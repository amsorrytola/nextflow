import { task } from "@trigger.dev/sdk/v3"
import { z } from "zod"
import * as fs from "fs"
import * as os from "os"
import * as path from "path"
import { execFile } from "child_process"
import { promisify } from "util"
import ffmpegPath from "ffmpeg-static"

const execFileAsync = promisify(execFile)
const FFMPEG = process.env.FFMPEG_PATH ?? ffmpegPath ?? "ffmpeg"

const inputSchema = z.object({
  videoUrl: z.string().url(),
  timestamp: z.string().default("0"),
  transloaditKey: z.string(),
  transloaditSecret: z.string(),
  transloaditTemplateId: z.string(),
})

async function uploadToTransloadit(filePath: string, key: string, secret: string, templateId: string): Promise<string> {
  const crypto = await import("crypto")
  const FormData = (await import("form-data")).default
  const axios = (await import("axios")).default
  const expiresAt = new Date(Date.now() + 30 * 60 * 1000).toISOString().replace("T", " ").replace(/\.\d+Z$/, "+00:00")
  const params = JSON.stringify({ auth: { key, expires: expiresAt }, template_id: templateId })
  const signature = "sha384:" + crypto.createHmac("sha384", secret).update(Buffer.from(params, "utf-8")).digest("hex")
  const form = new FormData()
  form.append("params", params)
  form.append("signature", signature)
  form.append("file", fs.createReadStream(filePath))
  const res = await axios.post("https://api2.transloadit.com/assemblies", form, { headers: form.getHeaders() })
  const assemblyUrl = res.data.assembly_ssl_url
  for (let i = 0; i < 30; i++) {
    await new Promise((r) => setTimeout(r, 2000))
    const poll = await axios.get(assemblyUrl)
    if (poll.data.ok === "ASSEMBLY_COMPLETED") {
      const results = poll.data.results as Record<string, { ssl_url: string }[]>
      const keys = Object.keys(results)
      const file = keys[0] ? results[keys[0]]?.[0] : undefined
      if (file?.ssl_url) return file.ssl_url
      const uploads = poll.data.uploads as { ssl_url: string }[]
      if (uploads?.[0]?.ssl_url) return uploads[0].ssl_url
      throw new Error("No file in assembly result")
    }
    if (poll.data.ok === "ASSEMBLY_FAILED") throw new Error(poll.data.message ?? "Assembly failed")
  }
  throw new Error("Upload timed out")
}

function parseDurationToSeconds(stderr: string): number | null {
  const match = stderr.match(/Duration:\s*(\d+):(\d+):(\d+(?:\.\d+)?)/)
  if (!match) return null
  const hours = Number(match[1] ?? 0)
  const minutes = Number(match[2] ?? 0)
  const seconds = Number(match[3] ?? 0)
  return hours * 3600 + minutes * 60 + seconds
}

export const extractFrameTask = task({
  id: "extract-frame-task",
  maxDuration: 180,
  run: async (payload: z.infer<typeof inputSchema>) => {
    const parsed = inputSchema.parse(payload)
    const tmpDir = os.tmpdir()
    const ext = (parsed.videoUrl.split("?")[0] ?? "").split(".").pop() ?? "mp4"
    const inputPath = path.join(tmpDir, `video-${Date.now()}.${ext}`)
    const outputPath = path.join(tmpDir, `frame-${Date.now()}.jpg`)

    const res = await fetch(parsed.videoUrl)
    const buffer = await res.arrayBuffer()
    fs.writeFileSync(inputPath, Buffer.from(buffer))

    let seekSeconds = 0
    if (parsed.timestamp.endsWith("%")) {
      const pct = parseFloat(parsed.timestamp) / 100
      try {
        const { stderr } = await execFileAsync(FFMPEG, [
          "-i", inputPath
        ])
        const duration = parseDurationToSeconds(stderr) ?? 10
        seekSeconds = duration * pct
      } catch { seekSeconds = 5 }
    } else {
      seekSeconds = parseFloat(parsed.timestamp) || 0
    }

    await execFileAsync(FFMPEG, [
      "-ss", String(seekSeconds),
      "-i", inputPath,
      "-frames:v", "1",
      "-y", outputPath
    ])

    const outputUrl = await uploadToTransloadit(outputPath, parsed.transloaditKey, parsed.transloaditSecret, parsed.transloaditTemplateId)
    fs.unlinkSync(inputPath)
    if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath)
    return { outputUrl }
  },
})

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
  imageUrl: z.string().url(),
  xPercent: z.number().min(0).max(100).default(0),
  yPercent: z.number().min(0).max(100).default(0),
  widthPercent: z.number().min(1).max(100).default(100),
  heightPercent: z.number().min(1).max(100).default(100),
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

export const cropImageTask = task({
  id: "crop-image-task",
  maxDuration: 180,
  run: async (payload: z.infer<typeof inputSchema>) => {
    const parsed = inputSchema.parse(payload)
    const tmpDir = os.tmpdir()
    const inputPath = path.join(tmpDir, `input-${Date.now()}.jpg`)
    const outputPath = path.join(tmpDir, `cropped-${Date.now()}.jpg`)

    const res = await fetch(parsed.imageUrl)
    const buffer = await res.arrayBuffer()
    fs.writeFileSync(inputPath, Buffer.from(buffer))

    await execFileAsync(FFMPEG, [
      "-i", inputPath,
      "-vf",
      `crop=iw*${parsed.widthPercent}/100:ih*${parsed.heightPercent}/100:iw*${parsed.xPercent}/100:ih*${parsed.yPercent}/100`,
      "-y", outputPath
    ])

    const outputUrl = await uploadToTransloadit(outputPath, parsed.transloaditKey, parsed.transloaditSecret, parsed.transloaditTemplateId)
    fs.unlinkSync(inputPath)
    if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath)
    return { outputUrl }
  },
})

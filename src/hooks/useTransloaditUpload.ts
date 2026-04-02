"use client"

import { useState, useCallback } from "react"

interface UploadResult {
  url: string
  name: string
  mime: string
  size: number
}

interface UseTransloaditUploadOptions {
  templateId: string
  accept: string
  onSuccess: (result: UploadResult) => void
  onError?: (error: string) => void
}

async function pollAssembly(assemblyUrl: string): Promise<UploadResult> {
  const maxAttempts = 60
  for (let i = 0; i < maxAttempts; i++) {
    await new Promise((r) => setTimeout(r, 1000))
    const res = await fetch(assemblyUrl)
    const data = await res.json()

    if (data.error) throw new Error(data.message || data.error)

    if (data.ok === "ASSEMBLY_COMPLETED") {
      // Try all result keys to find the uploaded file
      const results = data.results as Record<string, { ssl_url: string; name: string; mime: string; size: number }[]> | undefined
      if (results) {
        // Check :original first, then any other key
        const keys = Object.keys(results)
        const key = keys.includes(":original") ? ":original" : keys[0]
        const file = key ? results[key]?.[0] : undefined
        if (file?.ssl_url) {
          return {
            url: file.ssl_url,
            name: file.name,
            mime: file.mime,
            size: file.size,
          }
        }
      }

      // If no results, the file URL might be in uploads
      const uploads = data.uploads as { ssl_url: string; name: string; mime: string; size: number }[] | undefined
      if (uploads?.[0]?.ssl_url) {
        return {
          url: uploads[0].ssl_url,
          name: uploads[0].name,
          mime: uploads[0].mime,
          size: uploads[0].size,
        }
      }

      throw new Error(`Assembly completed but no file found. Keys: ${JSON.stringify(Object.keys(data.results ?? {}))}`)
    }

    if (data.ok === "ASSEMBLY_FAILED") {
      throw new Error(data.message || "Assembly failed")
    }
    // Still processing — continue polling
  }
  throw new Error("Upload timed out after 60 seconds")
}

export function useTransloaditUpload({
  templateId,
  accept,
  onSuccess,
  onError,
}: UseTransloaditUploadOptions) {
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)

  const upload = useCallback(
    async (file: File) => {
      setUploading(true)
      setProgress(0)

      try {
        const sigRes = await fetch("/api/transloadit/signature", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ templateId }),
        })
        if (!sigRes.ok) throw new Error("Failed to get upload signature")
        const { params, signature } = await sigRes.json()

        const formData = new FormData()
        formData.append("params", params)
        formData.append("signature", signature)
        formData.append("file", file)

        const assemblyData = await new Promise<{ assembly_ssl_url: string; assembly_url: string; error?: string; message?: string }>((resolve, reject) => {
          const xhr = new XMLHttpRequest()
          xhr.upload.addEventListener("progress", (e) => {
            if (e.lengthComputable) {
              setProgress(Math.round((e.loaded / e.total) * 90))
            }
          })
          xhr.onload = () => {
            try {
              const data = JSON.parse(xhr.responseText)
              if (xhr.status >= 200 && xhr.status < 300) resolve(data)
              else reject(new Error(data.message || `Upload failed: ${xhr.status}`))
            } catch {
              reject(new Error(`Parse error: ${xhr.responseText}`))
            }
          }
          xhr.onerror = () => reject(new Error("Network error"))
          xhr.open("POST", "https://api2.transloadit.com/assemblies")
          xhr.send(formData)
        })

        if (assemblyData.error) throw new Error(assemblyData.message || assemblyData.error)

        setProgress(95)
        const pollUrl = assemblyData.assembly_ssl_url || assemblyData.assembly_url
        const result = await pollAssembly(pollUrl)
        setProgress(100)
        onSuccess(result)
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Upload failed"
        onError?.(msg)
      } finally {
        setUploading(false)
        setProgress(0)
      }
    },
    [templateId, accept, onSuccess, onError]
  )

  return { upload, uploading, progress }
}

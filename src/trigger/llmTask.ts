import { task } from "@trigger.dev/sdk/v3"
import { GoogleGenerativeAI } from "@google/generative-ai"
import { z } from "zod"

const inputSchema = z.object({
  model: z.string().default("gemini-2.0-flash"),
  systemPrompt: z.string().optional(),
  userMessage: z.string().default(""),
  imageUrls: z.array(z.string().nullable()).default([]),
})

export const llmTask = task({
  id: "llm-task",
  maxDuration: 120,
  run: async (payload: z.infer<typeof inputSchema>) => {
    const parsed = inputSchema.parse(payload)
    const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY!)
    const model = genAI.getGenerativeModel({
      model: parsed.model,
      ...(parsed.systemPrompt ? { systemInstruction: parsed.systemPrompt } : {}),
    })

    const contentParts: ({ text: string } | { inlineData: { mimeType: string; data: string } })[] = [
      { text: parsed.userMessage || "Please analyze and respond." },
    ]

    // Filter out nulls and fetch valid image URLs
    const validImageUrls = parsed.imageUrls.filter((url): url is string => typeof url === "string" && url.length > 0)
    for (const imageUrl of validImageUrls) {
      try {
        const res = await fetch(imageUrl)
        const buffer = await res.arrayBuffer()
        const base64 = Buffer.from(buffer).toString("base64")
        const mimeType = res.headers.get("content-type") ?? "image/jpeg"
        contentParts.push({ inlineData: { mimeType, data: base64 } })
      } catch {
        console.warn(`Failed to fetch image: ${imageUrl}`)
      }
    }

    const result = await model.generateContent(contentParts)
    const text = result.response.text()
    return { output: text }
  },
})

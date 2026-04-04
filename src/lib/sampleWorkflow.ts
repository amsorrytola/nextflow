import type { WorkflowNode } from "@/store/workflowStore"
import type { Edge } from "@xyflow/react"

export function getSampleWorkflow(): { nodes: WorkflowNode[]; edges: Edge[] } {
  const nodes: WorkflowNode[] = [
    {
      id: "upload-image-1",
      type: "uploadImageNode",
      position: { x: 80, y: 100 },
      data: { type: "uploadImageNode", label: "A1 Product Photo Upload", imageUrl: null, fileName: null },
    },
    {
      id: "crop-image-1",
      type: "cropImageNode",
      position: { x: 420, y: 100 },
      data: {
        type: "cropImageNode",
        label: "A2 Hero Product Crop",
        xPercent: 10,
        yPercent: 10,
        widthPercent: 80,
        heightPercent: 80,
        result: null,
        error: null,
      },
    },
    {
      id: "text-system-1",
      type: "textNode",
      position: { x: 80, y: 360 },
      data: {
        type: "textNode",
        label: "A3 Product Description Brief",
        text:
          "You are a senior ecommerce marketing copywriter. Write one polished product description paragraph of 80 to 120 words. Focus on buyer value, premium tone, and concrete product benefits. Avoid hype, hashtags, and bullet points.",
      },
    },
    {
      id: "text-user-1",
      type: "textNode",
      position: { x: 80, y: 560 },
      data: {
        type: "textNode",
        label: "A4 Product Facts",
        text:
          "Product: Wireless Bluetooth Headphones\nAudience: commuters, remote workers, and students\nKey features: active noise cancellation, 30-hour battery life, foldable design, USB-C fast charging, lightweight ear cushions\nBrand tone: modern, premium, practical",
      },
    },
    {
      id: "llm-1",
      type: "llmNode",
      position: { x: 760, y: 250 },
      data: {
        type: "llmNode",
        label: "A5 Product Description Generator",
        model: "gemini-2.5-flash",
        systemPrompt: "",
        userMessage: "",
        result: null,
        error: null,
      },
    },
    {
      id: "upload-video-1",
      type: "uploadVideoNode",
      position: { x: 80, y: 920 },
      data: { type: "uploadVideoNode", label: "B1 Demo Video Upload", videoUrl: null, fileName: null },
    },
    {
      id: "extract-frame-1",
      type: "extractFrameNode",
      position: { x: 420, y: 920 },
      data: {
        type: "extractFrameNode",
        label: "B2 Midpoint Frame Extraction",
        timestamp: "50%",
        result: null,
        error: null,
      },
    },
    {
      id: "text-system-2",
      type: "textNode",
      position: { x: 760, y: 860 },
      data: {
        type: "textNode",
        label: "C1 Social Post Brief",
        text:
          "You are a social media strategist launching a new consumer tech product. Create one tweet-length post under 280 characters using the supplied product description and both images. Make it visual, specific, and launch-ready. Mention the strongest customer benefit and include a soft CTA. No emojis. No hashtags.",
      },
    },
    {
      id: "llm-2",
      type: "llmNode",
      position: { x: 1180, y: 560 },
      data: {
        type: "llmNode",
        label: "C2 Final Marketing Post",
        model: "gemini-2.5-flash",
        systemPrompt: "",
        userMessage: "",
        result: null,
        error: null,
      },
    },
  ]

  const edges: Edge[] = [
    { id: "e1-image-to-crop", source: "upload-image-1", sourceHandle: "outputImage", target: "crop-image-1", targetHandle: "image_url", type: "kreaEdge" },
    { id: "e2-crop-to-description-images", source: "crop-image-1", sourceHandle: "output", target: "llm-1", targetHandle: "images", type: "kreaEdge" },
    { id: "e3-brief-to-description-system", source: "text-system-1", sourceHandle: "outputText", target: "llm-1", targetHandle: "system_prompt", type: "kreaEdge" },
    { id: "e4-facts-to-description-prompt", source: "text-user-1", sourceHandle: "outputText", target: "llm-1", targetHandle: "prompt", type: "kreaEdge" },
    { id: "e5-video-to-frame", source: "upload-video-1", sourceHandle: "outputVideo", target: "extract-frame-1", targetHandle: "video_url", type: "kreaEdge" },
    { id: "e6-description-to-final-prompt", source: "llm-1", sourceHandle: "output", target: "llm-2", targetHandle: "prompt", type: "kreaEdge" },
    { id: "e7-crop-to-final-images", source: "crop-image-1", sourceHandle: "output", target: "llm-2", targetHandle: "images", type: "kreaEdge" },
    { id: "e8-frame-to-final-images", source: "extract-frame-1", sourceHandle: "output", target: "llm-2", targetHandle: "images", type: "kreaEdge" },
    { id: "e9-social-brief-to-final-system", source: "text-system-2", sourceHandle: "outputText", target: "llm-2", targetHandle: "system_prompt", type: "kreaEdge" },
  ]

  return { nodes, edges }
}

import type { WorkflowNode } from "@/store/workflowStore"
import type { Edge } from "@xyflow/react"

export function getSampleWorkflow(): { nodes: WorkflowNode[]; edges: Edge[] } {
  const nodes: WorkflowNode[] = [
    {
      id: "upload-image-1",
      type: "uploadImageNode",
      position: { x: 80, y: 80 },
      data: { type: "uploadImageNode", label: "Product Photo", imageUrl: null, fileName: null },
    },
    {
      id: "crop-image-1",
      type: "cropImageNode",
      position: { x: 420, y: 80 },
      data: { type: "cropImageNode", label: "Crop Product", xPercent: 10, yPercent: 10, widthPercent: 80, heightPercent: 80, result: null, error: null },
    },
    {
      id: "text-system-1",
      type: "textNode",
      position: { x: 80, y: 360 },
      data: { type: "textNode", label: "System Prompt", text: "You are a professional marketing copywriter. Generate a compelling one-paragraph product description." },
    },
    {
      id: "text-user-1",
      type: "textNode",
      position: { x: 80, y: 560 },
      data: { type: "textNode", label: "Product Details", text: "Product: Wireless Bluetooth Headphones. Features: Noise cancellation, 30-hour battery, foldable design." },
    },
    {
      id: "llm-1",
      type: "llmNode",
      position: { x: 760, y: 220 },
      data: { type: "llmNode", label: "Product Description LLM", model: "gemini-2.5-flash", systemPrompt: "", userMessage: "", result: null, error: null },
    },
    {
      id: "upload-video-1",
      type: "uploadVideoNode",
      position: { x: 80, y: 800 },
      data: { type: "uploadVideoNode", label: "Product Demo Video", videoUrl: null, fileName: null },
    },
    {
      id: "extract-frame-1",
      type: "extractFrameNode",
      position: { x: 420, y: 800 },
      data: { type: "extractFrameNode", label: "Extract Mid Frame", timestamp: "50%", result: null, error: null },
    },
    {
      id: "text-system-2",
      type: "textNode",
      position: { x: 760, y: 760 },
      data: { type: "textNode", label: "Social Media Prompt", text: "You are a social media manager. Create a tweet-length marketing post based on the product image and video frame." },
    },
    {
      id: "llm-2",
      type: "llmNode",
      position: { x: 1120, y: 500 },
      data: { type: "llmNode", label: "Marketing Tweet LLM", model: "gemini-2.5-flash", systemPrompt: "", userMessage: "", result: null, error: null },
    },
  ]

  const edges: Edge[] = [
    // Upload Image → Crop Image
    { id: "e1", source: "upload-image-1", sourceHandle: "outputImage", target: "crop-image-1", targetHandle: "image_url", type: "kreaEdge" },
    // Crop Image → LLM #1 images
    { id: "e2", source: "crop-image-1", sourceHandle: "output", target: "llm-1", targetHandle: "images", type: "kreaEdge" },
    // Text (system) → LLM #1 system_prompt
    { id: "e3", source: "text-system-1", sourceHandle: "outputText", target: "llm-1", targetHandle: "system_prompt", type: "kreaEdge" },
    // Text (user) → LLM #1 user_message
    { id: "e4", source: "text-user-1", sourceHandle: "outputText", target: "llm-1", targetHandle: "user_message", type: "kreaEdge" },
    // Upload Video → Extract Frame
    { id: "e5", source: "upload-video-1", sourceHandle: "outputVideo", target: "extract-frame-1", targetHandle: "video_url", type: "kreaEdge" },
    // LLM #1 output → LLM #2 user_message
    { id: "e6", source: "llm-1", sourceHandle: "output", target: "llm-2", targetHandle: "user_message", type: "kreaEdge" },
    // Crop Image → LLM #2 images
    { id: "e7", source: "crop-image-1", sourceHandle: "output", target: "llm-2", targetHandle: "images", type: "kreaEdge" },
    // Extract Frame → LLM #2 images
    { id: "e8", source: "extract-frame-1", sourceHandle: "output", target: "llm-2", targetHandle: "images", type: "kreaEdge" },
    // Text (social) → LLM #2 system_prompt
    { id: "e9", source: "text-system-2", sourceHandle: "outputText", target: "llm-2", targetHandle: "system_prompt", type: "kreaEdge" },
  ]

  return { nodes, edges }
}

export type NodeType =
  | "textNode"
  | "uploadImageNode"
  | "uploadVideoNode"
  | "llmNode"
  | "cropImageNode"
  | "extractFrameNode"

export type HandleDataType = "text" | "image" | "video" | "image[]"

export type NodeExecutionStatus = "idle" | "running" | "success" | "error"

export interface TextNodeData {
  type: "textNode"
  label: string
  text: string
}

export interface UploadImageNodeData {
  type: "uploadImageNode"
  label: string
  imageUrl: string | null
  fileName: string | null
}

export interface UploadVideoNodeData {
  type: "uploadVideoNode"
  label: string
  videoUrl: string | null
  fileName: string | null
}

export interface LLMNodeData {
  type: "llmNode"
  label: string
  model: string
  systemPrompt: string
  userMessage: string
  result: string | null
  error: string | null
}

export interface CropImageNodeData {
  type: "cropImageNode"
  label: string
  xPercent: number
  yPercent: number
  widthPercent: number
  heightPercent: number
  result: string | null
  error: string | null
}

export interface ExtractFrameNodeData {
  type: "extractFrameNode"
  label: string
  timestamp: string
  result: string | null
  error: string | null
}

export type AnyNodeData =
  | TextNodeData
  | UploadImageNodeData
  | UploadVideoNodeData
  | LLMNodeData
  | CropImageNodeData
  | ExtractFrameNodeData

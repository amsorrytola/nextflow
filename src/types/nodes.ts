export type NodeType =
  | "textNode"
  | "uploadImageNode"
  | "uploadVideoNode"
  | "llmNode"
  | "cropImageNode"
  | "extractFrameNode"

export type HandleDataType = "text" | "image" | "video" | "image[]"

export type NodeExecutionStatus = "idle" | "running" | "success" | "error"

export interface TextNodeData extends Record<string, unknown> {
  type: "textNode"
  label: string
  text: string
}

export interface UploadImageNodeData extends Record<string, unknown> {
  type: "uploadImageNode"
  label: string
  imageUrl: string | null
  fileName: string | null
}

export interface UploadVideoNodeData extends Record<string, unknown> {
  type: "uploadVideoNode"
  label: string
  videoUrl: string | null
  fileName: string | null
}

export interface LLMNodeData extends Record<string, unknown> {
  type: "llmNode"
  label: string
  model: string
  systemPrompt: string
  userMessage: string
  result: string | null
  error: string | null
}

export interface CropImageNodeData extends Record<string, unknown> {
  type: "cropImageNode"
  label: string
  xPercent: number
  yPercent: number
  widthPercent: number
  heightPercent: number
  result: string | null
  error: string | null
}

export interface ExtractFrameNodeData extends Record<string, unknown> {
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

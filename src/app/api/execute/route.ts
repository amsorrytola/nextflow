import { NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { z } from "zod"

const schema = z.object({
  workflowId: z.string(),
  mode: z.enum(["FULL", "PARTIAL", "SINGLE"]),
  selectedNodeIds: z.array(z.string()).default([]),
})

export async function POST(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

  // Execution is handled client-side via the execution engine
  // This route is a placeholder for server-side orchestration if needed
  return NextResponse.json({ ok: true, ...parsed.data })
}

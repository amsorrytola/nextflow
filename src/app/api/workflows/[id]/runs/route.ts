import { NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { prisma } from "@/lib/prisma"
import { createRunSchema } from "@/lib/schemas"

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { id } = await params

  const workflow = await prisma.workflow.findFirst({ where: { id, userId } })
  if (!workflow) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const runs = await prisma.workflowRun.findMany({
    where: { workflowId: id },
    orderBy: { createdAt: "desc" },
    include: { nodeRuns: { orderBy: { createdAt: "asc" } } },
  })

  return NextResponse.json(runs)
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { id } = await params

  const workflow = await prisma.workflow.findFirst({ where: { id, userId } })
  if (!workflow) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const body = await req.json()
  const parsed = createRunSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

  const runCount = await prisma.workflowRun.count({ where: { workflowId: id } })

  const run = await prisma.workflowRun.create({
    data: {
      workflowId: id,
      userId,
      runNumber: runCount + 1,
      scope: parsed.data.scope,
      status: parsed.data.status,
      durationMs: parsed.data.durationMs,
      nodeRuns: {
        create: parsed.data.nodeRuns.map((nr) => ({
          nodeId: nr.nodeId,
          nodeType: nr.nodeType,
          nodeLabel: nr.nodeLabel,
          status: nr.status,
          inputs: JSON.parse(JSON.stringify(nr.inputs)),
          outputs: JSON.parse(JSON.stringify(nr.outputs)),
          error: nr.error ?? null,
          durationMs: nr.durationMs,
        })),
      },
    },
    include: { nodeRuns: true },
  })

  return NextResponse.json(run, { status: 201 })
}

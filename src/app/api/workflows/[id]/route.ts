import { NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { prisma } from "@/lib/prisma"
import { updateWorkflowSchema } from "@/lib/schemas"

async function getWorkflowForUser(id: string, userId: string) {
  return prisma.workflow.findFirst({ where: { id, userId } })
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { id } = await params
  const workflow = await getWorkflowForUser(id, userId)
  if (!workflow) return NextResponse.json({ error: "Not found" }, { status: 404 })
  return NextResponse.json(workflow)
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { id } = await params
  const existing = await getWorkflowForUser(id, userId)
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const body = await req.json()
  const parsed = updateWorkflowSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

  const { nodes, edges, ...rest } = parsed.data

  const workflow = await prisma.workflow.update({
    where: { id },
    data: {
      ...rest,
      ...(nodes !== undefined && { nodes: JSON.parse(JSON.stringify(nodes)) }),
      ...(edges !== undefined && { edges: JSON.parse(JSON.stringify(edges)) }),
    },
  })
  return NextResponse.json(workflow)
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { id } = await params
  const existing = await getWorkflowForUser(id, userId)
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 })
  await prisma.workflow.delete({ where: { id } })
  return NextResponse.json({ success: true })
}

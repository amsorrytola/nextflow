import { NextResponse } from "next/server"

export async function POST() {
  return NextResponse.json(
    {
      error: "Deprecated endpoint. Workflow execution is handled via Trigger.dev orchestrator tasks.",
    },
    { status: 410 }
  )
}

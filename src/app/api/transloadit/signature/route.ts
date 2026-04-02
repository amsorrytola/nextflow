import { NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import crypto from "crypto"

export async function POST(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { templateId } = await req.json()

  const authKey = process.env.NEXT_PUBLIC_TRANSLOADIT_KEY!
  const authSecret = process.env.TRANSLOADIT_SECRET!

  const expiresAt = new Date(Date.now() + 30 * 60 * 1000)
    .toISOString()
    .replace("T", " ")
    .replace(/\.\d+Z$/, "+00:00")

  const params = JSON.stringify({
    auth: {
      key: authKey,
      expires: expiresAt,
    },
    template_id: templateId,
  })

  const signature =
    "sha384:" +
    crypto
      .createHmac("sha384", authSecret)
      .update(Buffer.from(params, "utf-8"))
      .digest("hex")

  return NextResponse.json({ params, signature })
}

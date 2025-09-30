import { NextResponse } from "next/server"
import { readAuth, saveAuth } from "@/lib/authStore"
import { getIronSession } from "iron-session"
import { cookies } from "next/headers"
import { sessionOptions, SessionData } from "@/lib/session"

export async function PATCH(req: Request) {
  const session = await getIronSession<SessionData>(await cookies(), sessionOptions)
  if (!session.isLoggedIn) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { username } = await req.json()
  if (!username) {
    return NextResponse.json({ error: "Missing username" }, { status: 400 })
  }

  const auth = readAuth()
  saveAuth(username, auth.passwordHash) // keep password unchanged

  session.username = username
  await session.save()

  return NextResponse.json({ success: true })
}
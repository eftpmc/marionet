import { NextResponse } from "next/server"
import { readAuth, saveAuth } from "@/lib/authStore"
import { getIronSession } from "iron-session"
import { cookies } from "next/headers"
import { sessionOptions, SessionData } from "@/lib/session"
import bcrypt from "bcryptjs"

export async function PATCH(req: Request) {
  const session = await getIronSession<SessionData>(await cookies(), sessionOptions)
  if (!session.isLoggedIn) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { currentPassword, newPassword } = await req.json()
  if (!currentPassword || !newPassword) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 })
  }

  const auth = readAuth()
  const valid = await bcrypt.compare(currentPassword, auth.passwordHash)
  if (!valid) {
    return NextResponse.json({ error: "Invalid current password" }, { status: 400 })
  }

  const passwordHash = await bcrypt.hash(newPassword, 10)
  saveAuth(auth.username, passwordHash) // keep username unchanged

  return NextResponse.json({ success: true })
}
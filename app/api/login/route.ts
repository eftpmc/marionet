import { NextResponse } from "next/server";
import { getIronSession } from "iron-session";
import { cookies } from "next/headers";
import { sessionOptions, SessionData } from "@/lib/session";
import { readAuth } from "@/lib/authStore";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
  const { username, password } = await req.json();

  const auth = readAuth();

  if (
    username === auth.username &&
    (await bcrypt.compare(password, auth.passwordHash))
  ) {
    const session = await getIronSession<SessionData>(await cookies(), sessionOptions);

    session.username = username;
    session.isLoggedIn = true;
    await session.save();

    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ success: false }, { status: 401 });
}
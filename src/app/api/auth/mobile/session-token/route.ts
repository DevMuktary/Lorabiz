import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const cookieStore = await cookies();

  let token =
    cookieStore.get("__Secure-next-auth.session-token")?.value ||
    cookieStore.get("next-auth.session-token")?.value ||
    "";

  if (!token) {
    let chunk = 0;
    while (cookieStore.has(`__Secure-next-auth.session-token.${chunk}`)) {
      token += cookieStore.get(`__Secure-next-auth.session-token.${chunk}`)?.value || "";
      chunk++;
    }
  }

  if (!token) {
    let chunk = 0;
    while (cookieStore.has(`next-auth.session-token.${chunk}`)) {
      token += cookieStore.get(`next-auth.session-token.${chunk}`)?.value || "";
      chunk++;
    }
  }

  return NextResponse.json({ token: token || null });
}

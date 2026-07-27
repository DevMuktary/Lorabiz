import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma'; // Adjust this import if your prisma client is located elsewhere

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, secret } = body;

    // 1. STRICT SECURITY GATE: Reject anyone without the exact secret key
    if (secret !== process.env.INTERNAL_API_SECRET) {
      console.warn(`[SECURITY WARNING] Unauthorized access attempt to /api/internal/verify-user`);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    // 2. CHECK THE MAIN DATABASE
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
      select: { id: true, name: true, email: true }
    });

    // 3. RETURN THE VERDICT
    if (user) {
      return NextResponse.json({ 
        exists: true, 
        userId: user.id, 
        name: user.name 
      }, { status: 200 });
    } else {
      return NextResponse.json({ exists: false }, { status: 404 });
    }

  } catch (error) {
    console.error('[INTERNAL API ERROR] Failed to verify user:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

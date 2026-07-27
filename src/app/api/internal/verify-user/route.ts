import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma'; 

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, secret } = body;

    // 1. STRICT SECURITY GATE
    if (secret !== process.env.INTERNAL_API_SECRET) {
      console.warn(`[SECURITY WARNING] Unauthorized access attempt to /api/internal/verify-user`);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    // 2. CHECK THE MAIN DATABASE
    // Fix: Using firstName and lastName based on your Prisma schema
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
      select: { id: true, firstName: true, lastName: true, email: true }
    });

    // 3. RETURN THE VERDICT
    if (user) {
      return NextResponse.json({ 
        exists: true, 
        userId: user.id, 
        name: `${user.firstName} ${user.lastName}` // Combine them for the support system
      }, { status: 200 });
    } else {
      return NextResponse.json({ exists: false }, { status: 404 });
    }

  } catch (error) {
    console.error('[INTERNAL API ERROR] Failed to verify user:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

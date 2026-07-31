import { NextResponse, NextRequest } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

// 🚨 CRITICAL: Forces Next.js to never cache this route so polling works perfectly
export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> } // 🚨 CHANGED: params is now typed as a Promise
) {
  try {
    // 🚨 CHANGED: You must await the params in newer Next.js versions
    const resolvedParams = await params;
    const { id } = resolvedParams;

    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user) {
      return NextResponse.json({ success: false, message: "User not found" }, { status: 404 });
    }

    // Check if the Webhook has successfully created the record from the Redis draft
    const scumlRegistration = await prisma.scumlRegistration.findUnique({
      where: { id }
    });

    if (!scumlRegistration) {
      // It is completely normal to return a 404 for the first 1-3 seconds 
      // while Paystack is still processing the background Webhook.
      return NextResponse.json({ success: false, message: "Application still processing" }, { status: 404 });
    }

    // Security check
    if (scumlRegistration.userId !== user.id) {
      return NextResponse.json({ success: false, message: "Unauthorized access" }, { status: 403 });
    }

    // As soon as this returns success, the modal will show the green CheckCircle and redirect!
    return NextResponse.json({
      success: true,
      data: scumlRegistration
    });
    
  } catch (error) {
    console.error("SCUML Polling Error:", error);
    return NextResponse.json({ success: false, message: "Internal Server Error" }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma"; // Adjust import to match your database client

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> } // Note: In Next.js 15+, params is a Promise
) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { success: false, message: "Registration ID is required" },
        { status: 400 }
      );
    }

    // Example database update: clear query status and move to PENDING/RESUBMITTED
    const updatedRegistration = await prisma.registration.update({
      where: { id },
      data: {
        status: "PENDING", // Or whatever status indicates resolution
        queryReason: null,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Query resolved successfully",
      data: updatedRegistration,
    });
  } catch (error: any) {
    console.error("Error resolving query:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}

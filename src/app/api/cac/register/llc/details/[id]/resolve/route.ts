import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { success: false, message: "Registration ID is required" },
        { status: 400 }
      );
    }

    // Update the LLC registration status back to PENDING after query resolution
    const updatedRegistration = await prisma.llcRegistration.update({
      where: { id },
      data: {
        status: "PENDING",
        queryReason: null,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Query resolved successfully",
      data: updatedRegistration,
    });
  } catch (error: any) {
    console.error("Error resolving LLC query:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

export async function POST(
  req: Request, 
  props: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await props.params;
    
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    // SECURITY CHECK: Verify ownership and check current status
    const currentReg = await prisma.businessRegistration.findUnique({ where: { id } });
    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    
    if (!currentReg || !user || currentReg.userId !== user.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
    }

    // STRICT STATUS CHECK: Only a "QUERIED" application can be resolved
    if (currentReg.status !== "QUERIED") {
      return NextResponse.json({ message: "Only Queried applications can be resolved." }, { status: 400 });
    }

    // Update the status back to PENDING and optionally clear the query reason
    await prisma.businessRegistration.update({
      where: { id },
      data: {
        status: "PENDING",
        queryReason: null // Clears the error message so the user knows it's fixed
      }
    });

    return NextResponse.json({ success: true, message: "Query resolved successfully." });
    
  } catch (error) {
    console.error("Resolve Query Error:", error);
    return NextResponse.json({ message: "Failed to resolve query" }, { status: 500 });
  }
}

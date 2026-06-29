import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ success: false, message: "Registration ID is required." }, { status: 400 });
    }

    // Try deleting from Business Registration first
    try {
      await prisma.businessRegistration.delete({ where: { id } });
      return NextResponse.json({ success: true, message: "Business Name deleted successfully." });
    } catch {
      // If it fails, it means the ID doesn't exist in the BusinessRegistration table.
      // So, let's try deleting it from the LLC table instead!
      try {
        await prisma.llcRegistration.delete({ where: { id } });
        return NextResponse.json({ success: true, message: "LLC deleted successfully." });
      } catch {
        return NextResponse.json({ success: false, message: "Record not found or could not be deleted." }, { status: 404 });
      }
    }
  } catch (error) {
    console.error("Delete Registration Error:", error);
    return NextResponse.json({ success: false, message: "Internal server error." }, { status: 500 });
  }
}

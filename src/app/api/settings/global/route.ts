import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    // Fetch the first global settings record (there should only be one)
    let settings = await prisma.globalSettings.findFirst();

    // If for some reason it doesn't exist yet, return safe defaults (everything enabled)
    if (!settings) {
      settings = {
        id: "default",
        bnEnabled: true,
        llcEnabled: true,
        ninEnabled: true,
        maintenanceReason: "This service is currently undergoing scheduled maintenance. Please check back later."
      } as any;
    }

    return NextResponse.json({ success: true, settings });
  } catch (error) {
    console.error("Failed to fetch global settings:", error);
    return NextResponse.json({ success: false, message: "Server error" }, { status: 500 });
  }
}

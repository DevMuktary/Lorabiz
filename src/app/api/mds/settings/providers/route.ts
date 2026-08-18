import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email) {
      return NextResponse.json(
        { success: false, message: "Unauthorized." },
        { status: 401 }
      );
    }

    const staffUser = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!staffUser || staffUser.role !== "STAFF") {
      return NextResponse.json(
        { success: false, message: "Access forbidden." },
        { status: 403 }
      );
    }

    const [ipeSetting, pznSetting] = await Promise.all([
      prisma.globalSetting.findUnique({
        where: { key: "NIN_IPE_PROVIDER" },
      }),
      prisma.globalSetting.findUnique({
        where: { key: "NIN_PERSONALIZATION_PROVIDER" },
      }),
    ]);

    return NextResponse.json({
      success: true,
      ipeProvider: ipeSetting?.value || "DATAVERIFY",
      personalizationProvider: pznSetting?.value || "DATAVERIFY",
    });
  } catch (error: any) {
    console.error("❌ Provider Settings GET Error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Failed to fetch provider settings." },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email) {
      return NextResponse.json(
        { success: false, message: "Unauthorized." },
        { status: 401 }
      );
    }

    const staffUser = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!staffUser || staffUser.role !== "STAFF") {
      return NextResponse.json(
        { success: false, message: "Only administrators can change provider routing." },
        { status: 403 }
      );
    }

    const { ipeProvider, personalizationProvider } = await req.json();

    const updates: Promise<any>[] = [];

    if (ipeProvider && ["DATAVERIFY", "AGENTHUB", "MANUAL"].includes(ipeProvider.toUpperCase())) {
      updates.push(
        prisma.globalSetting.upsert({
          where: { key: "NIN_IPE_PROVIDER" },
          update: { value: ipeProvider.toUpperCase() },
          create: {
            key: "NIN_IPE_PROVIDER",
            value: ipeProvider.toUpperCase(),
            description: "Active routing provider for NIMC IPE Clearance (DATAVERIFY | AGENTHUB | MANUAL)",
          },
        })
      );
    }

    if (personalizationProvider && ["DATAVERIFY", "MANUAL"].includes(personalizationProvider.toUpperCase())) {
      updates.push(
        prisma.globalSetting.upsert({
          where: { key: "NIN_PERSONALIZATION_PROVIDER" },
          update: { value: personalizationProvider.toUpperCase() },
          create: {
            key: "NIN_PERSONALIZATION_PROVIDER",
            value: personalizationProvider.toUpperCase(),
            description: "Active routing provider for NIN Personalization (DATAVERIFY | MANUAL)",
          },
        })
      );
    }

    await Promise.all(updates);

    // Record staff audit log
    await prisma.staffActionLog.create({
      data: {
        userId: staffUser.id,
        action: "UPDATE_IDENTITY_PROVIDERS",
        details: `Updated identity providers -> IPE: ${ipeProvider || "UNCHANGED"}, Personalization: ${personalizationProvider || "UNCHANGED"}`,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Identity provider routing settings saved successfully.",
      ipeProvider: ipeProvider?.toUpperCase(),
      personalizationProvider: personalizationProvider?.toUpperCase(),
    });
  } catch (error: any) {
    console.error("❌ Provider Settings POST Error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Failed to update provider settings." },
      { status: 500 }
    );
  }
}

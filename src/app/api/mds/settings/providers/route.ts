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

    if (!staffUser || staffUser.role === "USER") {
      return NextResponse.json(
        { success: false, message: "Access forbidden." },
        { status: 403 }
      );
    }

    const [ipeSetting, pznSetting, slipSettingNin, slipLegacySetting, slipSettingPhone, phoneSetting] = await Promise.all([
      prisma.globalSetting.findUnique({
        where: { key: "NIN_IPE_PROVIDER" },
      }),
      prisma.globalSetting.findUnique({
        where: { key: "NIN_PERSONALIZATION_PROVIDER" },
      }),
      prisma.globalSetting.findUnique({
        where: { key: "NIN_SLIP_PROVIDER_NIN" },
      }),
      prisma.globalSetting.findUnique({
        where: { key: "NIN_SLIP_PROVIDER" },
      }),
      prisma.globalSetting.findUnique({
        where: { key: "NIN_SLIP_PROVIDER_PHONE" },
      }),
      prisma.globalSetting.findUnique({
        where: { key: "NIN_PHONE_SEARCH_ACTIVE" },
      }),
    ]);

    const activeNin = slipSettingNin?.value || slipLegacySetting?.value || "AUTO";
    const activePhone = slipSettingPhone?.value || "AUTO";

    return NextResponse.json({
      success: true,
      ipeProvider: ipeSetting?.value || "DATAVERIFY",
      personalizationProvider: pznSetting?.value || "DATAVERIFY",
      ninSlipProvider: activeNin, // legacy compatibility
      ninSlipProviderNin: activeNin,
      ninSlipProviderPhone: activePhone,
      ninPhoneSearchActive: phoneSetting ? phoneSetting.value.toLowerCase() !== "false" : true,
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

    if (!staffUser || staffUser.role === "USER") {
      return NextResponse.json(
        { success: false, message: "Only administrators can change provider routing." },
        { status: 403 }
      );
    }

    const { 
      ipeProvider, 
      personalizationProvider, 
      ninSlipProvider, 
      ninSlipProviderNin, 
      ninSlipProviderPhone, 
      ninPhoneSearchActive 
    } = await req.json();

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

    // NIN-by-NIN Routing
    const targetNinProvider = (ninSlipProviderNin || ninSlipProvider)?.toUpperCase();
    if (targetNinProvider && ["AUTO", "DATAVERIFY", "SLIPAPI"].includes(targetNinProvider)) {
      updates.push(
        prisma.globalSetting.upsert({
          where: { key: "NIN_SLIP_PROVIDER_NIN" },
          update: { value: targetNinProvider },
          create: {
            key: "NIN_SLIP_PROVIDER_NIN",
            value: targetNinProvider,
            description: "Active routing provider for NIN Slips by 11-digit NIN (AUTO | DATAVERIFY | SLIPAPI)",
          },
        }),
        prisma.globalSetting.upsert({
          where: { key: "NIN_SLIP_PROVIDER" },
          update: { value: targetNinProvider },
          create: {
            key: "NIN_SLIP_PROVIDER",
            value: targetNinProvider,
            description: "Legacy master setting for NIN Slips",
          },
        })
      );
    }

    // NIN-by-Phone Routing (Decoupled!)
    if (ninSlipProviderPhone && ["AUTO", "DATAVERIFY", "SLIPAPI"].includes(ninSlipProviderPhone.toUpperCase())) {
      updates.push(
        prisma.globalSetting.upsert({
          where: { key: "NIN_SLIP_PROVIDER_PHONE" },
          update: { value: ninSlipProviderPhone.toUpperCase() },
          create: {
            key: "NIN_SLIP_PROVIDER_PHONE",
            value: ninSlipProviderPhone.toUpperCase(),
            description: "Active routing provider for NIN Slips by Phone Number (AUTO | DATAVERIFY | SLIPAPI)",
          },
        })
      );
    }

    if (typeof ninPhoneSearchActive === "boolean") {
      updates.push(
        prisma.globalSetting.upsert({
          where: { key: "NIN_PHONE_SEARCH_ACTIVE" },
          update: { value: ninPhoneSearchActive ? "true" : "false" },
          create: {
            key: "NIN_PHONE_SEARCH_ACTIVE",
            value: ninPhoneSearchActive ? "true" : "false",
            description: "Whether NIN Search by Phone is active (true | false)",
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
        details: `Updated identity providers -> IPE: ${ipeProvider || "UNCHANGED"}, Personalization: ${personalizationProvider || "UNCHANGED"}, NIN Slips: ${ninSlipProvider || "UNCHANGED"}, Phone Search: ${ninPhoneSearchActive !== undefined ? ninPhoneSearchActive : "UNCHANGED"}`,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Identity provider routing settings saved successfully.",
      ipeProvider: ipeProvider?.toUpperCase(),
      personalizationProvider: personalizationProvider?.toUpperCase(),
      ninSlipProvider: ninSlipProvider?.toUpperCase(),
      ninPhoneSearchActive,
    });
  } catch (error: any) {
    console.error("❌ Provider Settings POST Error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Failed to update provider settings." },
      { status: 500 }
    );
  }
}

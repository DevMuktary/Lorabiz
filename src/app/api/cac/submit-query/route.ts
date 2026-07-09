import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const { id, type } = await req.json();

    if (type === "BUSINESS_NAME") {
      await prisma.businessRegistration.update({
        where: { id },
        data: { status: "PENDING", queryStatus: "RESOLVED" }
      });
    } else {
      await prisma.llcRegistration.update({
        where: { id },
        data: { status: "PENDING", queryStatus: "RESOLVED" }
      });
    }

    return NextResponse.json({ message: "Query submitted successfully" }, { status: 200 });

  } catch (error) {
    console.error("Submit Query Error:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs"; 

const prisma = new PrismaClient();

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { actionType, ...data } = body;

    // Verify MD Admin
    const admin = await prisma.user.findFirst({ where: { role: "ADMIN" } });
    if (!admin) return NextResponse.json({ error: "Unauthorized. Admin required." }, { status: 401 });

    if (actionType === "CREATE") {
      const { firstName, lastName, email, phone, password } = data;
      
      if (!email || !password || !firstName || !lastName) {
        return NextResponse.json({ error: "All fields are required to create staff." }, { status: 400 });
      }

      const existingUser = await prisma.user.findUnique({ where: { email } });
      if (existingUser) return NextResponse.json({ error: "Email is already registered in the system." }, { status: 400 });

      const hashedPassword = await bcrypt.hash(password, 10);

      await prisma.user.create({
        data: {
          firstName,
          lastName,
          email,
          phone: phone || "",
          role: "STAFF",
          
          // FIX 1: Use the correct schema field name
          passwordHash: hashedPassword, 
          
          // FIX 2: Fill in the remaining required User fields with defaults
          whatsapp: phone || "",
          gender: "OTHER",
          state: "N/A",
          lga: "N/A",
          street: "N/A"
        }
      });

      return NextResponse.json({ success: true, message: "Staff account created successfully." });
    }

    if (actionType === "TOGGLE_SUSPEND") {
      const { staffId, isSuspended } = data;
      await prisma.user.update({
        where: { id: staffId },
        data: { isSuspended }
      });
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Invalid action type." }, { status: 400 });
  } catch (error: any) {
    console.error("Staff Action Error:", error);
    return NextResponse.json({ error: error.message || "Internal server error." }, { status: 500 });
  }
}

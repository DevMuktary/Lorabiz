import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET() {
  try {
    const airtimeTransactions = await prisma.transaction.findMany({
      where: {
        OR: [
          { serviceCategory: "AIRTIME" },
          { description: { contains: "Airtime", mode: "insensitive" } }
        ],
        type: "DEBIT"
      },
      orderBy: { createdAt: 'desc' },
      include: {
        wallet: {
          include: {
            user: {
              select: {
                id: true, // <--- FIX: Added ID to the select block
                firstName: true,
                lastName: true,
                email: true,
              }
            }
          }
        }
      }
    });

    const pipeline = airtimeTransactions.map(tx => ({
      id: tx.id,
      userId: tx.wallet.user.id,
      amount: tx.amount,
      status: tx.status,
      reference: tx.reference,
      description: tx.description, 
      createdAt: tx.createdAt.toISOString(),
      clientName: `${tx.wallet.user?.firstName || ''} ${tx.wallet.user?.lastName || ''}`.trim() || 'Unknown Client',
      clientEmail: tx.wallet.user?.email || 'N/A'
    }));

    return NextResponse.json({ success: true, pipeline });
  } catch (error) {
    console.error("Fetch Airtime Pipeline Error:", error);
    return NextResponse.json({ error: "Failed to fetch pipeline." }, { status: 500 });
  }
}

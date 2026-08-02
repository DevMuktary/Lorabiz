import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET() {
  try {
    // We fetch from the Transaction ledger where serviceCategory is AIRTIME
    const airtimeTransactions = await prisma.transaction.findMany({
      where: {
        // Assuming your Airtime API tags transactions with "AIRTIME"
        // If it doesn't, we can fallback to checking if the description contains "Airtime"
        OR: [
          { serviceCategory: "AIRTIME" },
          { description: { contains: "Airtime", mode: "insensitive" } }
        ],
        type: "DEBIT" // We only want to see the actual purchases
      },
      orderBy: { createdAt: 'desc' },
      include: {
        wallet: {
          include: {
            user: {
              select: {
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
      description: tx.description, // E.g., "MTN Airtime for 08012345678"
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

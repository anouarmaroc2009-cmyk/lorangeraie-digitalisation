import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== "DIRECTION") {
      return NextResponse.json({ error: "Acces refuse" }, { status: 403 })
    }

    const receipt = await prisma.receipt.findUnique({
      where: { id: params.id },
      include: {
        financialRecord: {
          include: { student: true },
        },
      },
    })

    if (!receipt) {
      return NextResponse.json({ error: "Recu introuvable" }, { status: 404 })
    }

    return NextResponse.json(receipt)
  } catch (error) {
    console.error("ERREUR recu:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}

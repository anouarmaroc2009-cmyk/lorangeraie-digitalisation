import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"

export async function POST() {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== "DIRECTION") {
      return NextResponse.json({ error: "Acces refuse" }, { status: 403 })
    }

    const deletedTrackings = await prisma.tuitionTracking.deleteMany({})
    const deletedRecords = await prisma.financialRecord.deleteMany({})

    return NextResponse.json({
      deletedTrackings: deletedTrackings.count,
      deletedRecords: deletedRecords.count,
      message: "Toutes les donnees financieres ont ete remises a zero",
    })
  } catch (error) {
    console.error("ERREUR reset finances:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}

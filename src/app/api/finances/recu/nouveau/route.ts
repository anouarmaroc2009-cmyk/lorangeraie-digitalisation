import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { getAcademicYear } from "@/lib/utils"

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== "DIRECTION") {
      return NextResponse.json({ error: "Acces refuse" }, { status: 403 })
    }

    const { studentId, amount, type, description } = await req.json()

    if (!studentId || !amount || !type) {
      return NextResponse.json({ error: "Champs obligatoires manquants" }, { status: 400 })
    }

    const student = await prisma.student.findUnique({ where: { id: studentId } })
    if (!student) {
      return NextResponse.json({ error: "Eleve introuvable" }, { status: 404 })
    }

    const academicYear = getAcademicYear()

    const fr = await prisma.financialRecord.create({
      data: {
        studentId,
        type,
        amount,
        description: description || `${type === "INSCRIPTION" ? "Frais d'inscription" : "Paiement de scolarite"} - ${student.firstName} ${student.lastName}`,
        academicYear,
      },
    })

    const last = await prisma.receipt.findFirst({
      where: { academicYear },
      orderBy: { number: "desc" },
    })
    const receipt = await prisma.receipt.create({
      data: { financialRecordId: fr.id, number: (last?.number ?? 0) + 1, academicYear },
    })

    return NextResponse.json({ receiptId: receipt.id })
  } catch (error) {
    console.error("ERREUR creation recu:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}

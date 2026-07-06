import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { getAcademicYear } from "@/lib/utils"

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== "DIRECTION") {
    return NextResponse.json({ error: "Acces refuse" }, { status: 403 })
  }

  const body = await req.json()
  const { action, amount } = body
  const tracking = await prisma.tuitionTracking.findUnique({
    where: { id: params.id },
    include: { student: true },
  })
  if (!tracking) return NextResponse.json({ error: "Introuvable" }, { status: 404 })

  if (action === "pay-inscription") {
    await prisma.tuitionTracking.update({
      where: { id: params.id },
      data: { inscriptionPaid: true },
    })
    await prisma.financialRecord.create({
      data: {
        studentId: tracking.studentId,
        type: "INSCRIPTION",
        amount: amount || 0,
        description: `Frais d'inscription - ${tracking.student.firstName} ${tracking.student.lastName}`,
        academicYear: tracking.academicYear,
        archived: false,
      },
    })
  }

  if (action === "pay-tuition") {
    const newPaid = tracking.tuitionPaid + (amount || 0)
    const newStatus = newPaid >= tracking.tuitionDue ? "PAID" : "PARTIAL"
    await prisma.tuitionTracking.update({
      where: { id: params.id },
      data: { tuitionPaid: newPaid, status: newStatus },
    })
    await prisma.financialRecord.create({
      data: {
        studentId: tracking.studentId,
        type: "TUITION",
        amount: amount || 0,
        description: `Paiement scolarite - ${tracking.student.firstName} ${tracking.student.lastName}`,
        academicYear: tracking.academicYear,
        archived: false,
      },
    })
  }

  if (action === "pay-full-year") {
    const remaining = tracking.tuitionDue - tracking.tuitionPaid
    await prisma.tuitionTracking.update({
      where: { id: params.id },
      data: {
        tuitionPaid: tracking.tuitionDue,
        paidFullYear: true,
        status: "PAID",
      },
    })
    await prisma.financialRecord.create({
      data: {
        studentId: tracking.studentId,
        type: "TUITION",
        amount: remaining,
        description: `Paiement annuel complet - ${tracking.student.firstName} ${tracking.student.lastName}`,
        academicYear: tracking.academicYear,
        archived: false,
      },
    })
  }

  if (action === "update-due") {
    await prisma.tuitionTracking.update({
      where: { id: params.id },
      data: { tuitionDue: amount || 0 },
    })
  }

  const updated = await prisma.tuitionTracking.findUnique({
    where: { id: params.id },
    include: { student: { select: { firstName: true, lastName: true, massar: true, level: true } } },
  })
  return NextResponse.json(updated)
}

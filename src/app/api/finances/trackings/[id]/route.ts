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
  const { action, amount, months } = body
  const tracking = await prisma.tuitionTracking.findUnique({
    where: { id: params.id },
    include: { student: true },
  })
  if (!tracking) return NextResponse.json({ error: "Introuvable" }, { status: 404 })

  if (action === "pay-inscription") {
    const fee = amount || tracking.inscriptionFee || 0
    await prisma.tuitionTracking.update({
      where: { id: params.id },
      data: { inscriptionPaid: true },
    })
    await prisma.financialRecord.create({
      data: {
        studentId: tracking.studentId,
        type: "INSCRIPTION",
        amount: fee,
        description: `Frais d'inscription ${tracking.academicYear} - ${tracking.student.firstName} ${tracking.student.lastName}`,
        academicYear: tracking.academicYear,
        archived: false,
      },
    })
  }

  if (action === "pay-months") {
    const n = months || 1
    const newMonths = Math.min(tracking.monthsPaid + n, 10)
    const addedMonths = newMonths - tracking.monthsPaid
    const addedAmount = tracking.monthlyAmount * addedMonths
    const newPaid = tracking.tuitionPaid + addedAmount
    const newStatus = newMonths >= 10 ? "PAID" : newPaid > 0 ? "PARTIAL" : "UNPAID"
    await prisma.tuitionTracking.update({
      where: { id: params.id },
      data: { monthsPaid: newMonths, tuitionPaid: newPaid, status: newStatus },
    })
    if (addedAmount > 0) {
      const label = addedMonths > 1 ? `${addedMonths} mois` : "1 mois"
      await prisma.financialRecord.create({
        data: {
          studentId: tracking.studentId,
          type: "TUITION",
          amount: addedAmount,
          description: `Paiement ${label} - ${tracking.student.firstName} ${tracking.student.lastName}`,
          academicYear: tracking.academicYear,
          archived: false,
        },
      })
    }
  }

  if (action === "pay-full-year") {
    const remaining = tracking.tuitionDue - tracking.tuitionPaid
    await prisma.tuitionTracking.update({
      where: { id: params.id },
      data: {
        tuitionPaid: tracking.tuitionDue,
        monthsPaid: 10,
        paidFullYear: true,
        status: "PAID",
      },
    })
    if (remaining > 0) {
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
  }

  if (action === "update-monthly") {
    const monthly = amount || 0
    await prisma.tuitionTracking.update({
      where: { id: params.id },
      data: { monthlyAmount: monthly, tuitionDue: monthly * 10 },
    })
  }

  const updated = await prisma.tuitionTracking.findUnique({
    where: { id: params.id },
    include: { student: { select: { firstName: true, lastName: true, massar: true, level: true } } },
  })
  return NextResponse.json(updated)
}

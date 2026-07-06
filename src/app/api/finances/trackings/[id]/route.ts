import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { getAcademicYear } from "@/lib/utils"
import { clearCache } from "@/lib/redis"

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

  let lastReceiptId: string | null = null

  const acYear = tracking.academicYear

  async function createReceipt(frId: string) {
    const last = await prisma.receipt.findFirst({
      where: { academicYear: acYear },
      orderBy: { number: "desc" },
    })
    const r = await prisma.receipt.create({
      data: { financialRecordId: frId, number: (last?.number ?? 0) + 1, academicYear: acYear },
    })
    lastReceiptId = r.id
  }

  if (action === "pay-inscription") {
    const fee = amount || tracking.inscriptionFee || 0
    await prisma.tuitionTracking.update({
      where: { id: params.id },
      data: { inscriptionPaid: true },
    })
    const fr = await prisma.financialRecord.create({
      data: {
        studentId: tracking.studentId,
        type: "INSCRIPTION",
        amount: fee,
        description: `Frais d'inscription ${tracking.academicYear} - ${tracking.student.firstName} ${tracking.student.lastName}`,
        academicYear: tracking.academicYear,
        archived: false,
      },
    })
    await createReceipt(fr.id)
  }

  if (action === "pay-months") {
    const n = months || 1
    const oldMonths = tracking.monthsPaid
    const newMonths = Math.min(oldMonths + n, 10)
    const addedMonths = newMonths - oldMonths
    const addedAmount = tracking.monthlyAmount * addedMonths
    const newPaid = tracking.tuitionPaid + addedAmount
    const newStatus = newMonths >= 10 ? "PAID" : newPaid > 0 ? "PARTIAL" : "UNPAID"
    await prisma.tuitionTracking.update({
      where: { id: params.id },
      data: { monthsPaid: newMonths, tuitionPaid: newPaid, status: newStatus },
    })
    if (addedAmount > 0) {
      const MONTH_NAMES = ["Septembre", "Octobre", "Novembre", "Decembre", "Janvier", "Fevrier", "Mars", "Avril", "Mai", "Juin"]
      const paidMonths = MONTH_NAMES.slice(oldMonths, newMonths)
      const label = paidMonths.length > 1
        ? `${paidMonths[0]} à ${paidMonths[paidMonths.length - 1]}`
        : paidMonths[0]
      const fr = await prisma.financialRecord.create({
        data: {
          studentId: tracking.studentId,
          type: "TUITION",
          amount: addedAmount,
          description: `Paiement ${label}`,
          academicYear: tracking.academicYear,
          archived: false,
        },
      })
      await createReceipt(fr.id)
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
      const fr = await prisma.financialRecord.create({
        data: {
          studentId: tracking.studentId,
          type: "TUITION",
          amount: remaining,
          description: `Paiement annuel complet - ${tracking.student.firstName} ${tracking.student.lastName}`,
          academicYear: tracking.academicYear,
          archived: false,
        },
      })
      await createReceipt(fr.id)
    }
  }

  if (action === "update-monthly") {
    const monthly = amount || 0
    await prisma.tuitionTracking.update({
      where: { id: params.id },
      data: { monthlyAmount: monthly, tuitionDue: monthly * 10 },
    })
  }

  await clearCache(`suivi:*`)

  const updated = await prisma.tuitionTracking.findUnique({
    where: { id: params.id },
    include: { student: { select: { firstName: true, lastName: true, massar: true, level: true } } },
  })
  return NextResponse.json({ ...updated, receiptId: lastReceiptId })
}

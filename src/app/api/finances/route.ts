import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== "DIRECTION") {
    return NextResponse.json({ error: "Acces refuse" }, { status: 403 })
  }

  const records = await prisma.financialRecord.findMany({
    include: { student: { select: { firstName: true, lastName: true, massar: true } } },
    orderBy: { date: "desc" },
  })

  const tuitions = records.filter((r) => r.type === "TUITION")
  const expenses = records.filter((r) => r.type === "EXPENSE")
  const salaries = records.filter((r) => r.type === "SALARY")

  const totalTuition = tuitions.reduce((sum, r) => sum + r.amount, 0)
  const totalExpenses = expenses.reduce((sum, r) => sum + r.amount, 0)
  const totalSalaries = salaries.reduce((sum, r) => sum + r.amount, 0)

  return NextResponse.json({
    records,
    tuitions,
    expenses,
    salaries,
    totalTuition,
    totalExpenses,
    totalSalaries,
    balance: totalTuition - totalExpenses - totalSalaries,
  })
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== "DIRECTION") {
    return NextResponse.json({ error: "Acces refuse" }, { status: 403 })
  }

  const body = await req.json()
  const record = await prisma.financialRecord.create({ data: body })
  return NextResponse.json(record)
}

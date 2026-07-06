import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { getAcademicYear } from "@/lib/utils"

export async function GET(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== "DIRECTION") {
    return NextResponse.json({ error: "Acces refuse" }, { status: 403 })
  }

  const { searchParams } = new URL(req.url)
  const archived = searchParams.get("archived") === "true"
  const academicYear = searchParams.get("academicYear")

  const where: any = { archived }
  if (academicYear) where.academicYear = academicYear

  const records = await prisma.financialRecord.findMany({
    where,
    include: { student: { select: { firstName: true, lastName: true, massar: true } } },
    orderBy: { date: "desc" },
  })

  const tuitions = records.filter((r) => r.type === "TUITION")
  const inscriptions = records.filter((r) => r.type === "INSCRIPTION")
  const expenses = records.filter((r) => r.type === "EXPENSE")
  const salaries = records.filter((r) => r.type === "SALARY")

  const totalTuition = tuitions.reduce((sum, r) => sum + r.amount, 0)
  const totalInscriptions = inscriptions.reduce((sum, r) => sum + r.amount, 0)
  const totalExpenses = expenses.reduce((sum, r) => sum + r.amount, 0)
  const totalSalaries = salaries.reduce((sum, r) => sum + r.amount, 0)

  const years = await prisma.financialRecord.groupBy({
    by: ["academicYear"],
    orderBy: { academicYear: "desc" },
  })

  return NextResponse.json({
    records,
    tuitions,
    inscriptions,
    expenses,
    salaries,
    totalTuition,
    totalInscriptions,
    totalExpenses,
    totalSalaries,
    balance: totalTuition + totalInscriptions - totalExpenses - totalSalaries,
    years: years.map((y) => y.academicYear),
  })
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== "DIRECTION") {
    return NextResponse.json({ error: "Acces refuse" }, { status: 403 })
  }

  const body = await req.json()
  const academicYear = getAcademicYear(body.date ? new Date(body.date) : undefined)

  const record = await prisma.financialRecord.create({
    data: {
      type: body.type,
      amount: parseFloat(body.amount),
      description: body.description,
      studentId: body.studentId || null,
      date: body.date ? new Date(body.date) : undefined,
      academicYear,
      archived: false,
    },
  })
  return NextResponse.json(record)
}

import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { getAcademicYear } from "@/lib/utils"
import { getCached, setCache, clearCache } from "@/lib/redis"

export const dynamic = "force-dynamic"

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== "DIRECTION") {
      return NextResponse.json({ error: "Acces refuse" }, { status: 403 })
    }

    const { searchParams } = new URL(req.url)
    const year = searchParams.get("academicYear") || getAcademicYear()

    const cacheKey = `depenses:${year}`
    const cached = await getCached<any>(cacheKey)
    if (cached) return NextResponse.json(cached)

    const allRecords = await prisma.financialRecord.findMany({
      where: { academicYear: year, type: { in: ["EXPENSE", "SALARY"] } },
      orderBy: { date: "desc" },
    })

    const incomes = await prisma.financialRecord.findMany({
      where: { academicYear: year, type: { in: ["TUITION", "INSCRIPTION"] } },
    })

    const totalIncome = incomes.reduce((s, r) => s + r.amount, 0)
    const totalExpenses = allRecords.reduce((s, r) => s + r.amount, 0)

    const byCategory: Record<string, { count: number; total: number; records: typeof allRecords }> = {}
    for (const r of allRecords) {
      const cat = r.category || r.type
      if (!byCategory[cat]) byCategory[cat] = { count: 0, total: 0, records: [] }
      byCategory[cat].count++
      byCategory[cat].total += r.amount
      byCategory[cat].records.push(r)
    }

    const result = { records: allRecords, byCategory, totalIncome, totalExpenses, balance: totalIncome - totalExpenses, academicYear: year }
    await setCache(cacheKey, result, 30)
    return NextResponse.json(result)
  } catch (error) {
    console.error("ERREUR /api/finances/depenses:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== "DIRECTION") {
      return NextResponse.json({ error: "Acces refuse" }, { status: 403 })
    }

    const body = await req.json()
    const academicYear = getAcademicYear(body.date ? new Date(body.date) : undefined)

    const record = await prisma.financialRecord.create({
      data: {
        type: body.type,
        category: body.category || null,
        amount: parseFloat(body.amount),
        description: body.description,
        date: body.date ? new Date(body.date) : undefined,
        academicYear,
      },
    })

    await clearCache(`depenses:${academicYear}`)
    await clearCache(`suivi:*`)

    return NextResponse.json(record)
  } catch (error) {
    console.error("ERREUR POST depenses:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}

import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { getAcademicYear, LEVEL_LABELS } from "@/lib/utils"
import { getCached, setCache, clearCache } from "@/lib/redis"

export const dynamic = "force-dynamic"

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== "DIRECTION") {
      return NextResponse.json({ error: "Acces refuse" }, { status: 403 })
    }

    const { searchParams } = new URL(req.url)
    const levelFilter = searchParams.get("level") || "ALL"
    const academicYear = searchParams.get("academicYear") || getAcademicYear()

    const cacheKey = `suivi:${academicYear}:${levelFilter}`
    const cached = await getCached<any>(cacheKey)
    if (cached) return NextResponse.json(cached)

    const whereFilter: any = { status: "ACTIVE" }
    if (levelFilter !== "ALL") {
      whereFilter.level = levelFilter
    }

    const students = await prisma.student.findMany({
      where: whereFilter,
      include: {
        tuitionTrackings: {
          where: { academicYear },
          take: 1,
        },
      },
      orderBy: [{ level: "asc" }, { lastName: "asc" }],
    })

    const allFinancialRecords = await prisma.financialRecord.findMany({
      where: {
        studentId: { in: students.map((s) => s.id) },
        academicYear,
        type: { in: ["TUITION", "INSCRIPTION"] },
        archived: false,
      },
      include: { receipt: { select: { id: true } } },
      orderBy: { date: "desc" },
    })
    const receiptByStudent = new Map<string, string>()
    for (const fr of allFinancialRecords) {
      if (fr.receipt && !receiptByStudent.has(fr.studentId!)) {
        receiptByStudent.set(fr.studentId!, fr.receipt.id)
      }
    }

    const mapped = students.map((s) => {
      const t = s.tuitionTrackings[0]
      const monthly = t?.monthlyAmount ?? s.monthlyTuition ?? 0
      const due = t?.tuitionDue ?? monthly * 10
      const paid = t?.tuitionPaid ?? 0
      return {
        id: s.id,
        firstName: s.firstName,
        lastName: s.lastName,
        massar: s.massar,
        level: s.level,
        reenrolled: s.reenrolled,
        lastReceiptId: receiptByStudent.get(s.id) ?? null,
        tracking: t
          ? {
              id: t.id,
              monthlyAmount: t.monthlyAmount,
              tuitionDue: t.tuitionDue,
              tuitionPaid: t.tuitionPaid,
              monthsPaid: t.monthsPaid,
              inscriptionFee: t.inscriptionFee,
              inscriptionPaid: t.inscriptionPaid,
              paidFullYear: t.paidFullYear,
              status: t.status,
              remaining: t.tuitionDue - t.tuitionPaid,
            }
          : {
              monthlyAmount: monthly,
              tuitionDue: due,
              tuitionPaid: 0,
              monthsPaid: 0,
              inscriptionFee: s.inscriptionFee ?? 0,
              inscriptionPaid: false,
              paidFullYear: false,
              status: "UNPAID" as const,
              remaining: due,
            },
      }
    })

    const stats = {
      totalCollected: mapped.reduce((s, e) => s + e.tracking.tuitionPaid, 0),
      totalRemaining: mapped.reduce((s, e) => s + e.tracking.remaining, 0),
      studentsBehind: mapped.filter((e) => e.tracking.status !== "PAID").length,
      totalInscriptionCollected: mapped.reduce((s, e) => s + (e.tracking.inscriptionPaid ? e.tracking.inscriptionFee : 0), 0),
      totalStudents: mapped.length,
    }

    const classes = ["NIVEAU_1AC", "NIVEAU_2AC", "NIVEAU_3AC", "NIVEAU_TRONC_COMMUN", "NIVEAU_1BAC_ECO", "NIVEAU_1BAC_SC", "NIVEAU_2BAC_ECO", "NIVEAU_2BAC_SC"].map((key) => ({
      key,
      label: LEVEL_LABELS[key] || key,
    }))

    const result = { students: mapped, stats, classes, academicYear }
    await setCache(cacheKey, result, 30)
    return NextResponse.json(result)
  } catch (error) {
    console.error("ERREUR suivi:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}

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
  const academicYear = searchParams.get("academicYear") || getAcademicYear()

  const trackings = await prisma.tuitionTracking.findMany({
    where: { academicYear },
    include: {
      student: { select: { id: true, firstName: true, lastName: true, massar: true, level: true, status: true } },
    },
    orderBy: { student: { lastName: "asc" } },
  })

  return NextResponse.json(trackings)
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== "DIRECTION") {
    return NextResponse.json({ error: "Acces refuse" }, { status: 403 })
  }

  const { academicYear } = await req.json()
  const year = academicYear || getAcademicYear()

  const students = await prisma.student.findMany({
    where: { status: "ACTIVE" },
    select: { id: true, monthlyTuition: true, inscriptionFee: true },
  })

  let created = 0
  for (const student of students) {
    const existing = await prisma.tuitionTracking.findUnique({
      where: { studentId_academicYear: { studentId: student.id, academicYear: year } },
    })
    if (!existing) {
      const monthly = student.monthlyTuition ?? 0
      await prisma.tuitionTracking.create({
        data: {
          studentId: student.id,
          academicYear: year,
          monthlyAmount: monthly,
          tuitionDue: monthly * 10,
          inscriptionFee: student.inscriptionFee ?? 0,
        },
      })
      created++
    }
  }

  return NextResponse.json({ created, academicYear: year })
}

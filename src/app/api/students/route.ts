import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { Level } from "@prisma/client"

export async function GET(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Non autorise" }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const level = searchParams.get("level")
  const status = searchParams.get("status") || "ACTIVE"

  const where: any = { status }
  if (level && level !== "ALL") where.level = level

  const students = await prisma.student.findMany({
    where,
    include: { _count: { select: { grades: true } } },
    orderBy: { lastName: "asc" },
  })

  return NextResponse.json(students)
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== "DIRECTION") {
    return NextResponse.json({ error: "Acces refuse" }, { status: 403 })
  }

  const body = await req.json()
  const student = await prisma.student.create({ data: body })
  return NextResponse.json(student)
}

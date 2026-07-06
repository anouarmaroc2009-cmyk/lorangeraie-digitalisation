import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Non autorise" }, { status: 401 })

  const teachers = await prisma.teacher.findMany({
    include: { levels: true },
    orderBy: { lastName: "asc" },
  })
  return NextResponse.json(teachers)
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== "DIRECTION") {
    return NextResponse.json({ error: "Acces refuse" }, { status: 403 })
  }

  const body = await req.json()
  const { levels, ...data } = body

  const teacher = await prisma.teacher.create({
    data: {
      ...data,
      levels: {
        create: (levels as string[]).map((level) => ({ level })),
      },
    },
    include: { levels: true },
  })
  return NextResponse.json(teacher)
}

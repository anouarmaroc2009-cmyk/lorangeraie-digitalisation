import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Non autorise" }, { status: 401 })

  const teacher = await prisma.teacher.findUnique({
    where: { id: params.id },
    include: { levels: true },
  })
  if (!teacher) return NextResponse.json({ error: "Introuvable" }, { status: 404 })
  return NextResponse.json(teacher)
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== "DIRECTION") {
    return NextResponse.json({ error: "Acces refuse" }, { status: 403 })
  }

  const body = await req.json()
  const { levels, ...data } = body

  await prisma.teacherLevel.deleteMany({ where: { teacherId: params.id } })

  const teacher = await prisma.teacher.update({
    where: { id: params.id },
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

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== "DIRECTION") {
    return NextResponse.json({ error: "Acces refuse" }, { status: 403 })
  }

  await prisma.teacher.delete({ where: { id: params.id } })
  return NextResponse.json({ success: true })
}

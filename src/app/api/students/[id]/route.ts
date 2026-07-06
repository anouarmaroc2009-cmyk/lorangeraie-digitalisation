import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Non autorise" }, { status: 401 })

  const student = await prisma.student.findUnique({
    where: { id: params.id },
    include: { grades: true, financialRecords: true },
  })
  if (!student) return NextResponse.json({ error: "Introuvable" }, { status: 404 })

  return NextResponse.json(student)
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== "DIRECTION") {
    return NextResponse.json({ error: "Acces refuse" }, { status: 403 })
  }

  const body = await req.json()
  const student = await prisma.student.update({
    where: { id: params.id },
    data: body,
  })
  return NextResponse.json(student)
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== "DIRECTION") {
    return NextResponse.json({ error: "Acces refuse" }, { status: 403 })
  }

  await prisma.student.delete({ where: { id: params.id } })
  return NextResponse.json({ success: true })
}

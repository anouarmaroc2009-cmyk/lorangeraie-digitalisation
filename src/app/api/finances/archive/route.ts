import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { getAcademicYear } from "@/lib/utils"

export async function POST() {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== "DIRECTION") {
    return NextResponse.json({ error: "Acces refuse" }, { status: 403 })
  }

  const academicYear = getAcademicYear()

  const result = await prisma.financialRecord.updateMany({
    where: { archived: false },
    data: { archived: true, academicYear },
  })

  return NextResponse.json({ archived: result.count, academicYear })
}

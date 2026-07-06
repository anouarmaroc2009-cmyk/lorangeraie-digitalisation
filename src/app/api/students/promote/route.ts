import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { Level, StudentStatus } from "@prisma/client"

const LEVEL_ORDER: Level[] = [
  "NIVEAU_1AC",
  "NIVEAU_2AC",
  "NIVEAU_3AC",
  "NIVEAU_TRONC_COMMUN",
  "NIVEAU_1BAC",
  "NIVEAU_2BAC",
]

export async function POST() {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== "DIRECTION") {
    return NextResponse.json({ error: "Acces refuse" }, { status: 403 })
  }

  const students = await prisma.student.findMany({
    where: { status: "ACTIVE" },
    include: { grades: true },
  })

  let promoted = 0
  let archived = 0

  for (const student of students) {
    const avg =
      student.grades.length > 0
        ? student.grades.reduce((sum, g) => sum + g.score * g.coefficient, 0) /
          student.grades.reduce((sum, g) => sum + g.coefficient, 0)
        : 0

    const currentIndex = LEVEL_ORDER.indexOf(student.level)
    const isLastLevel = student.level === "NIVEAU_2BAC"

    if (isLastLevel || (!student.reenrolled && avg >= 10)) {
      await prisma.student.update({
        where: { id: student.id },
        data: { status: "ARCHIVED" },
      })
      archived++
    } else if (student.reenrolled && avg >= 10 && currentIndex < LEVEL_ORDER.length - 1) {
      await prisma.student.update({
        where: { id: student.id },
        data: { level: LEVEL_ORDER[currentIndex + 1] },
      })
      promoted++
    }
  }

  return NextResponse.json({ promoted, archived })
}

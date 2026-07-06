import { PrismaClient, Role, Level } from "@prisma/client"
import bcrypt from "bcryptjs"

const prisma = new PrismaClient()

async function main() {
  const passwordHash = await bcrypt.hash("admin123", 12)

  const direction = await prisma.user.upsert({
    where: { email: "direction@orangeraie.ma" },
    update: {},
    create: {
      email: "direction@orangeraie.ma",
      passwordHash,
      name: "Directeur",
      role: Role.DIRECTION,
    },
  })

  const staffPassword = await bcrypt.hash("staff123", 12)

  await prisma.user.upsert({
    where: { email: "staff@orangeraie.ma" },
    update: {},
    create: {
      email: "staff@orangeraie.ma",
      passwordHash: staffPassword,
      name: "Professeur Ahmed",
      role: Role.STAFF,
    },
  })

  console.log("Utilisateurs crees:", direction.email)

  const levels = Object.values(Level)
  for (let i = 0; i < 12; i++) {
    await prisma.student.create({
      data: {
        firstName: `Eleve${i + 1}`,
        lastName: `Test`,
        massar: `MASSAR${String(202400 + i).padStart(3, "0")}`,
        level: levels[i % levels.length],
        status: "ACTIVE",
        reenrolled: true,
        parentName: `Parent ${i + 1}`,
        parentPhone: `061234567${i}`,
        address: `Adresse ${i + 1}, Casablanca`,
      },
    })
  }

  console.log("12 eleves de test crees avec succes")
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

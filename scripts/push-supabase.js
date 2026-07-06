const { Client } = require("pg")

const sql = `
CREATE TYPE "Role" AS ENUM ('DIRECTION', 'STAFF');
CREATE TYPE "Level" AS ENUM ('NIVEAU_1AC', 'NIVEAU_2AC', 'NIVEAU_3AC', 'NIVEAU_TRONC_COMMUN', 'NIVEAU_1BAC_ECO', 'NIVEAU_1BAC_SC', 'NIVEAU_2BAC_ECO', 'NIVEAU_2BAC_SC');
CREATE TYPE "StudentStatus" AS ENUM ('ACTIVE', 'ARCHIVED');
CREATE TYPE "PaymentStatus" AS ENUM ('UNPAID', 'PARTIAL', 'PAID');
CREATE TYPE "TransactionType" AS ENUM ('TUITION', 'INSCRIPTION', 'EXPENSE', 'SALARY');
CREATE TABLE "User" ("id" TEXT NOT NULL,"email" TEXT NOT NULL,"passwordHash" TEXT NOT NULL,"name" TEXT NOT NULL,"role" "Role" NOT NULL,"createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,"updatedAt" TIMESTAMP(3) NOT NULL,CONSTRAINT "User_pkey" PRIMARY KEY ("id"));
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE TABLE "Teacher" ("id" TEXT NOT NULL,"firstName" TEXT NOT NULL,"lastName" TEXT NOT NULL,"email" TEXT,"phone" TEXT,"address" TEXT,"createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,"updatedAt" TIMESTAMP(3) NOT NULL,CONSTRAINT "Teacher_pkey" PRIMARY KEY ("id"));
CREATE TABLE "TeacherLevel" ("teacherId" TEXT NOT NULL,"level" "Level" NOT NULL,CONSTRAINT "TeacherLevel_pkey" PRIMARY KEY ("teacherId","level"));
CREATE TABLE "Student" ("id" TEXT NOT NULL,"firstName" TEXT NOT NULL,"lastName" TEXT NOT NULL,"massar" TEXT NOT NULL,"level" "Level" NOT NULL,"status" "StudentStatus" NOT NULL DEFAULT 'ACTIVE',"reenrolled" BOOLEAN NOT NULL DEFAULT false,"monthlyTuition" DOUBLE PRECISION,"inscriptionFee" DOUBLE PRECISION,"parentName" TEXT,"parentPhone" TEXT,"address" TEXT,"createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,"updatedAt" TIMESTAMP(3) NOT NULL,CONSTRAINT "Student_pkey" PRIMARY KEY ("id"));
CREATE UNIQUE INDEX "Student_massar_key" ON "Student"("massar");
CREATE TABLE "Grade" ("id" TEXT NOT NULL,"studentId" TEXT NOT NULL,"subject" TEXT NOT NULL,"score" DOUBLE PRECISION NOT NULL,"coefficient" INTEGER NOT NULL DEFAULT 1,"semester" INTEGER NOT NULL,"academicYear" TEXT NOT NULL,"createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,"updatedAt" TIMESTAMP(3) NOT NULL,CONSTRAINT "Grade_pkey" PRIMARY KEY ("id"));
CREATE TABLE "TuitionTracking" ("id" TEXT NOT NULL,"studentId" TEXT NOT NULL,"academicYear" TEXT NOT NULL,"monthlyAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,"tuitionDue" DOUBLE PRECISION NOT NULL,"tuitionPaid" DOUBLE PRECISION NOT NULL DEFAULT 0,"monthsPaid" INTEGER NOT NULL DEFAULT 0,"inscriptionFee" DOUBLE PRECISION NOT NULL DEFAULT 0,"inscriptionPaid" BOOLEAN NOT NULL DEFAULT false,"paidFullYear" BOOLEAN NOT NULL DEFAULT false,"status" "PaymentStatus" NOT NULL DEFAULT 'UNPAID',"createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,"updatedAt" TIMESTAMP(3) NOT NULL,CONSTRAINT "TuitionTracking_pkey" PRIMARY KEY ("id"));
CREATE UNIQUE INDEX "TuitionTracking_studentId_academicYear_key" ON "TuitionTracking"("studentId", "academicYear");
CREATE TABLE "FinancialRecord" ("id" TEXT NOT NULL,"studentId" TEXT,"type" "TransactionType" NOT NULL,"category" TEXT,"amount" DOUBLE PRECISION NOT NULL,"description" TEXT NOT NULL,"date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,"academicYear" TEXT NOT NULL,"archived" BOOLEAN NOT NULL DEFAULT false,"createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,"updatedAt" TIMESTAMP(3) NOT NULL,CONSTRAINT "FinancialRecord_pkey" PRIMARY KEY ("id"));
ALTER TABLE "TeacherLevel" ADD CONSTRAINT "TeacherLevel_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "Teacher"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Grade" ADD CONSTRAINT "Grade_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TuitionTracking" ADD CONSTRAINT "TuitionTracking_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "FinancialRecord" ADD CONSTRAINT "FinancialRecord_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE SET NULL ON UPDATE CASCADE;
`

async function main() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL_SUPABASE,
  })
  await client.connect()
  console.log("Connected to Supabase")

  const statements = sql.split(";").filter(s => s.trim().length > 0)

  for (const stmt of statements) {
    try {
      await client.query(stmt.trim() + ";")
      console.log("OK:", stmt.trim().substring(0, 60) + "...")
    } catch (err) {
      console.log("SKIP (already exists?):", err.message.substring(0, 80))
    }
  }

  await client.end()
  console.log("Done!")
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})

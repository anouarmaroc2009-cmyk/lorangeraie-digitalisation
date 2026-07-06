const { Client } = require("pg")

const sql = `
CREATE TABLE IF NOT EXISTS "Receipt" (
  id TEXT NOT NULL,
  number INTEGER NOT NULL,
  "academicYear" TEXT NOT NULL,
  "financialRecordId" TEXT NOT NULL UNIQUE,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Receipt_pkey" PRIMARY KEY (id),
  CONSTRAINT "Receipt_financialRecordId_fkey" FOREIGN KEY ("financialRecordId") REFERENCES "FinancialRecord"(id) ON DELETE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS "Receipt_number_academicYear_key" ON "Receipt"(number, "academicYear");
`

async function main() {
  const client = new Client({ connectionString: process.env.DATABASE_URL_SUPABASE })
  await client.connect()
  await client.query(sql)
  console.log("Receipt table created on Supabase")
  await client.end()
}

main().catch((e) => { console.error(e.message); process.exit(1) })

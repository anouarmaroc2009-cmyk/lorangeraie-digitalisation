import { PrismaClient } from "@prisma/client"

const globalForSupabase = globalThis as unknown as { supabase: PrismaClient | undefined }

export const supabase =
  globalForSupabase.supabase ??
  new PrismaClient({
    datasources: { db: { url: process.env.DATABASE_URL_SUPABASE } },
  })

if (process.env.NODE_ENV !== "production") globalForSupabase.supabase = supabase

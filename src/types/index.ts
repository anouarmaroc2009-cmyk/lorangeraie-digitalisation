import { Role, Level, StudentStatus, TransactionType } from "@prisma/client"

export type UserRole = Role
export type StudentLevel = Level
export type StudentStatusType = StudentStatus
export type FinanceType = TransactionType

export interface SessionUser {
  id: string
  email: string
  name: string
  role: Role
}

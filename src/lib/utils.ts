import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const LEVEL_LABELS: Record<string, string> = {
  NIVEAU_1AC: "1AC",
  NIVEAU_2AC: "2AC",
  NIVEAU_3AC: "3AC",
  NIVEAU_TRONC_COMMUN: "Tronc Commun",
  NIVEAU_1BAC_ECO: "1BAC Eco",
  NIVEAU_1BAC_SC: "1BAC Sc",
  NIVEAU_2BAC_ECO: "2BAC Eco",
  NIVEAU_2BAC_SC: "2BAC Sc",
}

export const LEVEL_GROUPS: Record<string, string> = {
  NIVEAU_1AC: "1AC",
  NIVEAU_2AC: "2AC",
  NIVEAU_3AC: "3AC",
  NIVEAU_TRONC_COMMUN: "TC",
  NIVEAU_1BAC_ECO: "1BAC",
  NIVEAU_1BAC_SC: "1BAC",
  NIVEAU_2BAC_ECO: "2BAC",
  NIVEAU_2BAC_SC: "2BAC",
}

export const LEVEL_GROUP_ORDER = ["1AC", "2AC", "3AC", "TC", "1BAC", "2BAC"]

export function getLevelGroup(level: string): string {
  return LEVEL_GROUPS[level] ?? level
}

export function getAcademicYear(date?: Date): string {
  const d = date ?? new Date()
  const year = d.getFullYear()
  const month = d.getMonth() + 1
  if (month > 6 || (month === 6 && d.getDate() >= 30)) return `${year}-${year + 1}`
  return `${year - 1}-${year}`
}

export function getCurrentAcademicYear(): string {
  return getAcademicYear()
}

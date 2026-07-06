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
  NIVEAU_1BAC: "1BAC",
  NIVEAU_2BAC: "2BAC",
}

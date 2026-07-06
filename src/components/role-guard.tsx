"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { ReactNode, useEffect } from "react"

interface RoleGuardProps {
  allowedRoles: ("DIRECTION" | "STAFF")[]
  children: ReactNode
  fallback?: ReactNode
}

export function RoleGuard({ allowedRoles, children, fallback }: RoleGuardProps) {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login")
    }
  }, [status, router])

  if (status === "loading") return <p>Chargement...</p>
  if (!session?.user?.role) return null
  if (!allowedRoles.includes(session.user.role as "DIRECTION" | "STAFF")) {
    return fallback ?? <p>Accès non autorisé.</p>
  }

  return <>{children}</>
}

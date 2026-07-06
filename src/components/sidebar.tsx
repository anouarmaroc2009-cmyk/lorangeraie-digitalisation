"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { signOut, useSession } from "next-auth/react"
import { cn } from "@/lib/utils"
import {
  LayoutDashboard,
  GraduationCap,
  Wallet,
  Users,
  LogOut,
  Menu,
  X,
} from "lucide-react"
import { useState } from "react"
import { Button } from "@/components/ui/button"

const navItems = [
  { href: "/dashboard", label: "Tableau de bord", icon: LayoutDashboard },
  { href: "/dashboard/students", label: "Eleves", icon: GraduationCap },
  { href: "/dashboard/teachers", label: "Enseignants", icon: Users },
]

export default function Sidebar() {
  const pathname = usePathname()
  const { data: session } = useSession()
  const [mobileOpen, setMobileOpen] = useState(false)

  const isDirection = session?.user?.role === "DIRECTION"

  const items = isDirection
    ? [
        ...navItems,
        { href: "/dashboard/finances", label: "Finances", icon: Wallet },
      ]
    : navItems

  return (
    <>
      <button
        onClick={() => setMobileOpen(!mobileOpen)}
        className="fixed left-4 top-4 z-50 rounded-md border bg-white p-2 shadow md:hidden"
      >
        {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r bg-white transition-transform md:translate-x-0",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex h-16 items-center gap-2 border-b px-6">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-900">
            <span className="text-sm font-bold text-white">GO</span>
          </div>
          <div>
            <p className="text-sm font-semibold">GSP L'Orangeraie</p>
            <p className="text-xs text-muted-foreground">Gestion interne</p>
          </div>
        </div>

        <nav className="flex-1 space-y-1 p-4">
          {items.map((item) => {
            const Icon = item.icon
            const active = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  active
                    ? "bg-slate-900 text-white"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                )}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            )
          })}
        </nav>

        <div className="border-t p-4">
          <div className="mb-3 px-3 text-xs text-muted-foreground">
            <p className="font-medium text-slate-900">{session?.user?.name}</p>
            <p className="capitalize">{session?.user?.role?.toLowerCase()}</p>
          </div>
          <Button
            variant="outline"
            className="w-full justify-start gap-3"
            onClick={() => signOut({ callbackUrl: "/login" })}
          >
            <LogOut className="h-4 w-4" />
            Deconnexion
          </Button>
        </div>
      </aside>

      {mobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}
    </>
  )
}

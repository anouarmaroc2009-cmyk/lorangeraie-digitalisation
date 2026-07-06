"use client"

import { SessionProvider } from "next-auth/react"
import Sidebar from "@/components/sidebar"

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <div className="flex min-h-screen">
        <Sidebar />
        <main className="flex-1 md:ml-64">
          <div className="p-6">{children}</div>
        </main>
      </div>
    </SessionProvider>
  )
}

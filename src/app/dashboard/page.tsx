import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { GraduationCap, Users, Wallet, BarChart3 } from "lucide-react"

async function getStats() {
  const session = await getServerSession(authOptions)
  const isDirection = session?.user?.role === "DIRECTION"

  const [totalActive, totalByLevel, totalTuition, totalExpenses] = await Promise.all([
    prisma.student.count({ where: { status: "ACTIVE" } }),
    prisma.student.groupBy({ by: ["level"], where: { status: "ACTIVE" }, _count: true }),
    isDirection
      ? prisma.financialRecord.aggregate({
          where: { type: "TUITION" },
          _sum: { amount: true },
        })
      : Promise.resolve(null),
    isDirection
      ? prisma.financialRecord.aggregate({
          where: { type: { in: ["EXPENSE", "SALARY"] } },
          _sum: { amount: true },
        })
      : Promise.resolve(null),
  ])

  return { totalActive, totalByLevel, totalTuition: totalTuition?._sum.amount ?? 0, totalExpenses: totalExpenses?._sum.amount ?? 0, isDirection }
}

export default async function DashboardPage() {
  const stats = await getStats()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Tableau de bord</h1>
        <p className="text-sm text-muted-foreground">Vue d&apos;ensemble de l&apos;etablissement</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total eleves</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{stats.totalActive}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Niveaux</CardTitle>
            <GraduationCap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{stats.totalByLevel.length}</p>
          </CardContent>
        </Card>

        {stats.isDirection && (
          <>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Recettes</CardTitle>
                <Wallet className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-green-600">
                  {stats.totalTuition.toLocaleString()} DH
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Depenses</CardTitle>
                <BarChart3 className="h-4 w-4 text-red-600" />
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-red-600">
                  {stats.totalExpenses.toLocaleString()} DH
                </p>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  )
}

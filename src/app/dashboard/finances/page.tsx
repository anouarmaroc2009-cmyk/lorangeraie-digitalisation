"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { LEVEL_LABELS } from "@/lib/utils"
import { Wallet, TrendingUp, TrendingDown, DollarSign, Users, Plus } from "lucide-react"

interface FinanceRecord {
  id: string
  type: "TUITION" | "EXPENSE" | "SALARY"
  amount: number
  description: string
  date: string
  student?: { firstName: string; lastName: string; massar: string } | null
}

interface FinanceData {
  records: FinanceRecord[]
  tuitions: FinanceRecord[]
  expenses: FinanceRecord[]
  salaries: FinanceRecord[]
  totalTuition: number
  totalExpenses: number
  totalSalaries: number
  balance: number
}

const typeOptions = [
  { value: "TUITION", label: "Frais de scolarite" },
  { value: "EXPENSE", label: "Depense" },
  { value: "SALARY", label: "Salaire" },
]

export default function FinancesPage() {
  const { data: session } = useSession()
  const isDirection = session?.user?.role === "DIRECTION"

  const [data, setData] = useState<FinanceData | null>(null)
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({
    type: "TUITION",
    amount: "",
    description: "",
    studentId: "",
  })

  async function fetchFinances() {
    setLoading(true)
    const res = await fetch("/api/finances")
    const json = await res.json()
    setData(json)
    setLoading(false)
  }

  useEffect(() => { fetchFinances() }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    await fetch("/api/finances", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: form.type,
        amount: parseFloat(form.amount),
        description: form.description,
        studentId: form.studentId || null,
      }),
    })
    setForm({ type: "TUITION", amount: "", description: "", studentId: "" })
    setShowForm(false)
    fetchFinances()
  }

  if (!isDirection) return null

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12 text-muted-foreground">
        Chargement...
      </div>
    )
  }

  const format = (n: number) => `${n.toLocaleString()} DH`

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Finances</h1>
          <p className="text-sm text-muted-foreground">
            Gestion financiere de l&apos;etablissement
          </p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}>
          <Plus className="mr-2 h-4 w-4" />
          Nouvelle transaction
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Recettes (scolarite)</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-600">
              {data ? format(data.totalTuition) : "-"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Depenses</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-red-600">
              {data ? format(data.totalExpenses) : "-"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Salaires</CardTitle>
            <Users className="h-4 w-4 text-amber-600" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-amber-600">
              {data ? format(data.totalSalaries) : "-"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Solde</CardTitle>
            <Wallet className="h-4 w-4" />
          </CardHeader>
          <CardContent>
            <p className={`text-2xl font-bold ${data && data.balance >= 0 ? "text-green-600" : "text-red-600"}`}>
              {data ? format(data.balance) : "-"}
            </p>
          </CardContent>
        </Card>
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>Nouvelle transaction</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Type</label>
                  <Select
                    options={typeOptions}
                    value={form.type}
                    onChange={(e) => setForm({ ...form, type: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Montant (DH)</label>
                  <Input
                    type="number"
                    step="0.01"
                    required
                    value={form.amount}
                    onChange={(e) => setForm({ ...form, amount: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Description</label>
                <Input
                  required
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                />
              </div>
              <div className="flex gap-2">
                <Button type="submit">Ajouter</Button>
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                  Annuler
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Historique des transactions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left">
                  <th className="pb-3 font-medium text-muted-foreground">Date</th>
                  <th className="pb-3 font-medium text-muted-foreground">Type</th>
                  <th className="pb-3 font-medium text-muted-foreground">Description</th>
                  <th className="pb-3 font-medium text-muted-foreground">Eleve</th>
                  <th className="pb-3 font-medium text-muted-foreground text-right">Montant</th>
                </tr>
              </thead>
              <tbody>
                {data?.records.map((record) => (
                  <tr key={record.id} className="border-b last:border-0 hover:bg-slate-50">
                    <td className="py-3 text-muted-foreground">
                      {new Date(record.date).toLocaleDateString("fr-FR")}
                    </td>
                    <td className="py-3">
                      {record.type === "TUITION" && <Badge variant="success">Scolarite</Badge>}
                      {record.type === "EXPENSE" && <Badge variant="destructive">Depense</Badge>}
                      {record.type === "SALARY" && <Badge variant="warning">Salaire</Badge>}
                    </td>
                    <td className="py-3">{record.description}</td>
                    <td className="py-3 text-muted-foreground">
                      {record.student
                        ? `${record.student.firstName} ${record.student.lastName}`
                        : "-"}
                    </td>
                    <td className={`py-3 text-right font-medium ${
                      record.type === "TUITION" ? "text-green-600" : "text-red-600"
                    }`}>
                      {record.type === "TUITION" ? "+" : "-"}
                      {record.amount.toLocaleString()} DH
                    </td>
                  </tr>
                ))}
                {data?.records.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-muted-foreground">
                      Aucune transaction enregistree
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

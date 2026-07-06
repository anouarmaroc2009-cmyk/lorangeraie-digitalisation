"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { getAcademicYear } from "@/lib/utils"
import { Wallet, TrendingUp, TrendingDown, DollarSign, Users, Plus, Archive, Calendar, CalendarRange } from "lucide-react"

interface FinanceRecord {
  id: string
  type: "TUITION" | "EXPENSE" | "SALARY"
  amount: number
  description: string
  date: string
  academicYear: string
  archived: boolean
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
  years: string[]
}

const typeOptions = [
  { value: "TUITION", label: "Frais de scolarite" },
  { value: "EXPENSE", label: "Depense" },
  { value: "SALARY", label: "Salaire" },
]

export default function FinancesPage() {
  const { data: session } = useSession()
  const isDirection = session?.user?.role === "DIRECTION"

  const [tab, setTab] = useState<"mensuel" | "annuelle">("mensuel")
  const [data, setData] = useState<FinanceData | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedYear, setSelectedYear] = useState("")
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({
    type: "TUITION",
    amount: "",
    description: "",
    studentId: "",
  })

  async function fetchFinances() {
    setLoading(true)
    const params = new URLSearchParams()
    params.set("archived", tab === "annuelle" ? "true" : "false")
    if (tab === "annuelle" && selectedYear) params.set("academicYear", selectedYear)
    const res = await fetch(`/api/finances?${params}`)
    const json = await res.json()
    setData(json)
    if (!selectedYear && json.years?.[0]) setSelectedYear(json.years[0])
    setLoading(false)
  }

  useEffect(() => { fetchFinances() }, [tab, selectedYear])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const body: any = {
      type: form.type,
      amount: parseFloat(form.amount),
      description: form.description,
    }
    if (form.studentId) body.studentId = form.studentId
    await fetch("/api/finances", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })
    setForm({ type: "TUITION", amount: "", description: "", studentId: "" })
    setShowForm(false)
    fetchFinances()
  }

  async function handleArchive() {
    if (!confirm("Archiver toutes les transactions en cours pour l'annee " + getAcademicYear() + " ?")) return
    await fetch("/api/finances/archive", { method: "POST" })
    fetchFinances()
  }

  if (!isDirection) return null

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

      <div className="flex gap-1 rounded-lg border p-1 bg-slate-50 w-fit">
        <button
          onClick={() => setTab("mensuel")}
          className={`flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
            tab === "mensuel" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-900"
          }`}
        >
          <Calendar className="h-4 w-4" />
          Mensuel
        </button>
        <button
          onClick={() => setTab("annuelle")}
          className={`flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
            tab === "annuelle" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-900"
          }`}
        >
          <CalendarRange className="h-4 w-4" />
          Annuelle
        </button>
      </div>

      {tab === "mensuel" && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Annee en cours : <span className="font-medium text-slate-900">{getAcademicYear()}</span>
          </p>
          <Button variant="outline" onClick={handleArchive}>
            <Archive className="mr-2 h-4 w-4" />
            Archiver l&apos;annee
          </Button>
        </div>
      )}

      {tab === "annuelle" && data?.years && (
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Annee :</span>
          <Select
            options={data.years.map((y) => ({ value: y, label: y }))}
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
            className="w-40"
          />
        </div>
      )}

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
          <CardTitle>
            {tab === "mensuel" ? "Transactions en cours" : `Archive ${selectedYear || ""}`}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8 text-muted-foreground">Chargement...</div>
          ) : (
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
                        Aucune transaction
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

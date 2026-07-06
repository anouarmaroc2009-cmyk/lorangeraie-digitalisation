"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select } from "@/components/ui/select"
import { getAcademicYear, cn } from "@/lib/utils"
import {
  Wallet, TrendingDown, TrendingUp, Plus, Trash2, RefreshCw,
  AlertOctagon, Zap, Wifi, Droplets, Users, Building2, MoreHorizontal
} from "lucide-react"

const EXPENSE_TYPES = [
  { value: "SALARY", label: "Salaire" },
  { value: "EXPENSE", label: "Dépense" },
]

const EXPENSE_CATEGORIES = [
  { value: "SALARY", label: "Salaires enseignants", icon: "Users" },
  { value: "STAFF", label: "Salaires personnel", icon: "Users" },
  { value: "WIFI", label: "WiFi / Internet", icon: "Wifi" },
  { value: "WATER", label: "Eau", icon: "Droplets" },
  { value: "ELECTRICITY", label: "Électricité", icon: "Zap" },
  { value: "RENT", label: "Loyer", icon: "Building2" },
  { value: "MAINTENANCE", label: "Entretien", icon: "Building2" },
  { value: "OTHER", label: "Autre", icon: "MoreHorizontal" },
]

function CatIcon({ cat }: { cat: string }) {
  const icon = EXPENSE_CATEGORIES.find((c) => c.value === cat)?.icon
  if (icon === "Wifi") return <Wifi className="h-4 w-4" />
  if (icon === "Droplets") return <Droplets className="h-4 w-4" />
  if (icon === "Zap") return <Zap className="h-4 w-4" />
  if (icon === "Building2") return <Building2 className="h-4 w-4" />
  if (icon === "Users") return <Users className="h-4 w-4" />
  return <MoreHorizontal className="h-4 w-4" />
}

const CAT_LABELS: Record<string, string> = {
  SALARY: "Salaires enseignants",
  STAFF: "Salaires personnel",
  WIFI: "WiFi / Internet",
  WATER: "Eau",
  ELECTRICITY: "Électricité",
  RENT: "Loyer",
  MAINTENANCE: "Entretien",
  OTHER: "Autre",
}

const CAT_COLORS: Record<string, string> = {
  SALARY: "bg-violet-100 text-violet-800 border-violet-200",
  STAFF: "bg-purple-100 text-purple-800 border-purple-200",
  WIFI: "bg-sky-100 text-sky-800 border-sky-200",
  WATER: "bg-blue-100 text-blue-800 border-blue-200",
  ELECTRICITY: "bg-amber-100 text-amber-800 border-amber-200",
  RENT: "bg-orange-100 text-orange-800 border-orange-200",
  MAINTENANCE: "bg-slate-100 text-slate-800 border-slate-200",
  OTHER: "bg-gray-100 text-gray-800 border-gray-200",
}

function fmt(n: number): string {
  return n.toLocaleString("fr-FR") + " DH"
}

export default function DepensesPage() {
  const { data: session } = useSession()
  const isDirection = session?.user?.role === "DIRECTION"

  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ type: "EXPENSE", category: "OTHER", amount: "", description: "" })
  const [saving, setSaving] = useState(false)

  const year = getAcademicYear()

  function load() {
    setLoading(true)
    setError("")
    fetch(`/api/finances/depenses?academicYear=${year}`)
      .then(async (r) => {
        if (!r.ok) { const b = await r.json().catch(() => null); throw new Error(b?.error || `Erreur ${r.status}`) }
        return r.json()
      })
      .then((j) => { setData(j); setLoading(false) })
      .catch((e) => { setError(e.message); setLoading(false) })
  }

  useEffect(() => { load() }, [year])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      const r = await fetch("/api/finances/depenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: form.type,
          category: form.type === "SALARY" ? "SALARY" : form.category,
          amount: parseFloat(form.amount),
          description: form.description,
        }),
      })
      if (!r.ok) throw new Error("Erreur")
      setForm({ type: "EXPENSE", category: "OTHER", amount: "", description: "" })
      setShowForm(false)
      load()
    } catch (e: any) { setError(e.message) }
    setSaving(false)
  }

  async function handleDelete(id: string) {
    if (!confirm("Supprimer cette dépense ?")) return
    try {
      const r = await fetch(`/api/finances/depenses/${id}`, { method: "DELETE" })
      if (!r.ok) throw new Error("Erreur")
      load()
    } catch (e: any) { setError(e.message) }
  }

  if (!isDirection) {
    return <div className="py-12 text-center text-muted-foreground">Accès réservé à la direction</div>
  }

  const records = data?.records ?? []
  const byCategory = data?.byCategory ?? {}
  const totalIncome = data?.totalIncome ?? 0
  const totalExpenses = data?.totalExpenses ?? 0
  const balance = data?.balance ?? 0
  const categoryKeys = Object.keys(byCategory).sort()

  const catOptions = form.type === "SALARY"
    ? [{ value: "SALARY", label: "Salaire" }]
    : EXPENSE_CATEGORIES.filter((c) => c.value !== "SALARY" && c.value !== "STAFF")

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Dépenses</h1>
          <p className="text-sm text-muted-foreground">Année scolaire {year}</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setShowForm(!showForm)}>
            <Plus className="mr-1 h-4 w-4" /> {showForm ? "Annuler" : "Ajouter"}
          </Button>
          <Button variant="outline" size="sm" onClick={load}>
            <RefreshCw className="mr-1 h-3 w-3" /> Actualiser
          </Button>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-3 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          <AlertOctagon className="h-5 w-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Revenus</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-600">{fmt(totalIncome)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Dépenses</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-red-600">{fmt(totalExpenses)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Solde restant</CardTitle>
            <Wallet className="h-4 w-4" />
          </CardHeader>
          <CardContent>
            <p className={`text-2xl font-bold ${balance >= 0 ? "text-green-600" : "text-red-600"}`}>
              {fmt(balance)}
            </p>
          </CardContent>
        </Card>
      </div>

      {showForm && (
        <Card>
          <CardHeader><CardTitle>Nouvelle dépense</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Type</label>
                  <Select options={EXPENSE_TYPES} value={form.type}
                    onChange={(e) => setForm({ ...form, type: e.target.value, category: e.target.value === "SALARY" ? "SALARY" : "OTHER" })} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Catégorie</label>
                  <Select options={catOptions} value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })} />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Montant (DH)</label>
                  <Input type="number" step="0.01" required value={form.amount}
                    onChange={(e) => setForm({ ...form, amount: e.target.value })} />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Description</label>
                <Input required value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })} />
              </div>
              <div className="flex gap-2">
                <Button type="submit" disabled={saving}>{saving ? "..." : "Ajouter"}</Button>
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Annuler</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {categoryKeys.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {categoryKeys.map((cat) => (
            <Card key={cat}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div className="flex items-center gap-2">
                  <CatIcon cat={cat} />
                  <CardTitle className="text-sm font-medium">{CAT_LABELS[cat] || cat}</CardTitle>
                </div>
                <Badge className={CAT_COLORS[cat] || ""}>{byCategory[cat].count}</Badge>
              </CardHeader>
              <CardContent>
                <p className="text-lg font-bold">{fmt(byCategory[cat].total)}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {loading ? (
        <Card><CardContent className="flex items-center justify-center py-16"><RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" /></CardContent></Card>
      ) : records.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center py-16 text-muted-foreground">
            <Wallet className="mb-3 h-12 w-12" />
            <p className="text-lg font-medium">Aucune dépense</p>
            <p className="text-sm mt-1">Cliquez sur "Ajouter" pour enregistrer une dépense</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader><CardTitle>Historique des dépenses</CardTitle></CardHeader>
          <CardContent className="pt-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left">
                    <th className="py-3 pr-4 font-medium text-muted-foreground">Date</th>
                    <th className="py-3 pr-4 font-medium text-muted-foreground">Type</th>
                    <th className="py-3 pr-4 font-medium text-muted-foreground">Catégorie</th>
                    <th className="py-3 pr-4 font-medium text-muted-foreground">Description</th>
                    <th className="py-3 pr-4 font-medium text-muted-foreground text-right">Montant</th>
                    <th className="py-3 font-medium text-muted-foreground"></th>
                  </tr>
                </thead>
                <tbody>
                  {records.map((r: any) => (
                    <tr key={r.id} className="border-b last:border-0 hover:bg-slate-50">
                      <td className="py-3 pr-4 text-muted-foreground">{new Date(r.date).toLocaleDateString("fr-FR")}</td>
                      <td className="py-3 pr-4">
                        {r.type === "SALARY" ? <Badge variant="warning">Salaire</Badge> : <Badge variant="destructive">Dépense</Badge>}
                      </td>
                      <td className="py-3 pr-4">
                        <span className={cn("inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs font-medium", CAT_COLORS[r.category] || "bg-gray-100")}>
                          <CatIcon cat={r.category} />
                          {CAT_LABELS[r.category] || r.category}
                        </span>
                      </td>
                      <td className="py-3 pr-4">{r.description}</td>
                      <td className="py-3 pr-4 text-right font-medium text-red-600">{fmt(r.amount)}</td>
                      <td className="py-3">
                        <Button variant="ghost" size="sm" onClick={() => handleDelete(r.id)} title="Supprimer">
                          <Trash2 className="h-3 w-3 text-red-500" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

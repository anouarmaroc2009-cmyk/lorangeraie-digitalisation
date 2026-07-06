"use client"

import { useEffect, useState, useCallback } from "react"
import { useSession } from "next-auth/react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { getAcademicYear, LEVEL_LABELS, getLevelGroup, LEVEL_GROUP_ORDER } from "@/lib/utils"
import {
  Wallet, TrendingUp, TrendingDown, DollarSign, Users, Plus,
  Archive, Calendar, CalendarRange, CheckCircle, XCircle,
  AlertCircle, RotateCcw, CreditCard, FileText
} from "lucide-react"

interface FinanceRecord {
  id: string; type: "TUITION" | "INSCRIPTION" | "EXPENSE" | "SALARY"
  amount: number; description: string; date: string; academicYear: string; archived: boolean
  student?: { firstName: string; lastName: string; massar: string } | null
}

interface FinanceData {
  records: FinanceRecord[]; tuitions: FinanceRecord[]; inscriptions: FinanceRecord[]
  expenses: FinanceRecord[]; salaries: FinanceRecord[]
  totalTuition: number; totalInscriptions: number; totalExpenses: number; totalSalaries: number
  balance: number; years: string[]
}

interface Tracking {
  id: string; studentId: string; academicYear: string
  monthlyAmount: number; tuitionDue: number; tuitionPaid: number
  inscriptionFee: number; inscriptionPaid: boolean
  paidFullYear: boolean; status: "UNPAID" | "PARTIAL" | "PAID"
  student: { id: string; firstName: string; lastName: string; massar: string; level: string; status: string }
}

const typeOptions = [
  { value: "TUITION", label: "Scolarite" },
  { value: "INSCRIPTION", label: "Inscription" },
  { value: "EXPENSE", label: "Depense" },
  { value: "SALARY", label: "Salaire" },
]

export default function FinancesPage() {
  const { data: session } = useSession()
  const isDirection = session?.user?.role === "DIRECTION"

  const [tab, setTab] = useState<"mensuel" | "annuelle">("mensuel")
  const [data, setData] = useState<FinanceData | null>(null)
  const [trackings, setTrackings] = useState<Tracking[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedYear, setSelectedYear] = useState("")
  const [showForm, setShowForm] = useState(false)
  const [payingStudent, setPayingStudent] = useState<string | null>(null)
  const [payAmount, setPayAmount] = useState("")
  const [form, setForm] = useState({ type: "TUITION", amount: "", description: "", studentId: "" })

  const year = getAcademicYear()

  const fetchAll = useCallback(async () => {
    setLoading(true)
    const yearParam = tab === "annuelle" && selectedYear ? selectedYear : ""
    const params = new URLSearchParams()
    params.set("archived", tab === "annuelle" ? "true" : "false")
    if (yearParam) params.set("academicYear", yearParam)

    const [finRes, trackRes] = await Promise.all([
      fetch(`/api/finances?${params}`),
      fetch(`/api/finances/trackings?academicYear=${yearParam || year}`),
    ])
    const finData = await finRes.json()
    const trackData = await trackRes.json()
    setData(finData)
    setTrackings(trackData)
    if (!selectedYear && finData.years?.[0]) setSelectedYear(finData.years[0])
    setLoading(false)
  }, [tab, selectedYear])

  useEffect(() => { fetchAll() }, [fetchAll])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    await fetch("/api/finances", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: form.type, amount: parseFloat(form.amount), description: form.description,
        studentId: form.studentId || null,
      }),
    })
    setForm({ type: "TUITION", amount: "", description: "", studentId: "" })
    setShowForm(false)
    fetchAll()
  }

  async function handleArchive() {
    if (!confirm("Archiver toutes les transactions en cours ?")) return
    await fetch("/api/finances/archive", { method: "POST" })
    fetchAll()
  }

  async function handleInitYear() {
    if (!confirm(`Initialiser le suivi des paiements pour ${year} ? (les frais mensuels seront recuperes depuis chaque eleve)`)) return
    await fetch("/api/finances/trackings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ academicYear: year }),
    })
    fetchAll()
  }

  async function handlePayAction(trackingId: string, action: string, amount?: number) {
    await fetch(`/api/finances/trackings/${trackingId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, amount: amount || 0 }),
    })
    setPayingStudent(null)
    setPayAmount("")
    fetchAll()
  }

  function getStatusBadge(t: Tracking) {
    if (t.status === "PAID") return <Badge variant="success">Paye</Badge>
    if (t.status === "PARTIAL") return <Badge variant="warning">Partiel</Badge>
    return <Badge variant="destructive">Impaye</Badge>
  }

  function getStatusIcon(t: Tracking) {
    if (!t.inscriptionPaid) return <XCircle className="h-4 w-4 text-red-500" />
    if (t.status === "PAID") return <CheckCircle className="h-4 w-4 text-green-500" />
    if (t.status === "PARTIAL") return <AlertCircle className="h-4 w-4 text-amber-500" />
    return <XCircle className="h-4 w-4 text-red-500" />
  }

  if (!isDirection) return null

  const format = (n: number) => `${n.toLocaleString()} DH`

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Finances</h1>
          <p className="text-sm text-muted-foreground">Gestion financiere complete</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleArchive}>
            <Archive className="mr-2 h-4 w-4" /> Archiver
          </Button>
          <Button onClick={() => setShowForm(!showForm)}>
            <Plus className="mr-2 h-4 w-4" /> Transaction
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex gap-1 rounded-lg border p-1 bg-slate-50">
          <button onClick={() => setTab("mensuel")}
            className={`flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
              tab === "mensuel" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-900"
            }`}>
            <Calendar className="h-4 w-4" /> Mensuel
          </button>
          <button onClick={() => setTab("annuelle")}
            className={`flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
              tab === "annuelle" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-900"
            }`}>
            <CalendarRange className="h-4 w-4" /> Annuelle
          </button>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-slate-700">Annee:</span>
          <span className="rounded-md bg-slate-900 px-3 py-1 text-sm font-semibold text-white">
            {selectedYear || year}
          </span>
          {tab === "annuelle" && data?.years && (
            <Select
              options={data.years.map((y: string) => ({ value: y, label: y }))}
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="w-36"
            />
          )}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Recettes</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-600">{data ? format(data.totalTuition) : "-"}</p>
            <p className="text-xs text-muted-foreground">Scolarite</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Inscriptions</CardTitle>
            <FileText className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-blue-600">{data ? format(data.totalInscriptions) : "-"}</p>
            <p className="text-xs text-muted-foreground">Frais d&apos;inscription</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Depenses</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-red-600">{data ? format(data.totalExpenses) : "-"}</p>
            <p className="text-xs text-muted-foreground">Depenses diverses</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Salaires</CardTitle>
            <Users className="h-4 w-4 text-amber-600" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-amber-600">{data ? format(data.totalSalaries) : "-"}</p>
            <p className="text-xs text-muted-foreground">Personnel</p>
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

      {tab === "mensuel" && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Suivi des paiements - {year}</CardTitle>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={handleInitYear}>
                  <RotateCcw className="mr-1 h-3 w-3" /> Initialiser
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="py-8 text-center text-muted-foreground">Chargement...</div>
            ) : trackings.length === 0 ? (
              <div className="flex flex-col items-center py-12 text-muted-foreground">
                <Wallet className="mb-2 h-12 w-12" />
                <p>Aucun suivi pour cette annee</p>
                <p className="text-xs mt-1">Cliquez sur "Initialiser" pour creer le suivi des paiements</p>
              </div>
            ) : (
              <div className="space-y-6">
                {(() => {
                  const grouped = new Map<string, Tracking[]>()
                  trackings.forEach((t) => {
                    const group = getLevelGroup(t.student.level)
                    if (!grouped.has(group)) grouped.set(group, [])
                    grouped.get(group)!.push(t)
                  })
                  return LEVEL_GROUP_ORDER.map((group) => {
                    const items = grouped.get(group)
                    if (!items || items.length === 0) return null
                    const groupTotal = items.reduce((s, t) => s + t.tuitionDue, 0)
                    const groupPaid = items.reduce((s, t) => s + t.tuitionPaid, 0)
                    const groupRemaining = groupTotal - groupPaid
                    return (
                      <div key={group}>
                        <div className="flex items-center justify-between bg-slate-100 px-4 py-2 rounded-t-md border-b">
                          <h3 className="font-semibold text-lg">{group}</h3>
                          <p className="text-sm text-muted-foreground">
                            Total: <span className="font-medium">{groupTotal.toLocaleString()} DH</span>
                            {" | "}Paye: <span className="font-medium text-green-600">{groupPaid.toLocaleString()} DH</span>
                            {" | "}Reste: <span className={`font-medium ${groupRemaining > 0 ? "text-red-600" : "text-green-600"}`}>
                              {groupRemaining.toLocaleString()} DH
                            </span>
                          </p>
                        </div>
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b text-left bg-slate-50">
                              <th className="px-4 py-2 font-medium text-muted-foreground">Eleve</th>
                              <th className="px-4 py-2 font-medium text-muted-foreground">Niveau</th>
                              <th className="px-4 py-2 font-medium text-muted-foreground text-right">Mensualite</th>
                              <th className="px-4 py-2 font-medium text-muted-foreground text-right">Frais annuels</th>
                              <th className="px-4 py-2 font-medium text-muted-foreground text-right">Paye</th>
                              <th className="px-4 py-2 font-medium text-muted-foreground text-right">Reste</th>
                              <th className="px-4 py-2 font-medium text-muted-foreground text-center">Inscription</th>
                              <th className="px-4 py-2 font-medium text-muted-foreground text-center">Statut</th>
                              <th className="px-4 py-2 font-medium text-muted-foreground">Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {items.map((t) => {
                              const remaining = t.tuitionDue - t.tuitionPaid
                              return (
                                <tr key={t.id} className="border-b last:border-0 hover:bg-slate-50">
                                  <td className="px-4 py-3">
                                    <p className="font-medium">{t.student.lastName} {t.student.firstName}</p>
                                    <p className="text-xs text-muted-foreground font-mono">{t.student.massar}</p>
                                  </td>
                                  <td className="px-4 py-3">
                                    <Badge variant="secondary">{LEVEL_LABELS[t.student.level] || t.student.level}</Badge>
                                  </td>
                                  <td className="px-4 py-3 text-right font-medium">
                                    {t.monthlyAmount.toLocaleString()} DH
                                  </td>
                                  <td className="px-4 py-3 text-right font-medium">
                                    {t.tuitionDue.toLocaleString()} DH
                                  </td>
                                  <td className="px-4 py-3 text-right font-medium text-green-600">
                                    {t.tuitionPaid.toLocaleString()} DH
                                  </td>
                                  <td className="px-4 py-3 text-right font-medium">
                                    <span className={remaining > 0 ? "text-red-600" : "text-green-600"}>
                                      {remaining.toLocaleString()} DH
                                    </span>
                                  </td>
                                  <td className="px-4 py-3 text-center">
                                    {t.inscriptionPaid ? (
                                      <CheckCircle className="mx-auto h-5 w-5 text-green-500" />
                                    ) : (
                                      <button
                                        onClick={() => {
                                          const defaultFee = t.inscriptionFee || 500
                                          const amt = prompt("Montant de l'inscription (DH):", String(defaultFee))
                                          if (amt) handlePayAction(t.id, "pay-inscription", parseFloat(amt))
                                        }}
                                        className="text-red-500 hover:text-red-700"
                                        title="Marquer inscription payee"
                                      >
                                        <XCircle className="mx-auto h-5 w-5" />
                                      </button>
                                    )}
                                  </td>
                                  <td className="px-4 py-3 text-center">{getStatusBadge(t)}</td>
                                  <td className="px-4 py-3">
                                    <div className="flex flex-wrap gap-1">
                                      <Button
                                        variant="outline" size="sm"
                                        onClick={() => {
                                          const amt = prompt("Montant du paiement (DH):", String(remaining > 0 ? remaining : 0))
                                          if (amt) handlePayAction(t.id, "pay-tuition", parseFloat(amt))
                                        }}
                                        disabled={t.status === "PAID"}
                                      >
                                        <CreditCard className="mr-1 h-3 w-3" /> Payer
                                      </Button>
                                      {remaining > 0 && (
                                        <Button
                                          variant="outline" size="sm"
                                          onClick={() => {
                                            if (confirm(`Payer l'annee complete pour ${t.student.firstName} ${t.student.lastName} ? (${remaining.toLocaleString()} DH)`))
                                              handlePayAction(t.id, "pay-full-year")
                                          }}
                                        >
                                          <DollarSign className="mr-1 h-3 w-3" /> Annee
                                        </Button>
                                      )}
                                    </div>
                                  </td>
                                </tr>
                              )
                            })}
                          </tbody>
                        </table>
                      </div>
                    )
                  })
                })()}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {showForm && (
        <Card>
          <CardHeader><CardTitle>Nouvelle transaction</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Type</label>
                  <Select options={typeOptions} value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} />
                </div>
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
                <Button type="submit">Ajouter</Button>
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Annuler</Button>
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
          {loading ? (
            <div className="py-8 text-center text-muted-foreground">Chargement...</div>
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
                        {record.type === "INSCRIPTION" && <Badge variant="default">Inscription</Badge>}
                        {record.type === "EXPENSE" && <Badge variant="destructive">Depense</Badge>}
                        {record.type === "SALARY" && <Badge variant="warning">Salaire</Badge>}
                      </td>
                      <td className="py-3">{record.description}</td>
                      <td className="py-3 text-muted-foreground">
                        {record.student ? `${record.student.firstName} ${record.student.lastName}` : "-"}
                      </td>
                      <td className={`py-3 text-right font-medium ${
                        record.type === "TUITION" || record.type === "INSCRIPTION" ? "text-green-600" : "text-red-600"
                      }`}>
                        {(record.type === "TUITION" || record.type === "INSCRIPTION") ? "+" : "-"}
                        {record.amount.toLocaleString()} DH
                      </td>
                    </tr>
                  ))}
                  {data?.records.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-muted-foreground">Aucune transaction</td>
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

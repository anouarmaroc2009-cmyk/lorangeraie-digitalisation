"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { getAcademicYear, LEVEL_LABELS, cn } from "@/lib/utils"
import {
  Wallet, TrendingUp, AlertTriangle, CheckCircle, XCircle,
  RotateCcw, CreditCard, DollarSign, Users, FileText,
  RefreshCw, ChevronRight, Search, AlertOctagon
} from "lucide-react"

const CLASS_TABS = [
  { key: "ALL", label: "Toutes" },
  { key: "NIVEAU_1AC", label: "1AC" },
  { key: "NIVEAU_2AC", label: "2AC" },
  { key: "NIVEAU_3AC", label: "3AC" },
  { key: "NIVEAU_TRONC_COMMUN", label: "TC" },
  { key: "NIVEAU_1BAC_ECO", label: "1BAC Eco" },
  { key: "NIVEAU_1BAC_SC", label: "1BAC Sc" },
  { key: "NIVEAU_2BAC_ECO", label: "2BAC Eco" },
  { key: "NIVEAU_2BAC_SC", label: "2BAC Sc" },
]

function StatusBadge({ status }: { status: string }) {
  if (status === "PAID") return <Badge variant="success">Payé</Badge>
  if (status === "PARTIAL") return <Badge variant="warning">En attente</Badge>
  return <Badge variant="destructive">Impayé</Badge>
}

function fmt(n: number): string {
  return n.toLocaleString("fr-FR") + " DH"
}

export default function FinancesPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const isDirection = session?.user?.role === "DIRECTION"

  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [level, setLevel] = useState("ALL")
  const [search, setSearch] = useState("")
  const [initBusy, setInitBusy] = useState(false)

  const year = getAcademicYear()

  const load = () => {
    setLoading(true)
    setError("")
    const params = new URLSearchParams({ academicYear: year })
    if (level !== "ALL") params.set("level", level)
    fetch(`/api/finances/suivi?${params}`)
      .then(async (res) => {
        if (!res.ok) {
          const body = await res.json().catch(() => null)
          throw new Error(body?.error || `Erreur ${res.status}`)
        }
        return res.json()
      })
      .then((json) => {
        setData(json)
        setLoading(false)
      })
      .catch((e) => {
        console.error("Fetch error:", e)
        setError(e.message || "Impossible de charger")
        setLoading(false)
      })
  }

  useEffect(() => { load() }, [level, year])

  async function initYear() {
    if (!confirm(`Initialiser le suivi ${year} ?`)) return
    setInitBusy(true)
    try {
      const r = await fetch("/api/finances/trackings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ academicYear: year }),
      })
      if (!r.ok) throw new Error("Init échouée")
      load()
    } catch (e: any) { setError(e.message) }
    setInitBusy(false)
  }

  async function payMonths(tid: string, n: number, m: number) {
    const lbl = n >= 10 ? "l'année" : n > 1 ? `${n} mois` : "1 mois"
    if (!confirm(`Payer ${lbl} (${fmt(m * n)}) ?`)) return
    try {
      const r = await fetch(`/api/finances/trackings/${tid}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "pay-months", months: n }),
      })
      const j = await r.json()
      if (!r.ok) throw new Error("Échec paiement")
      load()
      if (j.receiptId) router.push(`/dashboard/finances/recu/${j.receiptId}`)
    } catch (e: any) { setError(e.message) }
  }

  async function payInscription(tid: string, fee: number) {
    if (!confirm(`Payer inscription (${fmt(fee)}) ?`)) return
    try {
      const r = await fetch(`/api/finances/trackings/${tid}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "pay-inscription" }),
      })
      const j = await r.json()
      if (!r.ok) throw new Error("Échec paiement")
      load()
      if (j.receiptId) router.push(`/dashboard/finances/recu/${j.receiptId}`)
    } catch (e: any) { setError(e.message) }
  }

  async function payFull(tid: string, rem: number) {
    if (!confirm(`Payer solde (${fmt(rem)}) ?`)) return
    try {
      const r = await fetch(`/api/finances/trackings/${tid}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "pay-full-year" }),
      })
      const j = await r.json()
      if (!r.ok) throw new Error("Échec paiement")
      load()
      if (j.receiptId) router.push(`/dashboard/finances/recu/${j.receiptId}`)
    } catch (e: any) { setError(e.message) }
  }

  const students: any[] = data?.students ?? []
  const stats = data?.stats
  const activeTab = CLASS_TABS.find((t) => t.key === level)
  const filtered = search
    ? students.filter((s: any) => {
        const q = search.toLowerCase()
        return s.firstName.toLowerCase().includes(q) || s.lastName.toLowerCase().includes(q) || s.massar.toLowerCase().includes(q)
      })
    : students

  if (!session) {
    return <div className="py-12 text-center text-muted-foreground">Session...</div>
  }

  if (!isDirection) {
    return <div className="py-12 text-center text-muted-foreground">Accès réservé à la direction</div>
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div><h1 className="text-2xl font-bold">Suivi des paiements</h1><p className="text-sm text-muted-foreground">Année scolaire {year}</p></div>
        <Card><CardContent className="flex items-center justify-center py-20"><RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" /><span className="ml-3 text-muted-foreground">Chargement...</span></CardContent></Card>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div><h1 className="text-2xl font-bold">Suivi des paiements</h1><p className="text-sm text-muted-foreground">Année scolaire {year}</p></div>
          <Button variant="outline" size="sm" onClick={load}><RefreshCw className="mr-1 h-3 w-3" /> Réessayer</Button>
        </div>
        <div className="flex items-center gap-3 rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <AlertOctagon className="h-5 w-5 shrink-0" />
          <span>{error}</span>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Suivi des paiements</h1>
          <p className="text-sm text-muted-foreground">Année {year} — {activeTab?.label || "Toutes"}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => router.push("/dashboard/finances/recu/nouveau")}>
            <FileText className="mr-1 h-3 w-3" /> Nouveau reçu
          </Button>
          <Button variant="outline" size="sm" onClick={initYear} disabled={initBusy}>
            <RotateCcw className="mr-1 h-3 w-3" /> {initBusy ? "..." : "Initialiser"}
          </Button>
          <Button variant="outline" size="sm" onClick={load}>
            <RefreshCw className="mr-1 h-3 w-3" /> Actualiser
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap gap-1 rounded-lg border bg-slate-50 p-1">
        {CLASS_TABS.map((t) => (
          <button key={t.key} onClick={() => { setLevel(t.key); setSearch("") }}
            className={cn("rounded-md px-4 py-2 text-sm font-medium transition-colors",
              level === t.key ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-900 hover:bg-white/50"
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {stats && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total collecté</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-green-600">{fmt(stats.totalCollected)}</p>
              {stats.totalInscriptionCollected > 0 && <p className="text-xs text-muted-foreground mt-1">dont {fmt(stats.totalInscriptionCollected)} inscriptions</p>}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Restant à percevoir</CardTitle>
              <AlertTriangle className="h-4 w-4 text-amber-600" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-amber-600">{fmt(stats.totalRemaining)}</p>
              {stats.totalRemaining === 0 && <p className="text-xs text-green-600 mt-1">Tout est à jour</p>}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Élèves en retard</CardTitle>
              <Users className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-red-600">{stats.studentsBehind}</p>
              <p className="text-xs text-muted-foreground mt-1">sur {stats.totalStudents} élève(s)</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Réinscrits N+1</CardTitle>
              <FileText className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-blue-600">{students.filter((s: any) => s.reenrolled).length}</p>
              <p className="text-xs text-muted-foreground mt-1">/ {stats.totalStudents} élève(s)</p>
            </CardContent>
          </Card>
        </div>
      )}

      {students.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center py-16 text-muted-foreground">
            <Wallet className="mb-3 h-12 w-12" />
            <p className="text-lg font-medium">Aucun élève trouvé</p>
            <p className="text-sm mt-1">{level === "ALL" ? "Aucun élève actif" : `Aucun élève en ${activeTab?.label}`}</p>
            <Button variant="outline" size="sm" className="mt-4" onClick={initYear}>
              <RotateCcw className="mr-1 h-3 w-3" /> Initialiser le suivi
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader className="pb-0">
            <div className="flex items-center justify-between">
              <CardTitle>{level !== "ALL" ? `Classe ${activeTab?.label}` : "Tous les élèves"} <span className="ml-2 text-sm font-normal text-muted-foreground">({filtered.length})</span></CardTitle>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input type="text" placeholder="Rechercher..." value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="h-9 w-48 rounded-md border border-slate-200 bg-white pl-9 pr-3 text-sm outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-400"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left">
                    <th className="py-3 pr-4 font-medium text-muted-foreground">Élève</th>
                    <th className="py-3 pr-4 font-medium text-muted-foreground">Classe</th>
                    <th className="py-3 pr-4 font-medium text-muted-foreground text-right">Mensualité</th>
                    <th className="py-3 pr-4 font-medium text-muted-foreground text-center">Inscription</th>
                    <th className="py-3 pr-4 font-medium text-muted-foreground text-center">Mois</th>
                    <th className="py-3 pr-4 font-medium text-muted-foreground text-right">Payé</th>
                    <th className="py-3 pr-4 font-medium text-muted-foreground text-right">Reste</th>
                    <th className="py-3 pr-4 font-medium text-muted-foreground text-center">Réinscrit</th>
                    <th className="py-3 pr-4 font-medium text-muted-foreground text-center">Statut</th>
                    <th className="py-3 font-medium text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((s) => (
                    <tr key={s.id} className="border-b last:border-0 hover:bg-slate-50">
                      <td className="py-3 pr-4"><p className="font-medium">{s.lastName} {s.firstName}</p><p className="text-xs text-muted-foreground font-mono">{s.massar}</p></td>
                      <td className="py-3 pr-4"><Badge variant="secondary">{LEVEL_LABELS[s.level] || s.level}</Badge></td>
                      <td className="py-3 pr-4 text-right font-medium">{fmt(s.tracking.monthlyAmount)}</td>
                      <td className="py-3 pr-4 text-center">
                        {s.tracking.inscriptionPaid ? (
                          <span className="inline-flex items-center gap-1 text-green-600"><CheckCircle className="h-4 w-4" /><span className="text-xs">Payée</span></span>
                        ) : (
                          <button onClick={() => payInscription(s.tracking.id, s.tracking.inscriptionFee)}
                            className="inline-flex items-center gap-1 text-red-500 hover:text-red-700" title="Payer inscription">
                            <XCircle className="h-4 w-4" /><span className="text-xs">{fmt(s.tracking.inscriptionFee)}</span>
                          </button>
                        )}
                      </td>
                      <td className="py-3 pr-4 text-center"><span className={cn("font-medium", s.tracking.monthsPaid >= 10 ? "text-green-600" : "")}>{s.tracking.monthsPaid}/10</span></td>
                      <td className="py-3 pr-4 text-right font-medium text-green-600">{fmt(s.tracking.tuitionPaid)}</td>
                      <td className="py-3 pr-4 text-right font-medium"><span className={s.tracking.remaining > 0 ? "text-red-600" : "text-green-600"}>{fmt(s.tracking.remaining)}</span></td>
                      <td className="py-3 pr-4 text-center">{s.reenrolled ? <Badge variant="success">Oui</Badge> : <Badge variant="warning">Non</Badge>}</td>
                      <td className="py-3 pr-4 text-center"><StatusBadge status={s.tracking.status} /></td>
                      <td className="py-3">
                        <div className="flex gap-1">
                          <Button variant="ghost" size="sm" onClick={() => payMonths(s.tracking.id, 1, s.tracking.monthlyAmount)}
                            disabled={s.tracking.monthsPaid >= 10} title="1 mois"><CreditCard className="h-3 w-3" /></Button>
                          {s.tracking.remaining > 0 && (
                            <Button variant="ghost" size="sm" onClick={() => payFull(s.tracking.id, s.tracking.remaining)} title="Tout payer"><DollarSign className="h-3 w-3" /></Button>
                          )}
                          {s.lastReceiptId && (
                            <Button variant="ghost" size="sm" onClick={() => router.push(`/dashboard/finances/recu/${s.lastReceiptId}`)} title="Voir le reçu"><FileText className="h-3 w-3" /></Button>
                          )}
                          <Button variant="ghost" size="sm" onClick={() => router.push(`/dashboard/students/${s.id}`)} title="Fiche élève"><ChevronRight className="h-3 w-3" /></Button>
                        </div>
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

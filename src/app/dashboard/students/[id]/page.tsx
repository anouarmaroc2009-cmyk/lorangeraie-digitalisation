"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { useRouter, useParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { LEVEL_LABELS, getAcademicYear } from "@/lib/utils"
import { ArrowLeft, Save, Trash2, CreditCard, DollarSign, CheckCircle, XCircle } from "lucide-react"

const MONTH_NAMES = ["Septembre", "Octobre", "Novembre", "Decembre", "Janvier", "Fevrier", "Mars", "Avril", "Mai", "Juin"]

const levelOptions = Object.entries(LEVEL_LABELS).map(([value, label]) => ({ value, label }))
const statusOptions = [
  { value: "ACTIVE", label: "Actif" },
  { value: "ARCHIVED", label: "Archive" },
]

export default function StudentDetailPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const params = useParams()
  const isDirection = session?.user?.role === "DIRECTION"
  const isNew = params.id === "new"

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    massar: "",
    level: "NIVEAU_1AC",
    status: "ACTIVE",
    reenrolled: false,
    monthlyTuition: "",
    inscriptionFee: "",
    parentName: "",
    parentPhone: "",
    address: "",
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [tracking, setTracking] = useState<any>(null)
  const [payingMonths, setPayingMonths] = useState(0)

  useEffect(() => {
    if (!isNew && params.id) {
      fetch(`/api/students/${params.id}`)
        .then((r) => r.json())
        .then((data) => {
          setForm({
            firstName: data.firstName,
            lastName: data.lastName,
            massar: data.massar,
            level: data.level,
            status: data.status,
            reenrolled: data.reenrolled,
            monthlyTuition: data.monthlyTuition?.toString() ?? "",
            inscriptionFee: data.inscriptionFee?.toString() ?? "",
            parentName: data.parentName ?? "",
            parentPhone: data.parentPhone ?? "",
            address: data.address ?? "",
          })
        })
    }
    if (!isNew && params.id) {
      const year = getAcademicYear()
      fetch(`/api/finances/trackings?academicYear=${year}`)
        .then((r) => r.json())
        .then((list) => {
          const found = list.find((t: any) => t.studentId === params.id)
          if (found) setTracking(found)
        })
    }
  }, [params.id])

  async function handleSave() {
    if (!isDirection) return
    setSaving(true)
    setError("")

    const url = isNew ? "/api/students" : `/api/students/${params.id}`
    const method = isNew ? "POST" : "PUT"

    const payload = {
      ...form,
      monthlyTuition: form.monthlyTuition ? parseFloat(form.monthlyTuition) : null,
      inscriptionFee: form.inscriptionFee ? parseFloat(form.inscriptionFee) : null,
    }
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })

    setSaving(false)

    if (!res.ok) {
      const text = await res.text()
      setError(text.slice(0, 200))
      return
    }

    router.push("/dashboard/students")
    router.refresh()
  }

  async function handlePayMonths(months: number) {
    if (!tracking) return
    const label = months >= 10 ? "toute l'annee" : months > 1 ? `${months} mois` : "1 mois"
    const total = tracking.monthlyAmount * months
    if (!confirm(`Payer ${label} (${total.toLocaleString()} DH) pour ${form.firstName} ${form.lastName} ?`)) return
    await fetch(`/api/finances/trackings/${tracking.id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "pay-months", months }),
    })
    setPayingMonths(0)
    const year = getAcademicYear()
    const list = await fetch(`/api/finances/trackings?academicYear=${year}`).then((r) => r.json())
    const found = list.find((t: any) => t.studentId === params.id)
    if (found) setTracking(found)
  }

  async function handlePayInscription() {
    if (!tracking) return
    const fee = tracking.inscriptionFee || 500
    if (!confirm(`Payer les frais d'inscription (${fee.toLocaleString()} DH) pour ${form.firstName} ${form.lastName} ?`)) return
    await fetch(`/api/finances/trackings/${tracking.id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "pay-inscription" }),
    })
    const year = getAcademicYear()
    const list = await fetch(`/api/finances/trackings?academicYear=${year}`).then((r) => r.json())
    const found = list.find((t: any) => t.studentId === params.id)
    if (found) setTracking(found)
  }

  async function handleDelete() {
    if (!isDirection || isNew) return
    if (!confirm("Supprimer cet eleve ?")) return

    await fetch(`/api/students/${params.id}`, { method: "DELETE" })
    router.push("/dashboard/students")
    router.refresh()
  }

  if (!isDirection && !isNew) {
    return (
      <div className="flex items-center justify-center py-12 text-muted-foreground">
        Acces reserve a la direction
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.push("/dashboard/students")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              {isNew ? "Nouvel eleve" : `${form.lastName} ${form.firstName}`}
            </h1>
          </div>
        </div>
        {isDirection && (
          <div className="flex gap-2">
            {!isNew && (
              <Button variant="destructive" onClick={handleDelete}>
                <Trash2 className="mr-2 h-4 w-4" />
                Supprimer
              </Button>
            )}
            <Button onClick={handleSave} disabled={saving}>
              <Save className="mr-2 h-4 w-4" />
              {saving ? "Enregistrement..." : "Enregistrer"}
            </Button>
          </div>
        )}
      </div>

        {error && (
          <div className="rounded-md bg-red-50 border border-red-200 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Informations</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Nom</label>
              <Input
                value={form.lastName}
                onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                disabled={!isDirection}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Prenom</label>
              <Input
                value={form.firstName}
                onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                disabled={!isDirection}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Code Massar</label>
            <Input
              value={form.massar}
              onChange={(e) => setForm({ ...form, massar: e.target.value })}
              disabled={!isDirection}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Niveau</label>
              <Select
                options={levelOptions}
                value={form.level}
                onChange={(e) => setForm({ ...form, level: e.target.value })}
                disabled={!isDirection}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Statut</label>
              <Select
                options={statusOptions}
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
                disabled={!isDirection}
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="reenrolled"
              checked={form.reenrolled}
              onChange={(e) => setForm({ ...form, reenrolled: e.target.checked })}
              disabled={!isDirection}
              className="h-4 w-4 rounded border-gray-300"
            />
            <label htmlFor="reenrolled" className="text-sm font-medium">
              Reinscrit pour l&apos;annee prochaine
            </label>
          </div>

          <div className="border-t pt-4">
            <p className="text-sm font-semibold text-slate-900 mb-3">Frais de scolarite</p>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">Mensualite (DH/mois)</label>
                <Input
                  type="number" min="0" step="100"
                  value={form.monthlyTuition}
                  onChange={(e) => setForm({ ...form, monthlyTuition: e.target.value })}
                  disabled={!isDirection}
                  placeholder="Ex: 500"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Frais d'inscription (DH/an)</label>
                <Input
                  type="number" min="0" step="100"
                  value={form.inscriptionFee}
                  onChange={(e) => setForm({ ...form, inscriptionFee: e.target.value })}
                  disabled={!isDirection}
                  placeholder="Ex: 1000"
                />
              </div>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Parent / Tuteur</label>
              <Input
                value={form.parentName}
                onChange={(e) => setForm({ ...form, parentName: e.target.value })}
                disabled={!isDirection}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Telephone parent</label>
              <Input
                value={form.parentPhone}
                onChange={(e) => setForm({ ...form, parentPhone: e.target.value })}
                disabled={!isDirection}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Adresse</label>
            <Input
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
              disabled={!isDirection}
            />
          </div>
        </CardContent>
      </Card>

      {!isNew && tracking && isDirection && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Paiements</CardTitle>
              <div className="flex items-center gap-2 text-sm">
                {tracking.inscriptionPaid ? (
                  <Badge variant="success">Inscription payee</Badge>
                ) : (
                  <Button variant="outline" size="sm" onClick={handlePayInscription}>
                    <XCircle className="mr-1 h-3 w-3 text-red-500" /> Payer inscription
                  </Button>
                )}
                <Badge variant="secondary">{tracking.monthsPaid}/10 mois</Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-sm text-muted-foreground">
              Mensualite: <strong>{tracking.monthlyAmount.toLocaleString()} DH</strong>
              {" | "}Total an: <strong>{tracking.tuitionDue.toLocaleString()} DH</strong>
              {" | "}Paye: <strong className="text-green-600">{tracking.tuitionPaid.toLocaleString()} DH</strong>
              {" | "}Reste: <strong className={tracking.tuitionDue - tracking.tuitionPaid > 0 ? "text-red-600" : "text-green-600"}>
                {(tracking.tuitionDue - tracking.tuitionPaid).toLocaleString()} DH
              </strong>
            </div>

            <div className="grid grid-cols-5 gap-2">
              {MONTH_NAMES.map((name, i) => {
                const paid = i < tracking.monthsPaid
                return (
                  <div key={name}
                    className={`flex items-center justify-center rounded-md border py-3 text-sm font-medium ${
                      paid
                        ? "bg-green-100 border-green-300 text-green-700"
                        : "bg-slate-50 border-slate-200 text-slate-500"
                    }`}
                  >
                    {paid ? <CheckCircle className="mr-1 h-4 w-4 text-green-500" /> : <XCircle className="mr-1 h-4 w-4 text-slate-300" />}
                    {name}
                  </div>
                )
              })}
            </div>

            <div className="flex flex-wrap gap-2 pt-2">
              <Button onClick={() => handlePayMonths(1)} disabled={tracking.monthsPaid >= 10}>
                <CreditCard className="mr-1 h-4 w-4" /> 1 mois
              </Button>
              <Button variant="outline" onClick={() => handlePayMonths(2)} disabled={tracking.monthsPaid >= 9}>
                2 mois
              </Button>
              <Button variant="outline" onClick={() => handlePayMonths(3)} disabled={tracking.monthsPaid >= 8}>
                3 mois
              </Button>
              {tracking.monthsPaid < 10 && (
                <Button variant="outline" onClick={() => handlePayMonths(5)} disabled={tracking.monthsPaid >= 6}>
                  5 mois
                </Button>
              )}
              <Button variant="default" onClick={() => handlePayMonths(10)} disabled={tracking.monthsPaid >= 10}>
                <DollarSign className="mr-1 h-4 w-4" /> Toute l&apos;annee
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

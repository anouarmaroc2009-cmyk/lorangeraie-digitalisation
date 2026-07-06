"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { useRouter, useParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select } from "@/components/ui/select"
import { LEVEL_LABELS } from "@/lib/utils"
import { ArrowLeft, Save, Trash2 } from "lucide-react"

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
    parentName: "",
    parentPhone: "",
    address: "",
  })
  const [saving, setSaving] = useState(false)

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
            parentName: data.parentName ?? "",
            parentPhone: data.parentPhone ?? "",
            address: data.address ?? "",
          })
        })
    }
  }, [params.id])

  async function handleSave() {
    if (!isDirection) return
    setSaving(true)

    const url = isNew ? "/api/students" : `/api/students/${params.id}`
    const method = isNew ? "POST" : "PUT"

    await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    })

    setSaving(false)
    router.push("/dashboard/students")
    router.refresh()
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
    </div>
  )
}

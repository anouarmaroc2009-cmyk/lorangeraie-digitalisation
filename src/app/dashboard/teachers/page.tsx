"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { LEVEL_LABELS } from "@/lib/utils"
import { Plus, Pencil, Trash2, Save, X, Users } from "lucide-react"

interface TeacherLevel {
  teacherId: string
  level: string
}

interface Teacher {
  id: string
  firstName: string
  lastName: string
  email: string | null
  phone: string | null
  address: string | null
  levels: TeacherLevel[]
}

const allLevels = Object.entries(LEVEL_LABELS).map(([value, label]) => ({ value, label }))

export default function TeachersPage() {
  const { data: session } = useSession()
  const isDirection = session?.user?.role === "DIRECTION"

  const [teachers, setTeachers] = useState<Teacher[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<string | null>(null)
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    address: "",
    levels: [] as string[],
  })

  async function fetchTeachers() {
    setLoading(true)
    const res = await fetch("/api/teachers")
    setTeachers(await res.json())
    setLoading(false)
  }

  useEffect(() => { fetchTeachers() }, [])

  function resetForm() {
    setForm({ firstName: "", lastName: "", email: "", phone: "", address: "", levels: [] })
    setEditing(null)
  }

  function startEdit(t: Teacher) {
    setForm({
      firstName: t.firstName,
      lastName: t.lastName,
      email: t.email ?? "",
      phone: t.phone ?? "",
      address: t.address ?? "",
      levels: t.levels.map((l) => l.level),
    })
    setEditing(t.id)
  }

  function toggleLevel(level: string) {
    setForm((f) => ({
      ...f,
      levels: f.levels.includes(level)
        ? f.levels.filter((l) => l !== level)
        : [...f.levels, level],
    }))
  }

  async function handleSave() {
    const method = editing ? "PUT" : "POST"
    const url = editing ? `/api/teachers/${editing}` : "/api/teachers"
    await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    })
    resetForm()
    fetchTeachers()
  }

  async function handleDelete(id: string) {
    if (!confirm("Supprimer cet enseignant ?")) return
    await fetch(`/api/teachers/${id}`, { method: "DELETE" })
    fetchTeachers()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Enseignants</h1>
          <p className="text-sm text-muted-foreground">
            {teachers.length} enseignant(s)
          </p>
        </div>
        {isDirection && !editing && (
          <Button onClick={() => setEditing("new")}>
            <Plus className="mr-2 h-4 w-4" />
            Ajouter
          </Button>
        )}
      </div>

      {(editing === "new" || (editing && editing !== "new")) && (
        <Card>
          <CardHeader>
            <CardTitle>{editing === "new" ? "Nouvel enseignant" : "Modifier l'enseignant"}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">Nom</label>
                <Input value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Prenom</label>
                <Input value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">Email</label>
                <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Telephone</label>
                <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Adresse</label>
              <Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Niveaux enseignes</label>
              <div className="flex flex-wrap gap-2">
                {allLevels.map((l) => (
                  <button
                    key={l.value}
                    type="button"
                    onClick={() => toggleLevel(l.value)}
                    className={`rounded-full px-3 py-1 text-xs font-medium border transition-colors ${
                      form.levels.includes(l.value)
                        ? "bg-slate-900 text-white border-slate-900"
                        : "bg-white text-slate-600 border-slate-300 hover:border-slate-900"
                    }`}
                  >
                    {l.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleSave}>
                <Save className="mr-2 h-4 w-4" />
                Enregistrer
              </Button>
              <Button variant="outline" onClick={resetForm}>
                <X className="mr-2 h-4 w-4" />
                Annuler
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Liste des enseignants</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="py-8 text-center text-muted-foreground">Chargement...</div>
          ) : teachers.length === 0 ? (
            <div className="flex flex-col items-center py-12 text-muted-foreground">
              <Users className="mb-2 h-12 w-12" />
              <p>Aucun enseignant enregistre</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left">
                    <th className="pb-3 font-medium text-muted-foreground">Nom</th>
                    <th className="pb-3 font-medium text-muted-foreground">Prenom</th>
                    <th className="pb-3 font-medium text-muted-foreground">Email</th>
                    <th className="pb-3 font-medium text-muted-foreground">Telephone</th>
                    <th className="pb-3 font-medium text-muted-foreground">Niveaux</th>
                    {isDirection && <th className="pb-3 font-medium text-muted-foreground">Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {teachers.map((t) => (
                    <tr key={t.id} className="border-b last:border-0 hover:bg-slate-50">
                      <td className="py-3 font-medium">{t.lastName}</td>
                      <td className="py-3">{t.firstName}</td>
                      <td className="py-3 text-muted-foreground">{t.email ?? "-"}</td>
                      <td className="py-3 text-muted-foreground">{t.phone ?? "-"}</td>
                      <td className="py-3">
                        <div className="flex flex-wrap gap-1">
                          {t.levels.length === 0 ? (
                            <span className="text-muted-foreground">-</span>
                          ) : (
                            t.levels.map((l) => (
                              <Badge key={l.level} variant="secondary">
                                {LEVEL_LABELS[l.level] || l.level}
                              </Badge>
                            ))
                          )}
                        </div>
                      </td>
                      {isDirection && (
                        <td className="py-3">
                          <div className="flex gap-1">
                            <Button variant="ghost" size="sm" onClick={() => startEdit(t)}>
                              <Pencil className="h-3 w-3" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => handleDelete(t.id)}>
                              <Trash2 className="h-3 w-3 text-red-500" />
                            </Button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

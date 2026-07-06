"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select } from "@/components/ui/select"
import { LEVEL_LABELS } from "@/lib/utils"
import { Plus, Search, RefreshCw, GraduationCap, ArrowUpDown } from "lucide-react"

interface Student {
  id: string
  firstName: string
  lastName: string
  massar: string
  level: string
  status: string
  reenrolled: boolean
  parentName: string | null
  parentPhone: string | null
  _count: { grades: number }
}

const levels = [
  { value: "ALL", label: "Tous les niveaux" },
  ...Object.entries(LEVEL_LABELS).map(([value, label]) => ({ value, label })),
]

export default function StudentsPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const isDirection = session?.user?.role === "DIRECTION"

  const [students, setStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(true)
  const [levelFilter, setLevelFilter] = useState("ALL")
  const [search, setSearch] = useState("")
  const [promoting, setPromoting] = useState(false)

  async function fetchStudents() {
    setLoading(true)
    const params = new URLSearchParams()
    if (levelFilter !== "ALL") params.set("level", levelFilter)
    const res = await fetch(`/api/students?${params}`)
    const data = await res.json()
    setStudents(data)
    setLoading(false)
  }

  useEffect(() => { fetchStudents() }, [levelFilter])

  const filtered = students.filter((s) => {
    if (!search) return true
    const q = search.toLowerCase()
    return (
      s.firstName.toLowerCase().includes(q) ||
      s.lastName.toLowerCase().includes(q) ||
      s.massar.toLowerCase().includes(q)
    )
  })

  async function handlePromote() {
    if (!confirm("Lancer la promotion automatique de fin d'annee ?")) return
    setPromoting(true)
    await fetch("/api/students/promote", { method: "POST" })
    await fetchStudents()
    setPromoting(false)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Eleves</h1>
          <p className="text-sm text-muted-foreground">
            {students.length} eleve(s) actif(s)
          </p>
        </div>
        {isDirection && (
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handlePromote}
              disabled={promoting}
            >
              <ArrowUpDown className="mr-2 h-4 w-4" />
              {promoting ? "Traitement..." : "Promotion annuelle"}
            </Button>
            <Button onClick={() => router.push("/dashboard/students/new")}>
              <Plus className="mr-2 h-4 w-4" />
              Ajouter
            </Button>
          </div>
        )}
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle>Liste des eleves</CardTitle>
            <div className="flex gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Rechercher..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 w-48"
                />
              </div>
              <Select
                options={levels}
                value={levelFilter}
                onChange={(e) => setLevelFilter(e.target.value)}
                className="w-40"
              />
              <Button variant="outline" size="icon" onClick={fetchStudents}>
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <GraduationCap className="mb-2 h-12 w-12" />
              <p>Aucun eleve trouve</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left">
                    <th className="pb-3 font-medium text-muted-foreground">Massar</th>
                    <th className="pb-3 font-medium text-muted-foreground">Nom</th>
                    <th className="pb-3 font-medium text-muted-foreground">Prenom</th>
                    <th className="pb-3 font-medium text-muted-foreground">Niveau</th>
                    <th className="pb-3 font-medium text-muted-foreground">Notes</th>
                    <th className="pb-3 font-medium text-muted-foreground">Reinscription</th>
                    <th className="pb-3 font-medium text-muted-foreground">Parent</th>
                    {isDirection && <th className="pb-3 font-medium text-muted-foreground">Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((student) => (
                    <tr key={student.id} className="border-b last:border-0 hover:bg-slate-50">
                      <td className="py-3 font-mono text-xs">{student.massar}</td>
                      <td className="py-3 font-medium">{student.lastName}</td>
                      <td className="py-3">{student.firstName}</td>
                      <td className="py-3">
                        <Badge variant="secondary">
                          {LEVEL_LABELS[student.level] || student.level}
                        </Badge>
                      </td>
                      <td className="py-3">
                        {student._count.grades > 0 ? (
                          <Badge variant="success">{student._count.grades} note(s)</Badge>
                        ) : (
                          <Badge variant="outline">Aucune</Badge>
                        )}
                      </td>
                      <td className="py-3">
                        {student.reenrolled ? (
                          <Badge variant="success">Oui</Badge>
                        ) : (
                          <Badge variant="warning">Non</Badge>
                        )}
                      </td>
                      <td className="py-3 text-muted-foreground">
                        {student.parentName ?? "-"}
                      </td>
                      {isDirection && (
                        <td className="py-3">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => router.push(`/dashboard/students/${student.id}`)}
                          >
                            Modifier
                          </Button>
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

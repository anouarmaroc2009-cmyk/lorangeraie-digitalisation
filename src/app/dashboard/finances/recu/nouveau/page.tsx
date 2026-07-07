"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { LEVEL_LABELS } from "@/lib/utils"
import { ArrowLeft, FileText, AlertOctagon } from "lucide-react"

export default function NouveauRecuPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [students, setStudents] = useState<any[]>([])
  const [studentId, setStudentId] = useState("")
  const [amount, setAmount] = useState("")
  const [type, setType] = useState("TUITION")
  const [description, setDescription] = useState("")
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    fetch("/api/students")
      .then((r) => r.json())
      .then((list) => setStudents(list))
      .catch(() => setError("Impossible de charger les eleves"))
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!studentId || !amount) {
      setError("Veuillez selectionner un eleve et entrer un montant")
      return
    }
    setSaving(true)
    setError("")
    try {
      const r = await fetch("/api/finances/recu/nouveau", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId,
          amount: parseFloat(amount),
          type,
          description: description || undefined,
        }),
      })
      const j = await r.json()
      if (!r.ok) throw new Error(j.error || "Erreur")
      router.push(`/dashboard/finances/recu/${j.receiptId}`)
    } catch (e: any) {
      setError(e.message)
    }
    setSaving(false)
  }

  if (!session || session.user.role !== "DIRECTION") {
    return <div className="py-12 text-center text-muted-foreground">Acces reserve a la direction</div>
  }

  const studentOptions = [
    { value: "", label: "Sélectionner un élève..." },
    ...students.map((s: any) => ({
      value: s.id,
      label: `${s.lastName} ${s.firstName} - ${LEVEL_LABELS[s.level] || s.level} (${s.massar})`,
    })),
  ]

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-2xl font-bold">Nouveau reçu</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Créer un reçu de paiement</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Élève</label>
              <Select options={studentOptions} value={studentId} onChange={(e) => setStudentId(e.target.value)} />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Type</label>
              <Select
                options={[
                  { value: "TUITION", label: "Scolarité" },
                  { value: "INSCRIPTION", label: "Inscription" },
                ]}
                value={type}
                onChange={(e) => setType(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Montant (DH)</label>
              <Input type="number" min="0" step="10" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="Ex: 500" />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Description (optionnelle)</label>
              <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Ex: Paiement Septembre 2024" />
            </div>

            {error && (
              <div className="flex items-center gap-2 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                <AlertOctagon className="h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <Button type="submit" className="w-full" disabled={saving}>
              <FileText className="mr-2 h-4 w-4" />
              {saving ? "Création..." : "Créer le reçu"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { LEVEL_LABELS } from "@/lib/utils"
import { Printer, ArrowLeft, AlertOctagon, CheckCircle, XCircle } from "lucide-react"

const MONTH_NAMES = ["Septembre", "Octobre", "Novembre", "Decembre", "Janvier", "Fevrier", "Mars", "Avril", "Mai", "Juin"]

function fmt(n: number): string {
  return n.toLocaleString("fr-FR") + " DH"
}

export default function RecuPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const params = useParams()
  const [receipt, setReceipt] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    fetch(`/api/finances/recu/${params.id}`)
      .then(async (r) => {
        if (!r.ok) { const b = await r.json().catch(() => null); throw new Error(b?.error || "Erreur") }
        return r.json()
      })
      .then((j) => { setReceipt(j); setLoading(false) })
      .catch((e) => { setError(e.message); setLoading(false) })
  }, [params.id])

  if (!session || session.user.role !== "DIRECTION") {
    return <div className="py-12 text-center text-muted-foreground">Accès réservé à la direction</div>
  }

  if (loading) return <div className="py-12 text-center text-muted-foreground">Chargement...</div>
  if (error) return <div className="py-12 text-center text-red-600 flex items-center justify-center gap-2"><AlertOctagon className="h-5 w-5" />{error}</div>
  if (!receipt) return null

  const fr = receipt.financialRecord
  const student = fr.student
  const isInscription = fr.type === "INSCRIPTION"
  const monthsPaid = receipt.tracking?.monthsPaid ?? 0

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <div className="flex items-center justify-between no-print">
        <Button variant="ghost" onClick={() => router.back()}>
          <ArrowLeft className="mr-1 h-4 w-4" /> Retour
        </Button>
        <Button onClick={() => window.print()}>
          <Printer className="mr-1 h-4 w-4" /> Imprimer
        </Button>
      </div>

      <div id="recu" className="rounded-lg border bg-white p-8 shadow-sm print:border-0 print:shadow-none">
        <div className="mb-8 text-center border-b pb-6">
          <h1 className="text-2xl font-bold uppercase tracking-wide">Groupe Scolaire Privé L&apos;Orangeraie</h1>
          <p className="text-lg font-semibold text-muted-foreground">
            {isInscription ? "REÇU DE FRAIS D&apos;INSCRIPTION" : "REÇU DE PAIEMENT DE SCOLARITÉ"}
          </p>
        </div>

        <div className="mb-6 flex items-center justify-between text-sm">
          <p><span className="font-medium">N° Reçu :</span> {receipt.academicYear}-{String(receipt.number).padStart(4, "0")}</p>
          <p><span className="font-medium">Date :</span> {new Date(fr.date).toLocaleDateString("fr-FR")}</p>
        </div>

        <div className="mb-6 space-y-1 text-sm">
          <p><span className="font-medium">Élève :</span> {student.lastName} {student.firstName}</p>
          <p><span className="font-medium">Massar :</span> {student.massar}</p>
          <p><span className="font-medium">Classe :</span> {LEVEL_LABELS[student.level] || student.level}</p>
          <p><span className="font-medium">Année scolaire :</span> {receipt.academicYear}</p>
        </div>

        {!isInscription && (
          <div className="mb-6">
            <p className="mb-2 text-sm font-medium">Mois payés :</p>
            <div className="grid grid-cols-5 gap-1.5">
              {MONTH_NAMES.map((name, i) => {
                const paid = i < monthsPaid
                return (
                  <div key={name}
                    className={`flex items-center justify-center gap-1 rounded-md border py-2 text-xs font-medium ${
                      paid
                        ? "bg-green-100 border-green-300 text-green-700"
                        : "bg-slate-50 border-slate-200 text-slate-400"
                    }`}
                  >
                    {paid ? <CheckCircle className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                    {name}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        <table className="mb-6 w-full text-sm">
          <thead>
            <tr className="border-b border-t">
              <th className="py-2 text-left font-medium">Libellé</th>
              <th className="py-2 text-right font-medium">Montant</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b">
              <td className="py-3">{isInscription ? `Frais d'inscription ${receipt.academicYear}` : fr.description}</td>
              <td className="py-3 text-right font-bold">{fmt(fr.amount)}</td>
            </tr>
          </tbody>
        </table>

        <div className="mb-8 flex justify-between border-t pt-4 text-lg font-bold">
          <span>Total</span>
          <span>{fmt(fr.amount)}</span>
        </div>

        <div className="flex justify-between text-sm text-muted-foreground">
          <div className="text-center">
            <p className="mb-8">
              {isInscription ? "Cachet de l'établissement" : "Cachet et signature"}
            </p>
            <p>_________________________</p>
          </div>
          <div className="text-center">
            <p className="mb-8">Reçu par</p>
            <p>_________________________</p>
          </div>
        </div>
      </div>

      <style jsx global>{`
        @media print {
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .no-print { display: none !important; }
        }
      `}</style>
    </div>
  )
}

"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import * as XLSX from "xlsx";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2 } from "lucide-react";

/* --------------------------------------------- */
/* HELPERS */
/* --------------------------------------------- */

function formatDate(d: string) {
  if (!d) return "";
  return new Date(d).toLocaleDateString("es-ES");
}

/* --------------------------------------------- */
/* COLUMN GROUPS */
/* --------------------------------------------- */

const GROUPS = [
  {
    key: "antropometria",
    title: "Antropometría",
    columns: [
      { key: "weight", label: "Peso (kg)" },
      { key: "bmi", label: "IMC" },
      { key: "height", label: "Talla (cm)" },
    ],
  },
  {
    key: "cardio",
    title: "Cardiovascular",
    columns: [
      { key: "office_sys", label: "TA sistólica (mmHg)" },
      { key: "office_dia", label: "TA diastólica (mmHg)" },
      { key: "probnp", label: "proBNP (pg/mL)" },
    ],
  },
  {
    key: "metabolico",
    title: "Metabólico",
    columns: [
      { key: "hb1ac", label: "HbA1c (%)" },
      { key: "ldl", label: "LDL (mg/dL)" },
      { key: "hdl", label: "HDL (mg/dL)" },
      { key: "triglycerides", label: "Triglicéridos (mg/dL)" },
      { key: "total_cholesterol", label: "Colesterol total (mg/dL)" },
    ],
  },
  {
    key: "renal",
    title: "Renal",
    columns: [
      { key: "creatinine", label: "Creatinina (mg/dL)" },
      { key: "egfr", label: "TFGe (ml/min)" },
      { key: "egfr_category", label: "Estadio renal" },
      { key: "albuminuria", label: "Albuminuria (mg/g)" },
      { key: "albuminuria_category", label: "Categoría albuminuria" },
      { key: "potassium", label: "Potasio" },
    ],
  },
];

/* --------------------------------------------- */
/* MAIN PAGE */
/* --------------------------------------------- */

export default function AllVisitsPage() {
  const { id } = useParams();
  const router = useRouter();
  const [visits, setVisits] = useState<any[]>([]);

  const [visibleGroups, setVisibleGroups] = useState<Record<string, boolean>>({
    antropometria: true,
    cardio: true,
    metabolico: true,
    renal: true,
  });

  const toggleGroup = (key: string) =>
    setVisibleGroups((prev) => ({ ...prev, [key]: !prev[key] }));

  /* LOAD DATA */
  async function loadVisits() {
    const { data, error } = await supabase
      .from("clinical_values")
      .select("*")
      .eq("patient_id", id)
      .order("measured_at", { ascending: true });

    if (error) console.error(error);
    setVisits(data || []);
  }

  useEffect(() => {
    loadVisits();
  }, [id]);

  /* DELETE VISIT */
  async function deleteVisit(visitId: string) {
    const ok = confirm("¿Eliminar esta visita? Esta acción no se puede deshacer.");
    if (!ok) return;

    const { error } = await supabase.from("clinical_values").delete().eq("id", visitId);
    if (error) return alert("Error eliminando la visita");

    await loadVisits();
  }

  /* EXPORT EXCEL */
  function exportExcel() {
    const rows = visits.map((v) => ({
      Fecha: formatDate(v.measured_at),
      Peso: v.weight,
      IMC: v.bmi,
      Talla: v.height,
      TA_sistolica: v.office_sys,
      TA_diastolica: v.office_dia,
      proBNP: v.probnp,
      HbA1c: v.hb1ac,
      LDL: v.ldl,
      HDL: v.hdl,
      Trigliceridos: v.triglycerides,
      Colesterol_total: v.total_cholesterol,
      Creatinina: v.creatinine,
      TFGe: v.egfr,
      Estadio_renal: v.egfr_category,
      Albuminuria: v.albuminuria,
      Categoria_albuminuria: v.albuminuria_category,
      Potasio: v.potassium,
    }));

    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Visitas");

    XLSX.writeFile(wb, `visitas_paciente_${id}.xlsx`);
  }

  return (
    <div className="bg-slate-50 min-h-screen px-4 md:px-8 py-4">
      <div className="w-full max-w-[2800px] mx-auto flex flex-col gap-6">

        {/* HEADER */}
        <div className="flex justify-between items-center border-b pb-3">
          <div>
            <h1 className="text-xl font-semibold text-sky-900">
              Todas las visitas 
            </h1>
            <p className="text-slate-600 text-sm">Parámetros clínicos</p>
          </div>

          <Button onClick={exportExcel} className="bg-emerald-600 hover:bg-emerald-700">
            Exportar Excel
          </Button>
        </div>

        {/* SWITCHES */}
        <Card className="shadow-sm bg-white border border-slate-200 rounded-xl">
          <CardHeader>
            <CardTitle className="text-sky-900 text-lg">
              Mostrar / Ocultar secciones
            </CardTitle>
          </CardHeader>

          <CardContent className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            {GROUPS.map((g) => (
              <div key={g.key} className="flex items-center space-x-2">
                <Switch
                  checked={visibleGroups[g.key]}
                  onCheckedChange={() => toggleGroup(g.key)}
                />
                <Label className="text-slate-700">{g.title}</Label>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* TABLE */}
        <Card className="shadow-sm border border-slate-200 bg-white rounded-xl w-full">
          <CardHeader className="border-b border-slate-200 pb-2">
            <CardTitle className="text-lg font-semibold text-sky-900">
              Tabla de visitas            </CardTitle>
          </CardHeader>

          <CardContent>
            <div className="overflow-x-auto border border-slate-200 rounded-lg">
              <table className="min-w-full text-xs table-auto">

                {/* COLGROUP */}
                <colgroup>
                  <col className="w-[140px]" /> {/* Fecha */}
                  <col className="w-[120px]" /> {/* Acciones */}
                  {GROUPS.flatMap((group) =>
                    visibleGroups[group.key]
                      ? group.columns.map(() => (
                          <col className="w-[130px]" key={Math.random()} />
                        ))
                      : []
                  )}
                </colgroup>

                {/* HEADER */}
                <thead>
                  <tr className="bg-slate-100">
                    <th className="p-3 border-r text-left font-semibold">Fecha</th>
                    <th className="p-3 border-r text-center font-semibold">Acciones</th>

                    {GROUPS.map(
                      (group) =>
                        visibleGroups[group.key] && (
                          <th
                            key={group.key}
                            colSpan={group.columns.length}
                            className="p-3 border-r text-center font-semibold text-sky-900"
                          >
                            {group.title}
                          </th>
                        )
                    )}
                  </tr>

                  <tr className="bg-slate-50">
                    <th></th>
                    <th></th>

                    {GROUPS.flatMap((group) =>
                      visibleGroups[group.key]
                        ? group.columns.map((col) => (
                            <th key={col.key} className="p-2 border-r text-left">
                              {col.label}
                            </th>
                          ))
                        : []
                    )}
                  </tr>
                </thead>

                {/* BODY */}
                <tbody>
                  {visits.map((v) => (
                    <tr key={v.id} className="border-t hover:bg-slate-50">
                      {/* Fecha */}
                      <td className="p-3 border-r font-medium">
                        {formatDate(v.measured_at)}
                      </td>

                      {/* Acciones alineadas a la derecha */}
                      <td className="p-3 border-r">
                        <div className="flex justify-center gap-3">
                          <button
                            onClick={() => router.push(`/patients/${id}/visits/${v.id}/edit`)}


                            className="text-sky-600 hover:text-sky-800"
                          >
                            <Pencil size={18} />
                          </button>

                          <button
                            onClick={() => deleteVisit(v.id)}
                            className="text-red-600 hover:text-red-800"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>

                      {/* Values */}
                      {GROUPS.flatMap((group) =>
                        visibleGroups[group.key]
                          ? group.columns.map((col) => (
                              <td key={col.key + v.id} className="p-2 border-r">
                                {v[col.key] ?? "—"}
                              </td>
                            ))
                          : []
                      )}
                    </tr>
                  ))}
                </tbody>

              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

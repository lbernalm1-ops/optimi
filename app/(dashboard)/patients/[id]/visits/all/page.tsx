"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

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
      { key: "proBNP", label: "proBNP (pg/mL)" },
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
      { key: "ckd_stage", label: "Estadio renal" },
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
  const [visits, setVisits] = useState<any[]>([]);

  // 🔥 Todas las secciones visibles por defecto
  const [visibleGroups, setVisibleGroups] = useState<Record<string, boolean>>({
    antropometria: true,
    cardio: true,
    metabolico: true,
    renal: true,
  });

  const toggleGroup = (key: string) => {
    setVisibleGroups((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  /* LOAD DATA */
  useEffect(() => {
    async function load() {
      const pid = Number(id);
      const { data } = await supabase
        .from("clinical_values")
        .select("*")
        .eq("patient_id", pid)
        .order("date", { ascending: true });

      setVisits(data || []);
    }
    load();
  }, [id]);

  return (
    <div className="bg-slate-50 min-h-screen px-4 md:px-8 py-4">

      <div className="w-full max-w-[1800px] mx-auto flex flex-col gap-6">

        {/* HEADER */}
        <div className="border-b pb-3">
          <h1 className="text-xl font-semibold text-sky-900 tracking-wide">
            Todas las visitas — Tabla completa
          </h1>
          <p className="text-slate-600 text-sm">
            Visualización de parámetros clínicos por sistemas.
          </p>
        </div>

        {/* SWITCH PANEL */}
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

        {/* TABLE CARD */}
        <Card className="shadow-sm border border-slate-200 bg-white rounded-xl w-full">
          <CardHeader className="border-b border-slate-200 pb-2">
            <CardTitle className="text-lg font-semibold text-sky-900">
              Tabla completa por visita
            </CardTitle>
          </CardHeader>

          <CardContent>
            <div className="overflow-x-auto border border-slate-200 rounded-lg">
              <table className="min-w-full text-sm table-fixed">

                {/* COLUMN WIDTHS */}
                <colgroup>
                  <col className="w-[120px]" />
                  {GROUPS.flatMap((group) =>
                    visibleGroups[group.key]
                      ? group.columns.map(() => (
                          <col className="w-[110px]" key={Math.random()} />
                        ))
                      : []
                  )}
                </colgroup>

                {/* HEADER */}
                <thead>
                  <tr className="bg-slate-100">
                    <th
                      rowSpan={2}
                      className="p-3 border-r font-semibold text-left whitespace-nowrap"
                    >
                      Fecha
                    </th>

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
                    {GROUPS.flatMap((group) =>
                      visibleGroups[group.key]
                        ? group.columns.map((col) => (
                            <th
                              key={group.key + col.key}
                              className="p-2 border-r font-medium text-left break-words"
                            >
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
                    <tr
                      key={v.id_value}
                      className="border-t hover:bg-slate-50 transition"
                    >
                      {/* Fecha */}
                      <td className="p-3 border-r font-medium whitespace-nowrap">
                        {formatDate(v.date)}
                      </td>

                      {/* Valores */}
                      {GROUPS.flatMap((group) =>
                        visibleGroups[group.key]
                          ? group.columns.map((col) => (
                              <td
                                key={group.key + col.key + v.id_value}
                                className="p-2 border-r break-words"
                              >
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

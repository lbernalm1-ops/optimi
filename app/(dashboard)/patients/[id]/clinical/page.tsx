"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";

import { Calendar, Eye, Info } from "lucide-react";

/* ============================================================
   HELPERS
============================================================ */

function formatDate(dateStr?: string) {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleDateString("es-ES");
}

function formatValueNumber(v: any) {
  if (v === null || v === undefined) return "—";
  const num = Number(v);
  if (isNaN(num)) return String(v);
  return num.toString().replace(".", ",");
}

/* ============================================================
   BASE OPTIONS → then alphabetically sorted
============================================================ */

const RAW_PARAM_OPTIONS = [
  { key: "albuminuria", label: "Albuminuria (mg/g)" },
  { key: "bmi", label: "IMC" },
  { key: "creatinine", label: "Creatinina (mg/dL)" },
  { key: "egfr", label: "TFGe (ml/min)" },
  { key: "hb1ac", label: "HbA1c (%)" },
  { key: "hdl", label: "HDL (mg/dL)" },
  { key: "ldl", label: "LDL (mg/dL)" },
  { key: "potassium", label: "Potasio (mmol/L)" },
  { key: "proBNP", label: "proBNP" },
  { key: "total_cholesterol", label: "Colesterol total (mg/dL)" },
  { key: "triglycerides", label: "Triglicéridos (mg/dL)" },

  // Especiales
  { key: "ta_consulta", label: "TA consulta" },
  { key: "ta_dom", label: "TA domicilio (AMPA)" },
];

const VALUE_PARAM_KEYS = RAW_PARAM_OPTIONS
  .map((p) => p.key)
  .filter((k) => k !== "ta_consulta" && k !== "ta_dom");

const PARAM_DISPLAY_NAME: Record<string, string> = {
  albuminuria: "Albuminuria",
  bmi: "IMC",
  creatinine: "Creatinina",
  egfr: "TFGe",
  hb1ac: "HbA1c",
  hdl: "HDL",
  ldl: "LDL",
  potassium: "Potasio",
  proBNP: "proBNP",
  total_cholesterol: "Colesterol total",
  triglycerides: "Triglicéridos",
};

/* ============================================================
   PAGE
============================================================ */

export default function ClinicalValuesPage() {
  const { id } = useParams();
  const router = useRouter();

  const [latest, setLatest] = useState<any>({});
  const [lastVisit, setLastVisit] = useState<any>(null);
  const [visits, setVisits] = useState<any[]>([]);

  // ⭐ Default: TA CONSULTA
  const [selectedParam, setSelectedParam] = useState("ta_consulta");

  const [loading, setLoading] = useState(true);

  /* ============================================================
     FETCH HELPERS
  ============================================================ */

  async function fetchLatest(field: string) {
    const { data } = await supabase
      .from("clinical_values")
      .select(`${field}, date, created_at`)
      .eq("patient_id", id)
      .not(field, "is", null)
      .order("date", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(1);

    return data?.[0] || null;
  }

  async function fetchLatestTAOffice() {
    const { data } = await supabase
      .from("clinical_values")
      .select("office_sys, office_dia, date, created_at")
      .eq("patient_id", id)
      .not("office_sys", "is", null)
      .order("date", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(1);

    return data?.[0] || null;
  }

  async function fetchLastVisit() {
    const { data } = await supabase
      .from("clinical_values")
      .select("date")
      .eq("patient_id", id)
      .order("date", { ascending: false })
      .limit(1);

    return data?.[0] || null;
  }

  /* ============================================================
     LOAD DATA
  ============================================================ */

  useEffect(() => {
    async function load() {
      const lv = await fetchLastVisit();
      setLastVisit(lv);

      const values: any = {};

      for (const key of VALUE_PARAM_KEYS) {
        values[key] = await fetchLatest(key);
      }

      values.taOffice = await fetchLatestTAOffice();

      setLatest(values);

      const { data: all } = await supabase
        .from("clinical_values")
        .select("*")
        .eq("patient_id", id)
        .order("date", { ascending: true });

      setVisits(all || []);
      setLoading(false);
    }

    load();
  }, [id]);

  if (loading) return <p className="p-6">Cargando…</p>;

  /* ============================================================
     GRAPH DATA
  ============================================================ */

  const isTAConsulta = selectedParam === "ta_consulta";
  const isTADom = selectedParam === "ta_dom";
  const isTA = isTAConsulta || isTADom;

  // Normal parameters
  const chartData = !isTA
    ? visits
        .filter((v) => v[selectedParam] !== null)
        .map((v) => ({
          date: formatDate(v.date),
          value: Number(v[selectedParam]),
        }))
    : [];

  // TA (consulta or AMPA)
  const chartDataTA = isTA
    ? visits
        .filter((v) =>
          isTAConsulta
            ? v.office_sys !== null
            : v.ampa_sys !== null
        )
        .map((v) => {
          const sys = Number(isTAConsulta ? v.office_sys : v.ampa_sys);
          const dia = Number(isTAConsulta ? v.office_dia : v.ampa_dia);
          const tam = Math.round((2 * dia + sys) / 3);

          return {
            date: formatDate(v.date),
            systolic: sys,
            diastolic: dia,
            tam,
          };
        })
    : [];

  // Final sorted list
  const PARAM_OPTIONS = [...RAW_PARAM_OPTIONS].sort((a, b) =>
    a.label.localeCompare(b.label, "es")
  );

  /* ============================================================
     UI
  ============================================================ */

  return (
    <div className="flex flex-col gap-6 px-4 md:px-6 py-4 bg-slate-50 min-h-screen">

      {/* HEADER */}
      <div className="flex justify-between items-center border-b pb-3">
        <h1 className="text-xl font-semibold text-sky-900 tracking-wide">
          Parámetros clínicos
        </h1>

        <Button
          variant="outline"
          onClick={() => router.push(`/patients/${id}/visits/all`)}
          className="flex items-center gap-2"
        >
          <Eye className="h-4 w-4 text-sky-700" />
          Ver todos
        </Button>
      </div>

      {/* ============================================================
         RESUMEN CLÍNICO
      ============================================================ */}

      <PremiumCard title="Resumen clínico reciente">
        {!lastVisit ? (
          <p className="text-slate-500">No hay datos clínicos registrados.</p>
        ) : (
          <div className="space-y-6">
            <p className="text-sm text-slate-700 flex items-center gap-2">
              <Calendar className="h-4 w-4 text-sky-600" />
              <span className="font-bold">Última visita:</span>
              <span className="font-semibold">{formatDate(lastVisit.date)}</span>
            </p>

            {/* Exploración física */}
            <SectionTitle title="Exploración física" />

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <ValueBox label="Peso" value={latest.weight?.weight ?? "—"} date={latest.weight?.date && formatDate(latest.weight.date)} />
              <ValueBox label="Talla" value={latest.height?.height ?? "—"} date={latest.height?.date && formatDate(latest.height.date)} />
              <ValueBox label="IMC" value={latest.bmi?.bmi ?? "—"} date={latest.bmi?.date && formatDate(latest.bmi.date)} />
              <ValueBox
                label="TA consulta"
                value={
                  latest.taOffice
                    ? `${latest.taOffice.office_sys}/${latest.taOffice.office_dia} mmHg`
                    : "—"
                }
                date={latest.taOffice?.date && formatDate(latest.taOffice.date)}
              />
            </div>

            {/* Analítica */}
            <SectionTitle title="Analítica" />

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <ValueBox label="LDL" value={latest.ldl?.ldl ?? "—"} date={latest.ldl?.date && formatDate(latest.ldl.date)} />
              <ValueBox label="HDL" value={latest.hdl?.hdl ?? "—"} date={latest.hdl?.date && formatDate(latest.hdl.date)} />
              <ValueBox label="Triglicéridos" value={latest.triglycerides?.triglycerides ?? "—"} date={latest.triglycerides?.date && formatDate(latest.triglycerides.date)} />
              <ValueBox label="Colesterol total" value={latest.total_cholesterol?.total_cholesterol ?? "—"} date={latest.total_cholesterol?.date && formatDate(latest.total_cholesterol.date)} />
              <ValueBox label="HbA1c" value={latest.hb1ac?.hb1ac ?? "—"} date={latest.hb1ac?.date && formatDate(latest.hb1ac.date)} />
              <ValueBox label="Creatinina" value={latest.creatinine?.creatinine ?? "—"} date={latest.creatinine?.date && formatDate(latest.creatinine.date)} />
              <ValueBox label="TFGe" value={latest.egfr?.egfr ?? "—"} date={latest.egfr?.date && formatDate(latest.egfr.date)} />
              <ValueBox label="Albuminuria" value={latest.albuminuria?.albuminuria ?? "—"} date={latest.albuminuria?.date && formatDate(latest.albuminuria.date)} />
              <ValueBox label="Potasio" value={latest.potassium?.potassium ?? "—"} date={latest.potassium?.date && formatDate(latest.potassium.date)} />
              <ValueBox label="proBNP" value={latest.proBNP?.proBNP ?? "—"} date={latest.proBNP?.date && formatDate(latest.proBNP.date)} />
            </div>
          </div>
        )}
      </PremiumCard>

      {/* ============================================================
         GRAPH
      ============================================================ */}

      <PremiumCard title="Evolución de parámetros">
        <div className="space-y-4">
          <div className="w-64">
            <Select value={selectedParam} onValueChange={setSelectedParam}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PARAM_OPTIONS.map((p) => (
                  <SelectItem key={p.key} value={p.key}>
                    {p.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="h-72">
            {/* NORMAL PARAMETERS */}
            {!isTA ? (
              chartData.length === 0 ? (
                <p className="text-sm text-slate-500">No hay datos disponibles.</p>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip
                      content={({ active, payload, label }) => {
                        if (!active || !payload?.length) return null;
                        const point = payload[0];
                        const key = point.dataKey!;
                        return (
                          <div className="bg-white border border-slate-300 shadow-md rounded-md px-3 py-2 text-sm">
                            <p className="font-semibold mb-1">{label}</p>
                            <p className="font-semibold">
                              {formatValueNumber(point.value)}
                            </p>
                          </div>
                        );
                      }}
                    />
                    <Line type="monotone" dataKey="value" stroke="#0284c7" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              )
            ) : (
              /* TA GRAPH */
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartDataTA}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />

                  <Tooltip
                    content={({ active, payload, label }) => {
                      if (!active || !payload?.length) return null;

                      const sys = payload.find((p) => p.dataKey === "systolic");
                      const tam = payload.find((p) => p.dataKey === "tam");
                      const dia = payload.find((p) => p.dataKey === "diastolic");

                      return (
                        <div className="bg-white border border-slate-300 shadow-md rounded-md px-3 py-2 text-sm">
                          <p className="font-semibold mb-1">{label}</p>

                          {sys && (
                            <p className="font-semibold">
                              {formatValueNumber(sys.value)}
                            </p>
                          )}
                          {tam && (
                            <p className="font-semibold">
                              {formatValueNumber(tam.value)}
                            </p>
                          )}
                          {dia && (
                            <p className="font-semibold">
                              {formatValueNumber(dia.value)}
                            </p>
                          )}
                        </div>
                      );
                    }}
                  />

                  <Line type="monotone" dataKey="systolic" stroke="#0284c7" strokeWidth={2} />
                  <Line type="monotone" dataKey="diastolic" stroke="#22c55e" strokeWidth={2} />
                  <Line type="monotone" dataKey="tam" stroke="#eab308" strokeWidth={2} strokeDasharray="4 4" dot={false} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </PremiumCard>
    </div>
  );
}

/* ============================================================
   COMPONENTS
============================================================ */

function PremiumCard({ title, children }: any) {
  return (
    <Card className="shadow-sm hover:shadow-md rounded-xl border-slate-200 bg-white">
      <CardHeader className="border-b border-slate-200 pb-2">
        <CardTitle className="text-lg font-semibold text-sky-900">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="py-4 space-y-3 text-sm">{children}</CardContent>
    </Card>
  );
}

function SectionTitle({ title }: { title: string }) {
  return (
    <h3 className="text-xs font-semibold text-sky-700 border-l-4 border-sky-400 pl-2">
      {title}
    </h3>
  );
}

function ValueBox({ label, value, date }: any) {
  return (
    <div className="p-3 border rounded-lg bg-slate-50 shadow-sm text-sm">
      <div className="flex items-center justify-between">
        <p className="text-xs text-slate-500">{label}</p>
        {date && (
          <span className="group relative">
            <Info className="w-3.5 h-3.5 text-slate-400 cursor-pointer" />
            <span className="absolute right-0 mt-1 w-max text-xs px-2 py-1 rounded-md bg-black/80 text-white opacity-0 group-hover:opacity-100 transition duration-200">
              Valor de: {date}
            </span>
          </span>
        )}
      </div>

      <p className="font-semibold text-sky-900 mt-1">
        {formatValueNumber(value)}
      </p>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useParams, useRouter, useSearchParams } from "next/navigation";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

import { Edit, Calendar, Info } from "lucide-react";

/* ==========================================================
   HELPERS: FORMATEAR FECHAS
========================================================== */
function formatDate(dateStr?: string) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return isNaN(d.getTime())
    ? ""
    : d.toLocaleDateString("es-ES", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
}

/* ==========================================================
   HELPERS: CALCULAR AÑOS DESDE DX
========================================================== */
function calcYearsFromDxYear(dxYear?: number | null) {
  if (!dxYear) return "";
  const current = new Date().getFullYear();
  if (dxYear > current) return "";
  return (current - dxYear).toString();
}

/* ==========================================================
   MAIN PAGE
========================================================== */

export default function PatientDetail() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();

  const id = Array.isArray(params.id) ? params.id[0] : params.id; // UUID directo

  const [patient, setPatient] = useState<any>(null);
  const [conditions, setConditions] = useState<any>(null);
  const [lastVisit, setLastVisit] = useState<any>(null);
  const [latest, setLatest] = useState<any>({
    taOffice: null,
    taAmpa: null,
    hb: null,
    eg: null,
  });

  /* ==========================================================
     LOAD DATA
  ========================================================== */
  useEffect(() => {
    async function load() {
      if (!id) return;

      const pid = id; // UUID correcto

      /* -------- PACIENTE -------- */
      const { data: p } = await supabase
        .from("patients")
        .select("*")
        .eq("id_patient", pid)
        .single();

      setPatient(p);

      /* -------- CONDICIONES -------- */
      let { data: c } = await supabase
        .from("conditions")
        .select("*")
        .eq("patient_id", pid)
        .single();

      if (!c) {
        const { data: newC } = await supabase
          .from("conditions")
          .insert({
            patient_id: pid,
            hta: false,
            dyslipemia: false,
            diabetes: false,
            smoker: false,
            ckd: false,
            ascvd_history: false,
          })
          .select()
          .single();

        c = newC;
      }

      setConditions(c);

      await loadLatestValues(pid);
      await loadLastVisit(pid);
    }

    load();
  }, [id, searchParams.toString()]);

  /* ==========================================================
     ÚLTIMA VISITA
  ========================================================== */
  async function loadLastVisit(pid: string) {
    const { data } = await supabase
      .from("clinical_values")
      .select("measured_at")
      .eq("patient_id", pid)
      .order("measured_at", { ascending: false })
      .limit(1);

    setLastVisit(data?.[0] || null);
  }

  /* ==========================================================
     ÚLTIMOS VALORES CLÍNICOS
  ========================================================== */
  async function loadLatestValues(pid: string) {
    const fetchLatest = async (field: string) => {
      const { data } = await supabase
        .from("clinical_values")
        .select(`${field}, measured_at`)
        .eq("patient_id", pid)
        .not(field, "is", null)
        .order("measured_at", { ascending: false })
        .limit(1);

      return data?.[0] || null;
    };

    // Office
    const taOffice = await supabase
      .from("clinical_values")
      .select("office_sys, office_dia, measured_at")
      .eq("patient_id", pid)
      .not("office_sys", "is", null)
      .order("measured_at", { ascending: false })
      .limit(1);

    // AMPA
    const taAmpa = await supabase
      .from("clinical_values")
      .select("ampa_sys, ampa_dia, measured_at")
      .eq("patient_id", pid)
      .not("ampa_sys", "is", null)
      .order("measured_at", { ascending: false })
      .limit(1);

    setLatest({
      taOffice: taOffice?.data?.[0] || null,
      taAmpa: taAmpa?.data?.[0] || null,
      hb: await fetchLatest("hb1ac"),
      eg: await fetchLatest("egfr"),
    });
  }

  if (!patient || !conditions) return <p className="p-6">Cargando…</p>;

  /* ==========================================================
     UI
  ========================================================== */

  return (
    <div className="flex flex-col gap-6 px-4 md:px-6 py-4 bg-slate-50 min-h-screen">

      {/* DATOS DEL PACIENTE */}
      <PremiumCard title="Datos del paciente" onEdit={() => router.push(`/patients/${id}/edit`)}>
        <Row label="Código" value={patient.patient_code} />
        <Row label="Sexo" value={patient.sex === "female" ? "Femenino" : "Masculino"} />
        <Row label="Fecha nacimiento" value={formatDate(patient.date_of_birth)} />
      </PremiumCard>

      {/* CONDICIONES */}
      <PremiumCard title="Condiciones" onEdit={() => router.push(`/patients/${id}/conditions`)}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <ConditionCard label="HTA" active={conditions.hta} dxYear={conditions.hta_diagnosis_year} treated={conditions.hta_treated} />
          <ConditionCard label="Dislipemia" active={conditions.dyslipemia} dxYear={conditions.dyslipemia_diagnosis_year} treated={conditions.dyslipemia_treated} />
          <ConditionCard label="Diabetes" active={conditions.diabetes} dxYear={conditions.diabetes_diagnosis_year} treated={conditions.diabetes_treated} />
          <ConditionCard label="Tabaquismo" active={conditions.smoker} dxYear={conditions.smoker_diagnosis_year} treated={conditions.smoker_treated} />
          <ConditionCard label="ERC" active={conditions.ckd} dxYear={conditions.ckd_diagnosis_year} treated={conditions.ckd_treated} />
          <ConditionCard label="ASCVD" active={conditions.ascvd_history} showExtra={false} tooltip="Enfermedad cardiovascular aterosclerótica" />
        </div>
      </PremiumCard>

      {/* ÚLTIMOS VALORES */}
      <PremiumCard title="Últimos valores clínicos" onEdit={() => router.push(`/patients/${id}/visits/new`)} editLabel="Nueva visita">
        
        {lastVisit && (
          <p className="text-base text-slate-700 mb-3 flex items-center gap-2">
            <Calendar className="h-4 w-4 text-sky-600" />
            <span className="font-semibold">Última visita:</span>
            {formatDate(lastVisit.measured_at)}
          </p>
        )}

        <div className="grid grid-cols-3 font-semibold border-b py-1.5 bg-slate-100 text-slate-700">
          <div>Parámetro</div>
          <div>Último valor</div>
          <div>Fecha</div>
        </div>

        <TableRow label="Tensión arterial consulta" value={latest.taOffice ? `${latest.taOffice.office_sys}/${latest.taOffice.office_dia} mmHg` : ""} date={formatDate(latest.taOffice?.measured_at)} />
        <TableRow label="Tensión arterial domicilio (AMPA)" value={latest.taAmpa ? `${latest.taAmpa.ampa_sys}/${latest.taAmpa.ampa_dia} mmHg` : ""} date={formatDate(latest.taAmpa?.measured_at)} />
        <TableRow label="HbA1c" value={latest.hb?.hb1ac ? `${latest.hb.hb1ac} %` : ""} date={formatDate(latest.hb?.measured_at)} />
        <TableRow label="TFGe" value={latest.eg?.egfr ? `${latest.eg.egfr} ml/min` : ""} date={formatDate(latest.eg?.measured_at)} />

      </PremiumCard>

    </div>
  );
}

/* ==========================================================
   PREMIUM CARD
========================================================== */
function PremiumCard({ title, onEdit, editLabel = "Editar", children }: any) {
  return (
    <Card className="shadow-sm hover:shadow-md transition rounded-xl border-slate-200 bg-white">
      <CardHeader className="flex flex-row items-center justify-between border-b border-slate-200 pb-2">
        <CardTitle className="flex items-center gap-2 text-lg font-semibold text-sky-900 tracking-wide">
          {title}
        </CardTitle>

        <Button variant="outline" size="sm" onClick={onEdit}>
          <Edit className="h-4 w-4 mr-2" /> {editLabel}
        </Button>
      </CardHeader>

      <CardContent className="text-base space-y-2 py-3">{children}</CardContent>
    </Card>
  );
}

/* ==========================================================
   CONDITION CARD
========================================================== */
function ConditionCard({ label, active, dxYear, treated, showExtra = true, tooltip }: any) {
  const years = calcYearsFromDxYear(dxYear);

  return (
    <div
      className={`
        relative p-4 rounded-xl border transition-all duration-300
        flex flex-col items-center justify-center text-center gap-2
        shadow-sm hover:shadow-md
        ${active ? "bg-sky-50 border-sky-300" : "bg-white border-slate-200"}
      `}
      style={{ minHeight: "105px" }}
    >
      <p className={`text-base font-semibold flex items-center gap-2 tracking-wide ${active ? "text-sky-900" : "text-slate-500"}`}>
        {label}: {active ? "Sí" : "No"}

        {tooltip && (
          <span className="group relative">
            <Info className="w-4 h-4 text-slate-400" />
            <span className="absolute left-1/2 -translate-x-1/2 mt-2 w-48 text-xs p-2 rounded-md bg-black/80 text-white opacity-0 group-hover:opacity-100 transition-all pointer-events-none shadow-lg">
              {tooltip}
            </span>
          </span>
        )}
      </p>

      {active && showExtra && (
        <div className="space-y-1 text-slate-600 text-sm">
          <p><span className="font-medium">Años:</span> {years || "—"}</p>
          <p><span className="font-medium">Tratamiento:</span> {treated ? "Sí" : "No"}</p>
        </div>
      )}
    </div>
  );
}

/* ==========================================================
   ROWS
========================================================== */
function Row({ label, value }: any) {
  return (
    <div className="flex justify-between text-base">
      <span className="text-slate-500">{label}</span>
      <span>{value}</span>
    </div>
  );
}

function TableRow({ label, value, date }: any) {
  return (
    <div className="grid grid-cols-3 py-2.5 border-b last:border-b-0 hover:bg-slate-50 transition">
      <div className="text-slate-700">{label}</div>
      <div className="font-medium text-sky-900">{value}</div>
      <div className="text-slate-500">{date}</div>
    </div>
  );
}

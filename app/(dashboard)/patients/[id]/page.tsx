"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

import {
  User,
  Stethoscope,
  Activity,
  Edit,
  Calendar,
} from "lucide-react";

/* ==========================================================
   UTIL: FORMATEAR FECHAS
========================================================== */
function formatDate(dateStr?: string) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "";
  return d.toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

/* ==========================================================
   UTIL: CALCULAR AÑOS DE EVOLUCIÓN
========================================================== */
function calcYearsFromDxYear(dxYear?: number | null) {
  if (!dxYear) return "";
  const current = new Date().getFullYear();
  if (dxYear > current) return "";
  return (current - dxYear).toString();
}

/* ==========================================================
   PAGE
========================================================== */

export default function PatientDetail() {
  const { id } = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();

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
      const pid = Number(id);

      // PACIENTE
      const { data: p } = await supabase
        .from("patients")
        .select("*")
        .eq("id_patient", pid)
        .single();
      setPatient(p);

      // CONDICIONES
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

      // DATOS CLÍNICOS
      await loadLatestValues(pid);
      await loadLastVisit(pid);
    }

    load();
  }, [id, searchParams.toString()]);

  /* ==========================================================
     ÚLTIMA VISITA
========================================================== */
  async function loadLastVisit(pid: number) {
    const { data } = await supabase
      .from("clinical_values")
      .select("date, created_at")
      .eq("patient_id", pid)
      .order("date", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(1);

    setLastVisit(data?.[0] || null);
  }

  /* ==========================================================
     ÚLTIMOS VALORES CLÍNICOS
========================================================== */
  async function loadLatestValues(pid: number) {
    const fetchLatest = async (field: string) => {
      const { data } = await supabase
        .from("clinical_values")
        .select(`${field}, date, created_at`)
        .eq("patient_id", pid)
        .not(field, "is", null)
        .order("date", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(1);

      return data?.[0] || null;
    };

    const taOffice = await supabase
      .from("clinical_values")
      .select("office_sys, office_dia, date, created_at")
      .eq("patient_id", pid)
      .not("office_sys", "is", null)
      .order("date", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(1);

    const taAmpa = await supabase
      .from("clinical_values")
      .select("ampa_sys, ampa_dia, date, created_at")
      .eq("patient_id", pid)
      .not("ampa_sys", "is", null)
      .order("date", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(1);

    const hb = await fetchLatest("hb1ac");
    const eg = await fetchLatest("egfr");

    setLatest({
      taOffice: taOffice?.data?.[0] || null,
      taAmpa: taAmpa?.data?.[0] || null,
      hb,
      eg,
    });
  }

  /* ==========================================================
     UI
========================================================== */

  if (!patient) return <p className="p-6">Cargando…</p>;

  return (
    <div className="flex flex-col gap-6">

      {/* HEADER */}
      <div className="flex justify-between items-start border-b pb-4">
        <div className="flex gap-3">
          <div className="h-10 w-10 bg-sky-600 text-white rounded-xl flex items-center justify-center">
            <User className="h-5 w-5" />
          </div>

          <div>
            <h1 className="text-xl font-semibold">Paciente {patient.code}</h1>
            <p className="text-sm text-slate-500">
              {patient.sex === "female" ? "Femenino" : "Masculino"}
            </p>
          </div>
        </div>

        <Link href="/patients">
          <Button variant="outline">Volver</Button>
        </Link>
      </div>

      {/* DATOS DEL PACIENTE */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <User className="h-5 w-5 text-sky-600" />
            Datos del paciente
          </CardTitle>

          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push(`/patients/${id}/edit`)}
          >
            <Edit className="h-4 w-4 mr-2" /> Editar
          </Button>
        </CardHeader>

        <CardContent className="text-sm space-y-1">
          <Row label="Código" value={patient.code} />
          <Row
            label="Sexo"
            value={patient.sex === "female" ? "Femenino" : "Masculino"}
          />
          <Row label="Fecha nacimiento" value={formatDate(patient.date_of_birth)} />
        </CardContent>
      </Card>

      {/* CONDICIONES */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Stethoscope className="h-5 w-5 text-sky-600" />
            Condiciones
          </CardTitle>

          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push(`/patients/${id}/conditions`)}
          >
            <Edit className="h-4 w-4 mr-2" /> Editar
          </Button>
        </CardHeader>

        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {conditions && (
            <>
              <ConditionCard
                label="HTA"
                active={conditions.hta}
                dxYear={conditions.hta_diagnosis_year}
                treated={conditions.hta_treated}
              />

              <ConditionCard
                label="Dislipemia"
                active={conditions.dyslipemia}
                dxYear={conditions.dyslipemia_diagnosis_year}
                treated={conditions.dyslipemia_treated}
              />

              <ConditionCard
                label="Diabetes"
                active={conditions.diabetes}
                dxYear={conditions.diabetes_diagnosis_year}
                treated={conditions.diabetes_treated}
              />

              <ConditionCard
                label="Tabaquismo"
                active={conditions.smoker}
                dxYear={conditions.smoker_diagnosis_year}
                treated={conditions.smoker_treated}
              />

              <ConditionCard
                label="ERC"
                active={conditions.ckd}
                dxYear={conditions.ckd_diagnosis_year}
                treated={conditions.ckd_treated}
              />

              <ConditionCard
                label="ASCVD (Enfermedad cardiovascular aterosclerótica)"
                active={conditions.ascvd_history}
                showExtra={false}
              />
            </>
          )}
        </CardContent>
      </Card>

      {/* ÚLTIMOS VALORES CLÍNICOS */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Activity className="h-5 w-5 text-sky-600" />
            Últimos valores clínicos
          </CardTitle>

          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push(`/patients/${id}/clinical/new`)}
          >
            + Nueva visita
          </Button>
        </CardHeader>

        <CardContent className="text-sm">

          {/* FECHA ÚLTIMA VISITA */}
          {lastVisit && (
            <p className="text-base text-slate-700 mb-3 px-1 flex items-center gap-2">
              <Calendar className="h-4 w-4 text-sky-600" />
              <span className="font-semibold">Fecha de última visita:</span>
              {formatDate(lastVisit.date)}
            </p>
          )}

          {/* Cabecera tabla */}
          <div className="grid grid-cols-3 font-semibold border-b py-2">
            <div>Parámetro</div>
            <div>Último valor</div>
            <div>Fecha</div>
          </div>

          <TableRow
            label="Tensión arterial consulta"
            value={
              latest.taOffice
                ? `${latest.taOffice.office_sys}/${latest.taOffice.office_dia} mmHg`
                : ""
            }
            date={formatDate(latest.taOffice?.date)}
          />

          <TableRow
            label="Tensión arterial domicilio (AMPA)"
            value={
              latest.taAmpa
                ? `${latest.taAmpa.ampa_sys}/${latest.taAmpa.ampa_dia} mmHg`
                : ""
            }
            date={formatDate(latest.taAmpa?.date)}
          />

          <TableRow
            label="HbA1c"
            value={latest.hb?.hb1ac ? `${latest.hb.hb1ac} %` : ""}
            date={formatDate(latest.hb?.date)}
          />

          <TableRow
            label="TFGe"
            value={latest.eg?.egfr ? `${latest.eg.egfr} ml/min` : ""}
            date={formatDate(latest.eg?.date)}
          />

        </CardContent>
      </Card>
    </div>
  );
}

/* ==========================================================
   COMPONENTES PEQUEÑOS
========================================================== */

function Row({ label, value }: { label: string; value: any }) {
  return (
    <div className="flex justify-between">
      <span className="text-slate-500">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}

function ConditionCard({
  label,
  active,
  dxYear,
  treated,
  showExtra = true,
}: {
  label: string;
  active: boolean;
  dxYear?: number | null;
  treated?: boolean;
  showExtra?: boolean;
}) {
  const years = calcYearsFromDxYear(dxYear);

  return (
    <div
      className={`p-3 border rounded-lg w-full ${
        active
          ? "bg-sky-100 border-sky-400"
          : "bg-slate-50 border-slate-200"
      }`}
    >
      <p
        className={`font-semibold ${
          active ? "text-sky-900" : "text-slate-500"
        }`}
      >
        {label}: {active ? "Sí" : "No"}
      </p>

      {active && showExtra && (
        <>
          <p className="text-xs text-slate-700">Años de evolución: {years || "—"}</p>
          <p className="text-xs text-slate-700">
            Tratamiento: {treated ? "Sí" : "No"}
          </p>
        </>
      )}
    </div>
  );
}

function TableRow({ label, value, date }: any) {
  return (
    <div className="grid grid-cols-3 py-2 border-b last:border-b-0">
      <div className="text-slate-600">{label}</div>
      <div className="font-medium">{value}</div>
      <div className="text-slate-500">{date}</div>
    </div>
  );
}

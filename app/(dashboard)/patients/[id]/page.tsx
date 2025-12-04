"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useParams } from "next/navigation";
import Link from "next/link";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

import { User, Stethoscope, Activity } from "lucide-react";

export default function PatientDetail() {
  const { id } = useParams();

  const [patient, setPatient] = useState<any>(null);
  const [conditions, setConditions] = useState<any>(null);
  const [latest, setLatest] = useState<any>(null);

  useEffect(() => {
    async function load() {
      const { data: p } = await supabase
        .from("patients")
        .select("*")
        .eq("id_patient", Number(id))
        .single();

      setPatient(p);

      const { data: c } = await supabase
        .from("conditions")
        .select("*")
        .eq("patient_id", Number(id))
        .single();

      setConditions(c);

      const { data: v } = await supabase
        .from("clinical_values")
        .select("*")
        .eq("patient_id", Number(id))
        .order("date", { ascending: false })
        .limit(1);

      setLatest(v?.[0] || null);
    }

    load();
  }, [id]);

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

      {/* TARJETA DATOS BÁSICOS */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm">
            <User className="h-4 w-4 text-sky-600" />
            Datos del paciente
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm space-y-1">
          <Row label="Código" value={patient.code} />
          <Row
            label="Sexo"
            value={patient.sex === "female" ? "Femenino" : "Masculino"}
          />
          <Row label="Fecha nacimiento" value={patient.date_of_birth} />
        </CardContent>
      </Card>

      {/* TARJETA CONDICIONES */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm">
            <Stethoscope className="h-4 w-4 text-sky-600" />
            Condiciones
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          {conditions ? (
            <>
              <Condition label="HTA" active={conditions.hta} />
              <Condition label="Dislipemia" active={conditions.dyslipemia} />
              <Condition label="Diabetes" active={conditions.diabetes} />
              <Condition label="Tabaquismo" active={conditions.smoker} />
              <Condition label="ERC" active={conditions.ckd} />
            </>
          ) : (
            <p className="text-sm text-slate-500">No hay condiciones.</p>
          )}
        </CardContent>
      </Card>

      {/* TARJETA VALORES CLÍNICOS */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm">
            <Activity className="h-4 w-4 text-sky-600" />
            Últimos valores clínicos
          </CardTitle>
        </CardHeader>

        <CardContent className="text-sm space-y-2">
          {!latest ? (
            <p className="text-slate-500">Sin valores registrados.</p>
          ) : (
            <>
              <Row label="Fecha" value={latest.date} />
              <Row
                label="Tensión arterial"
                value={
                  latest.systolic_bp
                    ? `${latest.systolic_bp}/${latest.diastolic_bp}`
                    : "—"
                }
              />
              <Row label="TFGe" value={latest.egfr || "—"} />
              <Row label="LDL" value={latest.ldl || "—"} />
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

/* COMPONENTES PEQUEÑOS */

function Row({ label, value }: { label: string; value: any }) {
  return (
    <div className="flex justify-between">
      <span className="text-slate-500">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}

function Condition({ label, active }: { label: string; active: boolean }) {
  return active ? (
    <Badge className="bg-sky-600 text-white">{label}: Sí</Badge>
  ) : (
    <Badge variant="outline" className="text-slate-400">
      {label}: No
    </Badge>
  );
}

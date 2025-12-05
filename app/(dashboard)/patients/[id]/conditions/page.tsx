"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useParams, useRouter } from "next/navigation";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";

/* ===========================================================
   HELPERS
=========================================================== */
const THIS_YEAR = new Date().getFullYear();

function calcYearsFromDx(year: number | null) {
  if (!year || year > THIS_YEAR) return "";
  return (THIS_YEAR - year).toString();
}

function calcDxYearFromYears(years: string) {
  const y = Number(years);
  if (isNaN(y) || y < 0) return null;
  return THIS_YEAR - y;
}

/* ===========================================================
   MAIN PAGE
=========================================================== */

export default function EditConditionsPage() {
  const { id } = useParams();
  const router = useRouter();

  const [conditions, setConditions] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

 useEffect(() => {
  async function load() {
    const pid = Number(id);

    // Intentar cargar condiciones
    let { data: c } = await supabase
      .from("conditions")
      .select("*")
      .eq("patient_id", pid)
      .single();

    // Si no existen → crearlas con valores por defecto
    if (!c) {
      const { data: newC, error } = await supabase
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

      if (error) {
        console.error("Error creando condiciones:", error);
      }

      c = newC;
    }

    setConditions(c);
    setLoading(false);
  }

  load();
}, [id]);


  const updateField = (k: string, v: any) => {
    setConditions((prev: any) => ({ ...prev, [k]: v }));
  };

  const updateDx = (conditionKey: string, diagnosisYearKey: string, years: string, year: string) => {
    // Si modifica el año de diagnóstico → recalcular años
    if (year !== "") {
      const numericYear = Number(year);
      updateField(diagnosisYearKey, numericYear);
    }

    // Si modifica años → recalcular año de diagnóstico
    if (years !== "") {
      const dx = calcDxYearFromYears(years);
      if (dx) updateField(diagnosisYearKey, dx);
    }
  };

  async function handleSave() {
    setSaving(true);

    const { error } = await supabase
      .from("conditions")
      .update(conditions)
      .eq("patient_id", id);

    setSaving(false);

    if (error) {
      alert(error.message);
      return;
    }
    router.push(`/patients/${id}`);
  }

  if (loading) return <p className="p-6">Cargando…</p>;
  if (!conditions) return <p>No existen condiciones.</p>;

  /* ===========================================================
     UI COMPONENT: ConditionBlock
  =========================================================== */
  const ConditionBlock = ({
    label,
    field,
    treatedField,
    dxYearField,
  }: {
    label: string;
    field: string;
    treatedField: string;
    dxYearField: string;
  }) => {
    const active = conditions[field];

    const dxYear = conditions[dxYearField];
    const years = dxYear ? calcYearsFromDx(dxYear) : "";

    return (
 <div
  className={`border rounded-xl p-4 space-y-3 transition-colors
    ${active ? "bg-sky-100 border-sky-400" : "bg-slate-50 border-slate-200"}
  `}
>
        {/* TÍTULO + SELECT PEQUEÑO */}
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-lg font-semibold text-slate-800">{label}</h2>

          <Select
            value={active ? "yes" : "no"}
            onValueChange={(v: string) => updateField(field, v === "yes")}
          >
            <SelectTrigger className="w-24 text-base font-medium bg-white">
              <SelectValue placeholder="—" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="no">No</SelectItem>
              <SelectItem value="yes">Sí</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* SI → EXPANDIR PANEL */}
        {active && (
          <div className="border rounded-lg bg-white p-4 transition-all">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

              {/* Año de diagnóstico */}
              <div>
                <Label className="text-sm font-medium">Año diagnóstico</Label>
                <Input
                  type="number"
                  value={dxYear || ""}
                  placeholder="AAAA"
                  className="mt-1"
                  onChange={(e) => {
                    const newYear = e.target.value;
                    updateDx(field, dxYearField, "", newYear);
                  }}
                />
              </div>

              {/* Años de evolución */}
              <div>
                <Label className="text-sm font-medium">Años evolución</Label>
                <Input
                  type="number"
                  value={years}
                  placeholder="—"
                  className="mt-1"
                  onChange={(e) => {
                    const newYears = e.target.value;
                    const dx = calcDxYearFromYears(newYears);
                    if (dx) updateField(dxYearField, dx);
                  }}
                />
              </div>

              {/* Tratamiento */}
              <div>
                <Label className="text-sm font-medium">Tratamiento</Label>
                <Select
                  value={conditions[treatedField] ? "yes" : "no"}
                  onValueChange={(v: string) => updateField(treatedField, v === "yes")}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="no">No</SelectItem>
                    <SelectItem value="yes">Sí</SelectItem>
                  </SelectContent>
                </Select>
              </div>

            </div>
          </div>
        )}
      </div>
    );
  };

  /* ===========================================================
     PAGE UI
  =========================================================== */
  return (
    <div className="p-6 flex flex-col gap-6">

      {/* HEADER */}
      <div className="flex justify-between items-start border-b pb-4">
        <h1 className="text-2xl font-semibold">Condiciones clínicas</h1>
        <Button onClick={handleSave} className="w-32" disabled={saving}>
          {saving ? "Guardando…" : "Guardar"}
        </Button>
      </div>

      {/* TARJETAS DE CONDICIONES */}
      <Card className="p-6 space-y-6">

        <ConditionBlock
          label="HTA"
          field="hta"
          treatedField="hta_treated"
          dxYearField="hta_diagnosis_year"
        />

        <ConditionBlock
          label="Dislipemia"
          field="dyslipemia"
          treatedField="dyslipemia_treated"
          dxYearField="dyslipemia_diagnosis_year"
        />

        <ConditionBlock
          label="Diabetes"
          field="diabetes"
          treatedField="diabetes_treated"
          dxYearField="diabetes_diagnosis_year"
        />

        <ConditionBlock
          label="Tabaquismo"
          field="smoker"
          treatedField="smoker_treated"
          dxYearField="smoker_diagnosis_year"
        />

        <ConditionBlock
          label="ERC"
          field="ckd"
          treatedField="ckd_treated"
          dxYearField="ckd_diagnosis_year"
        />

        {/* ASCVD — solo Sí/No */}
        <div className="border rounded-xl p-4 bg-slate-50 space-y-2">
          <h2 className="text-lg font-semibold text-slate-800">ASCVD</h2>

          <Select
            value={conditions.ascvd_history ? "yes" : "no"}
            onValueChange={(v: string) => updateField("ascvd_history", v === "yes")}
          >
            <SelectTrigger className="w-24 text-base font-medium bg-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="no">No</SelectItem>
              <SelectItem value="yes">Sí</SelectItem>
            </SelectContent>
          </Select>
        </div>

      </Card>
    </div>
  );
}

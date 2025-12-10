"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useParams, useRouter } from "next/navigation";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";

const THIS_YEAR = new Date().getFullYear();

function calcYearsFromDx(year: number | null) {
  if (!year || year > THIS_YEAR) return "";
  return (THIS_YEAR - year).toString();
}

function cleanConditions(obj: any) {
  const allowed = [
    "hta", "hta_treated", "hta_diagnosis_year",
    "dyslipemia", "dyslipemia_treated", "dyslipemia_diagnosis_year",
    "diabetes", "diabetes_treated", "diabetes_diagnosis_year",
    "smoker", "smoker_treated", "smoker_diagnosis_year",
    "ckd", "ckd_treated", "ckd_diagnosis_year",
    "ascvd_history"
  ];

  const out: any = {};
  allowed.forEach((k) => (out[k] = obj[k] ?? null));
  return out;
}

const ConditionBlock = ({
  label,
  field,
  treatedField,
  dxYearField,
  active,
  dxYear,
  years,
  treatedValue,
  inputDisplayValues,
  setInputDisplayValues,
  updateField,
}: {
  label: string;
  field: string;
  treatedField: string;
  dxYearField: string;
  active: boolean;
  dxYear: number | null;
  years: string;
  treatedValue: boolean;
  inputDisplayValues: Record<string, string>;
  setInputDisplayValues: (fn: (prev: Record<string, string>) => Record<string, string>) => void;
  updateField: (key: string, value: any) => void;
}) => {
  return (
    <div
      className={`border rounded-xl p-4 space-y-3 transition
      ${active ? "bg-sky-100 border-sky-400" : "bg-slate-50 border-slate-200"}
    `}
    >
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">{label}</h2>

        <Select
          value={active ? "yes" : "no"}
          onValueChange={(v) => updateField(field, v === "yes")}
        >
          <SelectTrigger className="w-24">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="no">No</SelectItem>
            <SelectItem value="yes">Sí</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {active && (
        <div className="border rounded-lg bg-white p-4 pointer-events-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

            {/* AÑO DIAGNÓSTICO — FIX DEFINITIVO */}
            <div>
              <Label>Año diagnóstico</Label>
              <Input
                type="number"
                value={inputDisplayValues[dxYearField] ?? (dxYear === null || dxYear === undefined || Number.isNaN(dxYear) ? "" : dxYear.toString())}
                placeholder="Ej: 2018"
                onChange={(e) => {
                  const val = e.target.value;
                  
                  // Limit to 4 digits
                  if (val.length > 4) return;
                  
                  setInputDisplayValues((prev) => ({ ...prev, [dxYearField]: val }));

                  if (val === "") {
                    updateField(dxYearField, null);
                    return;
                  }

                  const year = Number(val);
                  if (!Number.isNaN(year) && year >= 1900 && year <= THIS_YEAR) {
                    updateField(dxYearField, year);
                  }
                }}
                onBlur={() => {
                  const val = inputDisplayValues[dxYearField] ?? "";
                  if (val === "") {
                    setInputDisplayValues((prev) => {
                      const next = { ...prev };
                      delete next[dxYearField];
                      return next;
                    });
                  }
                }}
                className="mt-1"
              />
            </div>

            <div>
              <Label>Años de evolución</Label>
              <Input
                readOnly
                value={years}
                className="mt-1 bg-slate-100 text-slate-600"
              />
            </div>

            <div>
              <Label>Tratamiento</Label>
              <Select
                value={treatedValue ? "yes" : "no"}
                onValueChange={(v) => updateField(treatedField, v === "yes")}
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

export default function EditConditionsPage() {
  const { id } = useParams();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [inputDisplayValues, setInputDisplayValues] = useState<Record<string, string>>({});

  const [conditions, setConditions] = useState<any>({
    hta: false,
    hta_diagnosis_year: null,
    hta_treated: false,

    dyslipemia: false,
    dyslipemia_diagnosis_year: null,
    dyslipemia_treated: false,

    diabetes: false,
    diabetes_diagnosis_year: null,
    diabetes_treated: false,

    smoker: false,
    smoker_diagnosis_year: null,
    smoker_treated: false,

    ckd: false,
    ckd_diagnosis_year: null,
    ckd_treated: false,

    ascvd_history: false,
  });

  useEffect(() => {
    async function load() {
      const pid = id;

      let { data: c } = await supabase
        .from("conditions")
        .select("*")
        .eq("patient_id", pid)
        .single();

      if (!c) {
        const { data: newC } = await supabase
          .from("conditions")
          .insert({ patient_id: pid })
          .select()
          .single();
        c = newC;
      }

      setConditions((prev: any) => ({
        ...prev,
        ...cleanConditions(c),
      }));

      setLoading(false);
    }

    load();
  }, [id]);

  const updateField = (key: string, value: any) => {
    setConditions((prev: any) => ({ ...prev, [key]: value }));
  };

  async function handleSave() {
    setSaving(true);

    const { error } = await supabase
      .from("conditions")
      .update(cleanConditions(conditions))
      .eq("patient_id", id);

    setSaving(false);

    if (error) alert(error.message);
    else router.push(`/patients/${id}`);
  }

  if (loading) return <p className="p-6">Cargando…</p>;

  return (
    <div className="p-6 flex flex-col gap-6">

      <div className="flex justify-between items-center border-b pb-4">
        <h1 className="text-2xl font-semibold">Condiciones clínicas</h1>

        <Button onClick={handleSave} disabled={saving}>
          {saving ? "Guardando…" : "Guardar"}
        </Button>
      </div>

      <Card className="p-6 space-y-6">
        <ConditionBlock
          label="HTA"
          field="hta"
          treatedField="hta_treated"
          dxYearField="hta_diagnosis_year"
          active={conditions.hta}
          dxYear={conditions.hta_diagnosis_year}
          years={calcYearsFromDx(conditions.hta_diagnosis_year)}
          treatedValue={conditions.hta_treated}
          inputDisplayValues={inputDisplayValues}
          setInputDisplayValues={setInputDisplayValues}
          updateField={updateField}
        />

        <ConditionBlock
          label="Dislipemia"
          field="dyslipemia"
          treatedField="dyslipemia_treated"
          dxYearField="dyslipemia_diagnosis_year"
          active={conditions.dyslipemia}
          dxYear={conditions.dyslipemia_diagnosis_year}
          years={calcYearsFromDx(conditions.dyslipemia_diagnosis_year)}
          treatedValue={conditions.dyslipemia_treated}
          inputDisplayValues={inputDisplayValues}
          setInputDisplayValues={setInputDisplayValues}
          updateField={updateField}
        />

        <ConditionBlock
          label="Diabetes"
          field="diabetes"
          treatedField="diabetes_treated"
          dxYearField="diabetes_diagnosis_year"
          active={conditions.diabetes}
          dxYear={conditions.diabetes_diagnosis_year}
          years={calcYearsFromDx(conditions.diabetes_diagnosis_year)}
          treatedValue={conditions.diabetes_treated}
          inputDisplayValues={inputDisplayValues}
          setInputDisplayValues={setInputDisplayValues}
          updateField={updateField}
        />

        <ConditionBlock
          label="Tabaquismo"
          field="smoker"
          treatedField="smoker_treated"
          dxYearField="smoker_diagnosis_year"
          active={conditions.smoker}
          dxYear={conditions.smoker_diagnosis_year}
          years={calcYearsFromDx(conditions.smoker_diagnosis_year)}
          treatedValue={conditions.smoker_treated}
          inputDisplayValues={inputDisplayValues}
          setInputDisplayValues={setInputDisplayValues}
          updateField={updateField}
        />

        <ConditionBlock
          label="ERC"
          field="ckd"
          treatedField="ckd_treated"
          dxYearField="ckd_diagnosis_year"
          active={conditions.ckd}
          dxYear={conditions.ckd_diagnosis_year}
          years={calcYearsFromDx(conditions.ckd_diagnosis_year)}
          treatedValue={conditions.ckd_treated}
          inputDisplayValues={inputDisplayValues}
          setInputDisplayValues={setInputDisplayValues}
          updateField={updateField}
        />

        <div
          className={`border rounded-xl p-4 space-y-3 transition
          ${conditions.ascvd_history ? "bg-sky-100 border-sky-400" : "bg-slate-50 border-slate-200"}
        `}
        >
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-800">ASCVD</h2>

            <Select
              value={conditions.ascvd_history ? "yes" : "no"}
              onValueChange={(v) => updateField("ascvd_history", v === "yes")}
            >
              <SelectTrigger className="w-24 bg-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="no">No</SelectItem>
                <SelectItem value="yes">Sí</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

      </Card>
    </div>
  );
}

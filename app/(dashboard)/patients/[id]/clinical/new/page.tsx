"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useParams, useRouter, useSearchParams } from "next/navigation";

import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";

export default function NewClinicalValuesPage() {
  const { id } = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [patient, setPatient] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const today = new Date().toISOString().split("T")[0];

  /* ==========================================================
     ESTADO DEL FORMULARIO CLÍNICO
  ========================================================== */
  const [clinical, setClinical] = useState<any>({
    date: today,
    weight: "",
    height: "",
    bmi: "",
    total_cholesterol: "",
    ldl: "",
    hdl: "",
    triglycerides: "",
    hb1ac: "",
    creatinine: "",
    potassium: "",
    egfr: "",
    egfr_category: "",
    albuminuria: "",
    albuminuria_category: "",
    office_sys: "",
    office_dia: "",
    ampa_sys: "",
    ampa_dia: "",
  });

  /* ==========================================================
     CARGAR PACIENTE
  ========================================================== */
  useEffect(() => {
    async function loadPatient() {
      const { data } = await supabase
        .from("patients")
        .select("code, date_of_birth, sex")
        .eq("id_patient", id)
        .single();

      setPatient(data || null);
      setLoading(false);
    }
    loadPatient();
  }, [id]);

  /* ==========================================================
     RECIBIR OFFICE BP Y AMPA DESDE OTRAS PÁGINAS
  ========================================================== */
  useEffect(() => {
    const officeSys = searchParams.get("office_sys");
    const officeDia = searchParams.get("office_dia");
    const ampaSys = searchParams.get("ampa_sys");
    const ampaDia = searchParams.get("ampa_dia");

    setClinical((prev: any) => ({
      ...prev,
      office_sys: officeSys || prev.office_sys,
      office_dia: officeDia || prev.office_dia,
      ampa_sys: ampaSys || prev.ampa_sys,
      ampa_dia: ampaDia || prev.ampa_dia,
    }));
  }, [searchParams]);

  /* ==========================================================
     AUTOMÁTICOS: BMI
  ========================================================== */
  useEffect(() => {
    if (clinical.weight && clinical.height) {
      const h = parseFloat(clinical.height) / 100;
      const bmi = clinical.weight / (h * h);
      if (!isNaN(bmi)) {
        setClinical((prev: any) => ({
          ...prev,
          bmi: bmi.toFixed(1),
        }));
      }
    }
  }, [clinical.weight, clinical.height]);

  /* ==========================================================
     AUTOMÁTICOS: eGFR
  ========================================================== */
  useEffect(() => {
    if (!clinical.creatinine || !patient) return;

    const scr = parseFloat(clinical.creatinine);
    if (isNaN(scr) || scr <= 0) return;

    const dob = new Date(patient.date_of_birth);
    const age = new Date().getFullYear() - dob.getFullYear();
    const female = patient.sex === "female";

    const A = female ? 0.7 : 0.9;
    const B = scr <= A ? (female ? -0.241 : -0.302) : -1.2;
    const sexFactor = female ? 1.012 : 1;

    const egfr =
      142 * Math.pow(scr / A, B) * Math.pow(0.9938, age) * sexFactor;

    let category = "";
    if (egfr >= 60) category = "G1–G2 (Normal o leve descenso)";
    else if (egfr >= 45) category = "G3a";
    else if (egfr >= 30) category = "G3b";
    else if (egfr >= 15) category = "G4";
    else category = "G5";

    setClinical((prev: any) => ({
      ...prev,
      egfr: egfr.toFixed(0),
      egfr_category: category,
    }));
  }, [clinical.creatinine, patient]);

  /* ==========================================================
     AUTOMÁTICOS: ALBUMINURIA CATEGORY
  ========================================================== */
  useEffect(() => {
    const alb = parseFloat(clinical.albuminuria);
    if (isNaN(alb)) return;

    let category = "";
    if (alb < 30) category = "A1 (<30 mg/g)";
    else if (alb < 300) category = "A2 (30–299 mg/g)";
    else category = "A3 (≥300 mg/g)";

    setClinical((prev: any) => ({
      ...prev,
      albuminuria_category: category,
    }));
  }, [clinical.albuminuria]);

  /* ==========================================================
     GUARDAR — INSERT EN SUPABASE
  ========================================================== */
  async function handleSave(e: any) {
    e.preventDefault();
    setSaving(true);
    setErrorMsg("");

    const payload = {
      patient_id: Number(id),
      date: clinical.date || null,
      weight: clinical.weight || null,
      height: clinical.height || null,
      bmi: clinical.bmi || null,
      total_cholesterol: clinical.total_cholesterol || null,
      ldl: clinical.ldl || null,
      hdl: clinical.hdl || null,
      triglycerides: clinical.triglycerides || null,
      hb1ac: clinical.hb1ac || null,
      creatinine: clinical.creatinine || null,
      potassium: clinical.potassium || null,
      egfr: clinical.egfr || null,
      egfr_category: clinical.egfr_category || null,
      albuminuria: clinical.albuminuria || null,
      albuminuria_category: clinical.albuminuria_category || null,
      office_sys: clinical.office_sys || null,
      office_dia: clinical.office_dia || null,
      ampa_sys: clinical.ampa_sys || null,
      ampa_dia: clinical.ampa_dia || null,
    };

    const { error } = await supabase
      .from("clinical_values")
      .insert(payload);

    if (error) {
      console.error(error);
      setErrorMsg("Error guardando valores clínicos.");
      setSaving(false);
      return;
    }

    router.push(`/patients/${id}`);
  }

  /* ==========================================================
     RENDER
  ========================================================== */

  if (loading) return <p className="p-6">Cargando…</p>;
  if (!patient) return <p className="p-6">Paciente no encontrado</p>;

  return (
    <div className="flex flex-col gap-6">
      {/* HEADER */}
      <div className="flex items-start justify-between border-b pb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-600 text-white">
            ➕
          </div>
          <div>
            <h1 className="text-2xl font-semibold">
              Nuevo registro clínico — {patient.code}
            </h1>
            <p className="text-sm text-slate-500">
              Introduce valores clínicos actualizados
            </p>
          </div>
        </div>

        <Button variant="outline" onClick={() => router.back()}>
          Cancelar
        </Button>
      </div>

      {/* FORM MAIN */}
      <Card className="p-6 shadow-sm border-slate-200">
        <form className="space-y-10" onSubmit={handleSave}>
          
          {/* FECHA */}
          <div className="space-y-2">
            <h2 className="text-lg font-semibold text-slate-800">
              Fecha de la visita
            </h2>
            <Label className="text-base font-medium">Selecciona fecha *</Label>
            <Input
              type="date"
              required
              value={clinical.date}
              onChange={(e) =>
                setClinical({ ...clinical, date: e.target.value })
              }
            />
          </div>

          <Separator />

          {/* EXPLORACIÓN FÍSICA */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-slate-800">
              Exploración física
            </h2>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="space-y-1">
                <Label>Peso (kg)</Label>
                <Input
                  type="number"
                  step="0.1"
                  min="0"
                  value={clinical.weight}
                  onChange={(e) =>
                    setClinical({ ...clinical, weight: e.target.value })
                  }
                />
              </div>

              <div className="space-y-1">
                <Label>Talla (cm)</Label>
                <Input
                  type="number"
                  min="0"
                  value={clinical.height}
                  onChange={(e) =>
                    setClinical({ ...clinical, height: e.target.value })
                  }
                />
              </div>

              <div className="space-y-1">
                <Label>IMC</Label>
                <Input
                  readOnly
                  value={clinical.bmi}
                  className="bg-slate-100"
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* TENSIÓN ARTERIAL */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-slate-800">
              Tensión arterial
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

              {/* CONSULTA */}
              <Card className="p-4 flex flex-col justify-between">
                <div>
                  <h3 className="font-semibold text-slate-700">
                    Tensión arterial en consulta
                  </h3>

                  {clinical.office_sys && clinical.office_dia ? (
                    <p className="text-xl font-bold text-sky-700 mt-2">
                      {clinical.office_sys}/{clinical.office_dia} mmHg
                    </p>
                  ) : (
                    <p className="text-slate-400 mt-2 text-sm">
                      No registrada todavía
                    </p>
                  )}
                </div>

                <Button
                  variant="outline"
                  className="w-full mt-4"
                  type="button"
                  onClick={() =>
                    router.push(`/patients/${id}/clinical/new/office`)
                  }
                >
                  Añadir tensión en consulta
                </Button>
              </Card>

              {/* AMPA */}
              <Card className="p-4 flex flex-col justify-between">
                <div>
                  <h3 className="font-semibold text-slate-700">
                    Tensión en domicilio (AMPA)
                  </h3>

                  {clinical.ampa_sys && clinical.ampa_dia ? (
                    <p className="text-xl font-bold text-sky-700 mt-2">
                      {clinical.ampa_sys}/{clinical.ampa_dia} mmHg
                    </p>
                  ) : (
                    <p className="text-slate-400 mt-2 text-sm">
                      No registrada todavía
                    </p>
                  )}
                </div>

                <Button
                  variant="outline"
                  className="w-full mt-4"
                  type="button"
                  onClick={() =>
                    router.push(`/patients/${id}/clinical/new/ampa`)
                  }
                >
                  Añadir AMPA
                </Button>
              </Card>

            </div>
          </div>

          <Separator />

          {/* GLUCOSA */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-slate-800">
              Glucosa / Metabolismo
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label>HbA1c (%)</Label>
                <Input
                  type="number"
                  step="0.1"
                  value={clinical.hb1ac}
                  onChange={(e) =>
                    setClinical({ ...clinical, hb1ac: e.target.value })
                  }
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* PERFIL LIPÍDICO */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-slate-800">
              Perfil lipídico
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <Label>Colesterol total</Label>
                <Input
                  type="number"
                  value={clinical.total_cholesterol}
                  onChange={(e) =>
                    setClinical({
                      ...clinical,
                      total_cholesterol: e.target.value,
                    })
                  }
                />
              </div>

              <div>
                <Label>LDL</Label>
                <Input
                  type="number"
                  value={clinical.ldl}
                  onChange={(e) =>
                    setClinical({ ...clinical, ldl: e.target.value })
                  }
                />
              </div>

              <div>
                <Label>HDL</Label>
                <Input
                  type="number"
                  value={clinical.hdl}
                  onChange={(e) =>
                    setClinical({ ...clinical, hdl: e.target.value })
                  }
                />
              </div>

              <div>
                <Label>Triglicéridos</Label>
                <Input
                  type="number"
                  value={clinical.triglycerides}
                  onChange={(e) =>
                    setClinical({
                      ...clinical,
                      triglycerides: e.target.value,
                    })
                  }
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* RENAL */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-slate-800">
              Función renal
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label>Creatinina (mg/dL)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={clinical.creatinine}
                  onChange={(e) =>
                    setClinical({ ...clinical, creatinine: e.target.value })
                  }
                />
              </div>

              <div>
                <Label>TFGe</Label>
                <Input
                  readOnly
                  value={clinical.egfr}
                  className="bg-slate-100"
                />
              </div>

              <div>
                <Label>Categoría TFGe</Label>
                <Input
                  readOnly
                  value={clinical.egfr_category}
                  className="bg-slate-100"
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* ALBUMINURIA */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-slate-800">
              Albuminuria
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Albuminuria (mg/g)</Label>
                <Input
                  type="number"
                  value={clinical.albuminuria}
                  onChange={(e) =>
                    setClinical({
                      ...clinical,
                      albuminuria: e.target.value,
                    })
                  }
                />
              </div>

              <div>
                <Label>Categoría Albuminuria</Label>
                <Input
                  readOnly
                  value={clinical.albuminuria_category}
                  className="bg-slate-100"
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* BOTÓN GUARDAR */}
          <div className="flex justify-center">
            <Button type="submit" disabled={saving} className="w-48">
              {saving ? "Guardando…" : "Guardar valores"}
            </Button>
          </div>

          {errorMsg && (
            <p className="text-center text-red-600">{errorMsg}</p>
          )}
        </form>
      </Card>
    </div>
  );
}

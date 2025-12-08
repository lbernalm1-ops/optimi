"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useParams, useRouter, useSearchParams } from "next/navigation";

import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";

export default function NewVisitPage() {
  const { id } = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [patient, setPatient] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const today = new Date().toISOString().split("T")[0];

  /* ==========================================================
     ESTADO CLÍNICO
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
    proBNP: "",
    office_sys: "",
    office_dia: "",
    ampa_sys: "",
    ampa_dia: "",
  });

  /* ==========================================================
     CARGA PACIENTE
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
     RECIBIR TA DESDE SUBPÁGINAS
  ========================================================== */
  useEffect(() => {
    const officeSys = searchParams.get("office_sys");
    const officeDia = searchParams.get("office_dia");
    const ampaSys = searchParams.get("ampa_sys");
    const ampaDia = searchParams.get("ampa_dia");

    setClinical((prev: { office_sys: any; office_dia: any; ampa_sys: any; ampa_dia: any; }) => ({
      ...prev,
      office_sys: officeSys || prev.office_sys,
      office_dia: officeDia || prev.office_dia,
      ampa_sys: ampaSys || prev.ampa_sys,
      ampa_dia: ampaDia || prev.ampa_dia,
    }));
  }, [searchParams]);

  /* ==========================================================
     BMI
  ========================================================== */
  useEffect(() => {
    if (clinical.weight && clinical.height) {
      const hMeters = parseFloat(clinical.height) / 100;
      const bmi = clinical.weight / (hMeters * hMeters);
      if (!isNaN(bmi)) {
        setClinical((prev: any) => ({ ...prev, bmi: bmi.toFixed(1) }));
      }
    }
  }, [clinical.weight, clinical.height]);

  /* ==========================================================
     eGFR
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
      142 * Math.pow(scr / A, B) *
      Math.pow(0.9938, age) *
      sexFactor;

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
     ALBUMINURIA
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
     GUARDAR
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
      proBNP: clinical.proBNP || null,
      egfr: clinical.egfr || null,
      egfr_category: clinical.egfr_category || null,
      albuminuria: clinical.albuminuria || null,
      albuminuria_category: clinical.albuminuria_category || null,
      office_sys: clinical.office_sys || null,
      office_dia: clinical.office_dia || null,
      ampa_sys: clinical.ampa_sys || null,
      ampa_dia: clinical.ampa_dia || null,
    };

    Object.keys(payload).forEach((key) => {
      const k = key as keyof typeof payload;
      if (payload[k] === "") payload[k] = null;
    });

    const { error } = await supabase.from("clinical_values").insert(payload);

    if (error) {
      console.error(error);
      setErrorMsg("Error guardando valores clínicos.");
      setSaving(false);
      return;
    }

    router.push(`/patients/${id}?reload=${Date.now()}`);
  }

  /* ==========================================================
     UI
  ========================================================== */

  if (loading) return <p className="p-6">Cargando…</p>;
  if (!patient) return <p className="p-6">Paciente no encontrado</p>;

  return (
    <div className="flex flex-col gap-6">

      {/* HEADER */}
      <div className="flex items-start justify-between border-b pb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-600 text-white text-lg shadow-sm">
            ➕
          </div>

          <div>
            <h1 className="text-2xl font-semibold">Nueva visita — {patient.code}</h1>
            <p className="text-sm text-slate-500">Introduce los valores clínicos</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button
            type="submit"
            form="visit-form"
            disabled={saving}
            className="w-40 bg-sky-600 hover:bg-sky-700 text-white rounded-lg shadow-sm py-2 h-auto"
          >
            {saving ? "Guardando…" : "Guardar"}
          </Button>

          <Button
            variant="outline"
            onClick={() => router.back()}
            className="w-40 py-2 h-auto rounded-lg"
          >
            Cancelar
          </Button>
        </div>
      </div>

      {/* FORM */}
      <Card className="p-6 shadow-sm border-slate-200">
        <form id="visit-form" className="space-y-10" onSubmit={handleSave}>

          {/* FECHA */}
          <div className="space-y-1">
            <h2 className="text-lg font-semibold text-slate-800">Fecha</h2>
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

          {/* ==========================
              ANTROPOMETRÍA
          ========================== */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Antropometría</h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label className="mb-1">Peso (kg)</Label>
                <Input
                  type="number"
                  value={clinical.weight}
                  onChange={(e) =>
                    setClinical({ ...clinical, weight: e.target.value })
                  }
                />
              </div>

              <div>
                <Label className="mb-1">IMC</Label>
                <Input readOnly value={clinical.bmi} className="bg-slate-100" />
              </div>

              <div>
                <Label className="mb-1">Talla (cm)</Label>
                <Input
                  type="number"
                  value={clinical.height}
                  onChange={(e) =>
                    setClinical({ ...clinical, height: e.target.value })
                  }
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* ==========================
              CARDIOVASCULAR
          ========================== */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Cardiovascular</h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

              <div>
                <Label className="mb-1">TA sistólica / diastólica</Label>
                <Card className="p-3 text-sm">
                  {clinical.office_sys ? (
                    <p className="text-sky-700 font-bold text-lg">
                      {clinical.office_sys}/{clinical.office_dia} mmHg
                    </p>
                  ) : (
                    <p className="text-slate-400">No registrada</p>
                  )}

                  <Button
                    variant="outline"
                    className="w-full mt-3 py-1.5 text-xs rounded-lg"
                    type="button"
                    onClick={() =>
                      router.push(`/patients/${id}/clinical/new/office`)
                    }
                  >
                    Añadir TA consulta
                  </Button>
                </Card>
              </div>

              <div>
                <Label className="mb-1">TA AMPA</Label>
                <Card className="p-3 text-sm">
                  {clinical.ampa_sys ? (
                    <p className="text-sky-700 font-bold text-lg">
                      {clinical.ampa_sys}/{clinical.ampa_dia} mmHg
                    </p>
                  ) : (
                    <p className="text-slate-400">No registrada</p>
                  )}

                  <Button
                    variant="outline"
                    className="w-full mt-3 py-1.5 text-xs rounded-lg"
                    type="button"
                    onClick={() =>
                      router.push(`/patients/${id}/clinical/new/ampa`)
                    }
                  >
                    Añadir AMPA
                  </Button>
                </Card>
              </div>

              <div>
                <Label className="mb-1">proBNP (pg/mL)</Label>
                <Input
                  type="number"
                  value={clinical.proBNP}
                  onChange={(e) =>
                    setClinical({ ...clinical, proBNP: e.target.value })
                  }
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* ==========================
              METABÓLICO
          ========================== */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Metabólico</h2>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">

              <div>
                <Label className="mb-1">HbA1c (%)</Label>
                <Input
                  type="number"
                  value={clinical.hb1ac}
                  onChange={(e) =>
                    setClinical({ ...clinical, hb1ac: e.target.value })
                  }
                />
              </div>

              <div>
                <Label className="mb-1">LDL (mg/dL)</Label>
                <Input
                  type="number"
                  value={clinical.ldl}
                  onChange={(e) =>
                    setClinical({ ...clinical, ldl: e.target.value })
                  }
                />
              </div>

              <div>
                <Label className="mb-1">HDL (mg/dL)</Label>
                <Input
                  type="number"
                  value={clinical.hdl}
                  onChange={(e) =>
                    setClinical({ ...clinical, hdl: e.target.value })
                  }
                />
              </div>

              <div>
                <Label className="mb-1">Triglicéridos</Label>
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

              <div>
                <Label className="mb-1">Colesterol total</Label>
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
            </div>
          </div>

          <Separator />

          {/* ==========================
              RENAL
          ========================== */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Función renal</h2>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">

              <div>
                <Label className="mb-1">Creatinina (mg/dL)</Label>
                <Input
                  type="number"
                  value={clinical.creatinine}
                  onChange={(e) =>
                    setClinical({ ...clinical, creatinine: e.target.value })
                  }
                />
              </div>

              <div>
                <Label className="mb-1">Potasio (mmol/L)</Label>
                <Input
                  type="number"
                  value={clinical.potassium}
                  onChange={(e) =>
                    setClinical({ ...clinical, potassium: e.target.value })
                  }
                />
              </div>

              <div>
                <Label className="mb-1">TFGe</Label>
                <Input readOnly value={clinical.egfr} className="bg-slate-100" />
              </div>

              <div>
                <Label className="mb-1">Estadio renal</Label>
                <Input
                  readOnly
                  value={clinical.egfr_category}
                  className="bg-slate-100"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="mb-1">Albuminuria (mg/g)</Label>
                <Input
                  type="number"
                  value={clinical.albuminuria}
                  onChange={(e) =>
                    setClinical({ ...clinical, albuminuria: e.target.value })
                  }
                />
              </div>

              <div>
                <Label className="mb-1">Categoría albuminuria</Label>
                <Input
                  readOnly
                  value={clinical.albuminuria_category}
                  className="bg-slate-100"
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* GUARDAR */}
          <div className="flex justify-center">
            <Button
              type="submit"
              disabled={saving}
              className="w-48 bg-sky-600 hover:bg-sky-700 text-white rounded-lg shadow-sm py-2 h-auto"
            >
              {saving ? "Guardando…" : "Guardar visita"}
            </Button>
          </div>

          {errorMsg && (
            <p className="text-center text-red-600 text-sm">{errorMsg}</p>
          )}
        </form>
      </Card>
    </div>
  );
}

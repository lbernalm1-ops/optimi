"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useParams, useRouter } from "next/navigation";

import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";

type ClinicalState = {
  date: string;
  weight: string;
  height: string;
  bmi: string;
  total_cholesterol: string;
  ldl: string;
  hdl: string;
  triglycerides: string;
  hb1ac: string;
  creatinine: string;
  potassium: string;
  egfr: string;
  egfr_category: string;
  albuminuria: string;
  albuminuria_category: string;
  probnp: string;
  office_sys: string;
  office_dia: string;
  ampa_sys: string;
  ampa_dia: string;
};

export default function EditVisitPage() {
  const params = useParams<{ id: string; visit_id: string }>();
  const router = useRouter();

  const id = params.id;          // ID del paciente
  const visitId = params.visit_id; // ID de la visita a editar

  const [patient, setPatient] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const [clinical, setClinical] = useState<ClinicalState>({
    date: "",
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
    probnp: "",
    office_sys: "",
    office_dia: "",
    ampa_sys: "",
    ampa_dia: "",
  });

  /* ==========================================================
     1) CARGAR PACIENTE
  ========================================================== */
  useEffect(() => {
    async function loadPatient() {
      const { data } = await supabase
        .from("patients")
        .select("patient_code, date_of_birth, sex")
        .eq("id_patient", id)
        .single();

      setPatient(data || null);
    }
    loadPatient();
  }, [id]);

  /* ==========================================================
     2) CARGAR VISITA EXISTENTE
  ========================================================== */
  useEffect(() => {
    async function loadVisit() {
      const { data, error } = await supabase
        .from("clinical_values")
        .select("*")
        .eq("id", visitId)
        .single();

      if (error) {
        console.error("Error cargando visita:", error);
        return;
      }

      setClinical({
        date: data.measured_at || "",
        weight: data.weight ?? "",
        height: data.height ?? "",
        bmi: data.bmi ?? "",
        total_cholesterol: data.total_cholesterol ?? "",
        ldl: data.ldl ?? "",
        hdl: data.hdl ?? "",
        triglycerides: data.triglycerides ?? "",
        hb1ac: data.hb1ac ?? "",
        creatinine: data.creatinine ?? "",
        potassium: data.potassium ?? "",
        egfr: data.egfr ?? "",
        egfr_category: data.egfr_category ?? "",
        albuminuria: data.albuminuria ?? "",
        albuminuria_category: data.albuminuria_category ?? "",
        probnp: data.probnp ?? "",
        office_sys: data.office_sys ?? "",
        office_dia: data.office_dia ?? "",
        ampa_sys: data.ampa_sys ?? "",
        ampa_dia: data.ampa_dia ?? "",
      });

      setLoading(false);
    }

    loadVisit();
  }, [visitId]);

  /* ==========================================================
     3) BMI AUTOMÁTICO
  ========================================================== */
  useEffect(() => {
    if (clinical.weight && clinical.height) {
      const hMeters = parseFloat(clinical.height) / 100;
      const weight = parseFloat(clinical.weight);

      if (hMeters > 0 && !isNaN(weight)) {
        const bmi = weight / (hMeters * hMeters);
        setClinical((prev) => ({ ...prev, bmi: bmi.toFixed(1) }));
      }
    }
  }, [clinical.weight, clinical.height]);

  /* ==========================================================
     4) CALCULAR EGFR
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
      142 *
      Math.pow(scr / A, B) *
      Math.pow(0.9938, age) *
      sexFactor;

    let category = "";
    if (egfr >= 60) category = "G1–G2 (Normal o leve descenso)";
    else if (egfr >= 45) category = "G3a";
    else if (egfr >= 30) category = "G3b";
    else if (egfr >= 15) category = "G4";
    else category = "G5";

    setClinical((prev) => ({
      ...prev,
      egfr: egfr.toFixed(0),
      egfr_category: category,
    }));
  }, [clinical.creatinine, patient]);

  /* ==========================================================
     5) GUARDAR CAMBIOS (UPDATE)
  ========================================================== */
  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    const payload: Record<string, any> = {
      measured_at: clinical.date || null,
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
      probnp: clinical.probnp || null,
      office_sys: clinical.office_sys || null,
      office_dia: clinical.office_dia || null,
      ampa_sys: clinical.ampa_sys || null,
      ampa_dia: clinical.ampa_dia || null,
    };

    const { error } = await supabase
      .from("clinical_values")
      .update(payload)
      .eq("id", visitId);

    setSaving(false);

    if (error) {
      console.error(error);
      setErrorMsg("Error actualizando visita");
      return;
    }

    router.push(`/patients/${id}/visits/all`);
  }

  /* ==========================================================
     UI
  ========================================================== */

  if (loading) return <p className="p-6">Cargando visita…</p>;
  if (!patient) return <p className="p-6">Paciente no encontrado</p>;

  return (
    <div className="flex flex-col gap-6 px-6 py-6">
      {/* HEADER */}
      <div className="flex justify-between items-center border-b pb-4">
        <h1 className="text-2xl font-semibold text-sky-800">
          Editar visita — {patient.patient_code}
        </h1>

        <div className="flex gap-2">
          <Button type="submit" form="edit-form" disabled={saving}>
            {saving ? "Guardando…" : "Guardar cambios"}
          </Button>

          <Button variant="outline" onClick={() => router.back()}>
            Cancelar
          </Button>
        </div>
      </div>

      {/* FORM */}
      <Card className="p-6 shadow-sm">
        <form id="edit-form" className="space-y-10" onSubmit={handleSave}>
          {/* FECHA */}
          <div>
            <Label>Fecha</Label>
            <Input
              type="date"
              value={clinical.date}
              onChange={(e) => setClinical({ ...clinical, date: e.target.value })}
            />
          </div>

          <Separator />

          {/* ANTROPOMETRÍA */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label>Peso (kg)</Label>
              <Input
                type="number"
                value={clinical.weight}
                onChange={(e) =>
                  setClinical({ ...clinical, weight: e.target.value })
                }
              />
            </div>

            <div>
              <Label>IMC</Label>
              <Input readOnly value={clinical.bmi} className="bg-slate-100" />
            </div>

            <div>
              <Label>Talla (cm)</Label>
              <Input
                type="number"
                value={clinical.height}
                onChange={(e) =>
                  setClinical({ ...clinical, height: e.target.value })
                }
              />
            </div>
          </div>

          <Separator />

          {/* CARDIOVASCULAR */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label>TA sistólica</Label>
              <Input
                type="number"
                value={clinical.office_sys}
                onChange={(e) =>
                  setClinical({ ...clinical, office_sys: e.target.value })
                }
              />
            </div>

            <div>
              <Label>TA diastólica</Label>
              <Input
                type="number"
                value={clinical.office_dia}
                onChange={(e) =>
                  setClinical({ ...clinical, office_dia: e.target.value })
                }
              />
            </div>

            <div>
              <Label>proBNP</Label>
              <Input
                type="number"
                value={clinical.probnp}
                onChange={(e) =>
                  setClinical({ ...clinical, probnp: e.target.value })
                }
              />
            </div>
          </div>

          <Separator />

          {/* METABÓLICO */}
          <div>
            <Label>HbA1c</Label>
            <Input
              type="number"
              value={clinical.hb1ac}
              onChange={(e) =>
                setClinical({ ...clinical, hb1ac: e.target.value })
              }
            />
          </div>

          <Separator />

          {/* RENAL */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label>Creatinina</Label>
              <Input
                type="number"
                value={clinical.creatinine}
                onChange={(e) =>
                  setClinical({ ...clinical, creatinine: e.target.value })
                }
              />
            </div>

            <div>
              <Label>Potasio</Label>
              <Input
                type="number"
                value={clinical.potassium}
                onChange={(e) =>
                  setClinical({ ...clinical, potassium: e.target.value })
                }
              />
            </div>

            <div>
              <Label>TFGe</Label>
              <Input readOnly value={clinical.egfr} className="bg-slate-100" />
            </div>
          </div>

          {errorMsg && (
            <p className="text-red-600 text-sm text-center">{errorMsg}</p>
          )}
        </form>
      </Card>
    </div>
  );
}

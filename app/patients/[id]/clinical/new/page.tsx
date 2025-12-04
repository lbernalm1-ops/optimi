"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useParams, useRouter } from "next/navigation";

export default function NewClinicalValuesPage() {
  const { id } = useParams();
  const router = useRouter();

  const [patient, setPatient] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const [clinical, setClinical] = useState<any>({
    date: "",
    weight: "",
    height: "",
    bmi: "",
    systolic_bp: "",
    diastolic_bp: "",
    creatinine: "",
    egfr: "",
    egfr_category: "",
    potassium: "",
    albuminuria: "",
    albuminuria_category: "",
    total_cholesterol: "",
    ldl: "",
    hdl: "",
    triglycerides: "",
    hb1ac: "",
  });

  // Limpia valores "" → null antes de enviar a la BD
  function clean(values: any) {
    const out: any = {};
    Object.entries(values).forEach(([k, v]) => {
      if (v === "" || v === undefined) out[k] = null;
      else out[k] = v;
    });
    return out;
  }

  function calculateAge(dob: string) {
    const diff = Date.now() - new Date(dob).getTime();
    return Math.abs(new Date(diff).getUTCFullYear() - 1970);
  }

  // IMC
  useEffect(() => {
    if (clinical.weight && clinical.height) {
      const h = parseFloat(clinical.height) / 100;
      const bmi = clinical.weight / (h * h);
      if (!isNaN(bmi)) {
        setClinical((p: any) => ({ ...p, bmi: bmi.toFixed(1) }));
      }
    }
  }, [clinical.weight, clinical.height]);

  // TFGe CKD-EPI 2021 (creatinina, sin raza)
  useEffect(() => {
    if (!clinical.creatinine || !patient) return;

    const scr = parseFloat(clinical.creatinine);
    if (isNaN(scr) || scr <= 0) return;

    const age = calculateAge(patient.date_of_birth);
    const female = patient.sex === "female";

    let A: number;
    let B: number;

    if (female) {
      A = 0.7;
      if (scr <= 0.7) B = -0.241;
      else B = -1.2;
    } else {
      A = 0.9;
      if (scr <= 0.9) B = -0.302;
      else B = -1.2;
    }

    const sexFactor = female ? 1.012 : 1;

    const egfr =
      142 *
      Math.pow(scr / A, B) *
      Math.pow(0.9938, age) *
      sexFactor;

    if (isNaN(egfr) || !isFinite(egfr)) return;

    let cat = "";
    if (egfr >= 60) cat = "Normal o leve descenso (G1–G2)";
    else if (egfr >= 45) cat = "Descenso ligero-moderado (G3a)";
    else if (egfr >= 30) cat = "Moderado-grave (G3b)";
    else if (egfr >= 15) cat = "Grave (G4)";
    else cat = "Prediálisis (G5)";

    setClinical((p: any) => ({
      ...p,
      egfr: egfr.toFixed(0),
      egfr_category: cat,
    }));
  }, [clinical.creatinine, patient]);

  // Albuminuria
  useEffect(() => {
    const alb = parseFloat(clinical.albuminuria);
    if (isNaN(alb)) return;

    let cat = "";
    if (alb < 30) cat = "A1 (<30 mg/g)";
    else if (alb < 300) cat = "A2 (30–299 mg/g)";
    else cat = "A3 (≥300 mg/g)";

    setClinical((p: any) => ({ ...p, albuminuria_category: cat }));
  }, [clinical.albuminuria]);

  // Cargar paciente
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

  // Guardar
  async function handleSubmit(e: any) {
    e.preventDefault();
    setSaving(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setErrorMsg("No estás autenticado.");
      setSaving(false);
      return;
    }

    const cleaned = clean(clinical);

    const { error } = await supabase
      .from("clinical_values")
      .insert([
        {
          patient_id: id,
          user_id: user.id,
          code: patient.code,
          ...cleaned,
        },
      ]);

    if (error) {
      setErrorMsg(error.message);
      setSaving(false);
      return;
    }

    router.push(`/patients/${id}/clinical`);
  }

  if (loading) return <p>Cargando…</p>;

  return (
    <div>
      <h1>Añadir valores clínicos — {patient.code}</h1>

      <form onSubmit={handleSubmit}>
        <div>
          <label>Fecha *</label>
          <input
            type="date"
            required
            value={clinical.date ?? ""}
            onChange={(e) =>
              setClinical({ ...clinical, date: e.target.value })
            }
          />
        </div>

        <h2>Exploración física</h2>

        <div>
          <label>Peso (kg):</label>
          <input
            type="number"
            value={clinical.weight ?? ""}
            onChange={(e) =>
              setClinical({ ...clinical, weight: e.target.value })
            }
          />
        </div>

        <div>
          <label>Talla (cm):</label>
          <input
            type="number"
            value={clinical.height ?? ""}
            onChange={(e) =>
              setClinical({ ...clinical, height: e.target.value })
            }
          />
        </div>

        <div>
          <label>IMC:</label>
          <input type="text" value={clinical.bmi ?? ""} readOnly />
        </div>

        <h2>Tensión arterial</h2>

        <div>
          <label>Sistólica:</label>
          <input
            type="number"
            value={clinical.systolic_bp ?? ""}
            onChange={(e) =>
              setClinical({ ...clinical, systolic_bp: e.target.value })
            }
          />
        </div>

        <div>
          <label>Diastólica:</label>
          <input
            type="number"
            value={clinical.diastolic_bp ?? ""}
            onChange={(e) =>
              setClinical({ ...clinical, diastolic_bp: e.target.value })
            }
          />
        </div>

        <h2>Función renal</h2>

        <div>
          <label>Creatinina (mg/dL):</label>
          <input
            type="number"
            step="0.01"
            value={clinical.creatinine ?? ""}
            onChange={(e) =>
              setClinical({ ...clinical, creatinine: e.target.value })
            }
          />
        </div>

        <div>
          <label>TFGe (CKD-EPI 2021):</label>
          <input type="text" value={clinical.egfr ?? ""} readOnly />
        </div>

        <div>
          <label>Categoría TFGe:</label>
          <input type="text" value={clinical.egfr_category ?? ""} readOnly />
        </div>

        <div>
          <label>Potasio:</label>
          <input
            type="number"
            step="0.01"
            value={clinical.potassium ?? ""}
            onChange={(e) =>
              setClinical({ ...clinical, potassium: e.target.value })
            }
          />
        </div>

        <h2>Albuminuria</h2>

        <div>
          <label>Albuminuria (mg/g):</label>
          <input
            type="number"
            value={clinical.albuminuria ?? ""}
            onChange={(e) =>
              setClinical({ ...clinical, albuminuria: e.target.value })
            }
          />
        </div>

        <div>
          <label>Categoría:</label>
          <input
            type="text"
            value={clinical.albuminuria_category ?? ""}
            readOnly
          />
        </div>

        <h2>Perfil lipídico</h2>

        <div>
          <label>Colesterol total:</label>
          <input
            type="number"
            value={clinical.total_cholesterol ?? ""}
            onChange={(e) =>
              setClinical({
                ...clinical,
                total_cholesterol: e.target.value,
              })
            }
          />
        </div>

        <div>
          <label>LDL:</label>
          <input
            type="number"
            value={clinical.ldl ?? ""}
            onChange={(e) =>
              setClinical({ ...clinical, ldl: e.target.value })
            }
          />
        </div>

        <div>
          <label>HDL:</label>
          <input
            type="number"
            value={clinical.hdl ?? ""}
            onChange={(e) =>
              setClinical({ ...clinical, hdl: e.target.value })
            }
          />
        </div>

        <div>
          <label>Triglicéridos:</label>
          <input
            type="number"
            value={clinical.triglycerides ?? ""}
            onChange={(e) =>
              setClinical({ ...clinical, triglycerides: e.target.value })
            }
          />
        </div>

        <h2>Glucosa / Metabolismo</h2>

        <div>
          <label>HbA1c (%):</label>
          <input
            type="number"
            step="0.1"
            value={clinical.hb1ac ?? ""}
            onChange={(e) =>
              setClinical({ ...clinical, hb1ac: e.target.value })
            }
          />
        </div>

        {errorMsg && <p style={{ color: "red" }}>{errorMsg}</p>}

        <button type="submit" disabled={saving}>
          {saving ? "Guardando…" : "Guardar valores"}
        </button>
      </form>
    </div>
  );
}

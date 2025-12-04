"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import Link from "next/link";
import { useParams } from "next/navigation";

export default function PatientDetail() {
  const { id } = useParams();

  const [patient, setPatient] = useState<any>(null);
  const [conditions, setConditions] = useState<any>(null);
  const [latestValues, setLatestValues] = useState<any>(null);
  const [medications, setMedications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  function getAge(dob: string) {
    const diff = Date.now() - new Date(dob).getTime();
    return Math.abs(new Date(diff).getUTCFullYear() - 1970);
  }

  useEffect(() => {
    async function loadData() {
      // PACIENTE
      const { data: patientData } = await supabase
        .from("patients")
        .select("*")
        .eq("id_patient", Number(id))
        .single();
      setPatient(patientData);

      // CONDICIONES
      const { data: condData } = await supabase
        .from("conditions")
        .select("*")
        .eq("patient_id", Number(id))
        .single();
      setConditions(condData);

      // ÚLTIMO VALOR CLÍNICO
      const { data: clinicalData } = await supabase
        .from("clinical_values")
        .select("*")
        .eq("patient_id", Number(id))
        .order("date", { ascending: false })
        .limit(1);

      setLatestValues(clinicalData?.[0] || null);

      // MEDICACIÓN ACTUAL
      const { data: medsData } = await supabase
        .from("patient_medications")
        .select("*")
        .eq("patient_id", Number(id))
        .eq("active", true)
        .order("start_date", { ascending: false });

      setMedications(medsData || []);

      setLoading(false);
    }

    loadData();
  }, [id]);

  if (loading) return <p style={{ padding: 20 }}>Cargando…</p>;
  if (!patient) return <p style={{ padding: 20 }}>Paciente no encontrado.</p>;

  return (
    <div style={{ padding: 20 }}>

      {/* DATOS DEL PACIENTE */}
      <h1>Paciente {patient.code}</h1>

      <p><strong>Sexo:</strong> {patient.sex === "female" ? "Femenino" : "Masculino"}</p>
      <p>
        <strong>Fecha de nacimiento:</strong> {patient.date_of_birth} — 
        <strong> Edad:</strong> {getAge(patient.date_of_birth)} años
      </p>

      {/* CONDICIONES */}
      <h2 style={{ marginTop: 30 }}>Condiciones</h2>

      <Link href={`/patients/${id}/conditions`}>
        <button style={{ marginBottom: 15 }}>Editar condiciones →</button>
      </Link>

      {conditions && (
        <ul>
          <li>HTA: {conditions.hta ? "Sí" : "No"}</li>
          <li>Dislipemia: {conditions.dyslipemia ? "Sí" : "No"}</li>
          <li>Diabetes: {conditions.diabetes ? "Sí" : "No"}</li>
          <li>Tabaquismo: {conditions.smoker ? "Sí" : "No"}</li>
          <li>ERC: {conditions.ckd ? "Sí" : "No"}</li>
        </ul>
      )}

      {/* VALORES CLÍNICOS (RESTAURADO) */}
      <h2 style={{ marginTop: 30 }}>Valores clínicos</h2>

      <Link href={`/patients/${id}/clinical`}>
        <button style={{ marginBottom: 15 }}>Ver historial clínico →</button>
      </Link>

      {!latestValues && <p>No hay valores clínicos registrados.</p>}

      {latestValues && (
        <div style={{ marginTop: 10 }}>
          <p>
            <strong>Última visita:</strong> {latestValues.date}
          </p>

          <p>
            <strong>Tensión arterial:</strong>{" "}
            {latestValues.systolic_bp && latestValues.diastolic_bp
              ? `${latestValues.systolic_bp}/${latestValues.diastolic_bp}`
              : ""}
          </p>

          <p>
            <strong>TFGe (CKD-EPI 2021):</strong>{" "}
            {latestValues.egfr ? latestValues.egfr : ""}
          </p>

          <p>
            <strong>Categoría TFGe:</strong>{" "}
            {latestValues.egfr_category ? latestValues.egfr_category : ""}
          </p>

          <p>
            <strong>LDL:</strong>{" "}
            {latestValues.ldl ? `${latestValues.ldl} mg/dL` : ""}
          </p>

          <p>
            <strong>HbA1c:</strong>{" "}
            {latestValues.hb1ac ? `${latestValues.hb1ac} %` : ""}
          </p>
        </div>
      )}

      {/* MEDICACIÓN */}
      <h2 style={{ marginTop: 30 }}>Medicación actual</h2>

      <Link href={`/patients/${id}/medications`}>
        <button style={{ marginBottom: 15 }}>Gestionar medicación →</button>
      </Link>

      {medications.length === 0 && (
        <p>No hay medicación registrada para este paciente.</p>
      )}

      {medications.length > 0 && (
        <ul>
          {medications.map((med) => (
            <li key={med.id_medication} style={{ marginBottom: 12 }}>
              <strong>{med.drug_name}</strong>

              {med.dose ? ` — ${med.dose}` : ""}
              {med.frequency ? ` — ${med.frequency}` : ""}
              {med.posology ? ` — ${med.posology}` : ""}
              {med.indication ? ` — (${med.indication})` : ""}

              <div style={{ marginTop: 6 }}>
                <Link
                  href={`/patients/${id}/medications/${med.id_medication}/edit`}
                >
                  <button style={{ marginRight: 10 }}>✏ Editar</button>
                </Link>

                <button
                  style={{
                    backgroundColor: "red",
                    color: "white",
                    padding: "4px 10px",
                  }}
                  onClick={async () => {
                    await supabase
                      .from("patient_medications")
                      .update({
                        active: false,
                        end_date: new Date().toISOString().split("T")[0],
                      })
                      .eq("id_medication", med.id_medication);

                    location.reload();
                  }}
                >
                  ❌ Suspender
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

    </div>
  );
}

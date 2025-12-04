"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import Link from "next/link";
import { useParams } from "next/navigation";

export default function ClinicalValuesPage() {
  const { id } = useParams(); // ← id_patient
  const [patient, setPatient] = useState<any>(null);
  const [values, setValues] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      // 1️⃣ Cargar el código del paciente
      const { data: patientData, error: patientError } = await supabase
        .from("patients")
        .select("code")
        .eq("id_patient", id)
        .single();

      if (patientError) {
        console.error("Error cargando paciente:", patientError);
      }

      setPatient(patientData || null);

      // 2️⃣ Cargar valores clínicos del paciente
      const { data: clinicalData, error: valuesError } = await supabase
        .from("clinical_values")
        .select("*")
        .eq("patient_id", id)
        .order("date", { ascending: false });

      if (valuesError) {
        console.error("Error cargando valores clínicos:", valuesError);
      }

      setValues(clinicalData || []);
      setLoading(false);
    }

    loadData();
  }, [id]);

  if (loading) return <p style={{ padding: 20 }}>Cargando…</p>;
  if (!patient) return <p style={{ padding: 20 }}>Paciente no encontrado.</p>;

  return (
    <div style={{ padding: 20 }}>
      <h1>Paciente {patient.code} — Valores Clínicos</h1>

      {/* Botón para añadir visita */}
      <Link href={`/patients/${id}/clinical/new`}>
        <button style={{ marginTop: 20, marginBottom: 30 }}>
          Añadir valores clínicos
        </button>
      </Link>

      {/* Si no hay visitas */}
      {values.length === 0 && (
        <p>Este paciente aún no tiene valores clínicos registrados.</p>
      )}

      {/* Tabla de visitas clínicas */}
      {values.length > 0 && (
        <div>
          <h2>Historial clínico</h2>

          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              marginTop: 15,
            }}
          >
            <thead>
              <tr>
                <th style={th}>Fecha</th>
                <th style={th}>TA</th>
                <th style={th}>IMC</th>
                <th style={th}>eGFR</th>
                <th style={th}>Alb Cat</th>
              </tr>
            </thead>

            <tbody>
              {values.map((v) => (
                <tr key={v.id_value}>
                  <td style={td}>{v.date || "-"}</td>

                  <td style={td}>
                    {v.systolic_bp && v.diastolic_bp
                      ? `${v.systolic_bp}/${v.diastolic_bp}`
                      : "-"}
                  </td>

                  <td style={td}>{v.bmi ?? "-"}</td>

                  <td style={td}>{v.egfr ?? "-"}</td>

                  <td style={td}>{v.albuminuria_category ?? "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// Estilos tabla
const th = {
  borderBottom: "1px solid #ccc",
  padding: "8px",
  textAlign: "left" as const,
};

const td = {
  borderBottom: "1px solid #eee",
  padding: "8px",
};

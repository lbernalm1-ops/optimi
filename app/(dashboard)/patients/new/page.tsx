"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";

export default function NewPatientPage() {
  const router = useRouter();

  const [dateOfBirth, setDateOfBirth] = useState("");
  const [sex, setSex] = useState("female");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");

    // Obtener usuario logueado
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      setErrorMsg("El usuario no está autenticado.");
      setLoading(false);
      return;
    }

    // 1️⃣ BUSCAR EL ÚLTIMO CODE DE ESTE MÉDICO
    const { data: lastPatient } = await supabase
      .from("patients")
      .select("code")
      .eq("user_id", user.id)
      .order("code", { ascending: false })
      .limit(1)
      .maybeSingle();

    // 2️⃣ CALCULAR EL SIGUIENTE NÚMERO
    let nextNumber = 1;

    if (lastPatient?.code) {
      nextNumber = parseInt(lastPatient.code.slice(1)) + 1;
    }

    // 3️⃣ GENERAR EL NUEVO CÓDIGO
    const newCode = "P" + String(nextNumber).padStart(4, "0");

    // 4️⃣ INSERTAR PACIENTE CON ESE CODE
    const { data: newPatient, error: patientError } = await supabase
      .from("patients")
      .insert([
        {
          date_of_birth: dateOfBirth,
          sex: sex,
          user_id: user.id,
          code: newCode, // ← NUEVO CAMPO
        },
      ])
      .select("*")
      .single();

    if (patientError) {
      setErrorMsg(patientError.message);
      setLoading(false);
      return;
    }

    // 5️⃣ CREAR FILA VACÍA EN CONDITIONS (sin albuminuria)
    const { error: condError } = await supabase.from("conditions").insert([
      {
        patient_id: newPatient.id_patient,
        hta: null,
        dyslipemia: null,
        diabetes: null,
        smoker: null,
        ckd: null,
      },
    ]);

    if (condError) {
      setErrorMsg(condError.message);
      setLoading(false);
      return;
    }

    // 6️⃣ Volver al listado
    router.push("/patients");
  }

  return (
    <div style={{ padding: 20 }}>
      <h1>Nuevo Paciente</h1>

      <form
        onSubmit={handleSubmit}
        style={{ display: "flex", flexDirection: "column", width: "250px" }}
      >
        <label>Fecha de nacimiento:</label>
        <input
          type="date"
          value={dateOfBirth}
          onChange={(e) => setDateOfBirth(e.target.value)}
          required
        />

        <label>Sexo:</label>
        <select value={sex} onChange={(e) => setSex(e.target.value)}>
          <option value="female">Femenino</option>
          <option value="male">Masculino</option>
        </select>

        <button type="submit" disabled={loading} style={{ marginTop: 20 }}>
          {loading ? "Guardando..." : "Guardar"}
        </button>

        {errorMsg && <p style={{ color: "red" }}>{errorMsg}</p>}
      </form>
    </div>
  );
}

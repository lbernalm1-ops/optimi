"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function PatientsPage() {
  const [patients, setPatients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadPatients() {
      const { data, error } = await supabase
        .from("patients")
        .select("*")
        .order("id_patient", { ascending: true });

      console.log("DATA:", data);
      console.log("ERROR:", error);

      setPatients(data || []);
      setLoading(false);
    }

    loadPatients();
  }, []);

  if (loading) return <p>Cargando...</p>;

  return (
    <div style={{ padding: 20 }}>
      <h1>Pacientes</h1>

      {patients.length === 0 && <p>No hay pacientes todavía.</p>}

      <ul>
  {patients.map((p) => (
    <li key={p.id_patient} style={{ marginBottom: "10px" }}>
      <a
        href={`/patients/${p.id_patient}`}
        style={{ textDecoration: "none", color: "blue" }}
      >
        <strong>{p.code}</strong> — {p.sex} — {p.date_of_birth}
      </a>
    </li>
  ))}
</ul>
    </div>
  );
}


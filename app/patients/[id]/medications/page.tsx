"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import Link from "next/link";

export default function PatientMedicationsPage() {
  const { id } = useParams();
  const router = useRouter();

  const [meds, setMeds] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data, error } = await supabase
        .from("patient_medications")
        .select("*")
        .eq("patient_id", Number(id))
        .eq("active", true)
        .order("start_date", { ascending: false });

      if (error) {
        console.error("Error cargando medicación:", error);
      }

      setMeds(data || []);
      setLoading(false);
    }

    load();
  }, [id]);

  if (loading) return <p style={{ padding: 20 }}>Cargando…</p>;

  return (
    <div style={{ padding: 20 }}>
      <h1>Medicación del paciente</h1>

      <Link href={`/patients/${id}/medications/new`}>
        <button style={{ marginBottom: 15 }}>Añadir medicación →</button>
      </Link>

      {meds.length === 0 && <p>No hay medicación activa.</p>}

      {meds.length > 0 && (
        <ul>
          {meds.map((m) => (
            <li key={m.id_medication} style={{ marginBottom: 15 }}>
              <strong>{m.drug_name}</strong>
              {m.dose ? ` — ${m.dose}` : ""}
              {m.frequency ? ` — ${m.frequency}` : ""}
              {m.posology ? ` — ${m.posology}` : ""}
              {m.indication ? ` — (${m.indication})` : ""}

              <div style={{ marginTop: 6 }}>
                <Link
                  href={`/patients/${id}/medications/${m.id_medication}/edit`}
                >
                  <button style={{ marginRight: 10 }}>✏ Editar</button>
                </Link>

                <button
                  style={{
                    background: "red",
                    color: "white",
                    padding: "4px 10px",
                  }}
                  onClick={async () => {
                    const { error } = await supabase
                      .from("patient_medications")
                      .update({
                        active: false,
                        end_date: new Date().toISOString().split("T")[0],
                      })
                      .eq("id_medication", m.id_medication);

                    if (error) {
                      console.error("Error al suspender:", error);
                      return;
                    }

                    router.refresh();
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

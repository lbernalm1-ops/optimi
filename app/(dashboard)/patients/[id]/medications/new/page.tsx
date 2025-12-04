"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import DrugSearchInput from "@/components/DrugSearchInput";
import type { FlatDrugForm } from "@/data/types/drugs";

export default function AddMedicationPage() {
  const { id } = useParams();
  const router = useRouter();

  const [selectedDrug, setSelectedDrug] = useState<FlatDrugForm | null>(null);

  async function handleSave() {
    if (!selectedDrug) return;

    const patientId = Number(id);
    if (Number.isNaN(patientId)) {
      alert("ID de paciente inválido");
      return;
    }

    const payload = {
      patient_id: patientId,
      drug_name: selectedDrug.name,
      drug_group: selectedDrug.groupLabel,
      start_date: new Date().toISOString().split("T")[0],
      active: true,
    };

    const { error } = await supabase
      .from("patient_medications")
      .insert(payload);

    if (error) {
      alert("Error insertando medicación:\n" + (error.message || JSON.stringify(error)));
      return;
    }

    router.push(`/patients/${id}/medications`);
  }

  return (
    <div style={{ padding: 20 }}>
      <h1>Añadir medicación</h1>

      <p>Buscar medicamento:</p>
      <DrugSearchInput onSelect={setSelectedDrug} />

      {selectedDrug && (
        <div
          style={{
            marginTop: 20,
            padding: 10,
            border: "1px solid #ddd",
            borderRadius: 6,
          }}
        >
          <strong>Medicamento seleccionado:</strong>
          <p>{selectedDrug.name}</p>
          <p>{selectedDrug.lab}</p>
          <p>{selectedDrug.strength}</p>
        </div>
      )}

      <button
        disabled={!selectedDrug}
        onClick={handleSave}
        style={{
          marginTop: 20,
          padding: "12px 20px",
          backgroundColor: selectedDrug ? "black" : "gray",
          color: "white",
          borderRadius: 6,
          cursor: selectedDrug ? "pointer" : "not-allowed",
        }}
      >
        Guardar medicación
      </button>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { Button } from "@/components/ui/button";

export default function EditClinicPage() {
  const { id } = useParams();
  const router = useRouter();

  const [name, setName] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  async function loadClinic() {
    setLoading(true);

    const { data, error } = await supabase
      .from("clinics")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      console.error("Error cargando clínica:", error);
    } else {
      setName(data.name);
    }

    setLoading(false);
  }

  useEffect(() => {
    loadClinic();
  }, [id]);

  async function saveClinic() {
    if (name.trim().length < 3) {
      alert("El nombre debe tener al menos 3 caracteres.");
      return;
    }

    setSaving(true);

    const { error } = await supabase
      .from("clinics")
      .update({
        name,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    setSaving(false);

    if (error) {
      alert("No tienes permisos para editar esta clínica.");
      console.error(error);
      return;
    }

    router.push(`/clinics/${id}`);
  }

  if (loading) {
    return <p className="text-center py-10 text-slate-500">Cargando…</p>;
  }

  return (
    <div className="px-6 py-6 max-w-md mx-auto">
      <h1 className="text-xl font-semibold text-sky-900 mb-6">
        Editar clínica
      </h1>

      <div className="space-y-4">
        <div>
          <label className="text-sm text-slate-700">Nombre</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1 w-full border rounded-md px-3 py-2"
          />
        </div>

        <Button onClick={saveClinic} disabled={saving} className="w-full">
          {saving ? "Guardando…" : "Guardar cambios"}
        </Button>

        <Button
          variant="outline"
          onClick={() => router.push(`/clinics/${id}`)}
          className="w-full mt-2"
        >
          Cancelar
        </Button>
      </div>
    </div>
  );
}

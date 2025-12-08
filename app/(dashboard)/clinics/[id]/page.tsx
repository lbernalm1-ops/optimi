"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function ClinicPage() {
  const { id } = useParams();
  const router = useRouter();

  const [clinic, setClinic] = useState<any>(null);
  const [loading, setLoading] = useState(true);

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
      setClinic(data);
    }

    setLoading(false);
  }

  useEffect(() => {
    loadClinic();
  }, [id]);

  if (loading) {
    return <p className="text-center py-10 text-slate-500">Cargando clínica…</p>;
  }

  if (!clinic) {
    return (
      <div className="text-center py-20 text-slate-600">
        <p className="mb-4">No se encontró esta clínica.</p>
        <Button onClick={() => router.push("/clinics")}>Volver</Button>
      </div>
    );
  }

  return (
    <div className="px-6 py-6 max-w-3xl mx-auto">

      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold text-sky-900">
          Clínica: {clinic.name}
        </h1>

        <Button onClick={() => router.push(`/clinics/${id}/edit`)}>
          Editar clínica
        </Button>
      </div>

      <Card className="border-slate-200">
        <CardHeader>
          <CardTitle className="text-lg text-sky-900">Detalles</CardTitle>
        </CardHeader>

        <CardContent className="text-sm text-slate-700 space-y-2">
          <p><strong>ID:</strong> {clinic.id}</p>
          <p><strong>Nombre:</strong> {clinic.name}</p>
          <p><strong>Fecha de creación:</strong> {new Date(clinic.created_at).toLocaleString()}</p>

          {clinic.updated_at && (
            <p><strong>Última actualización:</strong> {new Date(clinic.updated_at).toLocaleString()}</p>
          )}

          <p><strong>Propietario:</strong> {clinic.owner_id}</p>
        </CardContent>
      </Card>

      <div className="mt-8">
        <h2 className="text-lg font-semibold text-sky-900 mb-3">Secciones futuras</h2>

        <ul className="list-disc ml-6 text-slate-600 text-sm">
          <li>Miembros de la clínica</li>
          <li>Pacientes asignados</li>
          <li>Agenda / Citas</li>
          <li>Documentos</li>
          <li>Ajustes avanzados</li>
        </ul>
      </div>

    </div>
  );
}

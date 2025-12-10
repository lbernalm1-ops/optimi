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
  const [userId, setUserId] = useState<string | null>(null);
  const [isMember, setIsMember] = useState(false);
  const [isOwner, setIsOwner] = useState(false);
  const [loading, setLoading] = useState(true);

  // --------------------------------------------------------
  // Cargar usuario + clínica + permisos
  // --------------------------------------------------------
  useEffect(() => {
    async function load() {
      if (!id) return; // esperar a tener el ID

      // 1) Obtener usuario autenticado
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }

      setUserId(user.id);

      // 2) Cargar clínica
      const { data: clinicData } = await supabase
        .from("clinics")
        .select("*")
        .eq("id", id)
        .single();

      if (!clinicData) {
        setClinic(null);
        setLoading(false);
        return;
      }

      setClinic(clinicData);

      // 3) Validar si es owner
      if (clinicData.owner_id === user.id) {
        setIsOwner(true);
        setIsMember(true); // owner siempre es miembro
        setLoading(false);
        return;
      }

      // 4) Validar si pertenece a la clínica como miembro activo
      const { data: membership } = await supabase
        .from("clinic_members")
        .select("user_id")
        .eq("clinic_id", id)
        .eq("user_id", user.id)
        .eq("is_active", true)
        .maybeSingle();

      if (membership) {
        setIsMember(true);
      }

      setLoading(false);
    }

    load();
  }, [id]);

  // --------------------------------------------------------
  // Estados de carga / error / acceso denegado
  // --------------------------------------------------------
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

  if (!isMember) {
    return (
      <div className="max-w-md mx-auto text-center py-20">
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="text-red-700">
              Acceso denegado
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-red-600">
            No tienes permisos para ver esta clínica.<br />
            Solo el propietario y los miembros pueden acceder.
          </CardContent>
        </Card>

        <div className="mt-6">
          <Button onClick={() => router.push("/clinics")}>Volver</Button>
        </div>
      </div>
    );
  }

  // --------------------------------------------------------
  // Render principal
  // --------------------------------------------------------
  return (
    <div className="px-6 py-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold text-sky-900">
          Clínica: {clinic.name}
        </h1>

        {isOwner && (
          <Button onClick={() => router.push(`/clinics/${id}/edit`)}>
            Editar clínica
          </Button>
        )}
      </div>

      {/* ----------------------------------------------- */}
      {/* Detalles */}
      {/* ----------------------------------------------- */}
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
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

// Reglas globales
import {
  canUserCreateClinics,
  maxClinicsAllowed,
} from "@/lib/clinicRules";

export default function NewClinicPage() {
  const router = useRouter();

  const [clinicName, setClinicName] = useState("");
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const [profile, setProfile] = useState<any>(null);
  const [clinicCount, setClinicCount] = useState(0);
  const [loading, setLoading] = useState(true);

  // --------------------------------------------------------
  // Cargar perfil + número de clínicas creadas
  // --------------------------------------------------------
  useEffect(() => {
    async function load() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setErrorMsg("Debes iniciar sesión.");
        setLoading(false);
        return;
      }

      const { data: profileData } = await supabase
        .from("profiles")
        .select("id, role, level, email")
        .eq("id", user.id)
        .single();

      setProfile(profileData);

      // contar clínicas creadas
      const { count } = await supabase
        .from("clinics")
        .select("*", { count: "exact", head: true })
        .eq("owner_id", user.id);

      setClinicCount(count ?? 0);
      setLoading(false);
    }

    load();
  }, []);

  // --------------------------------------------------------
  // Manejar creación
  // --------------------------------------------------------
  async function createClinic(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setErrorMsg("");

    if (!profile) {
      setErrorMsg("No se pudo obtener tu perfil.");
      setSaving(false);
      return;
    }

    // Validación del nombre
    if (clinicName.trim().length < 3) {
      setErrorMsg("El nombre debe tener al menos 3 caracteres.");
      setSaving(false);
      return;
    }

    // Validación mediante tus reglas globales
    const canCreate = canUserCreateClinics(profile.level);
    const max = maxClinicsAllowed(profile.level);

    if (!canCreate) {
      setErrorMsg("Tu plan no permite crear clínicas.");
      setSaving(false);
      return;
    }

    if (clinicCount >= max) {
      setErrorMsg(`Solo puedes crear ${max} clínicas con tu plan actual.`);
      setSaving(false);
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      setErrorMsg("Sesión expirada. Vuelve a iniciar sesión.");
      setSaving(false);
      return;
    }

    // Crear clínica → el trigger insertará al owner en clinic_members
    const { error } = await supabase.from("clinics").insert({
      name: clinicName.trim(),
      owner_id: user.id,
    });

    if (error) {
      console.error("❌ Error creando clínica:", error);
      setErrorMsg("Error inesperado al crear la clínica.");
      setSaving(false);
      return;
    }

    // Redirigir al listado
    router.push("/clinics");
  }

  if (loading) return <p className="p-6">Cargando…</p>;

  return (
    <div className="px-6 py-6 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6 border-b pb-3">
        <h1 className="text-xl font-semibold text-sky-900">
          Crear nueva clínica
        </h1>

        <Button variant="outline" onClick={() => router.back()}>
          Cancelar
        </Button>
      </div>

      <Card className="shadow-sm border-slate-200">
        <CardHeader>
          <CardTitle className="text-lg text-sky-900">
            Datos de la clínica
          </CardTitle>
        </CardHeader>

        <CardContent>
          <form onSubmit={createClinic} className="space-y-6">
            <div className="space-y-2">
              <Label className="text-sm">Nombre de la clínica</Label>
              <Input
                value={clinicName}
                onChange={(e) => setClinicName(e.target.value)}
                placeholder="Ej. Clínica Salud Plus"
                required
              />
            </div>

            {errorMsg && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
                {errorMsg}
              </div>
            )}

            <div className="pt-2">
              <Button type="submit" disabled={saving} className="w-full py-2">
                {saving ? "Creando..." : "Crear clínica"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function NewClinicPage() {
  const router = useRouter();

  const [clinicName, setClinicName] = useState("");
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  async function createClinic(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setErrorMsg("");

    // VALIDACIÓN nueva: nombre mínimo 3 caracteres
    if (clinicName.trim().length < 3) {
      setErrorMsg("El nombre debe tener al menos 3 caracteres.");
      setSaving(false);
      return;
    }

    // Obtener usuario actual
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setErrorMsg("No se ha podido identificar al usuario.");
      setSaving(false);
      return;
    }

    // Insertar clínica con updated_at opcional
    const { error } = await supabase.from("clinics").insert({
      name: clinicName.trim(),
      owner_id: user.id,
      updated_at: new Date().toISOString(), // opcional pero recomendado
    });

    if (error) {
      console.error("❌ Error creando clínica:", error);

      // Detectamos límite de 3 clínicas por policy RLS
      if (
        error.message?.includes("clinics") ||
        error.code === "42501" ||
        error.code === "P0001"
      ) {
        setErrorMsg("Has alcanzado el número máximo de clínicas permitidas (3).");
      } else {
        setErrorMsg("No ha sido posible crear la clínica.");
      }

      setSaving(false);
      return;
    }

    // Clínica creada → redirigir
    router.push("/clinics");
  }

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

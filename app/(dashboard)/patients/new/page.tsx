"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";

// Generar código numérico único (8 dígitos)
const generatePatientCode = () => {
  return Math.floor(10000000 + Math.random() * 90000000).toString();
};

export default function NewPatientPage() {
  const router = useRouter();

  const [patient_code, setCode] = useState(generatePatientCode());
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [sex, setSex] = useState("");
  const [notes, setNotes] = useState("");

  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  async function handleSave(e: any) {
    e.preventDefault();
    setErrorMsg("");

    // ---------------------------------------
    // Obtener usuario autenticado
    // ---------------------------------------
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setErrorMsg("Debes iniciar sesión.");
      return;
    }

    // ---------------------------------------
    // Validaciones locales
    // ---------------------------------------
    if (!dateOfBirth) {
      setErrorMsg("La fecha de nacimiento es obligatoria.");
      return;
    }

    if (!sex) {
      setErrorMsg("El sexo es obligatorio.");
      return;
    }

    setSaving(true);

    // ---------------------------------------
    // Verificar si el código ya existe
    // (opcional pero recomendado)
    // ---------------------------------------
    const { data: existing } = await supabase
      .from("patients")
      .select("patient_code")
      .eq("patient_code", patient_code)
      .maybeSingle();

    if (existing) {
      setSaving(false);
      setErrorMsg("Ya existe un paciente con ese código. Genera otro.");
      return;
    }

    // ---------------------------------------
    // Insertar paciente
    // ---------------------------------------
    const { error } = await supabase.from("patients").insert({
      user_id: user.id,
      patient_code,
      date_of_birth: dateOfBirth,
      sex,
      notes,
      clinic_id: null, // pacientes personales sin clínica
    });

    setSaving(false);

    if (error) {
      console.error("❌ Error guardando paciente:", error);
      setErrorMsg("Error guardando el paciente.");
      return;
    }

    // Redirigir al listado
    router.push("/patients");
  }

  return (
    <div className="p-6 flex flex-col gap-6">
      {/* HEADER */}
      <div className="flex justify-between items-start border-b pb-4">
        <h1 className="text-2xl font-semibold">Nuevo paciente</h1>

        <Button
          className="w-32"
          form="new-patient-form"
          type="submit"
          disabled={saving}
        >
          {saving ? "Guardando…" : "Guardar"}
        </Button>
      </div>

      {/* FORM */}
      <Card className="p-6">
        <form id="new-patient-form" onSubmit={handleSave} className="space-y-6">

          {/* CÓDIGO */}
          <div className="space-y-2">
            <Label className="font-medium">Código del paciente</Label>
            <div className="flex gap-2">
              <Input
                value={patient_code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="12345678"
                className="font-mono"
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => setCode(generatePatientCode())}
              >
                Generar
              </Button>
            </div>
            <p className="text-xs text-slate-500">
              Código numérico de 8 dígitos. Ejemplo: <b>12345678</b>
            </p>
          </div>

          {/* FECHA NACIMIENTO */}
          <div className="space-y-2">
            <Label className="font-medium">Fecha de nacimiento *</Label>
            <Input
              type="date"
              value={dateOfBirth}
              onChange={(e) => setDateOfBirth(e.target.value)}
            />
          </div>

          {/* SEXO */}
          <div className="space-y-2">
            <Label className="font-medium">Sexo *</Label>
            <Select value={sex} onValueChange={setSex}>
              <SelectTrigger>
                <SelectValue placeholder="Selecciona…" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="female">Femenino</SelectItem>
                <SelectItem value="male">Masculino</SelectItem>
                <SelectItem value="other">Otro</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* NOTAS */}
          <div className="space-y-2">
            <Label className="font-medium">Notas</Label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full min-h-[120px] p-3 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
              placeholder="Añade información clínica relevante..."
            />
          </div>

          {/* ERROR */}
          {errorMsg && (
            <p className="text-red-600 text-sm font-medium text-center">
              {errorMsg}
            </p>
          )}

        </form>
      </Card>
    </div>
  );
}

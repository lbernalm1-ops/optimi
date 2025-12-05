"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useParams, useRouter } from "next/navigation";

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

// Solo números permitidos
const validateCode = (value: string) => /^[0-9]+$/.test(value);

export default function EditPatientPage() {
  const router = useRouter();
  const { id } = useParams();

  const [loading, setLoading] = useState(true);

  const [code, setCode] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [sex, setSex] = useState("");
  const [notes, setNotes] = useState("");

  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  /* =======================================================
     CARGAR PACIENTE
  ======================================================= */
  useEffect(() => {
    async function load() {
      setLoading(true);

      // Obtener usuario logueado
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      // Cargar datos del paciente
      const { data: p, error } = await supabase
        .from("patients")
        .select("*")
        .eq("id_patient", id)
        .eq("user_id", user.id)
        .single();

      if (error || !p) {
        setErrorMsg("No se ha encontrado el paciente.");
        setLoading(false);
        return;
      }

      setCode(p.code || "");
      setDateOfBirth(p.date_of_birth || "");
      setSex(p.sex || "");
      setNotes(p.notes || "");

      setLoading(false);
    }

    load();
  }, [id, router]);

  /* =======================================================
     GUARDAR PACIENTE
  ======================================================= */
  async function handleSave(e: any) {
    e.preventDefault();
    setErrorMsg("");

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setErrorMsg("Debes iniciar sesión.");
      return;
    }

    if (!validateCode(code)) {
      setErrorMsg("El código solo puede contener números.");
      return;
    }

    if (!dateOfBirth) {
      setErrorMsg("La fecha de nacimiento es obligatoria.");
      return;
    }

    if (!sex) {
      setErrorMsg("El sexo es obligatorio.");
      return;
    }

    setSaving(true);

    // Verificar si otro paciente del mismo médico tiene ese código
    const { data: existing } = await supabase
      .from("patients")
      .select("id_patient")
      .eq("code", code)
      .eq("user_id", user.id)
      .neq("id_patient", id) // Permitir que el mismo paciente mantenga su código
      .maybeSingle();

    if (existing) {
      setSaving(false);
      setErrorMsg("Ya tienes otro paciente con ese código.");
      return;
    }

    // Actualizar
    const { error } = await supabase
      .from("patients")
      .update({
        code,
        date_of_birth: dateOfBirth,
        sex,
        notes,
      })
      .eq("id_patient", id)
      .eq("user_id", user.id);

    setSaving(false);

    if (error) {
      setErrorMsg("Error actualizando el paciente.");
      return;
    }

    router.push(`/patients/${id}`);
  }

  if (loading) return <p className="p-6">Cargando…</p>;

  return (
    <div className="p-6 flex flex-col gap-6">
      {/* HEADER */}
      <div className="flex justify-between items-start border-b pb-4">
        <h1 className="text-2xl font-semibold">Editar paciente</h1>

        <Button
          className="w-32"
          form="edit-patient-form"
          type="submit"
          disabled={saving}
        >
          {saving ? "Guardando…" : "Guardar"}
        </Button>
      </div>

      {/* FORM */}
      <Card className="p-6">
        <form id="edit-patient-form" onSubmit={handleSave} className="space-y-6">

          {/* CÓDIGO DEL PACIENTE */}
          <div className="space-y-2">
            <Label className="font-medium">Código del paciente</Label>
            <Input
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="12345678"
              className="font-mono"
            />
            <p className="text-xs text-slate-500">
              Identificador numérico del paciente.
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
              placeholder="Información clínica adicional…"
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

"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function RegisterDoctorPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const [form, setForm] = useState({
    email: "",
    password: "",
    name: "",
    surname_1: "",
    surname_2: "",
    dni: "",
    cole: "",
    street: "",
    number: "",
    flat: "",
    letter: "",
    cp: "",
    telephone: "",
  });

  function updateField(key: string, value: any) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleRegister(e: any) {
    e.preventDefault();
    setErrorMsg("");
    setLoading(true);

    // -------- 1️⃣ Validaciones básicas --------
    if (!form.email || !form.password) {
      setErrorMsg("Email y contraseña son obligatorios.");
      setLoading(false);
      return;
    }

    if (!form.dni || !form.cole) {
      setErrorMsg("DNI y número de colegiado son obligatorios.");
      setLoading(false);
      return;
    }

    // -------- 2️⃣ Crear usuario en Auth --------
    const { data: signUpData, error: signUpError } =
      await supabase.auth.signUp({
        email: form.email,
        password: form.password,
      });

    if (signUpError) {
      setErrorMsg(signUpError.message);
      setLoading(false);
      return;
    }

    const userId = signUpData.user?.id;
    if (!userId) {
      setErrorMsg("Error creando usuario.");
      setLoading(false);
      return;
    }

    // -------- 3️⃣ Actualizar perfil creado por el trigger --------
    const { error: updateError } = await supabase
      .from("profiles")
      .update({
        name: form.name,
        surname_1: form.surname_1,
        surname_2: form.surname_2,
        dni: form.dni,
        cole: form.cole,
        street: form.street,
        number: form.number || null,
        flat: form.flat,
        letter: form.letter,
        cp: form.cp || null,
        telephone: form.telephone || null,
      })
      .eq("id", userId);

    if (updateError) {
      setErrorMsg("Error guardando datos del perfil: " + updateError.message);
      setLoading(false);
      return;
    }

    // -------- 4️⃣ Registro completado --------
    router.push("/auth/login");
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-100 p-6">
      <Card className="w-full max-w-lg p-6 shadow-md">
        <h1 className="text-xl font-semibold text-sky-800 mb-4">
          Registro de nuevo médico
        </h1>

        <form className="space-y-4" onSubmit={handleRegister}>
          {/* ---------------- CREDENCIALES ---------------- */}
          <div>
            <Label>Email</Label>
            <Input
              type="email"
              value={form.email}
              onChange={(e) => updateField("email", e.target.value)}
              required
            />
          </div>

          <div>
            <Label>Contraseña</Label>
            <Input
              type="password"
              value={form.password}
              onChange={(e) => updateField("password", e.target.value)}
              required
            />
          </div>

          <hr className="my-4" />

          {/* ---------------- DATOS PERSONALES ---------------- */}
          <div>
            <Label>Nombre</Label>
            <Input
              value={form.name}
              onChange={(e) => updateField("name", e.target.value)}
            />
          </div>

          <div>
            <Label>Primer apellido</Label>
            <Input
              value={form.surname_1}
              onChange={(e) => updateField("surname_1", e.target.value)}
            />
          </div>

          <div>
            <Label>Segundo apellido</Label>
            <Input
              value={form.surname_2}
              onChange={(e) => updateField("surname_2", e.target.value)}
            />
          </div>

          <div>
            <Label>DNI *</Label>
            <Input
              value={form.dni}
              onChange={(e) => updateField("dni", e.target.value)}
              required
            />
          </div>

          <div>
            <Label>Nº de Colegiado *</Label>
            <Input
              value={form.cole}
              onChange={(e) => updateField("cole", e.target.value)}
              required
            />
          </div>

          <hr className="my-4" />

          {/* ---------------- DIRECCIÓN ---------------- */}
          <div>
            <Label>Calle</Label>
            <Input
              value={form.street}
              onChange={(e) => updateField("street", e.target.value)}
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label>Número</Label>
              <Input
                value={form.number}
                onChange={(e) => updateField("number", e.target.value)}
              />
            </div>

            <div>
              <Label>Piso</Label>
              <Input
                value={form.flat}
                onChange={(e) => updateField("flat", e.target.value)}
              />
            </div>

            <div>
              <Label>Letra</Label>
              <Input
                value={form.letter}
                onChange={(e) => updateField("letter", e.target.value)}
              />
            </div>
          </div>

          <div>
            <Label>Código Postal</Label>
            <Input
              value={form.cp}
              onChange={(e) => updateField("cp", e.target.value)}
            />
          </div>

          <div>
            <Label>Teléfono</Label>
            <Input
              value={form.telephone}
              onChange={(e) => updateField("telephone", e.target.value)}
            />
          </div>

          {/* ---------------- ERROR ---------------- */}
          {errorMsg && (
            <p className="text-red-600 text-sm text-center">{errorMsg}</p>
          )}

          {/* ---------------- BOTÓN ---------------- */}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Registrando…" : "Registrarse"}
          </Button>
        </form>
      </Card>
    </div>
  );
}

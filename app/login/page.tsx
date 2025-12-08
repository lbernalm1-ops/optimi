"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg("");
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setErrorMsg("Email o contraseña incorrectos.");
      setLoading(false);
      return;
    }

    router.push("/patients");
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-100 p-6">
      <Card className="w-full max-w-md p-6 shadow-md border-slate-200">
        <CardHeader className="text-center mb-4">
          <CardTitle className="text-xl font-semibold text-sky-800">
            Acceso médicos
          </CardTitle>
          <p className="text-sm text-slate-500">
            Introduce tus credenciales para continuar
          </p>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">

            <div>
              <Label>Email</Label>
              <Input
                type="email"
                placeholder="medico@ejemplo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div>
              <Label>Contraseña</Label>
              <Input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            {errorMsg && (
              <p className="text-red-600 text-sm text-center">{errorMsg}</p>
            )}

            <Button
              type="submit"
              className="w-full mt-2"
              disabled={loading}
            >
              {loading ? "Accediendo…" : "Entrar"}
            </Button>
          </form>

          <p className="text-xs text-center text-slate-500 mt-4">
            ¿No tienes cuenta? Contacta con el administrador.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

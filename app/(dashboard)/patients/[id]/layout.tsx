"use client";

import Link from "next/link";
import { usePathname, useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { cn } from "@/lib/utils";
import { User, ArrowLeft } from "lucide-react";

/* ============================
   Calcular edad desde fecha
============================ */
function getAge(dateString: string) {
  if (!dateString) return "";
  const birth = new Date(dateString);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
}

export default function PatientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { id } = useParams();

  const [patient, setPatient] = useState<any>(null);

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from("patients")
        .select("*")
        .eq("id_patient", id)
        .single();

      setPatient(data);
    }

    load();
  }, [id]);

  const tabs = [
    { label: "Resumen", href: `/patients/${id}` },
    { label: "Visitas", href: `/patients/${id}/visits` },
    { label: "Parámetros clínicos", href: `/patients/${id}/clinical` },
    { label: "Medicación", href: `/patients/${id}/medications` },
  ];

  return (
    <div className="w-full flex justify-center min-h-screen">
      <div className="w-full max-w-4xl space-y-6 px-4 md:px-0 py-6">

        {/* ========================================================= */}
        {/* ENCABEZADO COMPLETO ESTILO PREMIUM CLÍNICO */}
        {/* ========================================================= */}
        <div className="bg-white shadow-sm hover:shadow-md transition border border-slate-200 rounded-xl overflow-hidden">

          {/* ---------- ENCABEZADO + BOTÓN VOLVER ---------- */}
          {patient && (
            <div className="flex items-center justify-between p-4 md:p-5">

              {/* IZQUIERDA: Datos paciente */}
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-xl bg-sky-600 text-white flex items-center justify-center shadow-sm">
                  <User className="h-6 w-6" />
                </div>

                <div className="flex flex-col">
                  <p className="text-lg font-semibold text-sky-900 tracking-wide">
                    Paciente {patient.patient_code}
                  </p>

                  <p className="text-sm text-slate-600 flex gap-2">
                    <span>{patient.sex === "female" ? "Femenino" : "Masculino"}</span>
                    <span>•</span>
                    <span>{getAge(patient.date_of_birth)} años</span>
                  </p>
                </div>
              </div>

              {/* DERECHA: Botón Volver */}
              <Link href="/patients">
                <button className="flex items-center gap-1 text-sm px-3 py-1.5 rounded-md border border-slate-300 bg-slate-50 hover:bg-slate-100 text-slate-700 font-medium shadow-sm transition">
                  <ArrowLeft className="h-4 w-4" />
                  Volver
                </button>
              </Link>
            </div>
          )}

          {/* ---------- TABS PREMIUM ---------- */}
          <div className="flex gap-2 border-t border-slate-200 px-4 py-2 bg-slate-50">
            {tabs.map((t) => {
              const active =
                pathname === t.href ||
                (t.href !== `/patients/${id}` && pathname.startsWith(t.href));

              return (
                <Link
                  key={t.href}
                  href={t.href}
                  className={cn(
                    "px-3 py-1.5 text-sm font-medium rounded-md transition-all border",
                    active
                      ? "bg-sky-100 text-sky-900 border-sky-300 shadow-sm"
                      : "text-slate-600 border-transparent hover:bg-slate-100"
                  )}
                >
                  {t.label}
                </Link>
              );
            })}
          </div>
        </div>

        {/* CONTENIDO */}
        <div className="bg-white shadow-sm hover:shadow-md transition rounded-xl p-5 border border-slate-200">
          {children}
        </div>

      </div>
    </div>
  );
}

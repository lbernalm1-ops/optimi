"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

import { Calendar, Edit, Eye, ChevronDown, ChevronRight } from "lucide-react";

/* ==========================================================
   FORMAT DATE
========================================================== */
function formatDate(dateStr?: string) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return d.toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

/* ==========================================================
   PAGE
========================================================== */

export default function PatientVisitsPage() {
  const { id } = useParams();
  const router = useRouter();

  const [visits, setVisits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Estado: qué años están abiertos
  const [openYears, setOpenYears] = useState<Record<number, boolean>>({});

  useEffect(() => {
    async function load() {
      const pid = Number(id);

      const { data: v } = await supabase
        .from("clinical_values")
        .select("id_value, date")
        .eq("patient_id", pid)
        .order("date", { ascending: false });

      setVisits(v || []);

      // Abrir por defecto el año actual
      if (v && v.length > 0) {
        const firstYear = new Date(v[0].date).getFullYear();
        setOpenYears({ [firstYear]: true });
      }

      setLoading(false);
    }

    load();
  }, [id]);

  if (loading) return <p className="p-6">Cargando…</p>;

  /* ==========================================================
     GROUP VISITS BY YEAR
  ========================================================== */

  const grouped = visits.reduce((acc: any, v: any) => {
    const year = new Date(v.date).getFullYear();
    if (!acc[year]) acc[year] = [];
    acc[year].push(v);
    return acc;
  }, {});

  const years = Object.keys(grouped)
    .map(Number)
    .sort((a, b) => b - a); // años descendentes

  /* ==========================================================
     UI
  ========================================================== */

  return (
    <div className="flex flex-col gap-6 px-4 md:px-6 py-4 bg-slate-50 min-h-screen">

      {/* HEADER */}
      <div className="flex justify-between items-center border-b pb-3">
        <h1 className="text-xl font-semibold text-sky-900 tracking-wide">
          Visitas del paciente
        </h1>

        <div className="flex gap-2">

          {/* VER TODAS */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push(`/patients/${id}/visits/all`)}
            className="flex items-center gap-2 border-sky-300 text-sky-900 hover:bg-sky-50"
          >
            <Eye className="h-4 w-4" />
            Ver todas
          </Button>

          {/* NUEVA VISITA */}
          <Button
            size="sm"
            className="bg-sky-600 hover:bg-sky-700 text-white flex items-center gap-2"
            onClick={() => router.push(`/patients/${id}/visits/new`)}
          >
            <Edit className="h-4 w-4" />
            Nueva visita
          </Button>
        </div>
      </div>

      {/* ==========================================================
         TIMELINE COLAPSABLE POR AÑO
      ========================================================== */}
      <PremiumCard title="Historial de visitas">
        {visits.length === 0 ? (
          <p className="text-slate-500">No hay visitas registradas.</p>
        ) : (
          <div className="relative pl-6">

            {/* Línea vertical del timeline */}
            <div className="absolute left-2 top-0 w-0.5 h-full bg-sky-300"></div>

            <div className="space-y-6">
              {years.map((year) => (
                <div key={year}>

                  {/* ======= CABECERA DE AÑO CON TOGGLE ======= */}
                  <button
                    onClick={() =>
                      setOpenYears((prev) => ({
                        ...prev,
                        [year]: !prev[year],
                      }))
                    }
                    className="flex items-center gap-2 ml-2 text-sky-900 font-bold text-lg cursor-pointer mb-1"
                  >
                    {openYears[year] ? (
                      <ChevronDown className="h-5 w-5" />
                    ) : (
                      <ChevronRight className="h-5 w-5" />
                    )}
                    {year}
                  </button>

                  {/* ======= VISITAS INTERNAS DEL AÑO ======= */}
                  {openYears[year] && (
                    <div className="space-y-6 mt-2">

                      {grouped[year].map((v: any) => (
                        <div key={v.id_value} className="relative">

                          {/* Punto del timeline */}
                          <div className="absolute -left-[7px] top-3 w-3 h-3 rounded-full bg-sky-500 border-2 border-white shadow"></div>

                          {/* Tarjeta de visita */}
                          <div className="p-4 rounded-xl border bg-white shadow-sm hover:shadow-md transition flex justify-between items-center">
                            <span className="font-medium text-sky-900 text-base">
                              {formatDate(v.date)}
                            </span>

                            <Button
                              variant="outline"
                              size="sm"
                              className="flex items-center gap-2 border-slate-300 hover:bg-slate-50"
                              onClick={() =>
                                router.push(`/patients/${id}/clinical/${v.id_value}`)
                              }
                            >
                              <Eye className="h-4 w-4" />
                              Ver / Editar
                            </Button>
                          </div>
                        </div>
                      ))}

                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </PremiumCard>

    </div>
  );
}

/* ==========================================================
   PREMIUM CARD
========================================================== */
function PremiumCard({ title, children }: any) {
  return (
    <Card className="shadow-sm hover:shadow-md transition rounded-xl border-slate-200 bg-white">
      <CardHeader className="flex flex-row items-center justify-between border-b border-slate-200 pb-2">
        <CardTitle className="text-lg font-semibold text-sky-900 tracking-wide flex items-center gap-2">
          {title}
        </CardTitle>
      </CardHeader>

      <CardContent className="py-4 space-y-3 text-base">
        {children}
      </CardContent>
    </Card>
  );
}

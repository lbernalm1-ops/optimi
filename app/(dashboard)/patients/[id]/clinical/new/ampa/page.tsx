"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
// import { supabase } from "@/lib/supabaseClient"; // aún no lo usamos aquí

import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";

/* ---------- Tipos ---------- */
type Aday = {
  dayNumber: number;
  morning1_sys: string;
  morning1_dia: string;
  morning2_sys: string;
  morning2_dia: string;
  night1_sys: string;
  night1_dia: string;
  night2_sys: string;
  night2_dia: string;
};

type DayAverages = {
  morning_sys: string;
  morning_dia: string;
  night_sys: string;
  night_dia: string;
  day_sys: string;
  day_dia: string;
};

type DayErrors = {
  morning1: boolean;
  morning2: boolean;
  night1: boolean;
  night2: boolean;
};

export default function AMPAPage() {
  const { id } = useParams();
  const router = useRouter();

  /* -------- Estado AMPA -------- */
  const [days, setDays] = useState<Aday[]>(
    Array.from({ length: 7 }, (_, i) => ({
      dayNumber: i + 1,
      morning1_sys: "",
      morning1_dia: "",
      morning2_sys: "",
      morning2_dia: "",
      night1_sys: "",
      night1_dia: "",
      night2_sys: "",
      night2_dia: "",
    }))
  );

  const [dailyAverages, setDailyAverages] = useState<DayAverages[]>(
    Array.from({ length: 7 }, () => ({
      morning_sys: "",
      morning_dia: "",
      night_sys: "",
      night_dia: "",
      day_sys: "",
      day_dia: "",
    }))
  );

  const [errors, setErrors] = useState<DayErrors[]>(
    Array.from({ length: 7 }, () => ({
      morning1: false,
      morning2: false,
      night1: false,
      night2: false,
    }))
  );

  const [ampaFinal, setAmpaFinal] = useState("");
  const [saving, setSaving] = useState(false);

  /* -------- Helpers de cálculo -------- */
  const toNum = (v: string) => (v === "" ? NaN : Number(v));

  // Media de una sección (mañana o noche) usando T1/T2 si existen
  const computeSection = (s1: string, d1: string, s2: string, d2: string) => {
    const n1s = toNum(s1);
    const n1d = toNum(d1);
    const n2s = toNum(s2);
    const n2d = toNum(d2);

    const t1Ok = !isNaN(n1s) && !isNaN(n1d);
    const t2Ok = !isNaN(n2s) && !isNaN(n2d);

    if (t1Ok && t2Ok) {
      return {
        sys: ((n1s + n2s) / 2).toFixed(0),
        dia: ((n1d + n2d) / 2).toFixed(0),
      };
    }

    if (t1Ok) {
      return { sys: n1s.toFixed(0), dia: n1d.toFixed(0) };
    }

    if (t2Ok) {
      return { sys: n2s.toFixed(0), dia: n2d.toFixed(0) };
    }

    return { sys: "", dia: "" };
  };

  const computeDay = (d: Aday): DayAverages => {
    const morning = computeSection(
      d.morning1_sys,
      d.morning1_dia,
      d.morning2_sys,
      d.morning2_dia
    );
    const night = computeSection(
      d.night1_sys,
      d.night1_dia,
      d.night2_sys,
      d.night2_dia
    );

    let day_sys = "";
    let day_dia = "";

    if (morning.sys && night.sys) {
      day_sys = (
        (Number(morning.sys) + Number(night.sys)) /
        2
      ).toFixed(0);
      day_dia = (
        (Number(morning.dia) + Number(night.dia)) /
        2
      ).toFixed(0);
    } else if (morning.sys) {
      day_sys = morning.sys;
      day_dia = morning.dia;
    } else if (night.sys) {
      day_sys = night.sys;
      day_dia = night.dia;
    }

    return {
      morning_sys: morning.sys,
      morning_dia: morning.dia,
      night_sys: night.sys,
      night_dia: night.dia,
      day_sys,
      day_dia,
    };
  };

  const validatePair = (
    dayIndex: number,
    pair: keyof DayErrors,
    sys: string,
    dia: string
  ) => {
    const err = (sys !== "" && dia === "") || (dia !== "" && sys === "");
    setErrors((prev) => {
      const c = [...prev];
      c[dayIndex][pair] = err;
      return c;
    });
  };

  // 🔧 corregido para TypeScript: K genérico y value tipado
  const updateValue = <K extends keyof Aday>(
    dayIndex: number,
    field: K,
    value: Aday[K]
  ) => {
    setDays((prev) => {
      const copy = [...prev];
      copy[dayIndex] = { ...copy[dayIndex], [field]: value };

      // Validar parejas según el campo
      if (field.startsWith("morning1")) {
        validatePair(
          dayIndex,
          "morning1",
          copy[dayIndex].morning1_sys,
          copy[dayIndex].morning1_dia
        );
      }

      if (field.startsWith("morning2")) {
        validatePair(
          dayIndex,
          "morning2",
          copy[dayIndex].morning2_sys,
          copy[dayIndex].morning2_dia
        );
      }

      if (field.startsWith("night1")) {
        validatePair(
          dayIndex,
          "night1",
          copy[dayIndex].night1_sys,
          copy[dayIndex].night1_dia
        );
      }

      if (field.startsWith("night2")) {
        validatePair(
          dayIndex,
          "night2",
          copy[dayIndex].night2_sys,
          copy[dayIndex].night2_dia
        );
      }

      // Recalcular medias de este día
      const avg = computeDay(copy[dayIndex]);
      setDailyAverages((prevAvg) => {
        const a = [...prevAvg];
        a[dayIndex] = avg;
        return a;
      });

      return copy;
    });
  };
// AMPA FINAL — Media de las medias diarias (días 2–7)
useEffect(() => {
  // dailyAverages[0] = día 1 → NO se usa
  const validDays = dailyAverages.slice(1); // días 2–7

  const sysValues: number[] = [];
  const diaValues: number[] = [];

  validDays.forEach((d) => {
    if (d.day_sys && d.day_dia) {
      const s = Number(d.day_sys);
      const di = Number(d.day_dia);
      if (!isNaN(s) && !isNaN(di)) {
        sysValues.push(s);
        diaValues.push(di);
      }
    }
  });

  if (sysValues.length === 0) {
    setAmpaFinal("");
    return;
  }

  const meanSys = (
    sysValues.reduce((a, b) => a + b, 0) / sysValues.length
  ).toFixed(0);

  const meanDia = (
    diaValues.reduce((a, b) => a + b, 0) / diaValues.length
  ).toFixed(0);

  setAmpaFinal(`${meanSys}/${meanDia}`);
}, [dailyAverages]);
 
  const hasAnyError = errors.some(
    (e) => e.morning1 || e.morning2 || e.night1 || e.night2
  );

  /* -------- Guardar -------- */
  const handleSave = () => {
    if (!ampaFinal || hasAnyError) return;
    const [sys, dia] = ampaFinal.split("/");
    router.push(`/patients/${id}/clinical/new?ampa_sys=${sys}&ampa_dia=${dia}`);
  };

  /* =======================================================
     🟦 UI — MISMO DISEÑO, MÁS COMPACTO
     ======================================================= */
  return (
    <div className="p-6 flex flex-col gap-6">
      <div className="flex justify-between items-start border-b pb-4">
        <div>
          <h1 className="text-xl font-semibold">AMPA — Automedida domiciliaria</h1>
          <p className="text-sm text-slate-500">
            Día 1 es de adaptación (no entra en el cálculo final).
          </p>
        </div>
        <Button variant="outline" onClick={() => router.back()}>
          Volver
        </Button>
      </div>

      {/* Bloques día por día */}
      {days.map((day, i) => (
        <Card key={day.dayNumber} className="p-4 shadow-sm space-y-4">
          {/* Header del día */}
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold">
              Día {day.dayNumber}{" "}
              {day.dayNumber === 1 && (
                <span className="text-slate-400 text-sm">(adaptación)</span>
              )}
            </h2>

            <p className="text-2xl font-bold text-sky-700">
              {dailyAverages[i].day_sys && dailyAverages[i].day_dia
                ? `${dailyAverages[i].day_sys}/${dailyAverages[i].day_dia}`
                : "—"}
            </p>
          </div>

          <Separator />

          {/* Columnas lado a lado */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* MAÑANA */}
            <div className="bg-sky-50 p-4 rounded-lg space-y-3">
              <h3 className="text-md font-semibold text-sky-700">Mañana</h3>

              <div className="grid grid-cols-2 gap-4">
                {/* T1 */}
                <div>
                  <div className="font-bold text-sky-700 text-sm mb-1">T1</div>
                  <div className="flex items-center gap-1">
                    <Input
                      className={`h-8 text-center ${
                        errors[i].morning1 ? "border-red-500" : ""
                      }`}
                      value={day.morning1_sys}
                      placeholder="SYS"
                      onChange={(e) =>
                        updateValue(i, "morning1_sys", e.target.value)
                      }
                    />
                    <span className="font-bold">/</span>
                    <Input
                      className={`h-8 text-center ${
                        errors[i].morning1 ? "border-red-500" : ""
                      }`}
                      value={day.morning1_dia}
                      placeholder="DIA"
                      onChange={(e) =>
                        updateValue(i, "morning1_dia", e.target.value)
                      }
                    />
                  </div>
                </div>

                {/* T2 */}
                <div>
                  <div className="font-bold text-sky-700 text-sm mb-1">T2</div>
                  <div className="flex items-center gap-1">
                    <Input
                      className={`h-8 text-center ${
                        errors[i].morning2 ? "border-red-500" : ""
                      }`}
                      value={day.morning2_sys}
                      placeholder="SYS"
                      onChange={(e) =>
                        updateValue(i, "morning2_sys", e.target.value)
                      }
                    />
                    <span className="font-bold">/</span>
                    <Input
                      className={`h-8 text-center ${
                        errors[i].morning2 ? "border-red-500" : ""
                      }`}
                      value={day.morning2_dia}
                      placeholder="DIA"
                      onChange={(e) =>
                        updateValue(i, "morning2_dia", e.target.value)
                      }
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* TARDE / NOCHE */}
            <div className="bg-sky-100 p-4 rounded-lg space-y-3">
              <h3 className="text-md font-semibold text-sky-900">Tarde / Noche</h3>

              <div className="grid grid-cols-2 gap-4">
                {/* T1 */}
                <div>
                  <div className="font-bold text-sky-900 text-sm mb-1">T1</div>
                  <div className="flex items-center gap-1">
                    <Input
                      className={`h-8 text-center ${
                        errors[i].night1 ? "border-red-500" : ""
                      }`}
                      value={day.night1_sys}
                      placeholder="SYS"
                      onChange={(e) =>
                        updateValue(i, "night1_sys", e.target.value)
                      }
                    />
                    <span className="font-bold">/</span>
                    <Input
                      className={`h-8 text-center ${
                        errors[i].night1 ? "border-red-500" : ""
                      }`}
                      value={day.night1_dia}
                      placeholder="DIA"
                      onChange={(e) =>
                        updateValue(i, "night1_dia", e.target.value)
                      }
                    />
                  </div>
                </div>

                {/* T2 */}
                <div>
                  <div className="font-bold text-sky-900 text-sm mb-1">T2</div>
                  <div className="flex items-center gap-1">
                    <Input
                      className={`h-8 text-center ${
                        errors[i].night2 ? "border-red-500" : ""
                      }`}
                      value={day.night2_sys}
                      placeholder="SYS"
                      onChange={(e) =>
                        updateValue(i, "night2_sys", e.target.value)
                      }
                    />
                    <span className="font-bold">/</span>
                    <Input
                      className={`h-8 text-center ${
                        errors[i].night2 ? "border-red-500" : ""
                      }`}
                      value={day.night2_dia}
                      placeholder="DIA"
                      onChange={(e) =>
                        updateValue(i, "night2_dia", e.target.value)
                      }
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Card>
      ))}

      <Separator />

      {/* AMPA Final */}
      <div className="flex flex-col items-center gap-2">
        <p className="text-xl font-bold">
          AMPA final (días 2–7):{" "}
          {ampaFinal ? (
            <span className="text-sky-600">{ampaFinal} mmHg</span>
          ) : (
            "—"
          )}
        </p>

        {hasAnyError && (
          <p className="text-red-600 text-sm">
            Hay tomas incompletas. Revisa las que tienen borde rojo.
          </p>
        )}
      </div>

      {/* Botones */}
      <div className="flex justify-end gap-4 mt-4">
        <Button variant="outline" onClick={() => router.back()}>
          Cancelar
        </Button>
        <Button
          className="w-40"
          disabled={!ampaFinal || hasAnyError || saving}
          onClick={handleSave}
        >
          {saving ? "Guardando…" : "Guardar AMPA"}
        </Button>
      </div>
    </div>
  );
}

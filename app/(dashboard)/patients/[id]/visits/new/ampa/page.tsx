"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";

import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";

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
  const [saving] = useState(false);

  const toNum = (v: string) => (v === "" ? NaN : Number(v));

  const computeSection = (s1: string, d1: string, s2: string, d2: string) => {
    const n1s = toNum(s1);
    const n1d = toNum(d1);
    const n2s = toNum(s2);
    const n2d = toNum(d2);

    const t1Ok = !isNaN(n1s) && !isNaN(n1d);
    const t2Ok = !isNaN(n2s) && !isNaN(n2d);

    if (t1Ok && t2Ok)
      return {
        sys: ((n1s + n2s) / 2).toFixed(0),
        dia: ((n1d + n2d) / 2).toFixed(0),
      };

    if (t1Ok) return { sys: n1s.toFixed(0), dia: n1d.toFixed(0) };
    if (t2Ok) return { sys: n2s.toFixed(0), dia: n2d.toFixed(0) };

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
      day_sys = ((+morning.sys + +night.sys) / 2).toFixed(0);
      day_dia = ((+morning.dia + +night.dia) / 2).toFixed(0);
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
    i: number,
    pair: keyof DayErrors,
    sys: string,
    dia: string
  ) => {
    const err = (sys !== "" && dia === "") || (dia !== "" && sys === "");
    setErrors((prev) => {
      const c = [...prev];
      c[i][pair] = err;
      return c;
    });
  };

  const updateValue = <K extends keyof Aday>(
    i: number,
    field: K,
    value: Aday[K]
  ) => {
    setDays((prev) => {
      const copy = [...prev];
      copy[i] = { ...copy[i], [field]: value };

      if (field.startsWith("morning1"))
        validatePair(i, "morning1", copy[i].morning1_sys, copy[i].morning1_dia);
      if (field.startsWith("morning2"))
        validatePair(i, "morning2", copy[i].morning2_sys, copy[i].morning2_dia);
      if (field.startsWith("night1"))
        validatePair(i, "night1", copy[i].night1_sys, copy[i].night1_dia);
      if (field.startsWith("night2"))
        validatePair(i, "night2", copy[i].night2_sys, copy[i].night2_dia);

      const avg = computeDay(copy[i]);
      setDailyAverages((prevAvg) => {
        const arr = [...prevAvg];
        arr[i] = avg;
        return arr;
      });

      return copy;
    });
  };

  useEffect(() => {
    const validDays = dailyAverages.slice(1);

    const sysVals: number[] = [];
    const diaVals: number[] = [];

    validDays.forEach((d) => {
      if (d.day_sys && d.day_dia) {
        sysVals.push(+d.day_sys);
        diaVals.push(+d.day_dia);
      }
    });

    if (sysVals.length === 0) {
      setAmpaFinal("");
      return;
    }

    const meanSys = (
      sysVals.reduce((a, b) => a + b, 0) / sysVals.length
    ).toFixed(0);

    const meanDia = (
      diaVals.reduce((a, b) => a + b, 0) / diaVals.length
    ).toFixed(0);

    setAmpaFinal(`${meanSys}/${meanDia}`);
  }, [dailyAverages]);

  const hasAnyError = errors.some(
    (e) => e.morning1 || e.morning2 || e.night1 || e.night2
  );

  const handleSave = () => {
    if (!ampaFinal || hasAnyError) return;

    const [sys, dia] = ampaFinal.split("/");

    router.push(
      `/patients/${id}/visits/new?ampa_sys=${sys}&ampa_dia=${dia}`
    );
  };

  return (
    <div className="p-6 flex flex-col gap-6">
      <div className="flex justify-between items-center border-b pb-4">
        <Button
          className="w-32"
          disabled={!ampaFinal || hasAnyError}
          onClick={handleSave}
        >
          Guardar
        </Button>

        <Button variant="outline" onClick={() => router.back()}>
          Volver
        </Button>

        <div>
          <h1 className="text-xl font-semibold">AMPA — Automedida domiciliaria</h1>
          <p className="text-sm text-slate-500">
            Día 1 es de adaptación (no entra en el cálculo final).
          </p>
        </div>
      </div>

      {days.map((day, i) => (
        <Card key={day.dayNumber} className="p-4 shadow-sm space-y-2">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold">
              Día {day.dayNumber}{" "}
              {i === 0 && (
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Mañana */}
            <div className="bg-sky-50 p-4 rounded-lg space-y-3">
              <h3 className="text-md font-semibold text-sky-700">Mañana</h3>

              {/* T1 */}
              <div>
                <div className="font-bold text-sky-700 mb-1">T1</div>
                <div className="flex gap-1">
                  <Input
                    className={`h-8 text-center ${
                      errors[i].morning1 ? "border-red-500" : ""
                    }`}
                    placeholder="SYS"
                    value={day.morning1_sys}
                    onChange={(e) => updateValue(i, "morning1_sys", e.target.value)}
                  />
                  <span>/</span>
                  <Input
                    className={`h-8 text-center ${
                      errors[i].morning1 ? "border-red-500" : ""
                    }`}
                    placeholder="DIA"
                    value={day.morning1_dia}
                    onChange={(e) => updateValue(i, "morning1_dia", e.target.value)}
                  />
                </div>
              </div>

              {/* T2 */}
              <div>
                <div className="font-bold text-sky-700 mb-1">T2</div>
                <div className="flex gap-1">
                  <Input
                    className={`h-8 text-center ${
                      errors[i].morning2 ? "border-red-500" : ""
                    }`}
                    placeholder="SYS"
                    value={day.morning2_sys}
                    onChange={(e) => updateValue(i, "morning2_sys", e.target.value)}
                  />
                  <span>/</span>
                  <Input
                    className={`h-8 text-center ${
                      errors[i].morning2 ? "border-red-500" : ""
                    }`}
                    placeholder="DIA"
                    value={day.morning2_dia}
                    onChange={(e) => updateValue(i, "morning2_dia", e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Noche */}
            <div className="bg-sky-100 p-4 rounded-lg space-y-3">
              <h3 className="text-md font-semibold text-sky-900">Tarde / Noche</h3>

              {/* T1 */}
              <div>
                <div className="font-bold text-sky-900 mb-1">T1</div>
                <div className="flex gap-1">
                  <Input
                    className={`h-8 text-center ${
                      errors[i].night1 ? "border-red-500" : ""
                    }`}
                    placeholder="SYS"
                    value={day.night1_sys}
                    onChange={(e) => updateValue(i, "night1_sys", e.target.value)}
                  />
                  <span>/</span>
                  <Input
                    className={`h-8 text-center ${
                      errors[i].night1 ? "border-red-500" : ""
                    }`}
                    placeholder="DIA"
                    value={day.night1_dia}
                    onChange={(e) => updateValue(i, "night1_dia", e.target.value)}
                  />
                </div>
              </div>

              {/* T2 */}
              <div>
                <div className="font-bold text-sky-900 mb-1">T2</div>
                <div className="flex gap-1">
                  <Input
                    className={`h-8 text-center ${
                      errors[i].night2 ? "border-red-500" : ""
                    }`}
                    placeholder="SYS"
                    value={day.night2_sys}
                    onChange={(e) => updateValue(i, "night2_sys", e.target.value)}
                  />
                  <span>/</span>
                  <Input
                    className={`h-8 text-center ${
                      errors[i].night2 ? "border-red-500" : ""
                    }`}
                    placeholder="DIA"
                    value={day.night2_dia}
                    onChange={(e) => updateValue(i, "night2_dia", e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>
        </Card>
      ))}

      <Separator />

      <div className="text-center text-xl">
        AMPA final (días 2–7):{" "}
        {ampaFinal ? (
          <span className="font-bold text-sky-600">{ampaFinal} mmHg</span>
        ) : (
          "—"
        )}
      </div>

      {hasAnyError && (
        <p className="text-red-600 text-sm text-center">
          Hay tomas incompletas. Revisa las que tienen borde rojo.
        </p>
      )}

      <div className="flex justify-end gap-4">
        <Button variant="outline" onClick={() => router.back()}>
          Cancelar
        </Button>

        <Button
          className="w-40"
          disabled={!ampaFinal || hasAnyError}
          onClick={handleSave}
        >
          Guardar AMPA
        </Button>
      </div>
    </div>
  );
}

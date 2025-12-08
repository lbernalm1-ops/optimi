"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

type OfficeBP = {
  s1: string;
  d1: string;
  s2: string;
  d2: string;
  s3: string;
  d3: string;
};

type Errors = {
  t1: boolean;
  t2: boolean;
  t3: boolean;
};

export default function OfficeBPPage() {
  const { id } = useParams();
  const router = useRouter();

  const [bp, setBp] = useState<OfficeBP>({
    s1: "",
    d1: "",
    s2: "",
    d2: "",
    s3: "",
    d3: "",
  });

  const [errors, setErrors] = useState<Errors>({
    t1: false,
    t2: false,
    t3: false,
  });

  const [showT3, setShowT3] = useState(false);
  const [finalBP, setFinalBP] = useState("");

  const validatePair = (pair: keyof Errors, sys: string, dia: string) => {
    const err = (sys !== "" && dia === "") || (dia !== "" && sys === "");
    setErrors((prev) => ({ ...prev, [pair]: err }));
  };

  const updateField = (field: keyof OfficeBP, value: string) => {
    setBp((prev) => {
      const next = { ...prev, [field]: value };

      if (field === "s1" || field === "d1")
        validatePair("t1", next.s1, next.d1);

      if (field === "s2" || field === "d2")
        validatePair("t2", next.s2, next.d2);

      if (field === "s3" || field === "d3")
        validatePair("t3", next.s3, next.d3);

      return next;
    });
  };

  const isComplete = (s: string, d: string) => s !== "" && d !== "";

  /* ----------- DETERMINAR SI SE NECESITA T3 ----------- */
  useEffect(() => {
    const t1 = isComplete(bp.s1, bp.d1);
    const t2 = isComplete(bp.s2, bp.d2);

    if (!t1 || !t2) {
      setShowT3(false);
      return;
    }

    const diffSys = Math.abs(Number(bp.s1) - Number(bp.s2));
    const diffDia = Math.abs(Number(bp.d1) - Number(bp.d2));

    setShowT3(diffSys > 10);
  }, [bp.s1, bp.d1, bp.s2, bp.d2]);

  /* ----------- CÁLCULO DE LA MEDIA ----------- */
  useEffect(() => {
    const t1 = isComplete(bp.s1, bp.d1);
    const t2 = isComplete(bp.s2, bp.d2);
    const t3 = isComplete(bp.s3, bp.d3);

    let sVals: number[] = [];
    let dVals: number[] = [];

    // Si aparece T3, es obligatoria y solo valen T2 y T3
    if (showT3) {
      if (!t3) {
        setFinalBP("");
        return;
      }
      sVals = [Number(bp.s2), Number(bp.s3)];
      dVals = [Number(bp.d2), Number(bp.d3)];
    }
    // Si hay T1 + T2 válidas
    else if (t1 && t2) {
      sVals = [Number(bp.s1), Number(bp.s2)];
      dVals = [Number(bp.d1), Number(bp.d2)];
    }
    // Si solo hay T1 válida
    else if (t1) {
      sVals = [Number(bp.s1)];
      dVals = [Number(bp.d1)];
    } else {
      setFinalBP("");
      return;
    }

    const meanSys = (
      sVals.reduce((a, b) => a + b, 0) / sVals.length
    ).toFixed(0);

    const meanDia = (
      dVals.reduce((a, b) => a + b, 0) / dVals.length
    ).toFixed(0);

    setFinalBP(`${meanSys}/${meanDia}`);
  }, [bp, showT3]);

  const hasAnyError = errors.t1 || errors.t2 || errors.t3;

  function handleSave() {
    if (!finalBP || hasAnyError) return;
    const [sys, dia] = finalBP.split("/");
    router.push(
      `/patients/${id}/clinical/new?office_sys=${sys}&office_dia=${dia}`
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* HEADER */}
      <div className="flex justify-between items-start pb-3 border-b">
        <div>
          <h1 className="text-xl font-semibold">TA en consulta</h1>
          <p className="text-sm text-slate-500">
            Si T1 y T2 difieren &gt;10 mmHg aparece automáticamente T3.
          </p>
        </div>
        <Button variant="outline" onClick={() => router.back()}>
          Volver
        </Button>
      </div>

      <Card className="p-4 space-y-6 shadow-sm">

        {/* TOMA 1 */}
        <div className="space-y-2">
          <Label className="text-sky-700 font-semibold">Toma 1</Label>
          <div className="flex items-center gap-3">
            <Input
              className={`w-20 h-9 text-center ${
                errors.t1 ? "border-red-500" : ""
              }`}
              placeholder="SYS"
              value={bp.s1}
              onChange={(e) => updateField("s1", e.target.value)}
            />
            <span>/</span>
            <Input
              className={`w-20 h-9 text-center ${
                errors.t1 ? "border-red-500" : ""
              }`}
              placeholder="DIA"
              value={bp.d1}
              onChange={(e) => updateField("d1", e.target.value)}
            />
          </div>
        </div>

        {/* TOMA 2 */}
        <div className="space-y-2">
          <Label className="text-sky-800 font-semibold">Toma 2</Label>
          <div className="flex items-center gap-3">
            <Input
              className={`w-20 h-9 text-center ${
                errors.t2 ? "border-red-500" : ""
              }`}
              placeholder="SYS"
              value={bp.s2}
              onChange={(e) => updateField("s2", e.target.value)}
            />
            <span>/</span>
            <Input
              className={`w-20 h-9 text-center ${
                errors.t2 ? "border-red-500" : ""
              }`}
              placeholder="DIA"
              value={bp.d2}
              onChange={(e) => updateField("d2", e.target.value)}
            />
          </div>
        </div>

        {/* TOMA 3 */}
        {showT3 && (
          <div className="space-y-2">
            <Label className="text-slate-700 font-semibold">
              Toma 3 (necesaria)
            </Label>
            <div className="flex items-center gap-3">
              <Input
                className={`w-20 h-9 text-center ${
                  errors.t3 ? "border-red-500" : ""
                }`}
                placeholder="SYS"
                value={bp.s3}
                onChange={(e) => updateField("s3", e.target.value)}
              />
              <span>/</span>
              <Input
                className={`w-20 h-9 text-center ${
                  errors.t3 ? "border-red-500" : ""
                }`}
                placeholder="DIA"
                value={bp.d3}
                onChange={(e) => updateField("d3", e.target.value)}
              />
            </div>
          </div>
        )}
      </Card>

      {/* RESULTADO */}
      <div className="text-center text-lg font-bold">
        Resultado:{" "}
        {finalBP ? (
          <span className="text-sky-600">{finalBP} mmHg</span>
        ) : (
          <span className="text-slate-400">—</span>
        )}
      </div>

      {/* BOTONES */}
      <div className="flex justify-end gap-3">
        <Button variant="outline" onClick={() => router.back()}>
          Cancelar
        </Button>
        <Button
          className="w-40"
          disabled={!finalBP || hasAnyError}
          onClick={handleSave}
        >
          Guardar TA
        </Button>
      </div>
    </div>
  );
}

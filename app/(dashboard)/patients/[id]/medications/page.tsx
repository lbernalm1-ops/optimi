"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { DRUG_GROUPS } from "@/data/drugGroups";

/* ============================================================
   TYPES LOCALES
============================================================ */

interface PatientMedication {
  id_medication: number;
  patient_id: number;
  drug_name: string;
  posology: string | null;
  indication?: string | null;
  active: boolean;
  start_date?: string | null;
  end_date?: string | null;

  // Opcionales por si ya los tienes en BBDD:
  dose?: string | null;
  frequency?: string | null;
  daily_dose_total?: string | null;
  outside_vademecum?: boolean | null;
}

interface FlatForm {
  groupKey: string;
  groupLabel: string;
  drugKey: string;
  drugLabel: string;
  name: string;             // nombre comercial (name)
  registro: string;
  route: string;
  strength?: string;
  form?: string;
  actives: string[];
}

/* ============================================================
   ÍNDICES A PARTIR DE DRUG_GROUPS
============================================================ */

type RawDrugGroups = typeof DRUG_GROUPS;

const FLAT_FORMS: FlatForm[] = [];
const FORM_BY_NAME: Record<string, FlatForm> = {};
const ACTIVE_TO_GROUP: Record<string, string> = {};

// Construimos índices 1 sola vez
(function buildIndexes(groups: RawDrugGroups) {
  for (const [groupKey, group] of Object.entries(groups)) {
    const groupLabel = group.label;

    for (const [drugKey, drug] of Object.entries(group.drugs)) {
      const drugLabel = drug.label;

      for (const form of drug.forms) {
        const flat: FlatForm = {
          groupKey,
          groupLabel,
          drugKey,
          drugLabel,
          name: form.name,
          registro: form.registro,
          route: form.route,
          strength: form.strength,
          form: form.form,
          actives: [...form.actives],
        };

        FLAT_FORMS.push(flat);
        FORM_BY_NAME[flat.name.toLowerCase()] = flat;

        // Mapear principio activo → grupo farmacológico (solo si no estaba ya)
        for (const active of form.actives) {
          if (!ACTIVE_TO_GROUP[active]) {
            ACTIVE_TO_GROUP[active] = groupLabel;
          }
        }
      }
    }
  }
})(DRUG_GROUPS);

/* ============================================================
   HELPERS DOSIS / FORMATO
============================================================ */

function unitsPerDayFromPosology(posology?: string | null): number | null {
  if (!posology) return null;
  const clean = posology.replace(/\s/g, "");
  const parts = clean.split("-");
  if (!parts.every((p) => /^\d+$/.test(p))) return null;
  const total = parts.map((p) => parseInt(p, 10)).reduce((a, b) => a + b, 0);
  return total || null;
}

function parseMgStrength(strength?: string): number[] {
  if (!strength) return [];
  const matches = Array.from(strength.matchAll(/([\d]+(?:[.,]\d+)?)\s*mg/gi));
  return matches.map((m) => parseFloat(m[1].replace(",", ".")));
}

function formatDailyDoseLabel(form: FlatForm, posology?: string | null): string {
  const unitsPerDay = unitsPerDayFromPosology(posology);
  const strengths = parseMgStrength(form.strength);

  if (!unitsPerDay || strengths.length === 0) return "—";

  // Si hay tantos mg como principios activos, emparejamos 1:1
  const len = Math.min(form.actives.length, strengths.length);

  const parts: string[] = [];
  for (let i = 0; i < len; i++) {
    const active = form.actives[i];
    const mgPerDose = strengths[i];
    const totalMg = mgPerDose * unitsPerDay;
    const value = Number.isInteger(totalMg)
      ? totalMg.toFixed(0)
      : totalMg.toFixed(1);

    parts.push(`${active}: ${value} mg/día`);
  }

  return parts.length > 0 ? parts.join(" + ") : "—";
}

function formatGroupsForActives(actives: string[]): string {
  if (!actives.length) return "—";
  const groups = actives.map((a) => ACTIVE_TO_GROUP[a] || "Grupo no definido");
  // Eliminar duplicados
  const unique = Array.from(new Set(groups));
  return unique.join(" + ");
}

/* ============================================================
   PAGE
============================================================ */

export default function PatientMedicationsPage() {
  const { id } = useParams();
  const router = useRouter();

  const [meds, setMeds] = useState<PatientMedication[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Buscador / alta rápida
  const [search, setSearch] = useState("");
  const [selectedForm, setSelectedForm] = useState<FlatForm | null>(null);
  const [posology, setPosology] = useState("");
  const [indication, setIndication] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);

  /* ------------------------------------------------------------
     CARGAR MEDICACIÓN DEL PACIENTE
  ------------------------------------------------------------ */

  useEffect(() => {
    async function load() {
      const { data, error } = await supabase
        .from("patient_medications")
        .select("*")
        .eq("patient_id", Number(id))
        .eq("active", true)
        .order("start_date", { ascending: false });

      if (error) {
        console.error("Error cargando medicación:", error);
      }

      setMeds((data as PatientMedication[]) || []);
      setLoading(false);
    }

    load();
  }, [id]);

  /* ------------------------------------------------------------
     SUGERENCIAS DEL BUSCADOR
  ------------------------------------------------------------ */

  const filteredForms =
    search.trim().length === 0
      ? []
      : FLAT_FORMS.filter((f) => {
          const q = search.toLowerCase();
          return (
            f.name.toLowerCase().includes(q) ||
            f.drugLabel.toLowerCase().includes(q)
          );
        }).slice(0, 10);

  /* ------------------------------------------------------------
     AÑADIR MEDICACIÓN
  ------------------------------------------------------------ */

  async function handleAddMedication() {
    setErrorMsg("");

    // Si no hay forma seleccionada del vademécum
    if (!selectedForm) {
      // ¿Permitir fuera de vademécum?
      const proceed = window.confirm(
        "Esta medicación no coincide con tu vademécum. ¿Quieres añadirla igualmente?"
      );
      if (!proceed) return;

      setSaving(true);

      const payload: any = {
        patient_id: Number(id),
        drug_name: search.trim(),
        posology: posology || null,
        indication: indication || null,
        active: true,
        start_date: new Date().toISOString().split("T")[0],
        outside_vademecum: true,
      };

      const { error } = await supabase
        .from("patient_medications")
        .insert(payload);

      if (error) {
        console.error("Error añadiendo medicación:", error);
        setErrorMsg("Error añadiendo medicación.");
        setSaving(false);
        return;
      }

      // Refrescar listado
      const { data } = await supabase
        .from("patient_medications")
        .select("*")
        .eq("patient_id", Number(id))
        .eq("active", true)
        .order("start_date", { ascending: false });

      setMeds((data as PatientMedication[]) || []);
      setSaving(false);
      setSearch("");
      setPosology("");
      setIndication("");
      setSelectedForm(null);
      return;
    }

    // Medicación dentro del vademécum
    setSaving(true);

    const payload: any = {
      patient_id: Number(id),
      drug_name: selectedForm.name,
      posology: posology || null,
      indication: indication || null,
      active: true,
      start_date: new Date().toISOString().split("T")[0],
      outside_vademecum: false,
      // Campos opcionales, por si los añades en BBDD:
      // group_key: selectedForm.groupKey,
      // group_label: selectedForm.groupLabel,
      // actives: selectedForm.actives.join(", "),
    };

    const { error } = await supabase
      .from("patient_medications")
      .insert(payload);

    if (error) {
      console.error("Error añadiendo medicación:", error);
      setErrorMsg("Error añadiendo medicación.");
      setSaving(false);
      return;
    }

    const { data } = await supabase
      .from("patient_medications")
      .select("*")
      .eq("patient_id", Number(id))
      .eq("active", true)
      .order("start_date", { ascending: false });

    setMeds((data as PatientMedication[]) || []);
    setSaving(false);
    setSearch("");
    setPosology("");
    setIndication("");
    setSelectedForm(null);
  }

  /* ------------------------------------------------------------
     SUSPENDER MEDICACIÓN
  ------------------------------------------------------------ */

  async function handleSuspend(m: PatientMedication) {
    const ok = window.confirm(
      `¿Suspender ${m.drug_name}? Se marcará como no activa desde hoy.`
    );
    if (!ok) return;

    const today = new Date().toISOString().split("T")[0];

    const { error } = await supabase
      .from("patient_medications")
      .update({
        active: false,
        end_date: today,
      })
      .eq("id_medication", m.id_medication);

    if (error) {
      console.error("Error al suspender:", error);
      alert("No se ha podido suspender la medicación.");
      return;
    }

    setMeds((prev) => prev.filter((x) => x.id_medication !== m.id_medication));
  }

  /* ------------------------------------------------------------
     RENDER
  ------------------------------------------------------------ */

  if (loading) return <p className="p-6">Cargando…</p>;

  return (
    <div className="flex flex-col gap-6 px-4 md:px-6 py-4 bg-slate-50 min-h-screen">
      {/* HEADER */}
      <div className="flex items-center justify-between border-b pb-3">
        <h1 className="text-xl font-semibold text-sky-900 tracking-wide">
          Medicación del paciente
        </h1>
      </div>

      {/* ===========================================
          ALTA RÁPIDA DESDE VADEMÉCUM
      ============================================ */}
      <Card className="shadow-sm border-slate-200">
        <CardHeader className="border-b border-slate-200 pb-2">
          <CardTitle className="text-lg font-semibold text-sky-900">
            Añadir medicación
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4 space-y-4 text-sm">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Buscador vademécum */}
            <div className="relative">
              <Label className="text-xs text-slate-600 mb-1 block">
                Buscar en vademécum (nombre comercial o fármaco)
              </Label>
              <Input
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setSelectedForm(null);
                  setShowSuggestions(true);
                }}
                onFocus={() => setShowSuggestions(true)}
                placeholder="Ej. Metformina 850, Xigduo..."
                className="text-sm"
              />

              {showSuggestions && filteredForms.length > 0 && (
                <div className="absolute z-20 mt-1 w-full max-h-60 overflow-auto rounded-md border border-slate-200 bg-white shadow-md text-xs">
                  {filteredForms.map((f) => (
                    <button
                      type="button"
                      key={`${f.groupKey}-${f.drugKey}-${f.registro}`}
                      className="w-full text-left px-2 py-1.5 hover:bg-sky-50"
                      onClick={() => {
                        setSelectedForm(f);
                        setSearch(f.name);
                        setShowSuggestions(false);
                      }}
                    >
                      <div className="font-semibold text-slate-800">
                        {f.name}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        {f.drugLabel} · {f.actives.join(" + ")} ·{" "}
                        {f.groupLabel}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Posología */}
            <div>
              <Label className="text-xs text-slate-600 mb-1 block">
                Posología
              </Label>
              <Input
                value={posology}
                onChange={(e) => setPosology(e.target.value)}
                placeholder="Ej. 1-0-1"
                className="text-sm"
              />
            </div>

            {/* Indicación (opcional) */}
            <div>
              <Label className="text-xs text-slate-600 mb-1 block">
                Indicación (opcional)
              </Label>
              <Input
                value={indication}
                onChange={(e) => setIndication(e.target.value)}
                placeholder="Ej. DM2, IC, etc."
                className="text-sm"
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <Button
              onClick={handleAddMedication}
              disabled={saving}
              className="px-6"
            >
              {saving ? "Añadiendo…" : "Añadir medicación"}
            </Button>
          </div>

          {errorMsg && (
            <p className="text-xs text-red-600 text-right">{errorMsg}</p>
          )}
        </CardContent>
      </Card>

      {/* ===========================================
          LISTADO EN TABLA
      ============================================ */}
      <Card className="shadow-sm border-slate-200">
        <CardHeader className="border-b border-slate-200 pb-2">
          <CardTitle className="text-lg font-semibold text-sky-900">
            Medicación activa
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4 text-sm">
          {meds.length === 0 ? (
            <p className="text-slate-500 text-sm">
              No hay medicación activa registrada.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full border border-slate-200 rounded-md text-sm">
                <thead className="bg-slate-100">
                  <tr className="text-xs text-slate-600">
                    <th className="px-3 py-2 text-left font-semibold">
                      Nombre comercial
                    </th>
                    <th className="px-3 py-2 text-left font-semibold">
                      Principio(s) activo(s)
                    </th>
                    <th className="px-3 py-2 text-left font-semibold">
                      Grupo(s) farmacológico(s)
                    </th>
                    <th className="px-3 py-2 text-left font-semibold">
                      Posología
                    </th>
                    <th className="px-3 py-2 text-left font-semibold">
                      Dosis diaria total
                    </th>
                    <th className="px-3 py-2 text-left font-semibold">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {meds.map((m, idx) => {
                    const meta =
                      FORM_BY_NAME[m.drug_name?.toLowerCase?.() || ""] || null;

                    const actives = meta ? meta.actives : [];
                    const groups = meta
                      ? formatGroupsForActives(meta.actives)
                      : "—";

                    const dailyDose = meta
                      ? formatDailyDoseLabel(meta, m.posology)
                      : m.daily_dose_total || "—";

                    const isOutside =
                      m.outside_vademecum || (!meta && !!m.drug_name);

                    return (
                      <tr
                        key={m.id_medication}
                        className={
                          idx % 2 === 0
                            ? "bg-white border-t border-slate-100"
                            : "bg-slate-50 border-t border-slate-100"
                        }
                      >
                        {/* Nombre comercial */}
                        <td className="px-3 py-2 align-top">
                          <div className="flex flex-col gap-0.5">
                            <span className="font-semibold text-slate-900">
                              {m.drug_name}
                            </span>
                            {isOutside && (
                              <span className="inline-flex w-fit rounded-full bg-red-50 px-2 py-[2px] text-[10px] font-medium text-red-700 border border-red-100">
                                Fuera de vademécum
                              </span>
                            )}
                            {m.indication && (
                              <span className="text-[11px] text-slate-500">
                                Indicación: {m.indication}
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Principios activos */}
                        <td className="px-3 py-2 align-top">
                          {meta
                            ? actives.join(" + ")
                            : "—"}
                        </td>

                        {/* Grupos farmacéuticos */}
                        <td className="px-3 py-2 align-top">{groups}</td>

                        {/* Posología */}
                        <td className="px-3 py-2 align-top">
                          {m.posology || "—"}
                        </td>

                        {/* Dosis diaria total */}
                        <td className="px-3 py-2 align-top">{dailyDose}</td>

                        {/* Acciones */}
                        <td className="px-3 py-2 align-top">
                          <div className="flex flex-col gap-1">
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-7 px-2 text-xs"
                              onClick={() => handleSuspend(m)}
                            >
                              Suspender
                            </Button>
                            {/* Aquí podrías añadir botón Editar si tienes la página */}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

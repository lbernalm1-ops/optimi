"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Search, ArrowLeftRight } from "lucide-react";
import Link from "next/link";

// -----------------------------
// TYPES
// -----------------------------
type PrincipioActivo = {
  nombre: string;
  cantidad?: string;
  unidad?: string;
};

type Presentacion = {
  cn: string;
  nombre?: string;
  precio?: string;
  unidad?: string;
  tama?: string;
};

type Medication = {
  nregistro: string;
  nombre: string;
  labtitular: string;
  principiosActivos?: PrincipioActivo[];
  formasFarmaceuticas?: string[];
  viasAdministracion?: string[];
  presentaciones?: Presentacion[];
  receta?: boolean;
  huerfano?: boolean;
  biosimilar?: boolean;
  psicotropo?: boolean;
  estupefaciente?: boolean;
  triangulo?: boolean;
};

// -----------------------------
// HELPERS
// -----------------------------

async function fetchMedications(q: string): Promise<Medication[]> {
  if (!q || q.trim().length < 2) return [];
  const url = `/api/cima/medications?q=${encodeURIComponent(q)}&page=1`;
  const res = await fetch(url);
  if (!res.ok) return [];
  const data = await res.json();
  return data.items || [];
}

async function fetchMedicationDetail(nreg: string): Promise<Medication | null> {
  const res = await fetch(`/api/cima/medications/${nreg}`);
  if (!res.ok) return null;
  const data = await res.json();
  return data.item || null;
}

// -----------------------------
// COLUMN STATE
// -----------------------------
type ColumnState = {
  query: string;
  loading: boolean;
  results: Medication[];
  selectedMed?: Medication;
  selectedPres?: Presentacion;
};

function createEmptyColumn(): ColumnState {
  return {
    query: "",
    loading: false,
    results: [],
    selectedMed: undefined,
    selectedPres: undefined,
  };
}

// -----------------------------
// PAGE
// -----------------------------
export default function MedicationsComparePage() {
  const params = useSearchParams();

  const preloadLeft = params.get("left") || "";
  const preloadRight = params.get("right") || "";

  const [left, setLeft] = useState<ColumnState>(createEmptyColumn());
  const [right, setRight] = useState<ColumnState>(createEmptyColumn());

  // ----------------------------------
  // PRELOAD (si viene desde botón ➕)
  // ----------------------------------
  useEffect(() => {
    const preload = async () => {
      if (preloadLeft) {
        const med = await fetchMedicationDetail(preloadLeft);
        if (med) {
          setLeft((s) => ({
            ...s,
            selectedMed: med,
            selectedPres: undefined,
          }));
        }
      }

      if (preloadRight) {
        const med = await fetchMedicationDetail(preloadRight);
        if (med) {
          setRight((s) => ({
            ...s,
            selectedMed: med,
            selectedPres: undefined,
          }));
        }
      }
    };
    preload();
  }, [preloadLeft, preloadRight]);

  // ----------------------------------
  // BUSCAR
  // ----------------------------------
  const handleSearch = async (side: "left" | "right") => {
    const state = side === "left" ? left : right;
    const q = state.query.trim();

    if (q.length < 2) return;

    side === "left"
      ? setLeft((s) => ({ ...s, loading: true }))
      : setRight((s) => ({ ...s, loading: true }));

    const results = await fetchMedications(q);

    if (side === "left") {
      setLeft((s) => ({ ...s, loading: false, results }));
    } else {
      setRight((s) => ({ ...s, loading: false, results }));
    }
  };

  const selectMed = (side: "left" | "right", med: Medication) => {
    if (side === "left") {
      setLeft((s) => ({
        ...s,
        selectedMed: med,
        selectedPres: undefined,
      }));
    } else {
      setRight((s) => ({
        ...s,
        selectedMed: med,
        selectedPres: undefined,
      }));
    }
  };

  const selectPres = (side: "left" | "right", pres: Presentacion) => {
    if (side === "left") {
      setLeft((s) => ({ ...s, selectedPres: pres }));
    } else {
      setRight((s) => ({ ...s, selectedPres: pres }));
    }
  };

  const compareReady =
    left.selectedMed &&
    left.selectedPres &&
    right.selectedMed &&
    right.selectedPres;

  const columns = [
    { key: "left", state: left, setState: setLeft },
    { key: "right", state: right, setState: setRight },
  ] as const;

  // -----------------------------
  // RENDER
  // -----------------------------
  return (
    <div className="flex flex-col gap-6">
      {/* HEADER */}
      <header className="space-y-1">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900 flex items-center gap-2">
              Comparador de presentaciones
              <ArrowLeftRight className="h-5 w-5 text-slate-400" />
            </h1>
            <p className="text-sm text-slate-500 max-w-3xl">
              Compara lado a lado dos presentaciones (CNs) del vademécum.
            </p>
          </div>
          <Link href="/medications" className="text-sm text-sky-600 hover:underline">
            Volver al vademécum
          </Link>
        </div>
      </header>

      {/* COLUMNAS */}
      <section className="grid gap-4 md:grid-cols-2">
        {columns.map((col) => {
          const side = col.key;
          const state = col.state;

          return (
            <div
              key={side}
              className="rounded-xl border bg-white p-4 shadow-sm flex flex-col gap-3"
            >
              <h2 className="text-sm font-semibold text-slate-700 mb-1">
                {side === "left" ? "Presentación A" : "Presentación B"}
              </h2>

              {/* BUSCADOR */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSearch(side);
                }}
                className="flex items-center gap-2"
              >
                <div className="relative flex-1">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Buscar medicamento…"
                    value={state.query}
                    onChange={(e) =>
                      col.setState((s) => ({ ...s, query: e.target.value }))
                    }
                    className="w-full rounded-md border border-slate-200 bg-slate-50 pl-9 pr-3 py-2 text-sm outline-none ring-sky-200 focus:bg-white focus:ring-2"
                  />
                </div>
                <button
                  type="submit"
                  disabled={state.loading || state.query.trim().length < 2}
                  className="rounded-md bg-sky-600 px-3 py-2 text-xs font-medium text-white hover:bg-sky-700 disabled:opacity-40"
                >
                  {state.loading ? "Buscando…" : "Buscar"}
                </button>
              </form>

              {/* RESULTADOS */}
              {state.results.length > 0 && (
                <div className="max-h-48 overflow-y-auto border rounded-md bg-slate-50/60">
                  <ul className="divide-y">
                    {state.results.map((m) => (
                      <li
                        key={m.nregistro}
                        className={`px-3 py-2 text-xs cursor-pointer hover:bg-sky-50 ${
                          state.selectedMed?.nregistro === m.nregistro
                            ? "bg-sky-50 border-l-2 border-sky-600"
                            : ""
                        }`}
                        onClick={() => selectMed(side, m)}
                      >
                        <div className="font-medium text-slate-800">{m.nombre}</div>
                        <div className="text-[11px] text-slate-500">
                          {m.principiosActivos?.map((p) => p.nombre).join(" / ") ||
                            "Sin PA"}
                        </div>
                        <div className="text-[11px] text-slate-400">{m.labtitular}</div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* PRESENTACIONES */}
              {state.selectedMed && (
                <div className="mt-1 space-y-2">
                  <p className="text-xs text-slate-500">
                    Presentaciones de{" "}
                    <span className="font-medium text-slate-700">
                      {state.selectedMed.nombre}
                    </span>
                  </p>
                  {state.selectedMed.presentaciones &&
                  state.selectedMed.presentaciones.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {state.selectedMed.presentaciones.map((p) => (
                        <button
                          key={p.cn}
                          type="button"
                          onClick={() => selectPres(side, p)}
                          className={`inline-flex items-center rounded-full border px-3 py-1 text-[11px] md:text-xs ${
                            state.selectedPres?.cn === p.cn
                              ? "border-sky-600 bg-sky-50 text-sky-700"
                              : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                          }`}
                        >
                          CN {p.cn}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400">No constan presentaciones.</p>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </section>

      {/* TABLA FINAL */}
      <section className="rounded-xl border bg-white p-4 shadow-sm">
        <h2 className="mb-3 text-sm font-semibold text-slate-700">
          Comparativa detallada
        </h2>

        {!compareReady && (
          <p className="text-sm text-slate-500">
            Selecciona un medicamento y una presentación en cada lado.
          </p>
        )}

        {compareReady && (
          <div className="overflow-x-auto">
            <table className="min-w-full text-xs md:text-sm lg:text-base">
              <thead className="border-b bg-slate-50 text-left text-slate-600">
                <tr>
                  <th className="px-4 py-3"></th>
                  <th className="px-4 py-3">Presentación A</th>
                  <th className="px-4 py-3">Presentación B</th>
                </tr>
              </thead>
              <tbody>
                {/* Nombre */}
                <tr className="border-b align-top">
                  <td className="px-4 py-3 font-medium">Nombre</td>
                  <td className="px-4 py-3">{left.selectedMed!.nombre}</td>
                  <td className="px-4 py-3">{right.selectedMed!.nombre}</td>
                </tr>

                {/* CN */}
                <tr className="border-b align-top">
                  <td className="px-4 py-3 font-medium">CN</td>
                  <td className="px-4 py-3 font-mono">{left.selectedPres!.cn}</td>
                  <td className="px-4 py-3 font-mono">{right.selectedPres!.cn}</td>
                </tr>

                {/* Descripción */}
                <tr className="border-b align-top">
                  <td className="px-4 py-3 font-medium">Descripción</td>
                  <td className="px-4 py-3">{left.selectedPres!.nombre || "—"}</td>
                  <td className="px-4 py-3">{right.selectedPres!.nombre || "—"}</td>
                </tr>

                {/* Principios activos */}
                <tr className="border-b align-top">
                  <td className="px-4 py-3 font-medium">Principios activos</td>
                  <td className="px-4 py-3">
                    {left.selectedMed!.principiosActivos?.map((p, idx) => (
                      <div key={idx}>
                        <span className="font-medium">{p.nombre}</span>{" "}
                        {p.cantidad && (
                          <span className="text-slate-600">
                            — {p.cantidad}
                            {p.unidad}
                          </span>
                        )}
                      </div>
                    ))}
                  </td>
                  <td className="px-4 py-3">
                    {right.selectedMed!.principiosActivos?.map((p, idx) => (
                      <div key={idx}>
                        <span className="font-medium">{p.nombre}</span>{" "}
                        {p.cantidad && (
                          <span className="text-slate-600">
                            — {p.cantidad}
                            {p.unidad}
                          </span>
                        )}
                      </div>
                    ))}
                  </td>
                </tr>

                {/* Forma farmacéutica */}
                <tr className="border-b align-top">
                  <td className="px-4 py-3 font-medium">Forma farmacéutica</td>
                  <td className="px-4 py-3">
                    {left.selectedMed!.formasFarmaceuticas?.join(", ") || "—"}
                  </td>
                  <td className="px-4 py-3">
                    {right.selectedMed!.formasFarmaceuticas?.join(", ") || "—"}
                  </td>
                </tr>

                {/* Vía */}
                <tr className="border-b align-top">
                  <td className="px-4 py-3 font-medium">Vía</td>
                  <td className="px-4 py-3">
                    {left.selectedMed!.viasAdministracion?.join(", ") || "—"}
                  </td>
                  <td className="px-4 py-3">
                    {right.selectedMed!.viasAdministracion?.join(", ") || "—"}
                  </td>
                </tr>

                {/* Tamaño */}
                <tr className="border-b align-top">
                  <td className="px-4 py-3 font-medium">Tamaño</td>
                  <td className="px-4 py-3">
                    {left.selectedPres!.tama || left.selectedPres!.unidad || "—"}
                  </td>
                  <td className="px-4 py-3">
                    {right.selectedPres!.tama || right.selectedPres!.unidad || "—"}
                  </td>
                </tr>

                {/* Flags */}
                <tr className="border-b align-top">
                  <td className="px-4 py-3 font-medium">Especiales</td>
                  <td className="px-4 py-3 text-sm">
                    {left.selectedMed!.receta && "🔖 Con receta "}
                    {left.selectedMed!.triangulo && "⚠️ Seguimiento "}
                    {left.selectedMed!.huerfano && "🧬 Huérfano "}
                    {left.selectedMed!.biosimilar && "🧪 Biosimilar "}
                    {left.selectedMed!.estupefaciente && "💀 Estupefaciente "}
                    {left.selectedMed!.psicotropo && "🔒 Psicótropo "}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {right.selectedMed!.receta && "🔖 Con receta "}
                    {right.selectedMed!.triangulo && "⚠️ Seguimiento "}
                    {right.selectedMed!.huerfano && "🧬 Huérfano "}
                    {right.selectedMed!.biosimilar && "🧪 Biosimilar "}
                    {right.selectedMed!.estupefaciente && "💀 Estupefaciente "}
                    {right.selectedMed!.psicotropo && "🔒 Psicótropo "}
                  </td>
                </tr>

                {/* FT / Prospecto */}
                <tr>
                  <td className="px-4 py-3 font-medium">Documentación</td>
                  <td className="px-4 py-3">
                    <a
                      href={`https://cima.aemps.es/cima/dochtml/ft/${left.selectedMed!.nregistro}/FichaTecnica.html`}
                      className="text-sky-600 hover:underline"
                      target="_blank"
                    >
                      Ficha técnica
                    </a>
                    <br />
                    <a
                      href={`https://cima.aemps.es/cima/dochtml/p/${left.selectedMed!.nregistro}/Prospecto.html`}
                      className="text-slate-600 hover:underline"
                      target="_blank"
                    >
                      Prospecto
                    </a>
                  </td>
                  <td className="px-4 py-3">
                    <a
                      href={`https://cima.aemps.es/cima/dochtml/ft/${right.selectedMed!.nregistro}/FichaTecnica.html`}
                      className="text-sky-600 hover:underline"
                      target="_blank"
                    >
                      Ficha técnica
                    </a>
                    <br />
                    <a
                      href={`https://cima.aemps.es/cima/dochtml/p/${right.selectedMed!.nregistro}/Prospecto.html`}
                      className="text-slate-600 hover:underline"
                      target="_blank"
                    >
                      Prospecto
                    </a>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Search, ChevronLeft, ChevronRight } from "lucide-react";

/* =======================
   TIPOS
======================= */

type Medication = {
  nregistro: string;
  nombre: string;
  principioActivo?: string;
  dosis?: string;
  formaFarmaceutica?: string;
  formaFarmaceuticaSimplificada?: string;
  viasAdministracion?: string[];
  presentaciones?: {
    psum: boolean;
    comerc: boolean;
    cn: string;
    nombre?: string;
    tipoUso: "comunitario" | "hospitalario";
  }[];
  receta?: boolean;
  labtitular: string;
  fechaAutorizacion?: string;
  atcs?: { codigo: string; nombre: string }[];
  generico?: boolean;
  biosimilar?: boolean;
  huerfano?: boolean;
  conducir?: boolean;
  noSustituible?: string;
  excipientes?: string[];
  documentos?: {
    fichaTecnica?: string | null;
    prospecto?: string | null;
  };

};

/* =======================
   UTILIDADES
======================= */

function sentenceCase(t?: string) {
  if (!t) return "—";
  const l = t.toLowerCase();
  return l.charAt(0).toUpperCase() + l.slice(1);
}

function formatDate(d?: string) {
  if (!d) return "—";
  const [y, m, da] = d.split("-");
  return da && m && y ? `${da}-${m}-${y}` : d;
}
function matchesCN(m: Medication, q: string) {
  if (!m.presentaciones || !q) return false;
  return m.presentaciones.some((p) =>
    p.cn?.includes(q)
  );
}


/* =======================
   EXCIPIENTES
======================= */

const GLUTEN_TERMS = [
  "almidón de avena",
  "almidón de cebada",
  "almidón de centeno",
  "almidón de trigo",
  "triticale",
  "carboximetilalmidón",
  "carboximetilalmidón sódico",
  "carboximetilalmidón sódico tipo c",
  "carboximetilalmidón éter",
  "jarabe de almidón",
  "premezcla lactosa/almidón",
  "almidón octenil",
  "almidón hidrolizado",
  "almidón modificado",
  "harina de avena",
  "harina de trigo",
  "salvado de trigo",
  "extracto seco de germen de trigo",
];

const hasGluten = (e?: string[]) =>
  !!e && GLUTEN_TERMS.some((t) => e.join(" ").toLowerCase().includes(t));

const hasLactose = (e?: string[]) =>
  !!e && e.some((x) => x.toLowerCase().includes("lactosa"));

const hasFructose = (e?: string[]) =>
  !!e && e.some((x) => x.toLowerCase().includes("fructosa"));

/* =======================
   PAGE
======================= */

export default function MedicationsPage() {
  const searchParams = useSearchParams();
  const atcFromUrl = searchParams.get("atc");

  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [items, setItems] = useState<Medication[]>([]);
  const [loading, setLoading] = useState(false);

  const [sinGluten, setSinGluten] = useState(false);
  const [sinLactosa, setSinLactosa] = useState(false);
  const [sinFructosa, setSinFructosa] = useState(false);
  const [tipoMedicamento, setTipoMedicamento] = useState<"comunitario" | "institucional" | "ambos">("ambos");
  const [openPresentations, setOpenPresentations] = useState<Record<string, boolean>>({});
  const [principiosSeleccionados, setPrincipiosSeleccionados] = useState<string[]>([]);

    function togglePrincipioActivo(nombre: string) {
    setPrincipiosSeleccionados((prev) =>
      prev.includes(nombre)
        ? prev.filter((n) => n !== nombre)
        : [...prev, nombre]
    );
  }

  const PAGE_SIZE = 20;
  const [page, setPage] = useState(1);

  /* ---------- debounce ---------- */
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query.trim()), 300);
    return () => clearTimeout(t);
  }, [query]);

  /* ---------- fetch medicamentos ---------- */
  useEffect(() => {
    if (debouncedQuery.length < 2 && !atcFromUrl) {
      setItems([]);
      return;
    }
  

   

    const ac = new AbortController();

    const fetchAll = async () => {
      setLoading(true);
      try {
        let p = 1;
        let totalPages = 1;
        let all: Medication[] = [];

        do {
          const params = new URLSearchParams();
          params.set("page", String(p));
          if (debouncedQuery) params.set("q", debouncedQuery);
          if (atcFromUrl) params.set("atc", atcFromUrl);

          const res = await fetch(`/api/cima/medications?${params}`, {
            signal: ac.signal,
          });
          const data = await res.json();

          all.push(...(data.items ?? []));
          totalPages = Math.ceil((data.total ?? 0) / (data.tamanioPagina ?? 1));
          p++;
        } while (p <= totalPages);

        setItems(all);
        setPage(1);
      } finally {
        if (!ac.signal.aborted) setLoading(false);
      }
    };

    fetchAll();
    return () => ac.abort();
  }, [debouncedQuery, atcFromUrl]);

  /* ---------- filtros ---------- */
const filtered = useMemo(() => {
  let list = [...items];

// 🔑 filtrar PRESENTACIONES según tipo de uso
list = list
  .map((m) => {
    if (!m.presentaciones) return m;

    let presentacionesFiltradas = m.presentaciones;

    if (tipoMedicamento === "comunitario") {
      presentacionesFiltradas = m.presentaciones.filter(
        (p) => p.tipoUso === "comunitario"
      );
    }

    if (tipoMedicamento === "institucional") {
      presentacionesFiltradas = m.presentaciones.filter(
        (p) => p.tipoUso === "hospitalario"
      );
    }

    return {
      ...m,
      presentaciones: presentacionesFiltradas,
    };
  })
  // ⛔️ si tras filtrar no queda ninguna presentación → fuera
  .filter((m) => m.presentaciones && m.presentaciones.length > 0);

  

  const q = debouncedQuery.toLowerCase();


  if (q) {
    const isNumeric = /^\d+$/.test(q);

    list = list.filter((m) => {
      const byName =
        m.nombre?.toLowerCase().includes(q);

      const byActive =
        m.principioActivo?.toLowerCase().includes(q);

      const byCN =
        isNumeric && matchesCN(m, q);

      return byName || byActive || byCN;
    });
  }
// 🔑 filtro por principios activos seleccionados
if (principiosSeleccionados.length > 0) {
  list = list.filter((m) =>
    principiosSeleccionados.some((pa) =>
      m.principioActivo
        ?.toLowerCase()
        .includes(pa.toLowerCase())
    )
  );
}

  if (sinGluten) list = list.filter((m) => !hasGluten(m.excipientes));
  if (sinLactosa) list = list.filter((m) => !hasLactose(m.excipientes));
  if (sinFructosa) list = list.filter((m) => !hasFructose(m.excipientes));

  return list;
}, [items, debouncedQuery, sinGluten, sinLactosa, sinFructosa, tipoMedicamento, principiosSeleccionados,]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const pageItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

// 🔑lista de principios activos disponibles por Página

const principiosActivosDisponibles = useMemo(() => {
  const map = new Map<string, number>();

  filtered.forEach((m) => {
    if (!m.principioActivo) return;

    const key = m.principioActivo.trim();

    map.set(key, (map.get(key) ?? 0) + 1);
  });

  return Array.from(map.entries())
    .map(([nombre, count]) => ({ nombre, count }))
    .sort((a, b) => a.nombre.localeCompare(b.nombre));
}, [filtered]);


  /* =======================
     RENDER
======================= */

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="text-2xl font-semibold">Medicación</h1>
        <p className="text-sm text-slate-500">AEMPS · CIMA</p>
      </header>

    {/* BUSCADOR */}
<section className="rounded-xl border bg-white p-4 space-y-3">
 <div className="flex gap-2 items-stretch">
    <div className="relative grow">
    <Search className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />

    <input
      value={query}
      onChange={(e) => setQuery(e.target.value)}
      placeholder="Buscar por nombre, principio activo o CN…"
      className="
        w-full
        rounded-md
        border
        border-slate-300
        bg-white
        py-2
        pl-11
        pr-3
        text-sm
        placeholder-slate-400
        focus:border-sky-500
        focus:outline-none
        focus:ring-2
        focus:ring-sky-200
      "
    />
  </div>
 <button
    type="button"
    className="
      rounded-md
      bg-sky-600
      px-4
      py-2
      text-sm
      text-white
      hover:bg-sky-700
      active:bg-sky-800
    "
  >
    Buscar
  </button>
</div>


  <p className="text-xs text-slate-400">
    Ejemplos:{" "}
    <span className="font-mono">adalat</span>,{" "}
    <span className="font-mono">nifedipino</span>,{" "}
    <span className="font-mono">603340</span>
  </p>

<section className="rounded-xl border bg-white p-3 max-w-md">
  <h3 className="mb-2 text-xs font-semibold text-slate-700">
    Principios activos ({principiosActivosDisponibles.length})
  </h3>

  <div className="max-h-56 overflow-y-auto rounded-md border">
    <table className="w-full text-xs">
      <thead className="sticky top-0 bg-slate-50 text-[11px]">
        <tr>
          <th className="px-2 py-1 text-left font-medium">
            Principio activo
          </th>
          <th className="px-2 py-1 text-right font-medium">
            Nº
          </th>
        </tr>
      </thead>

      <tbody>
        {principiosActivosDisponibles.map((pa) => (
          <tr
                key={pa.nombre}
                onClick={() => togglePrincipioActivo(pa.nombre)}
                className={`
                  border-t cursor-pointer
                  hover:bg-slate-100
                  ${
                    principiosSeleccionados.includes(pa.nombre)
                      ? "bg-sky-100 text-sky-800 font-semibold"
                      : ""
                  }
                `}
              >

            <td className="px-2 py-1">
              {pa.nombre}
            </td>
            <td className="px-2 py-1 text-right text-slate-500">
              {pa.count}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
</section>



<div className="flex gap-4 text-sm">
  <label>
    <input
      type="radio"
      checked={tipoMedicamento === "comunitario"}
      onChange={() => setTipoMedicamento("comunitario")}
    />{" "}
    Farmacia comunitaria
  </label>

  <label>
    <input
      type="radio"
    checked={tipoMedicamento === "institucional"}
    onChange={() => setTipoMedicamento("institucional")}
    />{" "}
    Uso institucional
  </label>

  <label>
    <input
      type="radio"
      checked={tipoMedicamento === "ambos"}
      onChange={() => setTipoMedicamento("ambos")}
    />{" "}
    Ambos
  </label>
</div>


  <div className="flex gap-4 text-sm">
    <label><input type="checkbox" checked={sinGluten} onChange={e=>setSinGluten(e.target.checked)} /> Sin gluten 🌾</label>
    <label><input type="checkbox" checked={sinLactosa} onChange={e=>setSinLactosa(e.target.checked)} /> Sin lactosa 🥛</label>
    <label><input type="checkbox" checked={sinFructosa} onChange={e=>setSinFructosa(e.target.checked)} /> Sin fructosa 🍬</label>
  </div>
</section>

      {/* TABLA */}
      <section className="rounded-xl border bg-white p-4">
        {loading && <p className="text-sm">Cargando…</p>}

        {pageItems.length > 0 && (
          <div className="overflow-x-auto">
            <table className="min-w-[1550px] table-fixed text-sm">
              <thead className="bg-slate-50 border-b">
                <tr>
                  <th className="w-[180px]">CN / Documentación</th>
                  <th className="w-[240px] sticky left-0 bg-slate-50 z-10">Medicamento</th>
                  <th className="w-[120px]">Principio activo</th>
                  <th className="w-[120px]">Dosis</th>
                  <th className="w-[140px]">Presentación</th>
                  <th className="w-[140px]">Laboratorio / Fecha</th>
                  <th className="w-[80px]">ATC</th>
                  <th className="w-[80px]">Indicadores</th>
                  <th className="w-[80px]">Excipientes</th>
                </tr>
              </thead>

              <tbody>
                {pageItems.map((m) => {
                  const comercializadas = m.presentaciones ?? [];
                  return (
                  <tr key={m.nregistro} className="border-b align-top">
                    {/* CN + DOCS */}
<td className="px-2 py-2 text-xs text-left align-top">
  {(() => {
  
    if (comercializadas.length === 0) {
      return <span className="text-slate-400">—</span>;
    }

    return (
      <>
<button
  type="button"
  onClick={() =>
    setOpenPresentations((prev) => ({
      ...prev,
      [m.nregistro]: !prev[m.nregistro],
    }))
  }
  className="
    not-italic
    font-sans
    text-sky-700
    hover:underline
     text-sm
    flex
    items-center
    gap-1
  "
>
  {comercializadas.length === 1
    ? "Ver 1 presentación"
    : `Ver ${comercializadas.length} presentaciones`}
  <span className="text-xs">
    {openPresentations[m.nregistro] ? "▴" : "▾"}
  </span>
</button>



        {openPresentations[m.nregistro] && (
          <div className="mt-2 space-y-1">
            {comercializadas.map((p) => (
              <div
                key={p.cn}
                className="rounded border bg-white px-2 py-1"
              >
                <div className="flex items-center gap-1">
                  <div className="font-mono text-[11px]">
                    CN {p.cn}
                  </div>

                  {p.psum && (
                    <span
                      title="Problemas de suministro"
                      className="text-amber-600"
                    >
                      🚨
                    </span>
                  )}
                </div>

                {p.nombre && (
                  <div className="text-[11px] text-slate-600 leading-snug">
                    {p.nombre}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </>
    );
  })()}

  <div className="mt-2 flex gap-2">
    {m.documentos?.fichaTecnica && (
      <a
        href={m.documentos.fichaTecnica}
        target="_blank"
        className="text-sky-800 font-bold underline"
      >
        FT
      </a>
    )}
    {m.documentos?.prospecto && (
      <a
        href={m.documentos.prospecto}
        target="_blank"
        className="text-sky-800 font-bold underline"
      >
        P
      </a>
    )}
  </div>
</td>


                    {/* MEDICAMENTO */}
                    <td className="sticky left-0 bg-white px-3 py-2">
                      <Link href={`/medications/${m.nregistro}`} className="text-sky-700 font-medium hover:underline">
                        {sentenceCase(m.nombre)}
                      </Link>
                    </td>

                    <td>{sentenceCase(m.principioActivo)}</td>
                    <td>{m.dosis ?? "—"}</td>

                    <td className="text-xs">
                      <div className="font-medium">{sentenceCase(m.formaFarmaceuticaSimplificada)}</div>
                      <div>{m.receta ? "Con receta" : "Sin receta"}</div>
                      <div>{m.viasAdministracion?.join(", ")}</div>
                    </td>

                    <td className="text-xs">
                      <div>{m.labtitular}</div>
                      <div>Aut.: {formatDate(m.fechaAutorizacion)}</div>
                    </td>

                    <td className="text-xs font-mono">
                      {m.atcs?.map((a) => (
                        <Link
                          key={a.codigo}
                          href={`/medications?atc=${a.codigo}`}
                          className="block text-sky-700 hover:underline"
                          title={a.nombre}
                        >
                          {a.codigo}
                        </Link>
                      ))}
                    </td>

                   <td className="text-base">
                                    <div className="flex flex-wrap gap-1">
                                      {m.generico && <span title="Genérico">G</span>}
                                      {m.biosimilar && <span title="Biosimilar">🧪</span>}
                                      {m.huerfano && <span title="Medicamento huérfano">🧬</span>}
                                      {m.conducir && <span title="Afecta a la conducción">🚗</span>}
                                                                </div>
                                  </td>


                    <td className="text-base">
                      {hasGluten(m.excipientes) && "🌾"} {hasLactose(m.excipientes) && "🥛"}{" "}
                      {hasFructose(m.excipientes) && "🍬"}
                    </td>
                  </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {totalPages > 1 && (
          <div className="mt-4 flex justify-between">
            <span>Página {page} de {totalPages}</span>
            <div className="flex gap-2">
              <button onClick={() => setPage((p) => Math.max(1, p - 1))}><ChevronLeft /></button>
              <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))}><ChevronRight /></button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

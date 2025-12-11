"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Search,
  Filter,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { addToCompare } from "./compare/store";

/* ---------------------- TIPOS ----------------------- */

type PrincipioActivo = {
  nombre: string;
  cantidad?: string;
  unidad?: string;
};

type Presentacion = {
  cn: string;
  nombre?: string;
};

type AtcCode = {
  codigo: string;
  nombre: string;
  nivel: number;
};

type SupplyInfo = {
  estado: "normal" | "amarillo" | "rojo";
  comentario?: string;
  fechaPrevista?: string;
};

type GlutenStatus = "gluten" | "safe" | "unknown";

type PediatricFormStatus = "friendly" | "unfriendly" | "mixed" | "unknown";

type Medication = {
  nregistro: string;
  nombre: string;
  labtitular: string;
  cpresc?: string;
  receta?: boolean;
  comerc?: boolean;
  viasAdministracion?: string[];
  formasFarmaceuticas?: string[];
  principiosActivos?: PrincipioActivo[];
  presentaciones?: Presentacion[];
  excipientes?: string[];
  triangulo?: boolean;
  huerfano?: boolean;
  biosimilar?: boolean;
  estupefaciente?: boolean;
  psicotropo?: boolean;
  atcs?: AtcCode[];
  // Campos enriquecidos en cliente:
  supply?: SupplyInfo;
  glutenStatus?: GlutenStatus;
  geriatricRisk?: string | null;
  pediatricForm?: PediatricFormStatus;
  pediatricRisk?: string | null;
};

/* ---------- Constantes clínico-técnicas ---------- */

// Gluten: según listado AEMPS “Medicamentos y gluten”
const GLUTEN_EXCIPIENTS = [
  "almidón de trigo",
  "almidón de avena",
  "almidón de cebada",
  "almidón de centeno",
  "almidón de triticale",
  "carboximetilalmidón",
  "carboximetilalmidón sódico",
  "carboximetilalmidón sódico tipo c",
  "jarabe de almidón",
  "triticale",
  "harina de trigo",
  "harina de avena",
];

const GLUTEN_SAFE_STARCHES = [
  "almidón de maíz",
  "almidón de arroz",
  "almidón de patata",
];

// Geriatría: lista de principios activos “sensibles”
const GERIATRIC_RISK: Record<string, string> = {
  alprazolam: "benzodiazepina (riesgo de caídas y confusión en mayores)",
  lorazepam: "benzodiazepina (riesgo de caídas y confusión en mayores)",
  diazepam: "benzodiazepina (vida media larga, riesgo de acumulación)",
  bromazepam: "benzodiazepina (riesgo de sedación y caídas)",
  clorazepato: "benzodiazepina (riesgo de sedación y caídas)",

  zolpidem: "hipnótico tipo Z (riesgo de caídas, confusión)",
  zopiclona: "hipnótico tipo Z (riesgo de caídas, confusión)",

  oxibutinina: "anticolinérgico (riesgo cognitivo y de retención urinaria)",
  tolterodina: "anticolinérgico (riesgo cognitivo y de retención urinaria)",
  fesoterodina: "anticolinérgico (riesgo cognitivo y de retención urinaria)",
  amitriptilina: "antidepresivo tricíclico con carga anticolinérgica alta",

  ibuprofeno: "AINE (riesgo GI, renal y CV en uso crónico)",
  naproxeno: "AINE (riesgo GI, renal y CV en uso crónico)",
  diclofenaco: "AINE (riesgo GI, renal y CV en uso crónico)",

  quetiapina: "antipsicótico (riesgo de eventos CV y mortalidad en demencia)",
  risperidona: "antipsicótico (riesgo de eventos CV y mortalidad en demencia)",
  olanzapina: "antipsicótico (riesgo metabólico y de eventos CV)",
  haloperidol: "antipsicótico (riesgo extrapiramidal, CV)",

  clonidina: "hipotensor central (riesgo de hipotensión y caídas)",
  doxazosina: "alfa-bloqueante (riesgo de hipotensión ortostática)",
  pregabalina: "antiepiléptico/sedante (riesgo de caídas)",
  gabapentina: "antiepiléptico/sedante (riesgo de caídas)",
};

// Pediatría: principios activos con riesgo especial
const PEDIATRIC_RISK: Record<string, string> = {
  "ácido acetilsalicílico":
    "riesgo de síndrome de Reye en menores de 16 años",
  asa: "riesgo de síndrome de Reye en menores de 16 años",
  codeína:
    "riesgo de depresión respiratoria (metabolizadores ultrarrápidos CYP2D6)",
  tramadol: "riesgo de depresión respiratoria y abuso en adolescentes",
  tetraciclina: "afectación de hueso y esmalte dental en niños",
  doxiciclina: "afectación de hueso y esmalte dental en niños pequeños",
  minociclina: "afectación de hueso y esmalte dental en niños pequeños",
  ciprofloxacino:
    "fluoroquinolona, no de primera línea en niños (riesgo articular)",
  levofloxacino:
    "fluoroquinolona, no de primera línea en niños (riesgo articular)",
  metoclopramida:
    "riesgo de efectos extrapiramidales en población pediátrica",
};

// Formas más “pedi-friendly”
const PEDIATRIC_FRIENDLY_FORMS = [
  "suspensión oral",
  "solución oral",
  "gotas orales",
  "jarabe",
  "granulado para solución oral",
  "polvo para suspensión oral",
];

const PEDIATRIC_UNFRIENDLY_FORMS = [
  "comprimido recubierto",
  "comprimidos recubiertos",
  "comprimido de liberación prolongada",
  "comprimidos de liberación prolongada",
  "cápsula dura",
  "cápsulas duras",
];

/* ---------- Funciones de clasificación ---------- */

function detectGluten(excipientes: string[] | undefined): GlutenStatus {
  if (!excipientes || excipientes.length === 0) return "unknown";
  const lower = excipientes.map((e) => e.toLowerCase());

  const contains = GLUTEN_EXCIPIENTS.some((gl) =>
    lower.some((e) => e.includes(gl))
  );
  if (contains) return "gluten";

  const safe = GLUTEN_SAFE_STARCHES.some((s) =>
    lower.some((e) => e.includes(s))
  );
  if (safe) return "safe";

  return "unknown";
}

function detectGeriatricRisk(
  pactivos: PrincipioActivo[] | undefined
): string | null {
  if (!pactivos) return null;
  for (const pa of pactivos) {
    const name = pa.nombre.toLowerCase();
    if (GERIATRIC_RISK[name]) return GERIATRIC_RISK[name];
  }
  return null;
}

function detectPediatricRisk(
  pactivos: PrincipioActivo[] | undefined
): string | null {
  if (!pactivos) return null;
  for (const pa of pactivos) {
    const name = pa.nombre.toLowerCase();
    if (PEDIATRIC_RISK[name]) return PEDIATRIC_RISK[name];
  }
  return null;
}

function classifyPediatricForm(
  formas: string[] | undefined
): PediatricFormStatus {
  if (!formas || formas.length === 0) return "unknown";
  const lower = formas.map((f) => f.toLowerCase());

  const hasFriendly = lower.some((f) =>
    PEDIATRIC_FRIENDLY_FORMS.some((ff) => f.includes(ff))
  );
  const hasUnfriendly = lower.some((f) =>
    PEDIATRIC_UNFRIENDLY_FORMS.some((uf) => f.includes(uf))
  );

  if (hasFriendly && !hasUnfriendly) return "friendly";
  if (!hasFriendly && hasUnfriendly) return "unfriendly";
  if (hasFriendly && hasUnfriendly) return "mixed";
  return "unknown";
}

/* ---------- Página principal ---------- */

export default function MedicationsPage() {
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");

  // Datos crudos y enriquecidos
  const [meds, setMeds] = useState<Medication[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Maestras
  const [formas, setFormas] = useState<any[]>([]);
  const [vias, setVias] = useState<any[]>([]);
  const [laboratorios, setLaboratorios] = useState<any[]>([]);
  const [atcList, setAtcList] = useState<any[]>([]);

  // Filtros superiores (petición API)
  const [formaSeleccionada, setFormaSeleccionada] = useState("");
  const [viaSeleccionada, setViaSeleccionada] = useState("");
  const [labSeleccionado, setLabSeleccionado] = useState("");
  const [atcSeleccionado, setAtcSeleccionado] = useState("");

  const [requiereReceta, setRequiereReceta] = useState(false);
  const [huerfano, setHuerfano] = useState(false);
  const [biosimilar, setBiosimilar] = useState(false);
  const [triangulo, setTriangulo] = useState(false);
  const [estupefaciente, setEstupefaciente] = useState(false);
  const [psicotropo, setPsicotropo] = useState(false);
  const [soloSuministro, setSoloSuministro] = useState(false);
  const [sinGluten, setSinGluten] = useState(false);

  const [modoGeriatria, setModoGeriatria] = useState(false);
  const [modoPediatria, setModoPediatria] = useState(false);
  const [soloFormasPedia, setSoloFormasPedia] = useState(false);

  // Filtros de tabla (cliente)
  const [filterPA, setFilterPA] = useState("");
  const [filterLab, setFilterLab] = useState("");
  const [filterVia, setFilterVia] = useState("");
  const [filterReceta, setFilterReceta] = useState<"all" | "yes" | "no">("all");

  // Paginación
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [pageSize, setPageSize] = useState(0);

  const totalPages = useMemo(
    () => (pageSize > 0 ? Math.ceil(total / pageSize) : 1),
    [total, pageSize]
  );

  // Debounce de la query
  useEffect(() => {
    const handler = setTimeout(
      () => setDebouncedQuery(query.trim()),
      300
    );
    return () => clearTimeout(handler);
  }, [query]);

  // Reset de página cuando cambian filtros o búsqueda
  useEffect(() => {
    setPage(1);
  }, [
    debouncedQuery,
    formaSeleccionada,
    viaSeleccionada,
    labSeleccionado,
    atcSeleccionado,
    requiereReceta,
    huerfano,
    biosimilar,
    triangulo,
    estupefaciente,
    psicotropo,
  ]);

  // Cargar maestras (formas, vías, labs, ATC)
  useEffect(() => {
    const loadFilters = async () => {
      try {
        const [formsRes, viasRes, labsRes, atcRes] = await Promise.all([
          fetch("/api/cima/forms").then((r) => r.json()),
          fetch("/api/cima/routes").then((r) => r.json()),
          fetch("/api/cima/labs").then((r) => r.json()),
          fetch("/api/cima/atc").then((r) => r.json()),
        ]);

        setFormas(formsRes.items || []);
        setVias(viasRes.items || []);
        setLaboratorios(labsRes.items || []);
        setAtcList(atcRes.items || []);
      } catch (e) {
        console.error("Error cargando maestras", e);
      }
    };
    loadFilters();
  }, []);

  // Buscar medicamentos en CIMA (a través de /api/cima/medications) y enriquecer
  useEffect(() => {
    const fetchMedications = async () => {
      if (!debouncedQuery || debouncedQuery.length < 2) {
        setMeds([]);
        setTotal(0);
        setPageSize(0);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams();
        params.set("q", debouncedQuery);
        params.set("page", String(page));

        if (formaSeleccionada) params.set("forma", formaSeleccionada);
        if (viaSeleccionada) params.set("via", viaSeleccionada);
        if (labSeleccionado) params.set("lab", labSeleccionado);
        if (atcSeleccionado) params.set("atc", atcSeleccionado);

        if (requiereReceta) params.set("receta", "1");
        if (huerfano) params.set("huerfano", "1");
        if (biosimilar) params.set("biosimilar", "1");
        if (triangulo) params.set("triangulo", "1");
        if (estupefaciente) params.set("estupefaciente", "1");
        if (psicotropo) params.set("psicotropo", "1");

        const res = await fetch(`/api/cima/medications?${params.toString()}`);
        if (!res.ok) {
          throw new Error("Error consultando /api/cima/medications");
        }

        const data = await res.json();

        // Soportar data.items (si ya lo normalizaste) o data.resultados (respuesta cruda de CIMA)
        const raw: Medication[] =
          data.items || data.resultados || [];

        setTotal(data.total ?? raw.length);
        setPageSize(data.tamanioPagina ?? raw.length);

        // Obtener CNs de presentaciones para problemas de suministro
        const cns = Array.from(
          new Set(
            raw.flatMap((m) =>
              (m.presentaciones || [])
                .map((p) => p.cn)
                .filter(Boolean)
            )
          )
        ) as string[];

        let supplyMap: Record<string, SupplyInfo> = {};
        if (cns.length > 0) {
          try {
            const supRes = await fetch("/api/cima/supply", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ cns }),
            });
            if (supRes.ok) {
              supplyMap = await supRes.json();
            }
          } catch (e) {
            console.error("Error cargando problemas de suministro", e);
          }
        }

        // Enriquecer con gluten, geriatría, pediatría y suministro
        const enriched: Medication[] = raw.map((m) => {
          const cnPrincipal = m.presentaciones?.[0]?.cn;
          const s = cnPrincipal && supplyMap[cnPrincipal]
            ? supplyMap[cnPrincipal]
            : { estado: "normal" as const };

          const glutenStatus = detectGluten(m.excipientes);
          const geriatricRisk = detectGeriatricRisk(m.principiosActivos);
          const pediatricForm = classifyPediatricForm(
            m.formasFarmaceuticas || m.viasAdministracion
          );
          const pediatricRisk = detectPediatricRisk(m.principiosActivos);

          return {
            ...m,
            supply: s,
            glutenStatus,
            geriatricRisk,
            pediatricForm,
            pediatricRisk,
          };
        });

        setMeds(enriched);
      } catch (e: any) {
        console.error(e);
        setError("No se ha podido recuperar la información de medicamentos.");
        setMeds([]);
      } finally {
        setLoading(false);
      }
    };

    fetchMedications();
  }, [
    debouncedQuery,
    page,
    formaSeleccionada,
    viaSeleccionada,
    labSeleccionado,
    atcSeleccionado,
    requiereReceta,
    huerfano,
    biosimilar,
    triangulo,
    estupefaciente,
    psicotropo,
  ]);

  // Aplicar filtros avanzados en cliente (gluten, suministro, modos, filtros tabla)
  const displayedMeds = useMemo(() => {
    let list = [...meds];

    // Búsqueda avanzada local en múltiples campos
    const q = debouncedQuery.toLowerCase().trim();
    if (q.length >= 2) {
      list = list.filter((m) => {
        const inName = m.nombre.toLowerCase().includes(q);
        const inLab = m.labtitular?.toLowerCase().includes(q);
        const inForms = m.formasFarmaceuticas?.some((f) =>
          f.toLowerCase().includes(q)
        );
        const inPA = m.principiosActivos?.some((pa) =>
          pa.nombre.toLowerCase().includes(q)
        );
        const inVia = m.viasAdministracion?.some((v) =>
          v.toLowerCase().includes(q)
        );
        const inPres = m.presentaciones?.some(
          (p) =>
            p.cn.toLowerCase().includes(q) ||
            (p.nombre || "").toLowerCase().includes(q)
        );

        return inName || inLab || inForms || inPA || inVia || inPres;
      });
    }

    // 🎯 Filtros de tabla (cliente)
    if (filterPA.trim()) {
      const qpa = filterPA.toLowerCase();
      list = list.filter((m) =>
        m.principiosActivos?.some((p) =>
          p.nombre.toLowerCase().includes(qpa)
        )
      );
    }

    if (filterLab.trim()) {
      const qlab = filterLab.toLowerCase();
      list = list.filter((m) =>
        m.labtitular.toLowerCase().includes(qlab)
      );
    }

    if (filterVia.trim()) {
      const qvia = filterVia.toLowerCase();
      list = list.filter((m) =>
        m.viasAdministracion?.some((v) =>
          v.toLowerCase().includes(qvia)
        )
      );
    }

    if (filterReceta !== "all") {
      list = list.filter((m) =>
        filterReceta === "yes" ? m.receta : !m.receta
      );
    }

    // Filtros clínicos avanzados
    if (sinGluten) {
      list = list.filter((m) => m.glutenStatus !== "gluten");
    }

    if (soloSuministro) {
      list = list.filter(
        (m) => m.supply && m.supply.estado !== "normal"
      );
    }

    if (modoPediatria && soloFormasPedia) {
      list = list.filter(
        (m) =>
          m.pediatricForm === "friendly" ||
          m.pediatricForm === "mixed"
      );
    }

    // Ordenar para que en modo geriatría los de riesgo aparezcan arriba
    if (modoGeriatria) {
      list.sort((a, b) => {
        const aRisk = a.geriatricRisk ? 1 : 0;
        const bRisk = b.geriatricRisk ? 1 : 0;
        return bRisk - aRisk;
      });
    }

    return list;
  }, [
    meds,
    debouncedQuery,
    filterPA,
    filterLab,
    filterVia,
    filterReceta,
    sinGluten,
    soloSuministro,
    modoPediatria,
    soloFormasPedia,
    modoGeriatria,
  ]);

  /* ---------------------- RENDER ----------------------- */

  return (
    <div className="flex flex-col gap-6">
      {/* HEADER */}
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
          Vademécum de medicación
        </h1>
        <p className="text-sm text-slate-500 max-w-3xl">
          Búsqueda avanzada sobre el catálogo oficial de medicamentos (AEMPS),
          con filtros clínicos y modos de atención primaria, geriatría y pediatría.
        </p>
      </header>

      {/* BÚSQUEDA PRINCIPAL */}
      <section className="rounded-xl border bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por nombre, principio activo, forma, CN, laboratorio…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full rounded-md border border-slate-200 bg-slate-50 pl-11 pr-3 py-2.5 text-sm md:text-base outline-none ring-sky-200 focus:bg-white focus:ring-2"
            />
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <Filter className="h-4 w-4" />
            Escribe al menos 2 letras para iniciar la búsqueda.
          </div>
        </div>
      </section>

      {/* FILTROS SUPERIORES */}
      <section className="rounded-xl border bg-white p-4 shadow-sm space-y-4">
        <div className="flex flex-wrap gap-3">
          {/* Forma */}
          <select
            className="border rounded-md px-3 py-1.5 text-sm"
            value={formaSeleccionada}
            onChange={(e) => setFormaSeleccionada(e.target.value)}
          >
            <option value="">Forma farmacéutica</option>
            {formas.map((f: any) => (
              <option key={f.id} value={f.id}>
                {f.nombre}
              </option>
            ))}
          </select>

          {/* Vía */}
          <select
            className="border rounded-md px-3 py-1.5 text-sm"
            value={viaSeleccionada}
            onChange={(e) => setViaSeleccionada(e.target.value)}
          >
            <option value="">Vía de administración</option>
            {vias.map((v: any) => (
              <option key={v.id} value={v.id}>
                {v.nombre}
              </option>
            ))}
          </select>

          {/* Laboratorio */}
          <select
            className="border rounded-md px-3 py-1.5 text-sm"
            value={labSeleccionado}
            onChange={(e) => setLabSeleccionado(e.target.value)}
          >
            <option value="">Laboratorio</option>
            {laboratorios.map((l: any) => (
              <option key={l.id} value={l.nombre}>
                {l.nombre}
              </option>
            ))}
          </select>

          {/* ATC */}
          <select
            className="border rounded-md px-3 py-1.5 text-sm max-w-[260px]"
            value={atcSeleccionado}
            onChange={(e) => setAtcSeleccionado(e.target.value)}
          >
            <option value="">ATC</option>
            {atcList.map((a: any) => (
              <option key={a.id} value={a.codigo}>
                {a.codigo} — {a.nombre}
              </option>
            ))}
          </select>
        </div>

        {/* Filtros booleanos y modos clínicos */}
        <div className="flex flex-wrap gap-6 text-sm">
          <div className="flex flex-col gap-1">
            <p className="text-xs font-semibold text-slate-500">
              Regulación y tipo de medicamento
            </p>
            <div className="flex flex-wrap gap-3">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={requiereReceta}
                  onChange={(e) => setRequiereReceta(e.target.checked)}
                />
                <span className="text-xs">Requiere receta</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={huerfano}
                  onChange={(e) => setHuerfano(e.target.checked)}
                />
                <span className="text-xs">Huérfano 🧬</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={biosimilar}
                  onChange={(e) => setBiosimilar(e.target.checked)}
                />
                <span className="text-xs">Biosimilar 🧪</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={triangulo}
                  onChange={(e) => setTriangulo(e.target.checked)}
                />
                <span className="text-xs">
                  Triángulo negro{" "}
                  <AlertTriangle className="inline h-3 w-3 text-yellow-500" />
                </span>
              </label>
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <p className="text-xs font-semibold text-slate-500">
              Sustancias controladas
            </p>
            <div className="flex flex-wrap gap-3">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={estupefaciente}
                  onChange={(e) => setEstupefaciente(e.target.checked)}
                />
                <span className="text-xs">Estupefaciente 💀</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={psicotropo}
                  onChange={(e) => setPsicotropo(e.target.checked)}
                />
                <span className="text-xs">Psicótropo 🔒</span>
              </label>
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <p className="text-xs font-semibold text-slate-500">
              Suministro e intolerancias
            </p>
            <div className="flex flex-wrap gap-3">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={soloSuministro}
                  onChange={(e) => setSoloSuministro(e.target.checked)}
                />
                <span className="text-xs">
                  Problemas de suministro 🚨
                </span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={sinGluten}
                  onChange={(e) => setSinGluten(e.target.checked)}
                />
                <span className="text-xs">
                  Apto celíacos (sin gluten) 🌾✔️
                </span>
              </label>
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <p className="text-xs font-semibold text-slate-500">
              Modos clínicos
            </p>
            <div className="flex flex-wrap gap-3">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={modoGeriatria}
                  onChange={(e) => setModoGeriatria(e.target.checked)}
                />
                <span className="text-xs">Modo Geriatría 🧓</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={modoPediatria}
                  onChange={(e) => setModoPediatria(e.target.checked)}
                />
                <span className="text-xs">Modo Pediatría 👶</span>
              </label>
              {modoPediatria && (
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={soloFormasPedia}
                    onChange={(e) => setSoloFormasPedia(e.target.checked)}
                  />
                  <span className="text-xs">
                    Solo formas pediátricas
                  </span>
                </label>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* RESULTADOS */}
      <section className="rounded-xl border bg-white p-4 shadow-sm">
        {error && (
          <div className="mb-3 rounded-md border border-red-100 bg-red-50 px-3 py-2 text-xs text-red-700">
            {error}
          </div>
        )}

        {!loading && !error && debouncedQuery.length < 2 && (
          <p className="text-sm text-slate-500">
            Escribe al menos 2 letras para iniciar la búsqueda.
          </p>
        )}

        {loading && (
          <p className="text-sm text-slate-500">
            Cargando resultados…
          </p>
        )}

        {!loading &&
          debouncedQuery.length >= 2 &&
          displayedMeds.length === 0 &&
          !error && (
            <p className="text-sm text-slate-500">
              No se han encontrado medicamentos para “{debouncedQuery}”.
            </p>
          )}

        {/* Filtros de tabla + tabla */}
        {displayedMeds.length > 0 && (
          <>
            {/* FILTROS DE TABLA */}
            <div className="flex flex-wrap gap-3 mb-4 text-sm">
              <input
                type="text"
                placeholder="Filtrar por principio activo…"
                value={filterPA}
                onChange={(e) => setFilterPA(e.target.value)}
                className="border rounded-md px-3 py-1.5"
              />
              <input
                type="text"
                placeholder="Filtrar por laboratorio…"
                value={filterLab}
                onChange={(e) => setFilterLab(e.target.value)}
                className="border rounded-md px-3 py-1.5"
              />
              <input
                type="text"
                placeholder="Filtrar por vía…"
                value={filterVia}
                onChange={(e) => setFilterVia(e.target.value)}
                className="border rounded-md px-3 py-1.5"
              />
              <select
                value={filterReceta}
                onChange={(e) =>
                  setFilterReceta(e.target.value as "all" | "yes" | "no")
                }
                className="border rounded-md px-3 py-1.5"
              >
                <option value="all">Receta (todos)</option>
                <option value="yes">Con receta</option>
                <option value="no">Sin receta</option>
              </select>
            </div>

            {/* TABLA AMPLIA */}
            <div className="overflow-x-auto">
              <table className="min-w-full text-xs md:text-sm lg:text-base">
                <thead className="border-b bg-slate-50 text-left text-slate-600">
                  <tr>
                    <th className="px-3 py-2">Comparar</th>
                    <th className="px-4 py-3">Nombre</th>
                    <th className="px-4 py-3">Principio(s) activo(s)</th>
                    <th className="px-4 py-3">Forma farmacéutica</th>
                    <th className="px-4 py-3">Vía</th>
                    <th className="px-4 py-3">Presentaciones</th>
                    <th className="px-4 py-3">Lab.</th>
                    <th className="px-4 py-3">ATC</th>
                    <th className="px-4 py-3">Receta</th>
                    <th className="px-4 py-3">Indicadores</th>
                    <th className="px-4 py-3">Docs</th>
                  </tr>
                </thead>
                <tbody>
                  {displayedMeds.map((m) => {
                    const paText =
                      m.principiosActivos && m.principiosActivos.length
                        ? m.principiosActivos
                            .map(
                              (p) =>
                                `${p.nombre}${
                                  p.cantidad
                                    ? ` ${p.cantidad}${p.unidad ? p.unidad : ""}`
                                    : ""
                                }`
                            )
                            .join(" / ")
                        : "—";

                    const ftUrl = `https://cima.aemps.es/cima/dochtml/ft/${m.nregistro}/FichaTecnica.html`;
                    const prospUrl = `https://cima.aemps.es/cima/dochtml/p/${m.nregistro}/Prospecto.html`;

                    const atcText =
                      m.atcs && m.atcs.length
                        ? m.atcs.map((a) => a.codigo).join(", ")
                        : "—";

                    return (
                      <tr key={m.nregistro} className="border-b align-top">
                        {/* Columna comparar */}
                        <td className="px-3 py-2">
                          <button
                            onClick={() => addToCompare(m.nregistro)}
                            className="text-xs rounded bg-sky-100 px-2 py-1 hover:bg-sky-200"
                            title="Añadir al comparador"
                          >
                            ➕
                          </button>
                        </td>

                        <td className="px-4 py-3 font-medium text-slate-900 max-w-xs">
                          {m.nombre}
                        </td>
                        <td className="px-4 py-3 max-w-xs">
                          <span className="whitespace-pre-line">
                            {paText}
                          </span>
                        </td>
                        <td className="px-4 py-3 max-w-xs">
                          {m.formasFarmaceuticas?.join(", ") || "—"}
                        </td>
                        <td className="px-4 py-3">
                          {m.viasAdministracion?.join(", ") || "—"}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap gap-1">
                            {m.presentaciones && m.presentaciones.length > 0 ? (
                              m.presentaciones.map((p) => (
                                <span
                                  key={p.cn}
                                  title={p.nombre || ""}
                                  className="inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] md:text-xs text-slate-700 bg-slate-50"
                                >
                                  CN {p.cn}
                                </span>
                              ))
                            ) : (
                              <span className="text-slate-400 text-xs">—</span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          {m.labtitular || "—"}
                        </td>
                        <td className="px-4 py-3">
                          {atcText}
                        </td>
                        <td className="px-4 py-3">
                          {m.receta ? "Sí" : "No"}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap gap-1 text-base">
                            {m.triangulo && (
                              <span
                                title="Seguimiento adicional (triángulo negro)"
                                className="text-yellow-500"
                              >
                                ⚠️
                              </span>
                            )}
                            {m.huerfano && (
                              <span
                                title="Medicamento huérfano"
                                className="text-indigo-600"
                              >
                                🧬
                              </span>
                            )}
                            {m.biosimilar && (
                              <span
                                title="Biosimilar"
                                className="text-sky-600"
                              >
                                🧪
                              </span>
                            )}
                            {m.estupefaciente && (
                              <span
                                title="Estupefaciente"
                                className="text-red-600"
                              >
                                💀
                              </span>
                            )}
                            {m.psicotropo && (
                              <span
                                title="Psicótropo"
                                className="text-purple-600"
                              >
                                🔒
                              </span>
                            )}

                            {m.glutenStatus === "gluten" && (
                              <span
                                title="Contiene o puede contener gluten"
                                className="text-red-600"
                              >
                                🌾❌
                              </span>
                            )}
                            {m.glutenStatus === "safe" && (
                              <span
                                title="Sin gluten (apto celíacos)"
                                className="text-green-600"
                              >
                                🌾✔️
                              </span>
                            )}
                            {m.glutenStatus === "unknown" && (
                              <span
                                title="Gluten no clasificado / no consta"
                                className="text-yellow-600"
                              >
                                🌾?
                              </span>
                            )}

                            {m.supply?.estado === "amarillo" && (
                              <span
                                title={
                                  m.supply.comentario ||
                                  "Problemas de suministro"
                                }
                                className="text-yellow-500"
                              >
                                🟨
                              </span>
                            )}
                            {m.supply?.estado === "rojo" && (
                              <span
                                title={
                                  m.supply.comentario ||
                                  "Desabastecimiento"
                                }
                                className="text-red-600"
                              >
                                🟥
                              </span>
                            )}

                            {modoGeriatria && m.geriatricRisk && (
                              <span
                                title={`Riesgo geriátrico: ${m.geriatricRisk}`}
                                className="text-orange-600"
                              >
                                🧓⚠️
                              </span>
                            )}

                            {modoPediatria && (
                              <>
                                {m.pediatricForm === "friendly" && (
                                  <span
                                    title="Forma farmacéutica adecuada en población pediátrica"
                                    className="text-green-600"
                                  >
                                    👶✔️
                                  </span>
                                )}
                                {m.pediatricForm === "unfriendly" && (
                                  <span
                                    title="Forma farmacéutica poco adecuada en niños pequeños"
                                    className="text-yellow-500"
                                  >
                                    👶⚠️
                                  </span>
                                )}
                                {m.pediatricRisk && (
                                  <span
                                    title={`Precaución pediátrica: ${m.pediatricRisk}`}
                                    className="text-red-600"
                                  >
                                    👶❌
                                  </span>
                                )}
                              </>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-col gap-1 text-sm">
                            <a
                              href={ftUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="text-sky-600 hover:underline"
                            >
                              Ficha técnica
                            </a>
                            <a
                              href={prospUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="text-slate-600 hover:underline"
                            >
                              Prospecto
                            </a>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* PAGINACIÓN */}
            {totalPages > 1 && (
              <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm">
                <div className="text-xs text-slate-500">
                  Página {page} de {totalPages} • {total} medicamentos
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPage(1)}
                    disabled={page === 1}
                    className="flex items-center gap-1 rounded-md border px-2 py-1 text-xs disabled:opacity-40"
                  >
                    « Primera
                  </button>
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="flex items-center gap-1 rounded-md border px-2 py-1 text-xs disabled:opacity-40"
                  >
                    <ChevronLeft className="h-3 w-3" />
                    Anterior
                  </button>
                  <button
                    onClick={() =>
                      setPage((p) => Math.min(totalPages, p + 1))
                    }
                    disabled={page === totalPages}
                    className="flex items-center gap-1 rounded-md border px-2 py-1 text-xs disabled:opacity-40"
                  >
                    Siguiente
                    <ChevronRight className="h-3 w-3" />
                  </button>
                  <button
                    onClick={() => setPage(totalPages)}
                    disabled={page === totalPages}
                    className="flex items-center gap-1 rounded-md border px-2 py-1 text-xs disabled:opacity-40"
                  >
                    Última »
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </section>
    </div>
  );
}

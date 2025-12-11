// --- C:\Users\Laura\Desktop\Optim\DEV\optim-app\app\api\cima\actives\route.ts ---
import { NextRequest, NextResponse } from "next/server";

const CIMA_BASE_URL = "https://cima.aemps.es/cima/rest";

export type ActiveIngredient = {
  id: number;
  codigo: string;
  nombre: string;
};

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  const q = searchParams.get("q"); // búsqueda por nombre
  const code = searchParams.get("code");
  const id = searchParams.get("id");

  const params = new URLSearchParams();
  params.set("maestra", "1"); // Principios activos

  if (q) params.set("nombre", q);
  if (code) params.set("codigo", code);
  if (id) params.set("Id", id);

  const url = `${CIMA_BASE_URL}/maestras?${params.toString()}`;

  try {
    const res = await fetch(url, {
      headers: { Accept: "application/json" },
      next: { revalidate: 3600 }, // cache 1h
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: "Error al consultar CIMA (principios activos)" },
        { status: 502 }
      );
    }

    const data = await res.json();

    const items: ActiveIngredient[] = data.lista || [];

    return NextResponse.json(
      {
        source: "AEMPS-CIMA",
        fetchedAt: new Date().toISOString(),
        count: items.length,
        items,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[ACTIVES endpoint] error:", error);
    return NextResponse.json(
      { error: "Error de conexión con CIMA" },
      { status: 500 }
    );
  }
}


// --- C:\Users\Laura\Desktop\Optim\DEV\optim-app\app\api\cima\atc\route.ts ---
import { NextRequest, NextResponse } from "next/server";

const CIMA_BASE_URL = "https://cima.aemps.es/cima/rest";

export type AtcCode = {
  id: number;
  codigo: string;
  nombre: string;
};

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  const q = searchParams.get("q"); // búsqueda por nombre
  const code = searchParams.get("code"); // A02B, N02BE01...
  const id = searchParams.get("id");

  const params = new URLSearchParams();
  params.set("maestra", "7"); // Códigos ATC

  if (q) params.set("nombre", q);
  if (code) params.set("codigo", code);
  if (id) params.set("Id", id);

  const url = `${CIMA_BASE_URL}/maestras?${params.toString()}`;

  try {
    const res = await fetch(url, {
      headers: { Accept: "application/json" },
      next: { revalidate: 3600 },
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: "Error al consultar CIMA (ATC)" },
        { status: 502 }
      );
    }

    const data = await res.json();
    const items: AtcCode[] = data.lista || [];

    return NextResponse.json(
      {
        source: "AEMPS-CIMA",
        fetchedAt: new Date().toISOString(),
        count: items.length,
        items,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[ATC endpoint] error:", error);
    return NextResponse.json(
      { error: "Error de conexión con CIMA" },
      { status: 500 }
    );
  }
}


// --- C:\Users\Laura\Desktop\Optim\DEV\optim-app\app\api\cima\docs\route.ts ---
import { NextRequest, NextResponse } from "next/server";

const CIMA_BASE = "https://cima.aemps.es/cima";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  const id = searchParams.get("id"); // nregistro
  const type = searchParams.get("type"); // ft | p
  const section = searchParams.get("section"); // número de sección opcional
  const format = searchParams.get("format") ?? "json"; // json | html

  if (!id || !type) {
    return NextResponse.json(
      { error: "Parámetros requeridos: id, type" },
      { status: 400 }
    );
  }

  // 1 = FT, 2 = Prospecto
  const tipoDoc = type === "ft" ? 1 : 2;

  let url = "";
  let headers = {};

  if (format === "html") {
    // HTML completo
    url = `${CIMA_BASE}/dochtml/${type}/${id}/${type === "ft" ? "FichaTecnica" : "Prospecto"}.html`;
    headers = { Accept: "text/html" };
  } else {
    // JSON por secciones
    url = `${CIMA_BASE}/rest/docSegmentado/contenido/${tipoDoc}?nregistro=${id}`;
    if (section) url += `&seccion=${section}`;
    headers = { Accept: "application/json" };
  }

  try {
    const res = await fetch(url, {
      headers,
      next: { revalidate: 3600 }, // cache 1h
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: `Error al obtener documento (${type})` },
        { status: 502 }
      );
    }

    const content =
      format === "html" ? await res.text() : await res.json();

    return NextResponse.json(
      {
        source: "AEMPS-CIMA",
        fetchedAt: new Date().toISOString(),
        id,
        type,
        format,
        content,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[DOCS endpoint] Error:", error);
    return NextResponse.json(
      { error: "Error de conexión con CIMA" },
      { status: 500 }
    );
  }
}


// --- C:\Users\Laura\Desktop\Optim\DEV\optim-app\app\api\cima\forms\route.ts ---
import { NextRequest, NextResponse } from "next/server";

const CIMA_BASE_URL = "https://cima.aemps.es/cima/rest";

export type FormItem = {
  id: number;
  codigo: string;
  nombre: string;
};

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  const q = searchParams.get("q");
  const code = searchParams.get("code");
  const id = searchParams.get("id");
  const simplified = searchParams.get("simplified") === "true";

  // 3 = formas farmacéuticas, 13 = simplificadas (SNOMED)
  const maestra = simplified ? "13" : "3";

  const params = new URLSearchParams();
  params.set("maestra", maestra);

  if (q) params.set("nombre", q);
  if (code) params.set("codigo", code);
  if (id) params.set("Id", id);

  const url = `${CIMA_BASE_URL}/maestras?${params}`;

  try {
    const res = await fetch(url, {
      headers: { Accept: "application/json" },
      next: { revalidate: 3600 },
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: "Error al consultar CIMA (formas farmacéuticas)" },
        { status: 502 }
      );
    }

    const data = await res.json();
    const items: FormItem[] = data.lista || [];

    return NextResponse.json(
      {
        source: "AEMPS-CIMA",
        type: simplified ? "simplified" : "standard",
        fetchedAt: new Date().toISOString(),
        count: items.length,
        items,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[FORMS endpoint] error:", error);
    return NextResponse.json(
      { error: "Error de conexión con CIMA" },
      { status: 500 }
    );
  }
}


// --- C:\Users\Laura\Desktop\Optim\DEV\optim-app\app\api\cima\labs\route.ts ---
import { NextRequest, NextResponse } from "next/server";

const CIMA_BASE_URL = "https://cima.aemps.es/cima/rest";

export type LabItem = {
  id: number;
  codigo: string;
  nombre: string;
};

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  const q = searchParams.get("q");      // Buscar por nombre
  const code = searchParams.get("code");
  const id = searchParams.get("id");

  const params = new URLSearchParams();
  params.set("maestra", "6"); // 6 = Laboratorios

  if (q) params.set("nombre", q);
  if (code) params.set("codigo", code);
  if (id) params.set("Id", id);

  const url = `${CIMA_BASE_URL}/maestras?${params.toString()}`;

  try {
    const res = await fetch(url, {
      headers: { Accept: "application/json" },
      next: { revalidate: 3600 },
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: "Error al consultar CIMA (laboratorios)" },
        { status: 502 }
      );
    }

    const data = await res.json();
    const items: LabItem[] = data.lista || [];

    return NextResponse.json(
      {
        source: "AEMPS-CIMA",
        fetchedAt: new Date().toISOString(),
        count: items.length,
        items,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[LABS endpoint] Error:", error);
    return NextResponse.json(
      { error: "Error de conexión con CIMA" },
      { status: 500 }
    );
  }
}


// --- C:\Users\Laura\Desktop\Optim\DEV\optim-app\app\api\cima\materials\route.ts ---
import { NextRequest, NextResponse } from "next/server";

const CIMA_BASE_URL = "https://cima.aemps.es/cima/rest";

export type MaterialDocument = {
  nombre: string;
  url: string;
  fecha: number;
};

export type MedicationMaterials = {
  titulo: string;
  listaDocsPaciente: MaterialDocument[];
  listaDocsProfesional: MaterialDocument[];
  video?: string;
};

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  const id = searchParams.get("id"); // nregistro

  if (!id) {
    return NextResponse.json(
      { error: "El parámetro 'id' (nregistro) es obligatorio." },
      { status: 400 }
    );
  }

  const url = `${CIMA_BASE_URL}/materiales?nregistro=${id}`;

  try {
    const res = await fetch(url, {
      headers: { Accept: "application/json" },
      next: { revalidate: 3600 },
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: "Error al consultar CIMA (materiales informativos)" },
        { status: 502 }
      );
    }

    const data: MedicationMaterials[] = await res.json();

    return NextResponse.json(
      {
        source: "AEMPS-CIMA",
        fetchedAt: new Date().toISOString(),
        id,
        count: data.length,
        items: data,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[MATERIALS endpoint] Error:", error);
    return NextResponse.json(
      { error: "Error de conexión con CIMA" },
      { status: 500 }
    );
  }
}


// --- C:\Users\Laura\Desktop\Optim\DEV\optim-app\app\api\cima\medication\[id]\route.ts ---


// --- C:\Users\Laura\Desktop\Optim\DEV\optim-app\app\api\cima\medications\route.ts ---
import { NextRequest, NextResponse } from "next/server";

const CIMA_BASE_URL = "https://cima.aemps.es/cima/rest";

/**
 * Normaliza principios activos de CIMA
 */
function normalizePrincipios(raw: any): any[] {
  if (!raw || !Array.isArray(raw)) return [];

  return raw.map((p) => ({
    nombre: p.nombre || "",
    cantidad: p.cantidad || p.cant || null,
    unidad: p.unidad || null,
  }));
}

/**
 * Normaliza formas farmacéuticas
 */
function normalizeFormas(raw: any): string[] {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw.map((f) => f.nombre || f);

  if (typeof raw === "string") return [raw];

  return [];
}

/**
 * Normaliza vías de administración
 */
function normalizeVias(raw: any): string[] {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw.map((v) => v.nombre || v);

  if (typeof raw === "string") return [raw];

  return [];
}

/**
 * Normaliza presentaciones
 */
function normalizePresentaciones(raw: any): any[] {
  if (!raw || !Array.isArray(raw)) return [];

  return raw.map((p) => ({
    cn: p.cn || p.codigo || "",
    nombre: p.nombre || "",
  }));
}

/**
 * Normaliza códigos ATC
 */
function normalizeATC(raw: any): any[] {
  if (!raw || !Array.isArray(raw)) return [];

  return raw.map((a) => ({
    codigo: a.codigo || "",
    nombre: a.nombre || "",
  }));
}

/**
 * Normaliza medicamento completo
 */
function normalizeMedication(m: any) {
  return {
    nregistro: m.nregistro || "",
    nombre: m.nombre || "",
    labtitular: m.labtitular || "",

    principiosActivos: normalizePrincipios(m.pactivos || m.principiosActivos),
    formasFarmaceuticas: normalizeFormas(m.formafarmaceutica || m.formasFarmaceuticas),
    viasAdministracion: normalizeVias(m.viasAdministracion || m.vias),

    presentaciones: normalizePresentaciones(m.dosis || m.presentaciones),

    atc: normalizeATC(m.atcs),

    receta: Boolean(m.receta),
    huerfano: Boolean(m.huerfano),
    biosimilar: Boolean(m.biosimilar),
    psicotropo: Boolean(m.psicotropo),
    estupefaciente: Boolean(m.estupefaciente),
    triangulo: Boolean(m.triangulo),
    comerc: Boolean(m.comerc),
  };
}

/**
 * ENDPOINT GET /api/cima/medications
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  const params = new URLSearchParams();

  // Búsqueda libre
  const q = searchParams.get("q");
  if (q) params.set("nombre", q);

  // Filtros reales CIMA
  const mapParams = ["nombre", "laboratorio", "practiv1", "atc", "cn"];
  mapParams.forEach((p) => {
    const v = searchParams.get(p);
    if (v) params.set(p, v);
  });

  // Booleans
  ["receta", "psicotropo", "estupefaciente"].forEach((field) => {
    const v = searchParams.get(field);
    if (v === "0" || v === "1") params.set(field, v);
  });

  params.set("pagina", searchParams.get("page") ?? "1");

  const url = `${CIMA_BASE_URL}/medicamentos?${params.toString()}`;

  try {
    const res = await fetch(url, {
      headers: { Accept: "application/json" },
      next: { revalidate: 300 },
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: "Error consultando CIMA" },
        { status: 502 }
      );
    }

    const data = await res.json();
    const results = data.resultados || [];

    const normalized = results.map((m: any) => normalizeMedication(m));

    return NextResponse.json(
      {
        source: "CIMA",
        fetchedAt: new Date().toISOString(),
        pagina: data.pagina,
        total: data.total,
        tamanioPagina: data.tamanioPagina,
        items: normalized,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("CIMA ERROR:", error);
    return NextResponse.json(
      { error: "Error interno consultando CIMA" },
      { status: 500 }
    );
  }
}


// --- C:\Users\Laura\Desktop\Optim\DEV\optim-app\app\api\cima\medications\[nregistro]\route.ts ---


// --- C:\Users\Laura\Desktop\Optim\DEV\optim-app\app\api\cima\notes\route.ts ---
import { NextRequest, NextResponse } from "next/server";

const CIMA_BASE_URL = "https://cima.aemps.es/cima/rest";

export type NoteItem = {
  tipo: number; // 1 = Nota de seguridad
  num: string;
  ref: string;
  asunto: string;
  fecha: number;
  url: string;
};

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id"); // nregistro

  if (!id) {
    return NextResponse.json(
      { error: "El parámetro 'id' (nregistro) es obligatorio." },
      { status: 400 }
    );
  }

  const url = `${CIMA_BASE_URL}/notas?nregistro=${id}`;

  try {
    const res = await fetch(url, {
      headers: { Accept: "application/json" },
      next: { revalidate: 3600 },
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: "No se pudieron obtener las notas del medicamento." },
        { status: 502 }
      );
    }

    const notes: NoteItem[] = await res.json();

    return NextResponse.json(
      {
        source: "AEMPS-CIMA",
        fetchedAt: new Date().toISOString(),
        id,
        count: notes.length,
        items: notes,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[NOTES endpoint] Error:", error);

    return NextResponse.json(
      { error: "Error de conexión con CIMA." },
      { status: 500 }
    );
  }
}


// --- C:\Users\Laura\Desktop\Optim\DEV\optim-app\app\api\cima\presentations\route.ts ---
import { NextRequest, NextResponse } from "next/server";

const CIMA_BASE_URL = "https://cima.aemps.es/cima/rest";

export type PresentationItem = {
  cn: string;
  nregistro: string;
  nombre: string;
  pactivos: string;
  labtitular: string;
  cpresc: string;
  comerc: boolean;
  estupefaciente?: boolean;
  psicotropo?: boolean;
  estado?: any;
};

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  const params = new URLSearchParams();

  const map = {
    cn: "cn",
    nregistro: "nregistro",
    vmp: "vmp",
    vmpp: "vmpp",
    idpa: "idpractiv1",
    comerc: "comerc",
    estupefaciente: "estupefaciente",
    psicotropo: "psicotropo",
  } as const;

  for (const [key, value] of searchParams.entries()) {
    if (key in map) params.set(map[key as keyof typeof map], value);
  }

  const url = `${CIMA_BASE_URL}/presentaciones?${params.toString()}`;

  try {
    const res = await fetch(url, {
      headers: { Accept: "application/json" },
      next: { revalidate: 3600 },
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: "Error al consultar CIMA (presentaciones)" },
        { status: 502 }
      );
    }

    const list = await res.json();

    return NextResponse.json(
      {
        source: "AEMPS-CIMA",
        fetchedAt: new Date().toISOString(),
        count: list.length,
        items: list,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[PRESENTATIONS endpoint] Error:", error);
    return NextResponse.json(
      { error: "Error de conexión con CIMA" },
      { status: 500 }
    );
  }
}


// --- C:\Users\Laura\Desktop\Optim\DEV\optim-app\app\api\cima\routes\route.ts ---
import { NextRequest, NextResponse } from "next/server";

const CIMA_BASE_URL = "https://cima.aemps.es/cima/rest";

export type RouteItem = {
  id: number;
  codigo: string;
  nombre: string;
};

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  const q = searchParams.get("q");
  const code = searchParams.get("code");
  const id = searchParams.get("id");
  const simplified = searchParams.get("simplified") === "true";

  // 4 = vías estándar, 14 = vías simplificadas (SNOMED)
  const maestra = simplified ? "14" : "4";

  const params = new URLSearchParams();
  params.set("maestra", maestra);

  if (q) params.set("nombre", q);
  if (code) params.set("codigo", code);
  if (id) params.set("Id", id);

  const url = `${CIMA_BASE_URL}/maestras?${params.toString()}`;

  try {
    const res = await fetch(url, {
      headers: { Accept: "application/json" },
      next: { revalidate: 3600 },
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: "Error al consultar CIMA (vías de administración)" },
        { status: 502 }
      );
    }

    const data = await res.json();
    const items: RouteItem[] = data.lista || [];

    return NextResponse.json(
      {
        source: "AEMPS-CIMA",
        type: simplified ? "simplified" : "standard",
        fetchedAt: new Date().toISOString(),
        count: items.length,
        items,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[ROUTES endpoint] Error:", error);
    return NextResponse.json(
      { error: "Error de conexión con CIMA" },
      { status: 500 }
    );
  }
}


// --- C:\Users\Laura\Desktop\Optim\DEV\optim-app\app\api\cima\search\route.ts ---
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const CIMA_BASE_URL = "https://cima.aemps.es/cima/rest";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  const q = searchParams.get("q");
  const cn = searchParams.get("cn");
  const nregistro = searchParams.get("nregistro");
  const active = searchParams.get("active");  
  const lab = searchParams.get("lab");
  const atc = searchParams.get("atc");
  const receta = searchParams.get("receta");
  const estupefaciente = searchParams.get("estupefaciente");
  const psicotropo = searchParams.get("psicotropo");
  const page = searchParams.get("page") ?? "1";

  const params = new URLSearchParams();

  if (q) params.set("nombre", q);
  if (cn) params.set("cn", cn);
  if (nregistro) params.set("nregistro", nregistro);
  if (active) params.set("practiv1", active);
  if (lab) params.set("laboratorio", lab);
  if (atc) params.set("atc", atc);
  if (receta === "0" || receta === "1") params.set("receta", receta);
  if (estupefaciente === "0" || estupefaciente === "1") params.set("estupefaciente", estupefaciente);
  if (psicotropo === "0" || psicotropo === "1") params.set("psicotropo", psicotropo);

  params.set("pagina", page);

  const url = `${CIMA_BASE_URL}/medicamentos?${params.toString()}`;

  try {
    const res = await fetch(url, {
      headers: { Accept: "application/json" },
      cache: "no-store",
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: "Error al consultar medicamentos en CIMA" },
        { status: 502 }
      );
    }

    const data = await res.json();

    // NORMALIZAR CIMA (puede devolver lista o estructura con más datos)
    const results = Array.isArray(data) ? data : data?.resultados ?? [];

    return NextResponse.json(
      {
        source: "AEMPS-CIMA",
        fetchedAt: new Date().toISOString(),
        page: Number(page),
        count: results.length,
        items: results,
        raw: data,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[SEARCH endpoint] Error:", error);
    return NextResponse.json(
      { error: "Error interno conectando con CIMA" },
      { status: 500 }
    );
  }
}


// --- C:\Users\Laura\Desktop\Optim\DEV\optim-app\app\api\cima\supply\route.ts ---
import { NextRequest, NextResponse } from "next/server";

const CIMA_BASE_URL = "https://cima.aemps.es/cima/rest/medicamento";

/**
 * Normaliza el estado de suministro retornado por CIMA.
 */
function normalizeSupply(m: any) {
  if (!m) {
    return { estado: "normal" };
  }

  // CIMA usa múltiples campos según tipo de medicamento
  const rawEstado =
    m.estadoDistribucion ||
    m.estadoSuministro ||
    m.estado ||
    m.suministro ||
    "";

  let estado: "normal" | "amarillo" | "rojo" = "normal";

  const e = String(rawEstado).toLowerCase();

  if (
    e.includes("desabaste") ||
    e.includes("interrup") ||
    e.includes("cese")
  ) {
    estado = "rojo";
  } else if (
    e.includes("cautelar") ||
    e.includes("problema") ||
    e.includes("suministro") ||
    e.includes("retras")
  ) {
    estado = "amarillo";
  }

  const comentario =
    m.motivoDesabastecimiento ||
    m.motivo ||
    m.comentario ||
    null;

  const fechaPrevista =
    m.fechaPrevistaRestablecimiento ||
    m.fechaPrevista ||
    null;

  return {
    estado,
    comentario: comentario || undefined,
    fechaPrevista: fechaPrevista || undefined,
  };
}

export async function POST(req: NextRequest) {
  try {
    const { cns } = await req.json();

    if (!Array.isArray(cns) || cns.length === 0) {
      return NextResponse.json(
        { error: "Debes enviar un array de CNs." },
        { status: 400 }
      );
    }

    const uniqueCns = [...new Set(cns)];

    const results: Record<string, any> = {};

    // Pedimos CIMA en paralelo para máxima velocidad
    await Promise.all(
      uniqueCns.map(async (cn) => {
        const url = `${CIMA_BASE_URL}?cn=${cn}`;

        try {
          const res = await fetch(url, {
            headers: { Accept: "application/json" },
            next: { revalidate: 600 },
          });

          if (!res.ok) {
            results[cn] = { estado: "normal" };
            return;
          }

          const data = await res.json();
          results[cn] = normalizeSupply(data);
        } catch (err) {
          results[cn] = { estado: "normal" };
        }
      })
    );

    return NextResponse.json(results, { status: 200 });
  } catch (error) {
    console.error("[CIMA supply] Error:", error);
    return NextResponse.json(
      { error: "Error interno procesando suministro" },
      { status: 500 }
    );
  }
}


// --- C:\Users\Laura\Desktop\Optim\DEV\optim-app\app\api\cima\vmpp\route.ts ---
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const CIMA_BASE_URL = "https://cima.aemps.es/cima/rest";

export type VmppItem = {
  vmp?: string;
  vmpDesc?: string;
  vmpp?: string;
  vmppDesc?: string;
  presComerc?: number;
};

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  const params = new URLSearchParams();

  // Parámetros soportados por CIMA
  const map = {
    active: "practiv1",
    idactive: "idpractiv1",
    dose: "dosis",
    form: "forma",
    atc: "atc",
    name: "nombre",
    tree: "modoArbol",
  };

  // Mapeo dinámico
  for (const [key, val] of searchParams.entries()) {
    if (map[key as keyof typeof map]) {
      params.set(map[key as keyof typeof map], val);
    }
  }

  const url = `${CIMA_BASE_URL}/vmpp?${params.toString()}`;

  try {
    const res = await fetch(url, {
      headers: { Accept: "application/json" },
      cache: "no-store",
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: "Error al consultar VMPP en CIMA" },
        { status: 502 }
      );
    }

    const data = await res.json();

    // Normalizar: algunos resultados vienen como lista, otros como árbol
    const items = Array.isArray(data) ? data : data?.resultados ?? data;

    return NextResponse.json(
      {
        source: "AEMPS-CIMA",
        fetchedAt: new Date().toISOString(),
        count: Array.isArray(items) ? items.length : 1,
        items,
        raw: data, // opcional para depuración
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[VMPP endpoint] Error:", error);

    return NextResponse.json(
      { error: "Error conectando con CIMA para VMPP" },
      { status: 500 }
    );
  }
}



import { NextRequest, NextResponse } from "next/server";

const CIMA_BASE_URL = "https://cima.aemps.es/cima/rest/medicamento";

function normalizePrincipios(raw: any): any[] {
  if (!raw || !Array.isArray(raw)) return [];
  return raw.map((p) => ({
    nombre: p.nombre || "",
    cantidad: p.cantidad || p.cant || undefined,
    unidad: p.unidad || undefined,
  }));
}

function normalizeFormas(raw: any): string[] {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw.map((f) => f.nombre || f);
  if (typeof raw === "string") return [raw];
  return [];
}

function normalizeVias(raw: any): string[] {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw.map((v) => v.nombre || v);
  if (typeof raw === "string") return [raw];
  return [];
}

function normalizePresentaciones(raw: any): any[] {
  if (!raw || !Array.isArray(raw)) return [];
  return raw.map((p) => ({
    cn: p.cn || p.codigo || "",
    nombre: p.nombre || "",
    precio: p.precio || p.pvp || undefined,
    unidad: p.unidad || undefined,
    tama: p.tama || undefined,
  }));
}

function normalizeATC(raw: any): any[] {
  if (!raw || !Array.isArray(raw)) return [];
  return raw.map((a) => ({
    codigo: a.codigo || "",
    nombre: a.nombre || "",
  }));
}

function normalizeExcipientes(raw: any): string[] {
  if (!raw || !Array.isArray(raw)) return [];
  return raw.map((e) => e.nombre || e).filter(Boolean);
}

function normalizeDetail(m: any) {
  return {
    nregistro: m.nregistro || "",
    nombre: m.nombre || "",
    labtitular: m.labtitular || "",
    estado: m.estado || m.estadoComercializacion || null,

    principiosActivos: normalizePrincipios(m.pactivos || m.principiosActivos),
    formasFarmaceuticas: normalizeFormas(m.formasFarmaceuticas || m.formafarmaceutica),
    viasAdministracion: normalizeVias(m.viasAdministracion || m.vias),
    presentaciones: normalizePresentaciones(m.dosis || m.presentaciones),
    excipientes: normalizeExcipientes(m.excipientes),

    // ATC, receta, flags
    atc: normalizeATC(m.atcs),
    receta: Boolean(m.receta),
    huerfano: Boolean(m.huerfano),
    biosimilar: Boolean(m.biosimilar),
    psicotropo: Boolean(m.psicotropo),
    estupefaciente: Boolean(m.estupefaciente),
    triangulo: Boolean(m.triangulo),
    comerc: Boolean(m.comerc),

    // Textos si vienen
    formaTexto: m.formaFarmaceutica || undefined,
    viaTexto: m.viaAdministracion || undefined,

    _raw: m,
  };
}

export async function GET(
  req: NextRequest,
  { params }: { params: { nregistro: string } }
) {
  const { nregistro } = params;
  if (!nregistro) {
    return NextResponse.json(
      { error: "Falta nregistro" },
      { status: 400 }
    );
  }

  const url = `${CIMA_BASE_URL}?nregistro=${encodeURIComponent(nregistro)}`;

  try {
    const res = await fetch(url, {
      headers: { Accept: "application/json" },
      next: { revalidate: 300 },
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: "Error al consultar detalle en CIMA" },
        { status: 502 }
      );
    }

    const data = await res.json();
    const normalized = normalizeDetail(data);

    return NextResponse.json(
      {
        source: "CIMA",
        fetchedAt: new Date().toISOString(),
        item: normalized,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[CIMA detalle] Error:", error);
    return NextResponse.json(
      { error: "Error interno consultando detalle" },
      { status: 500 }
    );
  }
}

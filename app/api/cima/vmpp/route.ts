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

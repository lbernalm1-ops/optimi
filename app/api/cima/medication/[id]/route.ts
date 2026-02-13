import { NextRequest, NextResponse } from "next/server";

const CIMA_BASE_URL = "https://cima.aemps.es/cima/rest";

function isValidNregistro(id: string) {
  return /^\d{5,6}$/.test(id);
}

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const id = params.id;

  // ✅ no rompas el frontend: devuelve vacío si no parece nregistro
  if (!isValidNregistro(id)) {
    return NextResponse.json({ excipientes: [] }, { status: 200 });
  }

  const url = `${CIMA_BASE_URL}/medicamento?nregistro=${encodeURIComponent(id)}`;

  try {
    const res = await fetch(url, {
      headers: { Accept: "application/json" },
      // cache: "no-store", // si quieres evitar cache de Next en dev
    });

    // ✅ NO devuelvas 400 al navegador: devuelve vacío y listo
    if (!res.ok) {
      return NextResponse.json({ excipientes: [] }, { status: 200 });
    }

    const data = await res.json();

    // En el JSON de CIMA, "excipientes" es una lista de objetos.
    // Si tú quieres solo strings, mapeamos a nombre:
    const excipientes = Array.isArray(data?.excipientes)
      ? data.excipientes
          .map((e: any) => e?.nombre)
          .filter((x: any) => typeof x === "string" && x.trim().length > 0)
      : [];

    return NextResponse.json({ excipientes }, { status: 200 });
  } catch (e) {
    console.error("MEDICATION ERROR:", e);
    return NextResponse.json({ excipientes: [] }, { status: 200 });
  }
}

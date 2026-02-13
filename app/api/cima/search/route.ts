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

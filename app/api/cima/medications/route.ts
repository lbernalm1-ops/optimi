import { NextRequest, NextResponse } from "next/server";

const CIMA_BASE_URL = "https://cima.aemps.es/cima/rest";

export type CimaMedication = {
  nregistro: string;
  nombre: string;
  labtitular: string;
  cpresc?: string;
  receta?: boolean;
  comerc?: boolean;
  psum?: boolean;
  triangulo?: boolean;
  huerfano?: boolean;
  biosimilar?: boolean;
  ema?: boolean;
  atcs?: {
    codigo: string;
    nombre: string;
    nivel: number;
  }[];
  // Cualquier otro campo lo dejamos abierto
  [key: string]: any;
};

export type CimaMedicationListResponse = {
  total: number;
  pagina: number;
  tamanioPagina: number;
  resultados: CimaMedication[];
};

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  const params = new URLSearchParams();

  // 🔎 Parámetros que aceptará tu API interna
  const q = searchParams.get("q");
  const name = searchParams.get("name");
  const lab = searchParams.get("lab");
  const active = searchParams.get("active");
  const atc = searchParams.get("atc");
  const cn = searchParams.get("cn");
  const receta = searchParams.get("receta"); // "0" | "1"
  const estupefaciente = searchParams.get("estupefaciente"); // "0" | "1"
  const psicotropo = searchParams.get("psicotropo"); // "0" | "1"
  const page = searchParams.get("page") ?? "1";

  // 🧠 Mapeo a los parámetros reales de CIMA (GET medicamentos?{condiciones})
  // q = búsqueda libre → la usamos como nombre del medicamento
  if (q) {
    params.set("nombre", q);
  }
  if (name) params.set("nombre", name);
  if (lab) params.set("laboratorio", lab);
  if (active) params.set("practiv1", active);
  if (atc) params.set("atc", atc);
  if (cn) params.set("cn", cn);

  if (receta === "0" || receta === "1") {
    params.set("receta", receta);
  }
  if (estupefaciente === "1" || estupefaciente === "0") {
    params.set("estupefaciente", estupefaciente);
  }
  if (psicotropo === "1" || psicotropo === "0") {
    params.set("psicotropo", psicotropo);
  }

  params.set("pagina", page);

  const url = `${CIMA_BASE_URL}/medicamentos?${params.toString()}`;

  try {
    const res = await fetch(url, {
      headers: {
        Accept: "application/json",
      },
      // Cache revalidable 1h (ajústalo según te convenga)
      next: { revalidate: 3600 },
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      console.error("[CIMA medicamentos] Error:", res.status, text);
      return NextResponse.json(
        { error: "Error al consultar CIMA (medicamentos)" },
        { status: 502 },
      );
    }

    const data = (await res.json()) as CimaMedicationListResponse;

    // Puedes normalizar aquí si quieres, de momento devolvemos casi tal cual
    return NextResponse.json(
      {
        source: "AEMPS-CIMA",
        fetchedAt: new Date().toISOString(),
        ...data,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("[CIMA medicamentos] Excepción:", error);
    return NextResponse.json(
      { error: "Error de conexión con CIMA" },
      { status: 500 },
    );
  }
}

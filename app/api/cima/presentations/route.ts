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

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

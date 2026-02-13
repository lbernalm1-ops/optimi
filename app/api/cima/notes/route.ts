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

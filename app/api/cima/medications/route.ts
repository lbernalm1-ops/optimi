import { NextRequest, NextResponse } from "next/server";
import { normalizeMedication } from "./normalize";

const CIMA_BASE_URL = "https://cima.aemps.es/cima/rest";

/**
 * GET /api/cima/medications
 * Usa:
 *  - GET medicamentos → listado
 *  - GET medicamento → detalle (CN, ATC, docs…)
 *
 * Según CIMA REST API v1.23
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  const q = searchParams.get("q") ?? "";
  const page = searchParams.get("page") ?? "1";

  if (q.length < 2) {
    return NextResponse.json(
      { items: [], total: 0, tamanioPagina: 0 },
      { status: 200 }
    );
  }

  /* -------------------------------------------------
     1️⃣ LISTADO (GET medicamentos)
     ------------------------------------------------- */

  const listParams = new URLSearchParams();
  listParams.set("nombre", q);
  listParams.set("pagina", page);

  const listUrl = `${CIMA_BASE_URL}/medicamentos?${listParams.toString()}`;

  try {
    const listRes = await fetch(listUrl, {
      headers: { Accept: "application/json" },
    });

    if (!listRes.ok) {
      throw new Error("Error listando medicamentos");
    }

    const listData = await listRes.json();

    const items = listData.items ?? listData.resultados ?? [];
    const total = listData.total ?? items.length;
    const tamanioPagina =
      listData.tamanioPagina ?? items.length;

    /* -------------------------------------------------
       2️⃣ ENRIQUECIMIENTO (GET medicamento)
       ------------------------------------------------- */

    const detailedItems = await Promise.all(
      items.map(async (item: any) => {
        const nregistro = item.nregistro;
        if (!nregistro) return null;

        const detailUrl = `${CIMA_BASE_URL}/medicamento?nregistro=${nregistro}`;

        try {
          const detailRes = await fetch(detailUrl, {
            headers: { Accept: "application/json" },
          });

          if (!detailRes.ok) return null;

          const detailData = await detailRes.json();

          // 🔑 NORMALIZACIÓN ÚNICA
          return normalizeMedication(detailData);
        } catch {
          return null;
        }
      })
    );

    const cleanItems = detailedItems.filter(Boolean);

    return NextResponse.json(
      {
        items: cleanItems,
        total,
        tamanioPagina,
      },
      { status: 200 }
    );
  } catch (e) {
    console.error("CIMA medications error:", e);
    return NextResponse.json(
      { items: [], total: 0, tamanioPagina: 0 },
      { status: 200 }
    );
  }
}

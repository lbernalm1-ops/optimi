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

  const name = searchParams.get("name") ?? "";
  const principle = searchParams.get("principle") ?? "";
  const cn = searchParams.get("cn") ?? "";
  const page = searchParams.get("page") ?? "1";

// El dato debe ser mínimo de 2 caracteres para evitar sobrecargar la API
  if (name.length < 2 && principle.length < 2 && cn.length < 2) {
    return NextResponse.json(
      { items: [], total: 0, tamanioPagina: 0 },
      { status: 200 }
    );
  }

  /* -------------------------------------------------
     1️⃣ LISTADO (GET medicamentos)
     ------------------------------------------------- */

  const listParams = new URLSearchParams();
  if (name) listParams.set("nombre", name);
  if (principle) listParams.set("practiv1", principle);
  if (cn) listParams.set("cn", cn);
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

    let items = listData.items ?? listData.resultados ?? [];
    let total = listData.total ?? items.length;
    let tamanioPagina = listData.tamanioPagina ?? items.length;

    // Fallback: Si buscar por principio activo 1 no da resultados, 
    // probamos con principio activo 2
    if (principle && (!items || items.length === 0)) {
      console.info("CIMA medications: no results for practiv1, retrying with practiv2", { principle });

      const listParams2 = new URLSearchParams();
      if (name) listParams2.set("nombre", name);
      listParams2.set("practiv2", principle);
      if (cn) listParams2.set("cn", cn);
      listParams2.set("pagina", page);

      const listUrl2 = `${CIMA_BASE_URL}/medicamentos?${listParams2.toString()}`;

      try {
        const listRes2 = await fetch(listUrl2, { headers: { Accept: "application/json" } });
        if (listRes2.ok) {
          const listData2 = await listRes2.json();
          items = listData2.items ?? listData2.resultados ?? [];
          total = listData2.total ?? items.length;
          tamanioPagina = listData2.tamanioPagina ?? items.length;
          console.info("CIMA medications: practiv2 returned", { count: items.length });
        } else {
          console.warn("CIMA medications: practiv2 request failed", listRes2.status);
        }
      } catch (err) {
        console.warn("CIMA medications: practiv2 request error", err);
      }
    }

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

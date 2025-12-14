// app/api/cima/medications/normalize.ts

function toSentenceCase(str: string = "") {
  const lower = str.toLowerCase();
  return lower.charAt(0).toUpperCase() + lower.slice(1);
}

function formatName(name: string = "") {
  const lower = name.toLowerCase();
  return lower.replace(/\b\w/g, (c) => c.toUpperCase());
}

export function normalizeMedication(m: any) {
  const fechaAutorizacion = m?.estado?.aut
    ? new Date(m.estado.aut).toISOString().split("T")[0]
    : null;

  return {
    // -------------------------------
    // IDENTIFICACIÓN
    // -------------------------------
    nregistro: m.nregistro ?? "",
    nombre: formatName(m.nombre ?? ""),
    labtitular: m.labtitular ?? "",

    // -------------------------------
    // PRINCIPIO ACTIVO
    // -------------------------------
    principioActivo: m?.vtm?.nombre
      ? toSentenceCase(m.vtm.nombre)
      : null,

// -------------------------------
// DOSIS
// -------------------------------
dosis: Array.isArray(m.principiosActivos) && m.principiosActivos.length > 0
  ? m.principiosActivos
      .map((p: any) => {
        if (!p.cantidad || !p.unidad) return null;
        return `${p.cantidad} ${p.unidad}`;
      })
      .filter(Boolean)
      .join(" + ")
  : null,

// -------------------------------
// FORMAS
// -------------------------------
    formaFarmaceutica: m?.formaFarmaceutica?.nombre
      ? toSentenceCase(m.formaFarmaceutica.nombre)
      : null,

    formaFarmaceuticaSimplificada: m?.formaFarmaceuticaSimplificada?.nombre
      ? toSentenceCase(m.formaFarmaceuticaSimplificada.nombre)
      : null,

    // -------------------------------
    // VÍAS
    // -------------------------------
    viasAdministracion: Array.isArray(m.viasAdministracion)
      ? m.viasAdministracion.map((v: any) => toSentenceCase(v.nombre))
      : [],

    // -------------------------------
    // PRESENTACIONES
    // -------------------------------
presentaciones: Array.isArray(m.presentaciones)
  ? m.presentaciones.map((p: any) => ({
      cn: p.cn ?? "",
      nombre: p.nombre ? toSentenceCase(p.nombre) : null,
      comerc: Boolean(p.comerc),
      psum: Boolean(p.psum),
    }))
  : [],


    // -------------------------------
    // ATC
    // -------------------------------
    atcs: Array.isArray(m.atcs)
      ? m.atcs.map((a: any) => ({
          codigo: a.codigo ?? "",
          nombre: a.nombre ? toSentenceCase(a.nombre) : "",
        }))
      : [],

    // -------------------------------
    // DOCUMENTOS
    // -------------------------------
    documentos: Array.isArray(m.docs)
      ? {
          fichaTecnica: m.docs.find((d: any) => d.tipo === 1)?.urlHtml ?? null,
          prospecto: m.docs.find((d: any) => d.tipo === 2)?.urlHtml ?? null,
        }
      : { fichaTecnica: null, prospecto: null },

    // -------------------------------
    // EXCIPIENTES (CLAVE)
    // -------------------------------
    excipientes: Array.isArray(m.excipientes)
      ? m.excipientes
          .map((e: any) =>
            typeof e?.nombre === "string"
              ? e.nombre.toLowerCase()
              : null
          )
          .filter(Boolean)
      : [],

    // -------------------------------
    // INDICADORES
    // -------------------------------
    receta: Boolean(m.receta),
    generico: Boolean(m.generico),
    biosimilar: Boolean(m.biosimilar),
    huerfano: Boolean(m.huerfano),
    triangulo: Boolean(m.triangulo),
    conducir: Boolean(m.conduc),
    noSustituible: m?.nosustituible?.nombre ?? null,


    // -------------------------------
    // FECHA
    // -------------------------------
    fechaAutorizacion,
  };
}

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  Pill,
  Syringe,
  Factory,
  ChevronLeft,
  Scale,
} from "lucide-react";

type PrincipioActivo = {
  nombre: string;
  cantidad?: string;
  unidad?: string;
};

type Presentacion = {
  cn: string;
  nombre?: string;
  precio?: string;
  unidad?: string;
  tama?: string;
};

type AtcCode = {
  codigo: string;
  nombre: string;
};

type MedicationDetail = {
  nregistro: string;
  nombre: string;
  labtitular: string;
  estado?: string | null;
  principiosActivos?: PrincipioActivo[];
  formasFarmaceuticas?: string[];
  viasAdministracion?: string[];
  presentaciones?: Presentacion[];
  excipientes?: string[];
  atcs?: AtcCode[];
  receta?: boolean;
  huerfano?: boolean;
  biosimilar?: boolean;
  psicotropo?: boolean;
  estupefaciente?: boolean;
  triangulo?: boolean;
  comerc?: boolean;
};

async function fetchMedicationDetail(
  nregistro: string
): Promise<MedicationDetail | null> {
  const res = await fetch(`/api/cima/medications/${nregistro}`);
  if (!res.ok) return null;
  const data = await res.json();
  return data.item as MedicationDetail;
}

export default function MedicationDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const { id } = params;

  const [med, setMed] = useState<MedicationDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadMed = async () => {
      try {
        setLoading(true);
        const item = await fetchMedicationDetail(id);
        if (!item) setError("No se ha encontrado el medicamento.");
        else setMed(item);
      } catch {
        setError("Error cargando el medicamento.");
      } finally {
        setLoading(false);
      }
    };
    loadMed();
  }, [id]);

  if (loading) {
    return <p className="text-sm text-slate-500">Cargando…</p>;
  }

  if (error || !med) {
    return <p className="text-sm text-red-600">{error}</p>;
  }

  const ftUrl = `https://cima.aemps.es/cima/dochtml/ft/${med.nregistro}/FichaTecnica.html`;
  const prospUrl = `https://cima.aemps.es/cima/dochtml/p/${med.nregistro}/Prospecto.html`;

  return (
    <div className="flex flex-col gap-6">
      {/* BOTÓN VOLVER */}
      <div className="flex items-center gap-1 text-sm">
        <Link
          href="/medications"
          className="flex items-center gap-1 text-sky-600 hover:underline"
        >
          <ChevronLeft className="h-4 w-4" />
          Volver al vademécum
        </Link>
      </div>

      {/* CABECERA */}
      <section className="rounded-xl border bg-white p-6 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-3">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">
              {med.nombre}
            </h1>
            <p className="text-sm text-slate-600 flex items-center gap-2 mt-1">
              <Factory className="h-4 w-4" />
              {med.labtitular}
            </p>

            {med.estado && (
              <p className="text-xs text-slate-500 mt-1">
                Estado:{" "}
                <span className="font-medium text-slate-700">
                  {med.estado}
                </span>
              </p>
            )}
          </div>

          {/* BADGES */}
          <div className="flex flex-wrap gap-2 text-xs">
            {med.receta && (
              <span className="badge">🔖 Con receta</span>
            )}
            {med.triangulo && (
              <span className="badge-yellow">
                <AlertTriangle className="h-3 w-3 mr-1" />
                Seguimiento adicional
              </span>
            )}
            {med.huerfano && (
              <span className="badge-indigo">🧬 Huérfano</span>
            )}
            {med.biosimilar && (
              <span className="badge-sky">🧪 Biosimilar</span>
            )}
            {med.estupefaciente && (
              <span className="badge-red">💀 Estupefaciente</span>
            )}
            {med.psicotropo && (
              <span className="badge-purple">🔒 Psicótropo</span>
            )}
          </div>
        </div>

        {/* ACCIONES */}
        <div className="flex flex-wrap gap-3 pt-2 text-sm">
          <a
            href={ftUrl}
            target="_blank"
            className="btn-primary"
          >
            Ficha técnica
          </a>
          <a
            href={prospUrl}
            target="_blank"
            className="btn-secondary"
          >
            Prospecto
          </a>

          {/* COMPARAR */}
          <Link
            href={`/medications/compare?left=${med.nregistro}`}
            className="btn-outline"
          >
            <Scale className="h-4 w-4 mr-1" />
            Comparar presentaciones
          </Link>
        </div>
      </section>

      {/* PRINCIPIOS ACTIVOS */}
      <section className="grid md:grid-cols-3 gap-4">
        <div className="rounded-xl border bg-white p-4 shadow-sm md:col-span-2">
          <h2 className="flex items-center gap-2 text-sm font-semibold mb-2">
            <Pill className="h-4 w-4" />
            Principios activos
          </h2>

          <ul className="text-sm space-y-1">
            {med.principiosActivos?.map((pa, i) => (
              <li key={i}>
                <span className="font-medium">{pa.nombre}</span>
                {pa.cantidad && (
                  <>
                    {" — "}
                    <span className="text-slate-600">
                      {pa.cantidad}
                      {pa.unidad || ""}
                    </span>
                  </>
                )}
              </li>
            ))}
          </ul>
        </div>

        {/* FORMAS / VÍAS */}
        <div className="rounded-xl border bg-white p-4 shadow-sm space-y-3">
          <div>
            <h3 className="text-sm font-semibold mb-1 flex items-center gap-2">
              <Syringe className="h-4 w-4" />
              Forma farmacéutica
            </h3>
            <p className="text-sm">
              {med.formasFarmaceuticas?.join(", ") || "—"}
            </p>
          </div>

          <div>
            <h3 className="text-sm font-semibold mb-1">
              Vía de administración
            </h3>
            <p className="text-sm">
              {med.viasAdministracion?.join(", ") || "—"}
            </p>
          </div>
        </div>
      </section>

      {/* PRESENTACIONES */}
      <section className="rounded-xl border bg-white p-4 shadow-sm">
        <h2 className="text-sm font-semibold mb-3">
          Presentaciones (CN)
        </h2>

        <table className="min-w-full text-sm">
          <thead className="border-b bg-slate-50">
            <tr>
              <th className="px-3 py-2">CN</th>
              <th className="px-3 py-2">Descripción</th>
              <th className="px-3 py-2">Tamaño / unidad</th>
              <th className="px-3 py-2">Precio</th>
            </tr>
          </thead>
          <tbody>
            {med.presentaciones?.map((p) => (
              <tr key={p.cn} className="border-b">
                <td className="px-3 py-2 font-mono">{p.cn}</td>
                <td className="px-3 py-2">{p.nombre || "—"}</td>
                <td className="px-3 py-2">
                  {p.tama || p.unidad || "—"}
                </td>
                <td className="px-3 py-2">
                  {p.precio ? `${p.precio} €` : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {/* EXCIPIENTES + ATC */}
      <section className="grid md:grid-cols-2 gap-4">
        {/* EXCIPIENTES */}
        <div className="rounded-xl border bg-white p-4 shadow-sm">
          <h2 className="text-sm font-semibold mb-2">Excipientes</h2>
          <p className="text-sm whitespace-pre-line">
            {med.excipientes?.join(", ") || "No consta"}
          </p>
        </div>

        {/* ATC */}
        <div className="rounded-xl border bg-white p-4 shadow-sm">
          <h2 className="text-sm font-semibold mb-2">Códigos ATC</h2>

          <ul className="space-y-1 text-sm">
            {med.atcs?.map((a, i) => (
              <li key={i}>
                <span className="font-mono">{a.codigo}</span> — {a.nombre}
              </li>
            )) || <p>No consta</p>}
          </ul>
        </div>
      </section>
    </div>
  );
}

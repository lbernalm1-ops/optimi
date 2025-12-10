"use client";

import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";

// ------------------------
// TIPOS
// ------------------------
type Medication = {
  nregistro: string;
  nombre: string;
  labtitular: string;
  receta?: boolean;
  atcs?: { codigo: string; nombre: string }[];
  pactivos?: string;
  presentaciones?: any[];
};

// ------------------------
// PAGE COMPONENT
// ------------------------
export default function MedicationsPage() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<Medication[]>([]);
  const [page, setPage] = useState(1);

  // ------------------------
  // Buscar medicamentos
  // ------------------------
  const search = async () => {
    if (!query || query.length < 2) {
      setResults([]);
      return;
    }

    setLoading(true);

    try {
      const params = new URLSearchParams();
      params.set("q", query);
      params.set("page", page.toString());

      const res = await fetch(`/api/cima/search?${params.toString()}`);
      const data = await res.json();

      setResults(data.items || []);
    } catch (err) {
      console.error("Error searching medications:", err);
    }

    setLoading(false);
  };

  useEffect(() => {
    const delay = setTimeout(() => search(), 400);
    return () => clearTimeout(delay);
  }, [query, page]);

  // ------------------------
  // RENDER
  // ------------------------
  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Vademécum</h1>

      {/* SEARCH BAR */}
      <div>
        <Input
          placeholder="Buscar por nombre, CN, ATC, principio activo..."
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setPage(1);
          }}
        />
      </div>

      {/* LOADING */}
      {loading && (
        <div className="flex items-center gap-2 text-gray-600">
          <Loader2 className="animate-spin" size={20} />
          Buscando medicamentos...
        </div>
      )}

      {/* RESULTS */}
      <div className="space-y-3">
        {!loading && results.length === 0 && query.length >= 2 && (
          <p className="text-gray-500">No se encontraron resultados.</p>
        )}

        {results.map((med) => (
          <Card
            key={med.nregistro}
            className="border hover:shadow-md transition cursor-pointer"
          >
            <CardContent className="p-4">
              <div className="flex flex-col gap-1">
                <div className="text-lg font-semibold">{med.nombre}</div>

                <div className="text-sm text-gray-600">
                  {med.labtitular}
                </div>

                {/* BADGES */}
                <div className="flex flex-wrap gap-2 mt-2">
                  {med.receta && (
                    <Badge variant="destructive">Receta</Badge>
                  )}
                  {med.atcs?.map((a) => (
                    <Badge key={a.codigo} variant="secondary">
                      {a.codigo}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

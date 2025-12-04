// components/DrugSearchInput.tsx

import React, { useState, useMemo } from "react";
import { ALL_FORMS } from "../data/drugIndex";
import { FlatDrugForm } from "@/data/types/drugs";

interface DrugSearchInputProps {
  onSelect: (drug: FlatDrugForm) => void;
}

export default function DrugSearchInput({ onSelect }: DrugSearchInputProps) {
  const [query, setQuery] = useState("");

  const results = useMemo(() => {
    if (!query) return [];
    const q = query.toLowerCase();

    return ALL_FORMS.filter((f) =>
      f.name.toLowerCase().includes(q) ||
      f.actives.some((a) => a.toLowerCase().includes(q)) ||
      f.lab.toLowerCase().includes(q)
    ).slice(0, 20); // máximo 20 resultados
  }, [query]);

  return (
    <div className="relative w-full">
      <input
        type="text"
        className="border rounded px-3 py-2 w-full"
        placeholder="Buscar medicamento por nombre, activo o lab..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />

      {query && results.length > 0 && (
        <div className="absolute bg-white border rounded shadow-lg w-full mt-1 max-h-64 overflow-auto z-50">
          {results.map((drug) => (
            <button
              type="button"
              key={drug.registro}
              className="w-full text-left px-3 py-2 hover:bg-gray-100 cursor-pointer"
              onClick={() => {
                onSelect(drug);
                setQuery("");
              }}
            >
              <div className="font-medium">{drug.name}</div>
              <div className="text-xs text-gray-500">
                {drug.lab} • {drug.strength} • {drug.form}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

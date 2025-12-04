// lib/drug-search.ts

import { FlatDrugForm } from "@/data/types/drugs";
import { ALL_FORMS } from "../data/drugIndex";

export interface DrugSearchQuery {
  active?: string;
  lab?: string;
  registro?: string;
  groupKey?: string;
  drugKey?: string;
  generic?: boolean;
  injectable?: boolean;
  combo?: boolean;
  weightLoss?: boolean;
}

export function searchForms(query: DrugSearchQuery): FlatDrugForm[] {
  return ALL_FORMS.filter(form => {
    if (query.active) {
      const q = query.active.toLowerCase();
      if (!form.actives.some(a => a.toLowerCase().includes(q))) return false;
    }

    if (query.lab) {
      const q = query.lab.toLowerCase();
      if (!form.lab.toLowerCase().includes(q)) return false;
    }

    if (query.registro) {
      if (form.registro !== query.registro) return false;
    }

    if (query.groupKey && form.groupKey !== query.groupKey) return false;
    if (query.drugKey && form.drugKey !== query.drugKey) return false;

    if (query.generic === true && !form.isGeneric) return false;
    if (query.generic === false && form.isGeneric) return false;

    if (query.injectable === true && !form.isInjectable) return false;
    if (query.injectable === false && form.isInjectable) return false;

    if (query.combo === true && !form.isCombo) return false;
    if (query.combo === false && form.isCombo) return false;

    if (query.weightLoss === true && !form.isWeightLoss) return false;
    if (query.weightLoss === false && form.isWeightLoss) return false;

    return true;
  });
}

export function findByRegistro(registro: string): FlatDrugForm | undefined {
  return ALL_FORMS.find(f => f.registro === registro);
}

export function searchByActive(active: string): FlatDrugForm[] {
  return searchForms({ active });
}

export function searchByLab(lab: string): FlatDrugForm[] {
  return searchForms({ lab });
}

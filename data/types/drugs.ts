// ======================================================
// TYPES COMPATIBLES 100% CON TUS DATOS (readonly + vías reales)
// ======================================================

export type Route =
  | "oral"
  | "subcutánea"
  | "subcutánea / intramuscular"
  | "intravenosa"
  | "subcutánea (pluma)"
  | "inyectable"
  | string; // fallback por si aparece otra vía

// -------------------------
// FORMULARIO BASE
// -------------------------
export interface DrugFormBase {
  readonly name: string;
  readonly registro: string;
  readonly lab: string;
  readonly route: Route;
  readonly strength?: string;
  readonly form?: string;
  readonly actives: readonly string[];
}

// -------------------------
// FLAGS GENERADOS
// -------------------------
export interface DrugFormFlags {
  readonly isGeneric: boolean;
  readonly isBrand: boolean;
  readonly isInjectable: boolean;
  readonly isWeightLoss: boolean;
  readonly isCombo: boolean;
}

// -------------------------
// FORMA COMPLETA (APLANADA)
// -------------------------
export interface FlatDrugForm extends DrugFormBase, DrugFormFlags {
  readonly groupKey: string;
  readonly groupLabel: string;
  readonly drugKey: string;
  readonly drugLabel: string;
}

// -------------------------
// FÁRMACO (colección de formas)
// -------------------------
export interface Drug {
  readonly label: string;
  readonly forms: readonly DrugFormBase[];
}

// -------------------------
// GRUPO (colección de fármacos)
// -------------------------
export interface DrugGroup {
  readonly label: string;
  readonly drugs: Readonly<Record<string, Drug>>;
}

// -------------------------
// ALL GROUPS
// -------------------------
export type DrugGroups = Readonly<Record<string, DrugGroup>>;

// -------------------------
// FÁRMACO SIMPLIFICADO (para listados)
// -------------------------
export interface SimpleDrug {
  readonly key: string;
  readonly label: string;
  readonly groupKey: string;
  readonly groupLabel: string;
}

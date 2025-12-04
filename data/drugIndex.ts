// data/drugIndex.ts

import { DRUG_GROUPS } from "./drugGroups";
import type {
  DrugGroups,
  FlatDrugForm,
  SimpleDrug,
  DrugFormBase,
  DrugFormFlags,
} from "./types/drugs";

/**
 * Heurística para flags
 */
function computeFlags(base: DrugFormBase): DrugFormFlags {
  const nameUpper = base.name.toUpperCase();
  const activesUpper = base.actives.map((a) => a.toUpperCase());

  const isGeneric = nameUpper.includes(" EFG");
  const isBrand = !isGeneric;

  const isInjectable = base.route !== "oral";

  const weightLossActives = ["LIRAGLUTIDA", "SEMAGLUTIDA", "DULAGLUTIDA"];
  const isWeightLoss = activesUpper.some((a) =>
    weightLossActives.includes(a)
  );

  const isCombo = base.actives.length > 1;

  return {
    isGeneric,
    isBrand,
    isInjectable,
    isWeightLoss,
    isCombo,
  };
}

/**
 * Construye estructura aplanada desde DRUG_GROUPS
 */
function buildIndexes(drugGroups: DrugGroups) {
  const allForms: FlatDrugForm[] = [];
  const allDrugs: SimpleDrug[] = [];
  const activeSet = new Set<string>();

  for (const [groupKey, group] of Object.entries(drugGroups)) {
    const groupLabel = group.label;

    for (const [drugKey, drug] of Object.entries(group.drugs)) {
      const drugLabel = drug.label;

      allDrugs.push({
        key: drugKey,
        label: drugLabel,
        groupKey,
        groupLabel,
      });

      for (const form of drug.forms) {
        const flags = computeFlags(form);

        const flatForm: FlatDrugForm = {
          ...form,
          ...flags,
          groupKey,
          groupLabel,
          drugKey,
          drugLabel,
        };

        allForms.push(flatForm);
        form.actives.forEach((a) => activeSet.add(a));
      }
    }
  }

  const allActiveIngredients = Array.from(activeSet).sort((a, b) =>
    a.localeCompare(b, "es")
  );

  return {
    ALL_FORMS: allForms,
    ALL_DRUGS: allDrugs,
    ALL_ACTIVE_INGREDIENTS: allActiveIngredients,
  };
}
const INDEXES = buildIndexes(DRUG_GROUPS);

export const ALL_FORMS = INDEXES.ALL_FORMS;
export const ALL_DRUGS = INDEXES.ALL_DRUGS;
export const ALL_ACTIVE_INGREDIENTS = INDEXES.ALL_ACTIVE_INGREDIENTS;

// lib/clinicRules.ts

export type GlobalRole = "admin" | "doctor" | "nurse";
export type Level = "admin" | "supra" | "premium" | "medium" | "basic";

export type ClinicRole = "admin" | "doctor" | "nurse";

/* ----------------------------------------------------------
   1) REGLA: Rol dentro de la clínica
----------------------------------------------------------- */
/**
 * Convertimos el rol global en rol dentro de la clínica:
 * - admin → admin (no doctor)
 * - doctor → doctor
 * - nurse → nurse
 */
export function getClinicRoleFromProfileRole(role: GlobalRole): ClinicRole {
  if (role === "admin") return "admin";
  if (role === "nurse") return "nurse";
  return "doctor";
}

/* ----------------------------------------------------------
   2) REGLA: ¿Puede crear clínicas?
----------------------------------------------------------- */
/**
 * - level = admin → clínicas ilimitadas
 * - level = supra → hasta 3 clínicas
 * - otros niveles → no puede crear
 */
export function canUserCreateClinics(level: Level): boolean {
  return level === "admin" || level === "supra";
}

/**
 * Devuelve cuántas clínicas puede crear como máximo.
 * - admin → ilimitadas (Infinity)
 * - supra → 3
 * - premium/medium/basic → 0
 */
export function maxClinicsAllowed(level: Level): number {
  if (level === "admin") return Infinity;
  if (level === "supra") return 3;
  return 0;
}

/* ----------------------------------------------------------
   3) REGLA: ¿Puede pertenecer a clínicas?
----------------------------------------------------------- */
/**
 * - admin → sí
 * - supra → sí
 * - premium → sí
 * - medium/basic → NO
 */
export function canUserBelongToClinics(level: Level): boolean {
  return ["admin", "supra", "premium"].includes(level);
}

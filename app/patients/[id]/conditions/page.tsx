"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useParams, useRouter } from "next/navigation";

export default function EditConditionsPage() {
  const { id } = useParams(); // patient_id
  const router = useRouter();

  const [conditions, setConditions] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function loadConditions() {
      const { data } = await supabase
        .from("conditions")
        .select("*")
        .eq("patient_id", id)
        .single();

      setConditions(data);
      setLoading(false);
    }

    loadConditions();
  }, [id]);

  function updateField(field: string, value: any) {
    setConditions((prev: any) => ({ ...prev, [field]: value }));
  }

  async function handleSave(e: any) {
    e.preventDefault();
    setSaving(true);

    const { error } = await supabase
      .from("conditions")
      .update(conditions)
      .eq("patient_id", id);

    setSaving(false);

    if (error) {
      alert(error.message);
      return;
    }

    router.push(`/patients/${id}`);
  }

  if (loading) return <p>Cargando…</p>;
  if (!conditions) return <p>No existen condiciones para este paciente.</p>;

  return (
    <div style={{ padding: 20 }}>
      <h1>Editar condiciones</h1>

      <form
        onSubmit={handleSave}
        style={{ display: "flex", flexDirection: "column", gap: "16px" }}
      >
        {/* ========================================================= */}
        {/* ===========================  HTA  ========================= */}
        {/* ========================================================= */}

        <h3>HTA</h3>

        <label>
          ¿HTA?
          <select
            value={
              conditions.hta === null || conditions.hta === undefined
                ? ""
                : conditions.hta
                ? "yes"
                : "no"
            }
            onChange={(e) =>
              updateField(
                "hta",
                e.target.value === "" ? null : e.target.value === "yes"
              )
            }
          >
            <option value="">Selecciona…</option>
            <option value="no">No</option>
            <option value="yes">Sí</option>
          </select>
        </label>

        {conditions.hta === true && (
          <>
            <label>
              Años con HTA:
              <input
                type="text"
                value={conditions.hta_years || ""}
                onChange={(e) => updateField("hta_years", e.target.value)}
              />
            </label>

            <label>
              Tratamiento HTA:
              <select
                value={conditions.hta_treated ? "yes" : "no"}
                onChange={(e) =>
                  updateField("hta_treated", e.target.value === "yes")
                }
              >
                <option value="no">No</option>
                <option value="yes">Sí</option>
              </select>
            </label>
          </>
        )}

        {/* ========================================================= */}
        {/* ======================  DISLIPemia  ===================== */}
        {/* ========================================================= */}

        <h3>Dislipemia</h3>

        <label>
          ¿Dislipemia?
          <select
            value={
              conditions.dyslipemia === null ||
              conditions.dyslipemia === undefined
                ? ""
                : conditions.dyslipemia
                ? "yes"
                : "no"
            }
            onChange={(e) =>
              updateField(
                "dyslipemia",
                e.target.value === "" ? null : e.target.value === "yes"
              )
            }
          >
            <option value="">Selecciona…</option>
            <option value="no">No</option>
            <option value="yes">Sí</option>
          </select>
        </label>

        {conditions.dyslipemia === true && (
          <>
            <label>
              Años:
              <input
                type="text"
                value={conditions.dyslipemia_years || ""}
                onChange={(e) =>
                  updateField("dyslipemia_years", e.target.value)
                }
              />
            </label>

            <label>
              Tratamiento:
              <select
                value={conditions.dyslipemia_treated ? "yes" : "no"}
                onChange={(e) =>
                  updateField("dyslipemia_treated", e.target.value === "yes")
                }
              >
                <option value="no">No</option>
                <option value="yes">Sí</option>
              </select>
            </label>
          </>
        )}

        {/* ========================================================= */}
        {/* ========================  DIABETES  ====================== */}
        {/* ========================================================= */}

        <h3>Diabetes</h3>

        <label>
          ¿Diabetes?
          <select
            value={
              conditions.diabetes === null || conditions.diabetes === undefined
                ? ""
                : conditions.diabetes
                ? "yes"
                : "no"
            }
            onChange={(e) =>
              updateField(
                "diabetes",
                e.target.value === "" ? null : e.target.value === "yes"
              )
            }
          >
            <option value="">Selecciona…</option>
            <option value="no">No</option>
            <option value="yes">Sí</option>
          </select>
        </label>

        {conditions.diabetes === true && (
          <>
            <label>
              Años:
              <input
                type="text"
                value={conditions.diabetes_years || ""}
                onChange={(e) =>
                  updateField("diabetes_years", e.target.value)
                }
              />
            </label>

            <label>
              Tratamiento:
              <select
                value={conditions.diabetes_treated ? "yes" : "no"}
                onChange={(e) =>
                  updateField("diabetes_treated", e.target.value === "yes")
                }
              >
                <option value="no">No</option>
                <option value="yes">Sí</option>
              </select>
            </label>
          </>
        )}

        {/* ========================================================= */}
        {/* =======================  TABAQUISMO  ===================== */}
        {/* ========================================================= */}

        <h3>Tabaquismo</h3>

        <label>
          ¿Fumador?
          <select
            value={
              conditions.smoker === null || conditions.smoker === undefined
                ? ""
                : conditions.smoker
                ? "yes"
                : "no"
            }
            onChange={(e) =>
              updateField(
                "smoker",
                e.target.value === "" ? null : e.target.value === "yes"
              )
            }
          >
            <option value="">Selecciona…</option>
            <option value="no">No</option>
            <option value="yes">Sí</option>
          </select>
        </label>

        {conditions.smoker === true && (
          <>
            <label>
              Años:
              <input
                type="text"
                value={conditions.smoker_years || ""}
                onChange={(e) =>
                  updateField("smoker_years", e.target.value)
                }
              />
            </label>

            <label>
              Tratamiento:
              <select
                value={conditions.smoker_treated ? "yes" : "no"}
                onChange={(e) =>
                  updateField("smoker_treated", e.target.value === "yes")
                }
              >
                <option value="no">No</option>
                <option value="yes">Sí</option>
              </select>
            </label>
          </>
        )}

        {/* ========================================================= */}
        {/* ===========================  ERC  ======================== */}
        {/* ========================================================= */}

        <h3>ERC</h3>

        <label>
          ¿ERC?
          <select
            value={
              conditions.ckd === null || conditions.ckd === undefined
                ? ""
                : conditions.ckd
                ? "yes"
                : "no"
            }
            onChange={(e) =>
              updateField(
                "ckd",
                e.target.value === "" ? null : e.target.value === "yes"
              )
            }
          >
            <option value="">Selecciona…</option>
            <option value="no">No</option>
            <option value="yes">Sí</option>
          </select>
        </label>

        {conditions.ckd === true && (
          <>
            <label>
              Años:
              <input
                type="text"
                value={conditions.ckd_years || ""}
                onChange={(e) =>
                  updateField("ckd_years", e.target.value)
                }
              />
            </label>

            <label>
              Tratamiento:
              <select
                value={conditions.ckd_treated ? "yes" : "no"}
                onChange={(e) =>
                  updateField("ckd_treated", e.target.value === "yes")
                }
              >
                <option value="no">No</option>
                <option value="yes">Sí</option>
              </select>
            </label>
          </>
        )}

        {/* ========================================================= */}
        {/* ======================== BOTÓN ========================== */}
        {/* ========================================================= */}

        <button type="submit" disabled={saving} style={{ marginTop: 20 }}>
          {saving ? "Guardando…" : "Guardar cambios"}
        </button>
      </form>
    </div>
  );
}


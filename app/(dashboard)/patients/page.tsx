"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import Link from "next/link";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, Plus, ArrowRight } from "lucide-react";

type Patient = {
  id_patient: number;
  patient_code: string;
  sex: string;
  date_of_birth: string;
};

function getAge(dob: string) {
  const diff = Date.now() - new Date(dob).getTime();
  return Math.abs(new Date(diff).getUTCFullYear() - 1970);
}

export default function PatientsPage() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadPatients() {
      const { data, error } = await supabase
        .from("patients")
        .select("*")
        .order("id_patient", { ascending: true });

      if (error) console.error(error);
      setPatients(data || []);
      setLoading(false);
    }

    loadPatients();
  }, []);

  return (
    <div className="flex flex-col gap-6">
      {/* HEADER */}
      <div className="flex items-start justify-between border-b pb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-600 text-white">
            <Users className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl font-semibold tracking-tight">Pacientes</h1>
            <p className="text-sm text-slate-500">
              Gestión y listado de pacientes registrados
            </p>
          </div>
        </div>

        <Link href="/patients/new">
          <Button className="bg-sky-600 hover:bg-sky-700">
            <Plus className="mr-2 h-4 w-4" />
            Nuevo paciente
          </Button>
        </Link>
      </div>

      {/* TARJETA DE TABLA */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium text-slate-700">
            Listado de pacientes
          </CardTitle>
        </CardHeader>

        <CardContent>
          {loading && (
            <p className="py-4 text-sm text-slate-500">
              Cargando pacientes…
            </p>
          )}

          {!loading && patients.length === 0 && (
            <p className="py-4 text-sm text-slate-500">
              No hay pacientes registrados.
            </p>
          )}

          {!loading && patients.length > 0 && (
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="border-b text-xs uppercase text-slate-500">
                  <tr>
                    <th className="py-2 pr-4">Código</th>
                    <th className="py-2 pr-4">Sexo</th>
                    <th className="py-2 pr-4">Fecha nacimiento</th>
                    <th className="py-2 pr-4">Edad</th>
                    <th className="py-2 text-right">Acciones</th>
                  </tr>
                </thead>

                <tbody className="divide-y">
                  {patients.map((p) => (
                    <tr
                      key={p.id_patient}
                      className="hover:bg-slate-50 transition"
                    >
                      <td className="py-2 pr-4 font-medium text-slate-800">
                        {p.patient_code}
                      </td>
                      <td className="py-2 pr-4">
                        {p.sex === "female"
                          ? "Femenino"
                          : p.sex === "male"
                          ? "Masculino"
                          : p.sex}
                      </td>
                      <td className="py-2 pr-4">{p.date_of_birth}</td>
                      <td className="py-2 pr-4">
                        {p.date_of_birth
                          ? `${getAge(p.date_of_birth)} años`
                          : "—"}
                      </td>
                      <td className="py-2 pl-4 text-right">
                        <Link href={`/patients/${p.id_patient}`}>
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex items-center gap-1"
                          >
                            Ver ficha
                            <ArrowRight className="h-3 w-3" />
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}


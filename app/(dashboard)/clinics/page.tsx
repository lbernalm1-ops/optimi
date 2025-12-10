"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import {
  Users,
  Clock,
  Check,
  X,
  Building2,
  MailPlus,
  AlertCircle,
} from "lucide-react";

// 🔵 Importamos reglas centralizadas
import {
  canUserBelongToClinics,
  canUserCreateClinics,
  getClinicRoleFromProfileRole,
  maxClinicsAllowed,
} from "@/lib/clinicRules";

/* ----------------------------------------------------------
   TYPES
----------------------------------------------------------- */
type Profile = {
  id: string;
  email: string | null;
  professional_code: string | null;
  role: "admin" | "doctor" | "nurse";
  level: "admin" | "supra" | "premium" | "medium" | "basic";
};

type Clinic = {
  id: string;
  name: string;
  owner_id: string;
  role_in_clinic?: string;
};

type ClinicMember = {
  clinic_id: string;
  user_id: string;
  role_in_clinic: string;
  is_active: boolean;
  profiles: {
    id: string;
    email: string | null;
    professional_code: string | null;
    role: string;
  } | null;
};

type ClinicJoinRequest = {
  id: string;
  clinic_id: string;
  user_id: string;
  role: string;
  status: string;
  created_at: string;
  profiles: {
    id: string;
    email: string | null;
    professional_code: string | null;
    role: string;
  } | null;
};

/* ----------------------------------------------------------
   NOTIFICATIONS
----------------------------------------------------------- */
async function createNotification(
  userId: string,
  type: string,
  title: string,
  body: string,
  data?: any
) {
  try {
    await supabase.from("notifications").insert({
      user_id: userId,
      type,
      title,
      body,
      data: data ? JSON.stringify(data) : null,
    });
  } catch (error) {
    console.error("Error creando notificación:", error);
  }
}

/* ----------------------------------------------------------
   MAIN PAGE
----------------------------------------------------------- */
export default function ClinicsPage() {
  const [clinics, setClinics] = useState<Clinic[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [clinicCount, setClinicCount] = useState(0);

  async function loadClinics() {
    setLoading(true);

    // 🔵 Obtener usuario autenticado
    const { data: auth } = await supabase.auth.getUser();
    const uid = auth.user?.id || null;
    setUserId(uid);

    if (!uid) {
      setLoading(false);
      return;
    }

    // 🔵 Obtener perfil
    const { data: profileData } = await supabase
      .from("profiles")
      .select("id, role, level, email, professional_code")
      .eq("id", uid)
      .single();

    const typedProfile = profileData as Profile;
    setProfile(typedProfile);

    // 🔵 Contar cuántas clínicas posee el usuario
    const { count } = await supabase
      .from("clinics")
      .select("*", { count: "exact", head: true })
      .eq("owner_id", uid);

    setClinicCount(count ?? 0);

    // 🔵 Obtener clínicas donde pertenece
    const { data: memberships } = await supabase
      .from("clinic_members")
      .select("role_in_clinic, clinics(*)")
      .eq("user_id", uid)
      .eq("is_active", true);

    const clinicList =
      memberships?.map((m: any) => ({
        ...(m.clinics as Clinic),
        role_in_clinic: m.role_in_clinic,
      })) ?? [];

    setClinics(clinicList);
    setLoading(false);
  }

  useEffect(() => {
    loadClinics();
  }, []);

  /* ----------------------------------------------------------
     Aplicamos REGLAS desde clinicRules.ts
  ----------------------------------------------------------- */
  const canBelong = profile ? canUserBelongToClinics(profile.level) : false;

  const canCreate =
    profile && canUserCreateClinics(profile.level)
      ? clinicCount < maxClinicsAllowed(profile.level)
      : false;

  if (loading) return <p className="p-6 text-slate-600">Cargando clínicas…</p>;

  if (!canBelong) {
    return (
      <div className="max-w-3xl mx-auto px-6 py-10">
        <Card className="border-slate-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sky-900">
              <AlertCircle className="h-5 w-5 text-amber-500" />
              Acceso no incluido en tu plan
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-slate-600">
            <p>Tu plan actual no permite unirte a clínicas.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-sky-900 flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Mis clínicas
          </h1>
          <p className="text-xs text-slate-500">
            Gestiona tus clínicas y solicitudes.
          </p>
        </div>

        {/* 🔵 boton crear clínica usando reglas */}
        {canCreate && (
          <Button onClick={() => (window.location.href = "/clinics/new")}>
            Crear nueva clínica
          </Button>
        )}
      </div>

      <JoinClinicByCode
        currentUserId={userId!}
        currentProfile={profile}
        onJoined={loadClinics}
      />

      {clinics.length === 0 ? (
        <Card className="border-slate-200">
          <CardContent className="py-6 text-center text-sm text-slate-600">
            <p>No perteneces a ninguna clínica aún.</p>
          </CardContent>
        </Card>
      ) : (
        <Accordion type="single" collapsible className="space-y-4">
          {clinics.map((clinic) => (
            <AccordionItem
              value={clinic.id}
              key={clinic.id}
              className="border border-slate-200 rounded-lg"
            >
              <AccordionTrigger className="px-4 py-3">
                <div>
                  <p className="font-semibold text-sky-900">{clinic.name}</p>
                  <p className="text-xs text-slate-500">
                    Rol: {clinic.role_in_clinic}
                  </p>
                </div>
              </AccordionTrigger>

              <AccordionContent className="p-4 space-y-6">
                <ClinicMembers
                  clinicId={clinic.id}
                  currentUser={userId}
                  ownerId={clinic.owner_id}
                />

                <AddUserByEmail
                  clinicId={clinic.id}
                  clinicName={clinic.name}
                  ownerId={clinic.owner_id}
                  currentUser={userId}
                />

                <PendingRequests
                  clinicId={clinic.id}
                  clinicName={clinic.name}
                  ownerId={clinic.owner_id}
                  currentUser={userId}
                  onChanged={loadClinics}
                />

                <RejectedRequests clinicId={clinic.id} />
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      )}
    </div>
  );
}

/* ----------------------------------------------------------
   JOIN CLINIC BY CODE
---------------------------------------------------------- */
function JoinClinicByCode({
  currentUserId,
  currentProfile,
  onJoined,
}: {
  currentUserId: string;
  currentProfile: Profile | null;
  onJoined: () => void;
}) {
  const [code, setCode] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleJoin() {
    setMessage(null);

    if (!code.trim()) {
      setMessage("Introduce un código de clínica.");
      return;
    }

    setLoading(true);

    const { data: clinic } = await supabase
      .from("clinics")
      .select("id, name, owner_id")
      .eq("join_code", code.trim())
      .single();

    if (!clinic) {
      setLoading(false);
      setMessage("Código incorrecto.");
      return;
    }

    const { data: existingMember } = await supabase
      .from("clinic_members")
      .select("*")
      .eq("clinic_id", clinic.id)
      .eq("user_id", currentUserId)
      .eq("is_active", true);

    if (existingMember?.length) {
      setLoading(false);
      setMessage("Ya perteneces a esta clínica.");
      return;
    }

    const { data: existingReq } = await supabase
      .from("clinic_join_requests")
      .select("status")
      .eq("clinic_id", clinic.id)
      .eq("user_id", currentUserId)
      .order("created_at", { ascending: false })
      .limit(1);

    if (existingReq?.length && existingReq[0].status === "pending") {
      setLoading(false);
      setMessage("Ya tienes una solicitud pendiente.");
      return;
    }

    // 🔵 asignación de rol usando reglas globales
    const assignedRole = getClinicRoleFromProfileRole(
      currentProfile?.role || "doctor"
    );

    const { error } = await supabase.from("clinic_join_requests").insert({
      clinic_id: clinic.id,
      user_id: currentUserId,
      role: assignedRole,
      status: "pending",
    });

    if (error) {
      setLoading(false);
      setMessage("Error creando solicitud.");
      return;
    }

    setMessage(`Solicitud enviada a la clínica ${clinic.name}.`);

    await createNotification(
      clinic.owner_id,
      "clinic_join_request",
      "Nueva solicitud",
      `Un usuario quiere unirse a tu clínica ${clinic.name}.`,
      { clinicId: clinic.id, requesterId: currentUserId }
    );

    setLoading(false);
    onJoined();
  }

  return (
    <Card className="border-slate-200">
      <CardHeader>
        <CardTitle className="text-sm text-sky-800 flex items-center gap-2">
          <Building2 className="h-4 w-4" />
          Unirse a una clínica con código
        </CardTitle>
      </CardHeader>

      <CardContent className="flex flex-col gap-3 text-sm">
        <div className="flex flex-col sm:flex-row gap-2">
          <Input
            placeholder="Código"
            value={code}
            onChange={(e) => setCode(e.target.value)}
          />
          <Button onClick={handleJoin} disabled={loading}>
            {loading ? "Enviando…" : "Solicitar acceso"}
          </Button>
        </div>
        {message && <p className="text-xs text-slate-600">{message}</p>}
      </CardContent>
    </Card>
  );
}

/* ----------------------------------------------------------
   CLINIC MEMBERS
---------------------------------------------------------- */
function ClinicMembers({
  clinicId,
  currentUser,
  ownerId,
}: {
  clinicId: string;
  currentUser: string | null;
  ownerId: string;
}) {
  const [members, setMembers] = useState<ClinicMember[]>([]);

  const canManage = currentUser === ownerId;

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from("clinic_members")
        .select(
          "clinic_id, user_id, role_in_clinic, is_active, profiles(id, email, professional_code, role)"
        )
        .eq("clinic_id", clinicId)
        .eq("is_active", true);

      const formatted =
        data?.map((m: any) => ({
          ...m,
          profiles: Array.isArray(m.profiles) ? m.profiles[0] : m.profiles,
        })) ?? [];

      setMembers(formatted);
    }
    load();
  }, [clinicId]);

  async function handleExpel(userId: string) {
    if (!canManage) return;

    await supabase
      .from("clinic_members")
      .update({ is_active: false })
      .eq("clinic_id", clinicId)
      .eq("user_id", userId);

    setMembers((prev) => prev.filter((m) => m.user_id !== userId));
  }

  return (
    <Card className="border-slate-200">
      <CardHeader>
        <CardTitle className="text-sm text-sky-800 flex items-center gap-2">
          <Users className="h-4 w-4" />
          Miembros activos
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-3 text-sm">
        {members.length === 0 && (
          <p className="text-xs text-slate-500">No hay miembros todavía.</p>
        )}

        {members.map((m) => (
          <div
            key={m.user_id}
            className="flex items-center justify-between border-b pb-2"
          >
            <div>
              <p className="font-medium text-slate-800">
                {m.profiles?.professional_code ||
                  m.profiles?.email ||
                  m.profiles?.id}
              </p>
              <p className="text-xs text-slate-500">
                Rol en clínica: {m.role_in_clinic} • Global: {m.profiles?.role}
              </p>
            </div>

            {canManage && currentUser !== m.profiles?.id && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleExpel(m.user_id)}
              >
                Expulsar
              </Button>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

/* ----------------------------------------------------------
   ADD USER BY EMAIL
---------------------------------------------------------- */
function AddUserByEmail({
  clinicId,
  clinicName,
  ownerId,
  currentUser,
}: {
  clinicId: string;
  clinicName: string;
  ownerId: string;
  currentUser: string | null;
}) {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [notFoundEmail, setNotFoundEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const canManage = currentUser === ownerId;

  if (!canManage) return null;

  async function handleAdd() {
    setMessage(null);
    setNotFoundEmail(null);

    if (!email.trim()) {
      setMessage("Introduce un email.");
      return;
    }

    setLoading(true);

    const { data: userProfile, error } = await supabase
      .from("profiles")
      .select("id, role, level, email")
      .eq("email", email.trim())
      .single();

    if (error || !userProfile) {
      setNotFoundEmail(email.trim());
      setMessage("No existe un usuario con ese email.");
      setLoading(false);
      return;
    }

    const typed = userProfile as Profile;

    if (!canUserBelongToClinics(typed.level)) {
      setMessage("Ese usuario no tiene un plan que permita pertenecer a clínicas.");
      setLoading(false);
      return;
    }

    // 🔵 asignar rol según su rol global
    const clinicRole = getClinicRoleFromProfileRole(typed.role);

    const { error: insertError } = await supabase
      .from("clinic_members")
      .insert({
        clinic_id: clinicId,
        user_id: typed.id,
        role_in_clinic: clinicRole,
        is_active: true,
      });

    if (insertError) {
      setMessage("Error añadiendo al usuario.");
      setLoading(false);
      return;
    }

    setMessage("Usuario añadido correctamente.");
    setLoading(false);

    await createNotification(
      typed.id,
      "added_to_clinic",
      "Has sido añadido",
      `Has sido añadido a la clínica ${clinicName}.`,
      { clinicId }
    );
  }

  async function handleInviteEmail() {
    if (!notFoundEmail) return;
    setMessage(`Invitación enviada a ${notFoundEmail}. (Simulado)`);
    setNotFoundEmail(null);
  }

  return (
    <Card className="border-slate-200">
      <CardHeader>
        <CardTitle className="text-sm text-sky-800 flex items-center gap-2">
          <MailPlus className="h-4 w-4" />
          Añadir usuario por email
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-3 text-sm">
        <div className="flex flex-col sm:flex-row gap-2">
          <Input
            placeholder="Email del usuario"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <Button onClick={handleAdd} disabled={loading}>
            {loading ? "Añadiendo…" : "Añadir"}
          </Button>
        </div>

        {message && <p className="text-xs text-slate-600">{message}</p>}

        {notFoundEmail && (
          <div className="flex flex-col sm:flex-row gap-2 items-start text-xs">
            <p>No existe ese email. ¿Enviar invitación?</p>
            <Button size="sm" variant="outline" onClick={handleInviteEmail}>
              Enviar invitación
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/* ----------------------------------------------------------
   PENDING REQUESTS
---------------------------------------------------------- */
function PendingRequests({
  clinicId,
  clinicName,
  currentUser,
  ownerId,
  onChanged,
}: {
  clinicId: string;
  clinicName: string;
  currentUser: string | null;
  ownerId: string;
  onChanged: () => void;
}) {
  const [requests, setRequests] = useState<ClinicJoinRequest[]>([]);
  const isManager = currentUser === ownerId;

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from("clinic_join_requests")
        .select("*, profiles(id, email, professional_code, role)")
        .eq("clinic_id", clinicId)
        .eq("status", "pending")
        .order("created_at", { ascending: true });

      setRequests(data || []);
    }
    if (isManager) load();
  }, [clinicId, isManager]);

  if (!isManager) return null;

  async function handleDecision(
    request: ClinicJoinRequest,
    decision: "accept" | "reject"
  ) {
    if (decision === "accept") {
      // 🔵 Rol asignado según rol original del usuario
      const assignedRole = getClinicRoleFromProfileRole(
        request.profiles?.role as any
      );

      await supabase.from("clinic_members").insert({
        clinic_id: clinicId,
        user_id: request.user_id,
        role_in_clinic: assignedRole,
        is_active: true,
      });

      await supabase
        .from("clinic_join_requests")
        .update({ status: "approved" })
        .eq("id", request.id);

      await createNotification(
        request.user_id,
        "clinic_request_approved",
        "Solicitud aceptada",
        `Tu solicitud para unirte a ${clinicName} ha sido aceptada.`,
        { clinicId }
      );
    } else {
      await supabase
        .from("clinic_join_requests")
        .update({ status: "rejected" })
        .eq("id", request.id);

      await createNotification(
        request.user_id,
        "clinic_request_rejected",
        "Solicitud rechazada",
        `Tu solicitud para unirte a ${clinicName} ha sido rechazada.`,
        { clinicId }
      );
    }

    setRequests((prev) => prev.filter((r) => r.id !== request.id));
    onChanged();
  }

  return (
    <Card className="border-slate-200">
      <CardHeader>
        <CardTitle className="text-sm text-sky-800 flex items-center gap-2">
          <Clock className="h-4 w-4" />
          Solicitudes pendientes
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-3 text-sm">
        {requests.length === 0 && (
          <p className="text-xs text-slate-500">No hay solicitudes.</p>
        )}

        {requests.map((r) => (
          <div
            key={r.id}
            className="flex items-center justify-between border-b pb-2"
          >
            <div>
              <p className="font-medium">
                {r.profiles?.professional_code ||
                  r.profiles?.email ||
                  r.profiles?.id}
              </p>
              <p className="text-xs text-slate-500">
                Rol solicitado: {r.role} •{" "}
                {new Date(r.created_at).toLocaleString()}
              </p>
            </div>

            <div className="flex gap-2">
              <Button
                size="sm"
                className="bg-sky-600 text-white"
                onClick={() => handleDecision(r, "accept")}
              >
                <Check className="h-3 w-3" />
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={() => handleDecision(r, "reject")}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

/* ----------------------------------------------------------
   REJECTED REQUESTS
---------------------------------------------------------- */
function RejectedRequests({ clinicId }: { clinicId: string }) {
  const [rejected, setRejected] = useState<ClinicJoinRequest[]>([]);

  useEffect(() => {
    async function load() {
      const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

      const { data } = await supabase
        .from("clinic_join_requests")
        .select("*, profiles(id, email, professional_code, role)")
        .eq("clinic_id", clinicId)
        .eq("status", "rejected")
        .gte("created_at", since)
        .order("created_at", { ascending: false });

      setRejected(data || []);
    }
    load();
  }, [clinicId]);

  if (!rejected.length) return null;

  return (
    <Card className="border-slate-200">
      <CardHeader>
        <CardTitle className="text-sm text-sky-800 flex items-center gap-2">
          <X className="h-4 w-4" />
          Solicitudes rechazadas (30 días)
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-3 text-sm">
        {rejected.map((r) => (
          <div key={r.id} className="border-b pb-2">
            <p className="font-medium">
              {r.profiles?.professional_code ||
                r.profiles?.email ||
                r.profiles?.id}
            </p>
            <p className="text-xs text-slate-500">
              Rol: {r.role} • {new Date(r.created_at).toLocaleString()}
            </p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

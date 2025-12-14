"use client";

// app/(dashboard)/layout.tsx
import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import {
  LayoutDashboard,
  Users,
  Pill,
  Settings,
  Building2,
} from "lucide-react";

import { cn } from "@/lib/utils";

const navItems = [
  { label: "Resumen", href: "/dashboard", icon: LayoutDashboard },
  { label: "Pacientes", href: "/patients", icon: Users },

  // ⭐ Reemplaza al anterior “Valores clínicos”
  { label: "Clínicas", href: "/clinics", icon: Building2 },

  { label: "Medicación", href: "/medications", icon: Pill },
  { label: "Ajustes", href: "/settings", icon: Settings },
];

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <div className="flex h-screen">

        {/* SIDEBAR */}
        <aside className="hidden w-64 flex-col border-r bg-white/80 px-4 py-6 shadow-sm md:flex">
          
          {/* BRAND */}
          <div className="mb-8 flex items-center gap-2 px-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-600 text-white font-semibold">
              O
            </div>
            <div>
              <p className="text-sm font-semibold tracking-wide">
                Optim Clinical
              </p>
              <p className="text-xs text-slate-500">
                Gestor de pacientes crónicos
              </p>
            </div>
          </div>

          {/* NAVIGATION */}
          <nav className="flex flex-1 flex-col gap-1">
            {navItems.map((item) => (
              <NavItem key={item.href} {...item} />
            ))}
          </nav>

          {/* FOOTER */}
          <div className="mt-auto border-t pt-4 text-xs text-slate-400 tracking-wide">
            © {new Date().getFullYear()} Optim • Uso clínico
          </div>
        </aside>

        {/* CONTENT AREA */}
        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto flex h-full max-w-8xl flex-col px-4 py-6 md:px-8">
            {children}
          </div>
        </main>

      </div>
    </div>
  );
}

function NavItem({
  label,
  href,
  icon: Icon,
}: {
  label: string;
  href: string;
  icon: typeof LayoutDashboard;
}) {
  const pathname = usePathname();
  const active = pathname === href || pathname.startsWith(href + "/");

  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-2 rounded-lg px-3 py-2 text-sm tracking-wide transition-colors",
        active
          ? "bg-sky-50 text-sky-700 font-medium"
          : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
      )}
    >
      <Icon className="h-4 w-4" />
      <span>{label}</span>
    </Link>
  );
}

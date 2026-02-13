"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { BookOpen, Star, Columns } from "lucide-react";

export default function MedicationsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const tabs = [
    { label: "Vademécum", href: "/medications", icon: BookOpen },
    { label: "Favoritos", href: "/medications/favorites", icon: Star },
    { label: "Comparador", href: "/medications/compare", icon: Columns },
  ];

  return (
    <div className="flex flex-col w-full">

      {/* SUBNAV */}
      <div className="mb-6 flex items-center gap-2 border-b pb-2">
        {tabs.map((tab) => {
          const active =
            pathname === tab.href ||
            pathname.startsWith(tab.href + "/");

          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                "flex items-center gap-1 rounded-md px-3 py-1.5 text-sm font-medium transition",
                active
                  ? "bg-sky-100 text-sky-700 shadow-sm"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              )}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </Link>
          );
        })}
      </div>

      {/* CONTENT */}
      <div className="flex-1">{children}</div>
    </div>
  );
}


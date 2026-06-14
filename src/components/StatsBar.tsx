"use client";

import { Clock, CheckCircle, AlertTriangle, XCircle } from "lucide-react";
import type { Application } from "@/lib/types";

export default function StatsBar({ applications }: { applications: Application[] }) {
  const pending = applications.filter(
    (a) => a.status === "pending" || a.status === "analyzing"
  ).length;
  const approved = applications.filter((a) => a.status === "approved").length;
  const flagged = applications.filter((a) => a.status === "flagged").length;
  const rejected = applications.filter((a) => a.status === "rejected").length;

  const stats = [
    {
      label: "Pending Review",
      value: pending,
      icon: Clock,
      color: "text-slate-600",
      bg: "bg-slate-100",
    },
    {
      label: "Approved",
      value: approved,
      icon: CheckCircle,
      color: "text-emerald-600",
      bg: "bg-emerald-50",
    },
    {
      label: "Flagged",
      value: flagged,
      icon: AlertTriangle,
      color: "text-amber-600",
      bg: "bg-amber-50",
    },
    {
      label: "Rejected",
      value: rejected,
      icon: XCircle,
      color: "text-red-600",
      bg: "bg-red-50",
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
      {stats.map((stat) => (
        <div key={stat.label} className="card p-4 flex items-center gap-3">
          <div className={`w-10 h-10 rounded-lg ${stat.bg} flex items-center justify-center flex-shrink-0`}>
            <stat.icon size={20} className={stat.color} />
          </div>
          <div>
            <div className={`text-2xl font-bold ${stat.color}`}>{stat.value}</div>
            <div className="text-xs text-slate-500">{stat.label}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

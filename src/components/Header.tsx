"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ShieldCheck, List, Upload } from "lucide-react";

export default function Header() {
  const pathname = usePathname();

  return (
    <header className="bg-navy-900 border-b border-navy-800 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gold-500 rounded flex items-center justify-center">
              <ShieldCheck size={18} className="text-navy-900" />
            </div>
            <div>
              <div className="text-white font-bold text-sm leading-none">
                TTB Label Review
              </div>
              <div className="text-navy-400 text-xs leading-none mt-0.5">
                AI-Powered Compliance System
              </div>
            </div>
          </Link>

          <nav className="flex items-center gap-1">
            <Link
              href="/"
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                pathname === "/"
                  ? "bg-navy-700 text-white"
                  : "text-navy-400 hover:text-white hover:bg-navy-800"
              }`}
            >
              <List size={16} />
              Applications
            </Link>
            <Link
              href="/batch"
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                pathname === "/batch"
                  ? "bg-navy-700 text-white"
                  : "text-navy-400 hover:text-white hover:bg-navy-800"
              }`}
            >
              <Upload size={16} />
              Batch Upload
            </Link>
          </nav>

          <div className="flex items-center gap-2">
            <span className="text-xs text-navy-400 hidden sm:block">
              27 CFR Parts 4, 5 & 7
            </span>
            <div className="w-2 h-2 bg-emerald-400 rounded-full" title="System online" />
          </div>
        </div>
      </div>
    </header>
  );
}

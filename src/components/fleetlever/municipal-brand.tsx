"use client";

import { ArrowLeft, Building2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";

type MunicipalBrandLockupProps = {
  className?: string;
  compact?: boolean;
  context?: string;
  inverse?: boolean;
};

export function MunicipalBrandLockup({ className = "", compact = false, context = "Πύλη εργαζομένων", inverse = false }: MunicipalBrandLockupProps) {
  return (
    <div className={`flex min-w-0 items-center gap-3 ${className}`}>
      <div className={compact ? "grid h-14 w-40 shrink-0 place-items-center" : "grid h-14 w-28 shrink-0 place-items-center rounded-sm bg-[#113f3a] px-3 ring-1 ring-white/10"}>
        <Image
          src="/municipal/elliniko-argyroupoli-logo-white.png"
          alt="Δήμος Ελληνικού Αργυρούπολης"
          width={270}
          height={78}
          className={compact ? "h-auto w-full object-contain" : "h-auto w-full"}
          priority
        />
      </div>
      {!compact ? (
        <div className="min-w-0">
          <p className={`truncate text-xs font-black uppercase tracking-wide ${inverse ? "text-[#8be4df]" : "text-[#008f9a]"}`}>Δήμος Ελληνικού-Αργυρούπολης</p>
          <p className={`mt-1 text-sm font-black ${inverse ? "text-white" : "text-[#203a35]"}`}>{context}</p>
        </div>
      ) : null}
    </div>
  );
}

type MunicipalPortalBrandProps = {
  className?: string;
};

export function MunicipalPortalBrand({ className = "" }: MunicipalPortalBrandProps) {
  return (
    <div className={`flex flex-col gap-5 sm:flex-row sm:items-center ${className}`}>
      <div className="grid size-28 shrink-0 place-items-center rounded-sm border border-[#b8cdc6] bg-white/70 p-4 shadow-[0_18px_50px_rgba(18,60,54,0.10)] sm:size-36">
        <Image
          src="/municipal/elliniko-argyroupoli-mark.png"
          alt="Σήμα Δήμου Ελληνικού Αργυρούπολης"
          width={400}
          height={401}
          className="h-full w-full object-contain"
          priority
        />
      </div>
      <div className="min-w-0">
        <p className="text-sm font-black uppercase tracking-wide text-[#008f9a]">Δήμος Ελληνικού-Αργυρούπολης</p>
        <h2 className="mt-2 max-w-2xl text-balance text-3xl font-black leading-none text-[#123c36] sm:text-5xl">
          Εσωτερική πύλη εργαζομένων
        </h2>
        <p className="mt-3 max-w-xl text-base font-bold leading-relaxed text-[#526962]">
          Ενιαία πρόσβαση στις εφαρμογές λειτουργίας του Δήμου, με κοινή είσοδο για στόλο, υπηρεσίες πόλης και νέες δομές.
        </p>
      </div>
    </div>
  );
}

type PortalReturnLinkProps = {
  className?: string;
  label?: string;
};

export function PortalReturnLink({ className = "", label = "Πύλη εφαρμογών" }: PortalReturnLinkProps) {
  return (
    <Link
      href="/main-page"
      className={`inline-flex min-h-9 items-center gap-2 rounded-md border border-[#007582] bg-[#008f9a] px-3 text-sm font-black text-white shadow-[0_10px_24px_rgba(0,143,154,0.18)] transition hover:border-[#005f67] hover:bg-[#007582] ${className}`}
    >
      <ArrowLeft className="size-4" aria-hidden="true" />
      {label}
    </Link>
  );
}

export function MunicipalServiceChip({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-sm border border-[#9fc7c8] bg-[#eff8f4] px-3 py-2 text-xs font-black uppercase text-[#123c36]">
      <Building2 className="size-4 text-[#008f9a]" aria-hidden="true" />
      {children}
    </span>
  );
}

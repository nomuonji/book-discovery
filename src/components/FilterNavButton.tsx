"use client";

import { useRouter } from "next/navigation";
import type { ReactNode } from "react";

interface FilterNavButtonProps {
  href: string;
  className?: string;
  children: ReactNode;
  ariaLabel?: string;
}

export function FilterNavButton({ href, className, children, ariaLabel }: FilterNavButtonProps) {
  const router = useRouter();

  return (
    <button
      type="button"
      onClick={() => router.push(href)}
      className={className}
      aria-label={ariaLabel}
    >
      {children}
    </button>
  );
}

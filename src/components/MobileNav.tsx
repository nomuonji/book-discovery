"use client";

import { useState } from "react";
import Link from "next/link";
import { getAllCategories } from "@/lib/data-client";

export function MobileNav() {
  const [open, setOpen] = useState(false);
  const categories = getAllCategories();

  return (
    <>
      {/* Hamburger button */}
      <button
        onClick={() => setOpen(!open)}
        className="flex md:hidden items-center justify-center w-9 h-9 rounded-lg border border-[var(--border)] hover:border-[var(--accent)] transition-colors"
        aria-label="メニューを開く"
      >
        <span className="relative w-4 h-3.5">
          <span className={`absolute left-0 w-full h-0.5 bg-current rounded transition-all duration-200 ${open ? "top-1.5 rotate-45" : "top-0"}`} />
          <span className={`absolute left-0 top-1.5 w-full h-0.5 bg-current rounded transition-all duration-200 ${open ? "opacity-0" : "opacity-100"}`} />
          <span className={`absolute left-0 w-full h-0.5 bg-current rounded transition-all duration-200 ${open ? "top-1.5 -rotate-45" : "top-3"}`} />
        </span>
      </button>

      {/* Overlay */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/40 md:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Slide-out menu */}
      <nav
        className={`fixed top-0 right-0 z-50 h-full w-64 bg-[var(--card)] border-l border-[var(--border)] shadow-xl md:hidden transform transition-transform duration-250 ${open ? "translate-x-0" : "translate-x-full"}`}
      >
        <div className="flex items-center justify-between p-4 border-b border-[var(--border)]">
          <span className="text-sm font-bold text-[var(--accent)]">📚 メニュー</span>
          <button
            onClick={() => setOpen(false)}
            className="w-8 h-8 flex items-center justify-center rounded hover:bg-[var(--card-hover)] transition-colors"
            aria-label="メニューを閉じる"
          >
            ✕
          </button>
        </div>

        <div className="p-4 space-y-1">
          <Link
            href="/"
            onClick={() => setOpen(false)}
            className="block px-3 py-2 rounded-lg hover:bg-[var(--card-hover)] transition-colors text-sm font-medium"
          >
            🏠 ホーム
          </Link>
          <Link
            href="/books"
            onClick={() => setOpen(false)}
            className="block px-3 py-2 rounded-lg hover:bg-[var(--card-hover)] transition-colors text-sm font-medium"
          >
            📚 すべての本
          </Link>
          <Link
            href="/paths"
            onClick={() => setOpen(false)}
            className="block px-3 py-2 rounded-lg hover:bg-[var(--card-hover)] transition-colors text-sm font-medium"
          >
            🗺️ 読書パス
          </Link>
          <Link
            href="/recommend"
            onClick={() => setOpen(false)}
            className="block px-3 py-2 rounded-lg hover:bg-[var(--card-hover)] transition-colors text-sm font-medium"
          >
            🎯 おすすめを探す
          </Link>

          <div className="border-t border-[var(--border)] my-3" />

          <p className="px-3 text-xs font-medium text-[var(--muted)] mb-1">カテゴリ</p>
          {categories.map((cat) => (
            <Link
              key={cat.slug}
              href={`/categories/${cat.slug}`}
              onClick={() => setOpen(false)}
              className="block px-3 py-1.5 rounded-lg hover:bg-[var(--card-hover)] transition-colors text-sm"
            >
              {cat.label}
              <span className="text-[var(--muted)] ml-1 text-xs">({cat.count})</span>
            </Link>
          ))}
        </div>
      </nav>
    </>
  );
}

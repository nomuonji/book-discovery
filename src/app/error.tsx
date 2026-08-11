"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function ErrorPage({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="max-w-5xl mx-auto px-4 py-16 flex flex-col items-center justify-center min-h-[50vh] text-center">
      <div className="text-5xl mb-4">⚠️</div>
      <h1 className="text-xl font-bold mb-2">エラーが発生しました</h1>
      <p className="text-sm text-[var(--muted)] mb-6 max-w-md">
        ページの読み込み中に問題が発生しました。一時的な問題かもしれませんので、もう一度お試しください。
      </p>
      <div className="flex gap-3">
        <button
          onClick={retry}
          className="px-5 py-2.5 bg-[var(--accent)] text-[var(--background)] rounded-lg hover:opacity-90 transition-opacity text-sm font-medium"
        >
          もう一度試す
        </button>
        <Link
          href="/"
          className="px-5 py-2.5 border border-[var(--border)] rounded-lg hover:border-[var(--accent)] hover:text-[var(--accent)] transition-colors text-sm"
        >
          ホームに戻る
        </Link>
      </div>
    </div>
  );
}

import Link from "next/link";

export default function NotFound() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-16 flex flex-col items-center justify-center min-h-[50vh] text-center">
      <div className="text-6xl mb-4">📭</div>
      <h1 className="text-2xl font-bold mb-2">ページが見つかりません</h1>
      <p className="text-sm text-[var(--muted)] mb-6 max-w-md">
        お探しのページは削除されたか、URLが間違っている可能性があります。
      </p>
      <div className="flex gap-3">
        <Link
          href="/"
          className="px-5 py-2.5 bg-[var(--accent)] text-white rounded-lg hover:opacity-90 transition-opacity text-sm font-medium"
        >
          ホームに戻る
        </Link>
        <Link
          href="/books"
          className="px-5 py-2.5 border border-[var(--border)] rounded-lg hover:border-[var(--accent)] hover:text-[var(--accent)] transition-colors text-sm"
        >
          本を探す
        </Link>
      </div>
    </div>
  );
}

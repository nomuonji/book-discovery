export default function Loading() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-16 flex flex-col items-center justify-center min-h-[50vh]">
      <div className="flex flex-col items-center gap-4">
        {/* Spinner */}
        <div className="relative w-12 h-12">
          <div className="absolute inset-0 rounded-full border-4 border-[var(--border)]" />
          <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-[var(--accent)] animate-spin" />
        </div>
        <p className="text-sm text-[var(--muted)] animate-pulse">読み込み中...</p>
      </div>
    </div>
  );
}

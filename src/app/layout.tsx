import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import "./globals.css";
import { getAllCategories, getStats } from "@/lib/data";
import { MobileNav } from "@/components/MobileNav";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: { default: "読書の羅針盤 — 世界の名作と出会う", template: "%s | 読書の羅針盤" },
  description: "文学史に残る古典から現代の受賞作まで、厳選した世界の名作を日本語で発見できる読書ガイド。村上春樹好きにおすすめの海外文学から、実存主義の読書パスまで。",
  // 暫定: カスタムドメイン取得までは Cloudflare Pages の URL。
  // 取得後は本来のドメインに戻すこと（robots.ts / sitemap.ts / bot/config.ts も同様）。
  metadataBase: new URL("https://book-discovery-cu3.pages.dev"),
  openGraph: {
    title: "読書の羅針盤 — 世界の名作と出会う",
    description: "あなたの次の一冊を、世界の名作から。厳選した海外文学・思想書を日本語で発見できる読書ガイド。",
    siteName: "読書の羅針盤",
    locale: "ja_JP",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "読書の羅針盤",
    description: "あなたの次の一冊を、世界の名作から。",
  },
};

function Header() {
  const categories = getAllCategories();

  return (
    <header className="sticky top-0 z-50 bg-[var(--background)]/90 backdrop-blur border-b border-[var(--border)]">
      <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
        <Link href="/" className="text-lg font-bold tracking-tight text-[var(--accent)] hover:opacity-80 transition-opacity shrink-0">
          📚 読書の羅針盤
        </Link>

        {/* Simple search form (hidden on smallest screens) */}
        <form action="/books" method="GET" className="hidden sm:block flex-1 max-w-xs mx-auto">
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-[var(--muted)] pointer-events-none">
              🔍
            </span>
            <input
              type="text"
              name="q"
              placeholder="本・著者を検索..."
              className="w-full pl-9 pr-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--card)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent text-sm"
            />
          </div>
        </form>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-5 text-sm shrink-0">
          <div className="relative group">
            <Link href="/books" className="hover:text-[var(--accent)] transition-colors py-2">
              本を探す ▾
            </Link>
            <div className="absolute top-full left-0 mt-0 w-48 bg-[var(--card)] border border-[var(--border)] rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-150 z-20">
              <div className="p-2 space-y-0.5">
                <Link href="/books" className="block px-3 py-1.5 text-xs rounded hover:bg-[var(--card-hover)] transition-colors">
                  すべての本
                </Link>
                <div className="border-t border-[var(--border)] my-1" />
                {categories.map((cat) => (
                  <Link key={cat.slug} href={`/categories/${cat.slug}`} className="block px-3 py-1.5 text-xs rounded hover:bg-[var(--card-hover)] transition-colors">
                    {cat.label} <span className="opacity-50">({cat.count})</span>
                  </Link>
                ))}
              </div>
            </div>
          </div>
          <Link href="/paths" className="hover:text-[var(--accent)] transition-colors">読書パス</Link>
          <Link href="/recommend" className="hover:text-[var(--accent)] transition-colors">おすすめを探す</Link>
        </nav>

        {/* Mobile nav button */}
        <div className="flex md:hidden items-center gap-2">
          <MobileNav />
        </div>
      </div>

      {/* Mobile search (below header on small screens) */}
      <form action="/books" method="GET" className="sm:hidden px-4 pb-3">
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-[var(--muted)] pointer-events-none">
            🔍
          </span>
          <input
            type="text"
            name="q"
            placeholder="本・著者を検索..."
            className="w-full pl-9 pr-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--card)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent text-sm"
          />
        </div>
      </form>
    </header>
  );
}

function Footer() {
  const categories = getAllCategories();
  const stats = getStats();

  return (
    <footer className="border-t border-[var(--border)] mt-auto py-10">
      <div className="max-w-5xl mx-auto px-4">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 mb-8">
          <div>
            <h3 className="text-sm font-semibold mb-2">📚 本を探す</h3>
            <ul className="space-y-1 text-xs text-[var(--muted)]">
              <li><Link href="/books" className="hover:text-[var(--accent)] transition-colors">すべての本</Link></li>
              {categories.slice(0, 4).map((cat) => (
                <li key={cat.slug}><Link href={`/categories/${cat.slug}`} className="hover:text-[var(--accent)] transition-colors">{cat.label}</Link></li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-semibold mb-2">🗺️ 読書パス</h3>
            <ul className="space-y-1 text-xs text-[var(--muted)]">
              <li><Link href="/paths" className="hover:text-[var(--accent)] transition-colors">すべてのパス</Link></li>
              <li><Link href="/recommend" className="hover:text-[var(--accent)] transition-colors">おすすめを探す</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-semibold mb-2">📊 サイト情報</h3>
            <ul className="space-y-1 text-xs text-[var(--muted)]">
              <li>📖 {stats.totalBooks}冊の本</li>
              <li>👤 {stats.totalAuthors}名の著者</li>
              <li>🌍 {stats.totalCountries}カ国</li>
              <li>🗺️ {stats.totalPaths}の読書パス</li>
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-semibold mb-2">📝 このサイトについて</h3>
            <p className="text-xs text-[var(--muted)] leading-relaxed">
              世界の名作を厳選して紹介する読書ガイド。受賞作・文学史の古典を中心に、すべての本に選書理由を明記しています。
              <span className="block mt-1">Amazonアソシエイト参加中。</span>
            </p>
          </div>
        </div>
        <div className="text-center text-xs text-[var(--muted)] border-t border-[var(--border)] pt-6">
          📚 読書の羅針盤 — 世界の名作と出会うための読書ガイド
        </div>
      </div>
    </footer>
  );
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}

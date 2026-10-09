import { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BookGrid } from "@/components/BookGrid";
import { CategoryNav } from "@/components/CategoryNav";
import { getBooksByCategory, getCategoryBySlug, getAllCategories, getAllBooks } from "@/lib/data";
import { buildMetadata } from "@/lib/seo";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return getAllCategories().map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const cat = getCategoryBySlug(slug);
  if (!cat) return { title: "Not Found" };
  return buildMetadata({
    title: `${cat.label} — カテゴリ別一覧`,
    description: cat.description,
    path: `/categories/${cat.slug}`,
  });
}

export default async function CategoryPage({ params }: PageProps) {
  const { slug } = await params;
  const cat = getCategoryBySlug(slug);
  if (!cat) notFound();

  const books = getBooksByCategory(slug);

  return (
    <div className="reading-interior reading-category-index max-w-5xl mx-auto px-4 py-8">
      <nav className="text-sm text-[var(--muted)] mb-6">
        <Link href="/" className="hover:text-[var(--accent)] transition-colors">ホーム</Link>
        <span className="mx-2">/</span>
        <Link href="/books/" className="hover:text-[var(--accent)] transition-colors">本を探す</Link>
        <span className="mx-2">/</span>
        <span>{cat.label}</span>
      </nav>

      <span className="reading-interior-kicker">SHELF / {books.length} BOOKS</span><h1 className="text-2xl font-bold mb-2 reading-index-title">{cat.label}</h1>
      <p className="text-[var(--muted)] mb-6 max-w-2xl">{cat.description}</p>

      <div className="mb-8">
        <CategoryNav current={slug} />
      </div>

      <p className="text-sm text-[var(--muted)] mb-4">📚 {books.length}冊</p>
      <BookGrid books={books} />
    </div>
  );
}

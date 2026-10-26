import { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BookGrid } from "@/components/BookGrid";
import { CategoryNav } from "@/components/CategoryNav";
import { JsonLd } from "@/components/JsonLd";
import { getBooksByCategory, getCategoryBySlug, getAllCategories } from "@/lib/data";
import { breadcrumbListNode, collectionPageNode } from "@/lib/jsonld";
import { buildMetadata } from "@/lib/seo";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return getAllCategories().map((c) => ({ slug: c.slug }));
}

/**
 * 一覧の説明文。ページに実際に並べている冊数をそのまま使い、
 * 分類（カテゴリの説明）と絞り込みの軸だけを書く。
 */
function categoryDescription(cat: { label: string; description: string }, bookCount: number) {
  return `${cat.label}の本の一覧。${cat.description}全${bookCount}冊を収録し、著者・国・出版年から絞り込めます。各冊のページでは次に読む一冊も案内しています。`;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const cat = getCategoryBySlug(slug);
  if (!cat) return { title: "Not Found" };
  return buildMetadata({
    title: `${cat.label} — カテゴリ別一覧`,
    description: categoryDescription(cat, getBooksByCategory(slug).length),
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
      <JsonLd
        data={[
          collectionPageNode({
            name: cat.label,
            description: categoryDescription(cat, books.length),
            path: `/categories/${cat.slug}`,
            numberOfItems: books.length,
          }),
          breadcrumbListNode([
            { name: "ホーム", path: "/" },
            { name: "本を探す", path: "/books" },
            { name: cat.label, path: `/categories/${cat.slug}` },
          ]),
        ]}
      />
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

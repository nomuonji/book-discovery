import { Book } from "@/types";
import { BookCard } from "@/components/BookCard";

interface BookGridProps {
  books: Book[];
  reasonMap?: Record<string, string>;
  showAmazon?: boolean;
  emptyMessage?: string;
}

export function BookGrid({ books, reasonMap, showAmazon = true, emptyMessage = "該当する本が見つかりませんでした。" }: BookGridProps) {
  if (books.length === 0) {
    return (
      <div className="text-center py-16 text-[var(--muted)]">
        <p className="text-3xl mb-3">📚</p>
        <p>{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {books.map((book) => (
        <BookCard key={book.slug} book={book} reason={reasonMap?.[book.slug]} showAmazon={showAmazon} />
      ))}
    </div>
  );
}

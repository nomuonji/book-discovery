import Link from "next/link";
import { BookGrid } from "@/components/BookGrid";
import { CategoryNav } from "@/components/CategoryNav";
import { getAllPaths, getBookBySlug, getStats } from "@/lib/data";

export default function HomePage() {
  const paths = getAllPaths();
  const stats = getStats();
  const mainPath = paths.find((path) => path.slug === "existentialism-to-modern-thought");
  const pair = mainPath?.steps.slice(0, 2).flatMap((step) => {
    const book = getBookBySlug(step.bookSlug);
    return book ? [{ step, book }] : [];
  }) ?? [];
  const leadPaths = paths.slice(0, 4);
  const picks = [
    "the-stranger", "my-brilliant-friend", "what-we-talk-about-when-we-talk-about-love",
    "the-vegetarian", "flights", "klara-and-the-sun",
  ].map((slug) => getBookBySlug(slug))
    .filter((book): book is NonNullable<typeof book> => book !== undefined);

  return (
    <div className="reading-home">
      <section className="reading-hero" aria-labelledby="reading-hero-title">
        <div className="reading-hero-inner">
          <div className="reading-hero-copy">
            <p className="reading-kicker"><span className="reading-kicker-dot" /> A FIELD GUIDE TO READING</p>
            <h1 id="reading-hero-title">本を一冊、<br /><em>その先へ。</em></h1>
            <p className="reading-hero-lead">
              面白かった本を読み終えて、次が決まらない。
              本屋に戻って、似た表紙を探すのもいいけれど。
              ここでは一冊と一冊の「あいだ」に、読書の道をつくっています。
            </p>
            <div className="reading-hero-actions">
              <Link className="reading-action-primary" href="/recommend/">好きな本から次を探す <span aria-hidden="true">↗</span></Link>
              <Link className="reading-action-text" href="/paths/">読み進める順番を見る <span aria-hidden="true">→</span></Link>
            </div>
          </div>
          <div className="reading-hero-visual" aria-label="実際の読書パスにある二冊の接続">
            <div className="reading-scene-top"><span>FROM ONE BOOK TO ANOTHER</span><span>01 — 02</span></div>
            {pair.length === 2 && mainPath ? (
              <>
                <div className="reading-book-pair">
                  {pair.map(({ book }, index) => (
                    <Link href={"/books/" + book.slug + "/"} key={book.slug}
                      className={"reading-book-cover reading-book-cover-" + (index + 1)}>
                      <span className="reading-book-cover-no">THE READING ROOM / {String(index + 1).padStart(2, "0")}</span>
                      <strong>{book.titleJa}</strong>
                      <span className="reading-book-author">{book.authorJa}</span>
                    </Link>
                  ))}
                  <span className="reading-book-between" aria-hidden="true">→</span>
                </div>
                <div className="reading-scene-caption">
                  <span>次の本には、理由がある。</span>
                  <Link href={"/paths/" + mainPath.slug + "/"}>この二冊のつながりを読む ↗</Link>
                </div>
              </>
            ) : (
              <div className="reading-hero-visual-fallback">
                <p>一冊を入口に、その先の読書へ。</p>
                <Link href="/paths/">読書パスを探す ↗</Link>
              </div>
            )}
          </div>
        </div>
        <div className="reading-hero-floor">
          <span>BOOKS WITH A WAY FORWARD</span>
          <span>{stats.totalBooks} BOOKS <i /> {stats.totalRecommendations} CONNECTIONS <i /> {stats.totalPaths} ROUTES</span>
        </div>
      </section>

      <section className="reading-entrances reading-container" aria-labelledby="reading-entrances-heading">
        <div className="reading-section-header">
          <span className="reading-section-index">01 / HOW TO BEGIN</span>
          <h2 id="reading-entrances-heading">どこから読もうか。</h2>
          <p>手がかりは、ひとつあれば十分です。</p>
        </div>
        <div className="reading-entrance-list">
          <Link href="/recommend/" className="reading-entrance">
            <span className="reading-entrance-no">A</span>
            <span className="reading-entrance-body"><strong>好きな本がある</strong><small>一冊、または作家の名前から。その本の隣にある作品を探す。</small></span>
            <span className="reading-entrance-arrow" aria-hidden="true">↗</span>
          </Link>
          <Link href="/guides/overseas-literature/" className="reading-entrance">
            <span className="reading-entrance-no">B</span>
            <span className="reading-entrance-body"><strong>何を読みたいか、まだ分からない</strong><small>海外文学への入口を、読みたい体験から絞る。</small></span>
            <span className="reading-entrance-arrow" aria-hidden="true">↗</span>
          </Link>
          <Link href="/paths/" className="reading-entrance">
            <span className="reading-entrance-no">C</span>
            <span className="reading-entrance-body"><strong>何冊か続けて読んでみたい</strong><small>哲学や小説を、一本の道として読み進める。</small></span>
            <span className="reading-entrance-arrow" aria-hidden="true">↗</span>
          </Link>
        </div>
      </section>

      {mainPath && pair.length === 2 && (
        <section className="reading-connection" aria-labelledby="reading-connection-title">
          <div className="reading-container reading-connection-inner">
            <div className="reading-connection-head">
              <span className="reading-section-index">02 / BETWEEN BOOKS</span>
              <h2 id="reading-connection-title">「異邦人」の<br /><em>次に読む本。</em></h2>
              <p>同じ作家の二冊でも、読む順番で見えてくるものは変わります。掲載中の読書パスから、一例を抜き出しました。</p>
              <Link href={"/paths/" + mainPath.slug + "/"} className="reading-inline-link">この先の読書パスを見る <span aria-hidden="true">→</span></Link>
            </div>
            <ol className="reading-connection-notes">
              {pair.map(({ step, book }, index) => (
                <li key={book.slug}>
                  <span className="reading-connection-step">CHAPTER 0{index + 1}</span>
                  <h3><Link href={"/books/" + book.slug + "/"}>{book.titleJa}</Link></h3>
                  <p className="reading-connection-author">{book.authorJa}</p>
                  <p>{step.noteJa}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>
      )}

      <section className="reading-routes reading-container" aria-labelledby="reading-routes-title">
        <div className="reading-section-header reading-section-header-row">
          <div>
            <span className="reading-section-index">03 / READING ROUTES</span>
            <h2 id="reading-routes-title">読む順番も、作品の一部。</h2>
            <p>一冊目が二冊目の読み方を変える。編集済みの読書パスから。</p>
          </div>
          <Link href="/paths/" className="reading-inline-link">全{paths.length}本の読書パス <span aria-hidden="true">↗</span></Link>
        </div>
        <div className="reading-routes-list">
          {leadPaths.map((path, index) => {
            const first = path.steps[0] ? getBookBySlug(path.steps[0].bookSlug) : undefined;
            return (
              <Link key={path.slug} href={"/paths/" + path.slug + "/"} className="reading-route">
                <span className="reading-route-num">{String(index + 1).padStart(2, "0")}</span>
                <span className="reading-route-main"><strong>{path.titleJa}</strong><small>{path.descriptionJa}</small></span>
                <span className="reading-route-aside">{first?.titleJa ?? "読書パス"} から<br />{path.steps.length}冊をたどる</span>
                <span className="reading-route-arrow" aria-hidden="true">↗</span>
              </Link>
            );
          })}
        </div>
      </section>

      <section className="reading-bookshelf reading-container" aria-labelledby="reading-bookshelf-title">
        <div className="reading-section-header reading-section-header-row">
          <div>
            <span className="reading-section-index">04 / OPEN THE SHELF</span>
            <h2 id="reading-bookshelf-title">とりあえず、一冊ひらく。</h2>
            <p>入口になる六冊。気になる題名を選んで、次の作品へ進んでください。</p>
          </div>
          <Link href="/books/" className="reading-inline-link">書棚をすべて見る <span aria-hidden="true">↗</span></Link>
        </div>
        <div className="reading-bookshelf-grid"><BookGrid books={picks} /></div>
      </section>

      <section className="reading-catalog reading-container" aria-labelledby="reading-catalog-title">
        <div className="reading-catalog-heading">
          <span className="reading-section-index">05 / THE INDEX</span>
          <h2 id="reading-catalog-title">あてもなく、書棚を歩く。</h2>
          <p>本を探す日は、いつも目的があるとは限りません。</p>
          <Link href="/books/" className="reading-inline-link">全{stats.totalBooks}冊から探す <span aria-hidden="true">↗</span></Link>
        </div>
        <div className="reading-catalog-categories"><CategoryNav /></div>
      </section>
    </div>
  );
}

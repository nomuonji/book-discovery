import Image from "next/image";
import Link from "next/link";
import { FilterNavButton } from "@/components/FilterNavButton";
import { Book } from "@/types";
import { getAmazonLink,getAmazonSearchLink,getAmazonComSearchLink } from "@/lib/amazon";
interface BookCardProps {book:Book; reason?:string; showAmazon?:boolean}
function authorSlug(author:string){return author.toLowerCase().replace(/\s+/g,"-").replace(/[^a-z0-9-]/g,"")}
export function BookCard({book,reason,showAmazon=true}:BookCardProps){
 return <article className="reading-entry-card group">
   <div className="reading-entry-main">
     <Link href={"/books/"+book.slug+"/"} className="reading-entry-cover" aria-label={book.titleJa+"の詳細"}>
       {book.coverUrl?<Image src={book.coverUrl} alt={book.titleJa} fill className="object-cover" sizes="(max-width:640px) 80px,104px"/>:
       <div className="cover-placeholder reading-entry-cover-fallback"><span>THE READING ROOM</span><strong>{book.titleJa}</strong></div>}
     </Link>
     <div className="reading-entry-copy">
       <span className="reading-entry-category">{book.country} / {book.year}</span>
       <h3><Link href={"/books/"+book.slug+"/"}>{book.titleJa}<span aria-hidden="true"> ↗</span></Link></h3>
       <p className="reading-entry-origin">{book.title}</p>
       <p className="reading-entry-author"><Link href={"/authors/"+authorSlug(book.author)+"/"}>{book.authorJa}</Link></p>
       <p className="reading-entry-reason"><span>{reason?"この本につながる理由":"選書ノート"}</span>{reason||book.selectionReasonJa||book.whyReadJa}</p>
       <div className="reading-entry-tags">{book.genre.slice(0,2).map(g=><FilterNavButton key={g} href={"/books/?genre="+encodeURIComponent(g)} className="reading-entry-tag" ariaLabel={g+"で本を絞り込む"}>{g}</FilterNavButton>)}</div>
     </div>
   </div>
   {showAmazon&&<div className="reading-entry-shop">
     <a href={book.asin?getAmazonLink(book.asin):getAmazonSearchLink(book.title,book.author,book.titleJa,book.authorJa)} target="_blank" rel="noopener noreferrer">日本語版・国内で探す ↗</a>
     <a href={getAmazonComSearchLink(book.titleEn||book.title,book.author)} target="_blank" rel="noopener noreferrer">原書を探す ↗</a>
   </div>}
 </article>
}
import Link from "next/link";
import {Book} from "@/types";
interface PathCardProps {slug:string;titleJa:string;descriptionJa:string;difficulty:1|2|3;stepCount:number;representativeBook?:Book}
const levels:{[key:number]:string}={1:"入門",2:"中級",3:"発展"};
export function PathCard({slug,titleJa,descriptionJa,difficulty,stepCount,representativeBook}:PathCardProps){
 return <Link className="reading-route-card" href={"/paths/"+slug+"/"}>
   <span className="reading-route-card-overline">READING ROUTE <small>{levels[difficulty]} / {stepCount}冊</small></span>
   <strong>{titleJa}</strong>
   <p>{descriptionJa}</p>
   <span className="reading-route-card-bottom"><span>{representativeBook?"最初の一冊：『"+representativeBook.titleJa+"』":"この順番を読む"}</span><span aria-hidden="true">↗</span></span>
 </Link>
}
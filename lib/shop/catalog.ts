import categoryTree from './categories.json';
export type Category={name:string;slug:string;children:Category[]};
export type Product={id:string;slug:string;name:string;priceCents:number;categorySlug:string;language:string;images:string[];description:string;stock:number;sku:string;status:string;isLive:boolean;featured:boolean;version:number;createdAt?:string;updatedAt?:string};
export const categories=categoryTree as Category[];
export const categoryMap=new Map<string,Category>();
export const parentMap=new Map<string,string>();
function walk(nodes:Category[],parent=''){for(const n of nodes){categoryMap.set(n.slug,n);if(parent)parentMap.set(n.slug,parent);walk(n.children,n.slug)}}walk(categories);
export const descendants=(slug:string):string[]=>{const c=categoryMap.get(slug);return c?[c.slug,...c.children.flatMap(n=>descendants(n.slug))]:[]};
export function ancestors(slug:string):Category[]{const c=categoryMap.get(slug);return c?[...(parentMap.has(slug)?ancestors(parentMap.get(slug)!):[]),c]:[]}
export const categoryPath=(slug:string)=>ancestors(slug).map(c=>c.name).join(' / ');
export const categoryURL=(slug:string)=>slug==='live-stream'?'/live-stream':slug==='wydarzenia'?'/wydarzenia':`/kategoria/${slug}`;
export const slugify=(value:string)=>value.toLowerCase().replace(/ł/g,'l').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
export const esc=(value:unknown)=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!));
export const money=(cents:number)=>(cents/100).toLocaleString('pl-PL',{minimumFractionDigits:2,maximumFractionDigits:2});
export const productCount=(n:number)=>`${n} ${n===1?'produkt':n%10>=2&&n%10<=4&&(n%100<12||n%100>14)?'produkty':'produktów'}`;
export function fromRow(r:any):Product{return {id:r.id,slug:r.slug,name:r.name,priceCents:r.price_cents,categorySlug:r.category_slug,language:r.language,images:JSON.parse(r.images),description:r.description,stock:r.stock,sku:r.sku,status:r.status,isLive:Boolean(r.is_live),featured:Boolean(r.featured),version:r.version,createdAt:r.created_at,updatedAt:r.updated_at}}
export function validateProduct(input:any):Product{
 if(!input||typeof input!=='object')throw Error('Nieprawidłowy formularz.');
 const name=String(input.name??'').trim(),slug=String(input.slug??slugify(name)).trim();
 if(name.length<3||name.length>180)throw Error('Nazwa musi mieć od 3 do 180 znaków.');
 if(!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)||slug.length>180)throw Error('Adres produktu może zawierać małe litery, cyfry i łączniki.');
 const priceCents=Number(input.priceCents),stock=Number(input.stock);
 if(!Number.isSafeInteger(priceCents)||priceCents<1||priceCents>100000000)throw Error('Wpisz poprawną cenę większą od zera.');
 if(!Number.isSafeInteger(stock)||stock<0||stock>1000000)throw Error('Stan magazynu musi być liczbą całkowitą od 0 do 1 000 000.');
 const categorySlug=String(input.categorySlug??'');if(!categoryMap.has(categorySlug)||['live-stream','wydarzenia'].includes(categorySlug))throw Error('Wybierz kategorię produktu.');
 const language=String(input.language??'');if(!['Angielski','Japoński','Chiński','Koreański','Polski','Inny','Nie dotyczy'].includes(language))throw Error('Wybierz wersję językową.');
 const status=String(input.status??'draft');if(!['draft','published','archived'].includes(status))throw Error('Nieprawidłowy status.');
 if(!Array.isArray(input.images)||input.images.length<1||input.images.length>10)throw Error('Dodaj od 1 do 10 zdjęć.');
 const images=input.images.map((x:any)=>String(x));if(images.some((s:string)=>s.length>1500||!(/^(?:\/assets\/|\/media\/)[a-zA-Z0-9._/-]+$/.test(s)||/^https:\/\//.test(s))))throw Error('Zdjęcia muszą pochodzić z przesłanych plików lub bezpiecznego adresu HTTPS.');
 const description=String(input.description??'').trim();if(description.length>30000)throw Error('Opis jest za długi (maks. 30 000 znaków).');
 const sku=String(input.sku??'').trim();if(sku.length>80)throw Error('SKU może mieć maksymalnie 80 znaków.');
 return {id:String(input.id??''),name,slug,priceCents,stock,categorySlug,language,status,images,description,sku,isLive:input.isLive===true,featured:input.featured===true,version:Number(input.version??1)};
}

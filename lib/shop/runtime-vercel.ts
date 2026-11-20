import {randomBytes,timingSafeEqual,createHash} from 'node:crypto';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {join} from 'node:path';
import {put,get} from '@vercel/blob';
import {postgresDatabase,sqliteDatabase} from './node-database';
import {loginPage} from './login-view';
import {activeCredentials,matchesPassword,sessionSignature,rotatePassword} from './admin-credentials';

const local=process.env.SHOP_LOCAL==='1'&&!process.env.VERCEL;
const databaseURL=process.env.DATABASE_URL||process.env.POSTGRES_URL;
const configuredBlob=Boolean(process.env.BLOB_READ_WRITE_TOKEN||process.env.BLOB_STORE_ID&&process.env.VERCEL_OIDC_TOKEN);
export const uploadLimit=4*1024*1024;
let cachedDB:D1Database|undefined;
const bucket={async put(key:string,bytes:Uint8Array,options:any){if(configuredBlob){await put('products/'+key,Buffer.from(bytes),{access:'private',addRandomSuffix:false,contentType:options?.httpMetadata?.contentType});return}if(!local)throw Error('Photo storage is not configured.');await mkdir(join(process.cwd(),'.local/media'),{recursive:true});await writeFile(join(process.cwd(),'.local/media',key),bytes)},async get(key:string){if(configuredBlob){const result=await get('products/'+key,{access:'private',useCache:false});if(!result||result.statusCode!==200||!result.stream)return null;return {body:result.stream,httpMetadata:{contentType:result.blob.contentType||'application/octet-stream'}}}if(!local)return null;try{const bytes=await readFile(join(process.cwd(),'.local/media',key));const extension=key.split('.').at(-1)||'';return {body:new Uint8Array(bytes),httpMetadata:{contentType:({png:'image/png',jpg:'image/jpeg',webp:'image/webp',gif:'image/gif'} as Record<string,string>)[extension]||'application/octet-stream'}}}catch{return null}}};
export const env={get DB(){if(!cachedDB)cachedDB=databaseURL?postgresDatabase(databaseURL):sqliteDatabase(local);return cachedDB},get BUCKET(){return configuredBlob||local?bucket as unknown as R2Bucket:undefined}};
export const adminStorageReady=()=>Boolean(databaseURL||local)&&Boolean(configuredBlob||local);
const cookieName='tcg-shop_admin',lifetime=8*60*60;
const secret=()=>process.env.ADMIN_SESSION_SECRET||'';
const authReady=()=>Boolean(process.env.ADMIN_PASSWORD_HASH?.startsWith('scrypt:')&&secret().length>=32);
const credentials=()=>activeCredentials(env.DB,process.env.ADMIN_PASSWORD_HASH||'');
export async function isAdmin(request:Request){if(!authReady())return false;const token=request.headers.get('cookie')?.split(';').map(s=>s.trim()).find(s=>s.startsWith(cookieName+'='))?.slice(cookieName.length+1);if(!token||token.length>500)return false;const [expires,nonce,signature,...rest]=token.split('.');if(rest.length||!expires||!nonce||!signature||!/^\d+$/.test(expires)||Number(expires)<=Math.floor(Date.now()/1000)||Number(expires)>Math.floor(Date.now()/1000)+lifetime+30)return false;const actual=Buffer.from(signature),expected=Buffer.from(sessionSignature(expires+'.'+nonce,secret(),await credentials()));return actual.length===expected.length&&timingSafeEqual(actual,expected)}
export const isAuthenticated=isAdmin;
export function sameOrigin(request:Request){try{const origin=new URL(request.headers.get('origin')||''),url=new URL(request.url),host=request.headers.get('host')||url.host;return !/[\s,/@]/.test(host)&&origin.host===host&&origin.protocol===(process.env.VERCEL?'https:':url.protocol)}catch{return false}}
function safeReturn(value:string|null){return value&&value.startsWith('/admin')&&!value.startsWith('//')&&!value.startsWith('/admin/login')&&!value.startsWith('/admin/logout')?value:'/admin'}
function redirect(path:string,cookie?:string){return new Response(null,{status:303,headers:{Location:path,'Cache-Control':'no-store',...(cookie?{'Set-Cookie':cookie}:{})}})}
export const adminRedirect=(request:Request)=>redirect('/admin/login?return_to='+encodeURIComponent(new URL(request.url).pathname));
function cookie(value:string,maxAge=lifetime){return `${cookieName}=${value}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${maxAge}${process.env.VERCEL||process.env.NODE_ENV==='production'&&!local?'; Secure':''}`}
function html(body:string,status=200){return new Response(body,{status,headers:{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff','X-Frame-Options':'DENY','Content-Security-Policy':"default-src 'self'; style-src 'self'; img-src 'self'; form-action 'self'; frame-ancestors 'none'; base-uri 'none'"}})}
function missingConfiguration(){const missing=[];if(!process.env.ADMIN_PASSWORD_HASH)missing.push('ADMIN_PASSWORD_HASH — hasło administratora');if(secret().length<32)missing.push('ADMIN_SESSION_SECRET — klucz sesji');if(!databaseURL&&!local)missing.push('DATABASE_URL — baza PostgreSQL (Neon)');if(!configuredBlob&&!local)missing.push('BLOB_READ_WRITE_TOKEN lub połączenie Vercel Blob — zdjęcia');return missing}
export const adminSetupResponse=()=>html(loginPage('/admin',{missing:missingConfiguration()}),503);
const failures=new Map<string,{count:number;until:number}>();
export async function handleAuth(request:Request):Promise<Response|null>{const url=new URL(request.url),path=url.pathname;if(path==='/signin-with-chatgpt')return redirect('/admin/login');if(path==='/signout-with-chatgpt'||path==='/admin/logout')return redirect('/',cookie('',0));if(path==='/api/admin/password')return changePassword(request);if(path!=='/admin/login')return null;const returnTo=safeReturn(url.searchParams.get('return_to'));if(await isAdmin(request))return redirect(returnTo);const missing=missingConfiguration();if(missing.length)return html(loginPage(returnTo,{missing}),503);if(request.method==='GET')return html(loginPage(returnTo));if(request.method!=='POST')return new Response(null,{status:405});if(!sameOrigin(request))return html(loginPage(returnTo,{error:'Nieprawidłowe źródło formularza.'}),403);const key=createHash('sha256').update(request.headers.get('x-forwarded-for')?.split(',')[0]||'local').digest('hex'),now=Date.now(),previous=failures.get(key);if(previous&&previous.until>now&&previous.count>=8)return html(loginPage(returnTo,{error:'Zbyt wiele prób. Spróbuj ponownie za kilka minut.'}),429);if(Number(request.headers.get('content-length')||0)>8192)return new Response(null,{status:413});const text=await request.text();if(text.length>8192)return new Response(null,{status:413});const form=new URLSearchParams(text),password=form.get('password')||'',destination=safeReturn(form.get('return_to'));const active=await credentials(),valid=matchesPassword(password,active.passwordHash);if(!valid){if(failures.size>10000)failures.clear();const attempt=previous&&previous.until>now?previous:{count:0,until:now+15*60*1000};attempt.count++;failures.set(key,attempt);return html(loginPage(destination,{error:'Nieprawidłowe hasło administratora.'}),401)}failures.delete(key);const expires=String(Math.floor(Date.now()/1000)+lifetime),nonce=randomBytes(18).toString('base64url'),payload=expires+'.'+nonce;return redirect(destination,cookie(payload+'.'+sessionSignature(payload,secret(),active)))}

async function changePassword(request:Request){
 const json=(body:Record<string,unknown>,status=200)=>new Response(JSON.stringify(body),{status,headers:{'Content-Type':'application/json','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
 if(request.method!=='POST')return json({error:'Niedozwolona metoda.'},405);
 if(!sameOrigin(request))return json({error:'Nieprawidłowe źródło żądania.'},403);
 if(!await isAdmin(request))return json({error:'Zaloguj się jako administrator.'},401);
 if(!databaseURL&&!local)return json({error:'Brak trwałej bazy danych.'},503);
 if(!request.headers.get('content-type')?.includes('application/json'))return json({error:'Wymagany JSON.'},415);
 if(Number(request.headers.get('content-length')||0)>8192)return json({error:'Za dużo danych.'},413);
 const body=await request.text();if(body.length>8192)return json({error:'Za dużo danych.'},413);
 let input;try{input=JSON.parse(body)}catch{return json({error:'Nieprawidłowe dane.'},400)}
 if(!input||typeof input.newPassword!=='string'||input.newPassword.length<16||input.newPassword.length>256)return json({error:'Nowe hasło musi mieć od 16 do 256 znaków.'},400);
 const active=await credentials();
 if(!matchesPassword(input.currentPassword,active.passwordHash))return json({error:'Nieprawidłowe obecne hasło.'},401);
 if(input.currentPassword===input.newPassword)return json({error:'Wybierz inne nowe hasło.'},400);
 if(!await rotatePassword(env.DB,active,input.newPassword))return json({error:'Hasło zmieniono w innej sesji. Zaloguj się ponownie.'},409);
 const response=json({ok:true});response.headers.set('Set-Cookie',cookie('',0));return response;
}

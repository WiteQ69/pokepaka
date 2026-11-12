import {env as cloudflareEnv} from 'cloudflare:workers';
export const env=cloudflareEnv;
export const uploadLimit=4*1024*1024;
export const adminStorageReady=()=>true;
export const sameOrigin=(request:Request)=>request.headers.get('origin')===new URL(request.url).origin;
export async function isAdmin(request:Request){const id=request.headers.get('oai-authenticated-user-id'),email=request.headers.get('oai-authenticated-user-email'),allowed=(env.ADMIN_EMAIL_SHA256||'').trim().toLowerCase();if(!id||!email||!/^[a-f0-9]{64}$/.test(allowed))return false;const digest=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(email.trim().toLowerCase()));return Array.from(new Uint8Array(digest),b=>b.toString(16).padStart(2,'0')).join('')===allowed}
export const isAuthenticated=(request:Request)=>Boolean(request.headers.get('oai-authenticated-user-id'));
export const adminRedirect=(request:Request)=>new Response(null,{status:302,headers:{Location:'/signin-with-chatgpt?return_to='+encodeURIComponent(new URL(request.url).pathname)}});
export async function handleAuth(request:Request):Promise<Response|null>{const path=new URL(request.url).pathname;if(path==='/admin/login')return adminRedirect(request);if(path==='/admin/logout')return new Response(null,{status:302,headers:{Location:'/signout-with-chatgpt?return_to=%2F'}});return null}

export const adminSetupResponse=()=>new Response('Panel jest chwilowo niedostępny.',{status:503});

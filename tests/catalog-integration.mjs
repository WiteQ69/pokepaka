import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
const vercel=process.env.POKEPAKA_TEST_RUNTIME==='vercel';
const origin=process.env.TEST_ORIGIN||(vercel?'http://127.0.0.1:3000':'http://127.0.0.1:5173');
const login=vercel?await fetch(origin+'/admin/login',{method:'POST',redirect:'manual',headers:{origin,'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({password:(await fs.readFile('.local/admin-password.txt','utf8')).trim(),return_to:'/admin'})}):await fetch(origin+'/signin-with-chatgpt?return_to=/admin',{redirect:'manual'});
if(!login.headers.get('set-cookie')){const content=await login.text();throw Error(JSON.stringify({loginStatus:login.status,error:content.match(/class="login-error"[^>]*>([^<]+)/)?.[1],needsSetup:content.includes('Do uzupełnienia')}))}
const auth={cookie:login.headers.get('set-cookie').split(';')[0]};
let assertions=0;
async function request(path,{method='GET',body,headers={},authenticated=true}={}){const r=await fetch(origin+path,{method,headers:{...(authenticated?auth:{}),...(method==='GET'?{}:{origin}),'Content-Type':'application/json',...headers},...(body?{body:JSON.stringify(body)}:{})});const content=await r.text();let value;try{value=JSON.parse(content)}catch{}return {status:r.status,content,value}}
const check=(actual,expected,label)=>{assert.equal(actual,expected,label);assertions++};
check((await request('/api/admin/products',{authenticated:false})).status,401,'Anonymous admin denied');
check((await request('/api/admin/products',{authenticated:false,headers:{'oai-authenticated-user-id':'spoofed','oai-authenticated-user-email':'seedy@sites.test'}})).status,401,'Spoofed identity headers denied');
const adminHtml=await request('/admin');check(adminHtml.status,200,'Administrator remains authorized');assert.ok(!adminHtml.content.includes('seedy@sites.test'),'Account email excluded from HTML');assert.ok(!adminHtml.content.includes('local_seedy'),'Account id excluded from HTML');assertions+=2;
const seed=await request('/api/admin/products');check(seed.status,200,'Owner catalog available');assert.ok(seed.value.total>=12);
const all=JSON.parse(await fs.readFile('lib/shop/categories.json','utf8'));const flatten=nodes=>nodes.flatMap(c=>[c,...flatten(c.children)]);
for(const c of flatten(all)){const path=c.slug==='live-stream'?'/live-stream':c.slug==='wydarzenia'?'/wydarzenia':'/kategoria/'+c.slug;check((await request(path,{authenticated:false})).status,200,'Category page '+path)}
for(const p of seed.value.products.filter(p=>p.status==='published'))check((await request('/produkt/'+p.slug,{authenticated:false})).status,200,'Product detail '+p.slug);
check((await request('/produkt/nieistniejacy-produkt',{authenticated:false})).status,404,'Unknown product returns 404');
check((await request('/kategoria/nieistniejaca',{authenticated:false})).status,404,'Unknown category returns 404');
const base={name:'Produkt testowy katalogu',slug:'produkt-integracyjny-'+Date.now(),priceCents:12345,categorySlug:'booster-box',language:'Angielski',images:['/assets/product-1.webp'],description:'Opis testowy.\n\n<script>alert("xss")</script>',stock:7,sku:'PP-INTEGRATION-TEST',status:'published',isLive:true,featured:false,version:1};
check((await request('/api/admin/products',{method:'POST',body:base,headers:{origin:'https://foreign.example'}})).status,403,'CSRF blocked');
check((await request('/api/admin/products',{method:'POST',body:{...base,priceCents:-1}})).status,400,'Negative price rejected');
check((await request('/api/admin/products',{method:'POST',body:{...base,images:['javascript:alert(1)']}})).status,400,'Unsafe image URL rejected');
let created=await request('/api/admin/products',{method:'POST',body:base});check(created.status,201,'Create product');let product=created.value.product;const endpoint='/api/admin/products/'+product.id;
check((await request('/api/admin/products',{method:'POST',body:base})).status,409,'Duplicate URL rejected');
let detail=await request('/produkt/'+product.slug,{authenticated:false});check(detail.status,200,'Published product has separate page');assert.ok(detail.content.includes('&lt;script&gt;alert('),'Description escaped');assert.ok(!detail.content.includes('<script>alert('),'Raw user script not rendered');assertions+=2;
const category=await request('/kategoria/booster-box',{authenticated:false});assert.ok(category.content.includes(product.slug));assertions++;
let update=await request(endpoint,{method:'PUT',body:{...product,priceCents:14999,stock:3}});check(update.status,200,'Update persisted');let updated=update.value.product;check(updated.priceCents,14999,'Price saved in cents');check(updated.version,2,'Version incremented');
check((await request(endpoint,{method:'PUT',body:{...product,priceCents:999}})).status,409,'Stale update rejected');
detail=await request('/produkt/'+updated.slug,{authenticated:false});assert.ok(detail.content.includes('149,99'),'New price on product page');assertions++;
const uploadData=new FormData();const file=await fs.readFile('public/assets/product-1.webp');uploadData.append('file',new Blob([file],{type:'image/webp'}),'product.webp');const uploadResponse=await fetch(origin+'/api/admin/upload',{method:'POST',headers:{...auth,origin},body:uploadData});check(uploadResponse.status,201,'Upload persisted in R2');const uploaded=await uploadResponse.json();const media=await fetch(origin+uploaded.url);check(media.status,200,'Uploaded media served');check((await media.arrayBuffer()).byteLength,file.byteLength,'Uploaded bytes retained');
const invalid=new FormData();invalid.append('file',new Blob(['<svg onload="alert(1)"/>'],{type:'image/svg+xml'}),'unsafe.svg');check((await fetch(origin+'/api/admin/upload',{method:'POST',headers:{...auth,origin},body:invalid})).status,415,'SVG uploads rejected');
update=await request(endpoint,{method:'PUT',body:{...updated,images:[uploaded.url,'/assets/product-2.webp'],status:'draft'}});check(update.status,200,'Draft and gallery saved');updated=update.value.product;check(updated.images.length,2,'Gallery retained');check((await request('/produkt/'+updated.slug,{authenticated:false})).status,404,'Draft hidden publicly');
const archived=await request(endpoint,{method:'DELETE',body:{version:updated.version}});check(archived.status,200,'Archive product');updated=archived.value.product;check(updated.status,'archived','Archive is reversible');
const restored=await request(endpoint,{method:'PUT',body:{...updated,status:'published'}});check(restored.status,200,'Restore archived product');product=restored.value.product;check((await request('/produkt/'+product.slug,{authenticated:false})).status,200,'Restored product visible');
await request(endpoint,{method:'DELETE',body:{version:product.version}});
const sorted=await request('/sklep?sort=price-asc',{authenticated:false});check(sorted.status,200,'Sort route');
const search=await request('/szukaj?q=Espeon',{authenticated:false});assert.ok(search.content.includes('2 produkty'));assertions++;
console.log(JSON.stringify({passed:true,assertions,categories:flatten(all).length,seededProducts:seed.value.products.filter(p=>p.status==='published').length,uploadedMedia:uploaded.url},null,2));

import {spawnSync} from 'node:child_process';
import {existsSync} from 'node:fs';
import {fileURLToPath} from 'node:url';

const run=(file,args=[])=>{const r=spawnSync(process.execPath,[file,...args],{stdio:'inherit',env:process.env});if(r.error)throw r.error;if(r.status!==0)process.exit(r.status??1)};
if(process.env.SHOP_TARGET==='cloudflare'){
 run(fileURLToPath(new URL('./run-framework.mjs',import.meta.url)),['build']);
}else{
 run(fileURLToPath(new URL('./migrate-postgres.mjs',import.meta.url)));
 run(fileURLToPath(new URL('../node_modules/next/dist/bin/next',import.meta.url)),['build','--webpack']);
 if(!existsSync('.next/routes-manifest.json'))throw Error('Next.js did not generate .next/routes-manifest.json');
 console.log('Verified: .next/routes-manifest.json is ready for Vercel.');
}

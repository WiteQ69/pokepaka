import {readFileSync} from 'node:fs';
import postgres from 'postgres';
import nextEnv from '@next/env';

nextEnv.loadEnvConfig(process.cwd());
const url=process.env.DATABASE_URL||process.env.POSTGRES_URL;
if(!url){console.log('No PostgreSQL connection configured. Building the public catalog; administrator writes remain disabled until storage is connected.');process.exit(0)}
const sql=postgres(url,{max:1,prepare:false,connect_timeout:15,idle_timeout:10});
try{
 const schema=readFileSync(new URL('../db/postgres.sql',import.meta.url),'utf8');
 await sql.begin(async tx=>{await tx.unsafe("SELECT pg_advisory_xact_lock(19270001)");for(const statement of schema.split(';').map(s=>s.trim()).filter(Boolean))await tx.unsafe(statement)});
 console.log('PostgreSQL catalog schema is ready.');
}finally{await sql.end({timeout:5})}

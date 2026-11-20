import assert from 'node:assert/strict';
import {randomBytes,scryptSync} from 'node:crypto';
import {DatabaseSync} from 'node:sqlite';
import {readFile,mkdtemp,writeFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {pathToFileURL} from 'node:url';
import ts from 'typescript';

const directory=await mkdtemp(join(tmpdir(),'tcg-shop-auth-'));
const sqlite=new DatabaseSync(':memory:');
sqlite.exec('CREATE TABLE app_meta (key TEXT PRIMARY KEY,value TEXT NOT NULL)');
const db={
 prepare(sql){
  return {bind(...params){
   return {
    async first(){return sqlite.prepare(sql).get(...params)??null},
    async run(){return {meta:{changes:Number(sqlite.prepare(sql).run(...params).changes)}}},
   };
  }};
 },
};
try{
 const source=await readFile(new URL('../lib/shop/admin-credentials.ts',import.meta.url),'utf8');
 const output=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText;
 const path=join(directory,'credentials.mjs');await writeFile(path,output);
 const {activeCredentials,matchesPassword,sessionSignature,rotatePassword}=await import(pathToFileURL(path));
 const oldPassword=randomBytes(24).toString('hex'),newPassword=randomBytes(24).toString('hex');
 const salt=randomBytes(16).toString('hex'),fallback=`scrypt:${salt}:${scryptSync(oldPassword,salt,32).toString('hex')}`;
 const original=await activeCredentials(db,fallback);
 assert(matchesPassword(oldPassword,original.passwordHash));
 assert(!matchesPassword(newPassword,original.passwordHash));
 assert(!matchesPassword(null,original.passwordHash));
 const signature=sessionSignature('session',randomBytes(32).toString('hex'),original);
 const secret=randomBytes(32).toString('hex'),oldSession=sessionSignature('session',secret,original);
 assert(await rotatePassword(db,original,newPassword));
 const saved=await activeCredentials(db,fallback);
 assert(matchesPassword(newPassword,saved.passwordHash));
 assert(!matchesPassword(oldPassword,saved.passwordHash));
 assert.notEqual(oldSession,sessionSignature('session',secret,saved));
 assert(!await rotatePassword(db,original,oldPassword),'Concurrent bootstrap rotation must fail');
 assert(await rotatePassword(db,saved,newPassword+'new'));
 assert(!await rotatePassword(db,saved,oldPassword),'Concurrent update must fail');
 assert(!sqlite.prepare('SELECT value FROM app_meta').get().value.includes(newPassword));
 sqlite.prepare('UPDATE app_meta SET value=?').run('{"passwordHash":"broken"}');
 await assert.rejects(activeCredentials(db,fallback));
 sqlite.prepare('UPDATE app_meta SET value=?').run('invalid JSON');
 await assert.rejects(activeCredentials(db,fallback));
 await assert.rejects(activeCredentials({prepare(){throw Error('Database unavailable')}},fallback));
 assert.equal(typeof signature,'string');
 console.log('15 administrator credential checks passed.');
}finally{sqlite.close();await rm(directory,{recursive:true,force:true});}

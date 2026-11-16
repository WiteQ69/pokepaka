import {createHmac,randomBytes,scryptSync,timingSafeEqual} from 'node:crypto';

const key='admin_credentials_v1';
type Credentials={passwordHash:string;version:string};
const validHash=(value:unknown):value is string=>typeof value==='string'&&/^scrypt:[a-f0-9]{32}:[a-f0-9]{64}$/.test(value);

export async function activeCredentials(db:D1Database,fallback:string){
 const row=await db.prepare('SELECT value FROM app_meta WHERE key=?').bind(key).first<{value:string}>();
 if(!row){if(!validHash(fallback))throw Error('Invalid administrator configuration.');return {passwordHash:fallback,version:'bootstrap',stored:null} as const;}
 const credentials=JSON.parse(row.value) as Credentials;
 if(!validHash(credentials.passwordHash)||!(/^[a-f0-9]{48}$/.test(credentials.version)))throw Error('Invalid saved administrator credentials.');
 return {...credentials,stored:row.value};
}

export function matchesPassword(password:unknown,passwordHash:string){
 if(typeof password!=='string'||password.length<1||password.length>256||!validHash(passwordHash))return false;
 const [,salt,expected]=passwordHash.split(':');
 return timingSafeEqual(scryptSync(password,salt,32),Buffer.from(expected,'hex'));
}

export function sessionSignature(payload:string,secret:string,credentials:Credentials){
 return createHmac('sha256',secret).update(JSON.stringify([credentials.passwordHash,credentials.version,payload])).digest('base64url');
}

export async function rotatePassword(db:D1Database,current:Awaited<ReturnType<typeof activeCredentials>>,password:string){
 const salt=randomBytes(16).toString('hex');
 const value=JSON.stringify({passwordHash:`scrypt:${salt}:${scryptSync(password,salt,32).toString('hex')}`,version:randomBytes(24).toString('hex'),changedAt:new Date().toISOString()});
 const result=current.stored===null
  ?await db.prepare('INSERT INTO app_meta (key,value) VALUES (?,?) ON CONFLICT DO NOTHING').bind(key,value).run()
  :await db.prepare('UPDATE app_meta SET value=? WHERE key=? AND value=?').bind(value,key,current.stored).run();
 return Boolean(result.meta.changes);
}

import {readFile,writeFile,mkdir,unlink} from 'node:fs/promises';
import {randomBytes,scryptSync} from 'node:crypto';

if(!process.argv[2])throw Error('Podaj adres wdrożonego sklepu jako argument.');
const origin=new URL(process.argv[2]).origin;
if(!origin.startsWith('https://')&&!/^http:\/\/(localhost|127\.0\.0\.1)(:|$)/.test(origin))throw Error('Use HTTPS for the administrator credentials.');
await mkdir('.local',{recursive:true});
const passwordFile='.local/admin-password.txt',pendingFile='.local/admin-password.pending.txt';
const currentPassword=(await readFile(passwordFile,'utf8')).trim();
let newPassword;
try{newPassword=(await readFile(pendingFile,'utf8')).trim()}catch(error){
 if(error.code!=='ENOENT')throw error;
 newPassword=randomBytes(24).toString('base64url');
 await writeFile(pendingFile,newPassword+'\n',{mode:0o600,flag:'wx'});
}
const login=password=>fetch(origin+'/admin/login',{method:'POST',redirect:'manual',headers:{origin,'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({password,return_to:'/admin'})});
const session=response=>response.status===303?response.headers.get('set-cookie')?.split(';')[0]:null;
let newSession=session(await login(newPassword));
if(!newSession){
 const oldSession=session(await login(currentPassword));
 if(!oldSession)throw Error('Cannot sign in using the saved administrator password. No password was changed.');
 const changed=await fetch(origin+'/api/admin/password',{method:'POST',headers:{origin,cookie:oldSession,'Content-Type':'application/json'},body:JSON.stringify({currentPassword,newPassword})});
 if(changed.status!==200)throw Error('Password rotation failed (HTTP '+changed.status+'). Pending credentials retained locally for recovery.');
 newSession=session(await login(newPassword));
 if(!newSession)throw Error('New-password verification failed. Pending credentials retained locally for recovery.');
 const stale=await fetch(origin+'/api/admin/products',{headers:{cookie:oldSession}});
 if(stale.status!==401)throw Error('Old-session invalidation verification failed.');
}
const admin=await fetch(origin+'/api/admin/products',{headers:{cookie:newSession}});
if(admin.status!==200)throw Error('Administrator access verification failed. Pending credentials retained locally.');
if(currentPassword!==newPassword&&(await login(currentPassword)).status!==401)throw Error('Old-password rejection verification failed.');
await writeFile(passwordFile,newPassword+'\n',{mode:0o600});
// Keep local bootstrap configuration consistent. The deployed database stores the active hash.
const salt=randomBytes(16).toString('hex'),hash=`scrypt:${salt}:${scryptSync(newPassword,salt,32).toString('hex')}`;
for(const file of ['.local/admin-vercel.env','.env.local']){
 try{const content=await readFile(file,'utf8');await writeFile(file,content.replace(/^ADMIN_PASSWORD_HASH=.*$/m,'ADMIN_PASSWORD_HASH='+hash),{mode:0o600})}catch(error){if(error.code!=='ENOENT')throw error}
}
await unlink(pendingFile);
console.log('Password changed and verified. Old password and old sessions rejected. New password saved in .local/admin-password.txt (not committed).');

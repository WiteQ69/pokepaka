import {randomBytes,scryptSync} from 'node:crypto';
import {mkdirSync,writeFileSync,existsSync} from 'node:fs';
import {join,resolve} from 'node:path';

const directory=resolve('.local');mkdirSync(directory,{recursive:true});
const envPath=join(directory,'admin-vercel.env'),passwordPath=join(directory,'admin-password.txt');
if(existsSync(envPath)&&existsSync(passwordPath)){
 console.log('Istniejące dane administratora zachowano w .local/admin-vercel.env i .local/admin-password.txt.');
 process.exit(0);
}
if(existsSync(envPath)||existsSync(passwordPath))throw Error('Brakuje jednego z plików danych administratora w .local. Przywróć brakujący plik przed generowaniem nowych danych.');
const password=randomBytes(24).toString('base64url'),salt=randomBytes(16).toString('hex'),hash=scryptSync(password,salt,32).toString('hex'),session=randomBytes(48).toString('hex');
writeFileSync(envPath,`ADMIN_PASSWORD_HASH=scrypt:${salt}:${hash}\nADMIN_SESSION_SECRET=${session}\n`,{mode:0o600});
writeFileSync(passwordPath,password+'\n',{mode:0o600});
console.log('Administrator credentials were saved locally in .local/admin-vercel.env and .local/admin-password.txt. These files are excluded from Git.');

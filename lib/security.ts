import { createHash, randomInt, randomUUID, scrypt as scryptCallback, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';
import { SignJWT, jwtVerify } from 'jose';

const scrypt=promisify(scryptCallback);
const sha=(value:string)=>createHash('sha256').update(value).digest('hex');
export const hashToken=sha;
export async function hashPassword(password:string){const salt=createHash('sha256').update(randomUUID()).digest('hex').slice(0,24);const key=await scrypt(password,salt,64) as Buffer;return `scrypt$${salt}$${key.toString('hex')}`;}
export async function verifyPassword(password:string,stored:string){const [alg,salt,keyHex]=stored.split('$');if(alg!=='scrypt'||!salt||!keyHex)return false;const expected=Buffer.from(keyHex,'hex');const derived=await scrypt(password,salt,expected.length) as Buffer;return expected.length===derived.length&&timingSafeEqual(expected,derived);}
export function newOtp(){return String(randomInt(0,1_000_000)).padStart(6,'0');}
export function otpHash(challengeId:string,code:string){return sha(`${challengeId}:${code}`);}
export function safeEqual(a:string,b:string){const x=Buffer.from(a);const y=Buffer.from(b);return x.length===y.length&&timingSafeEqual(x,y);}
function sessionKey(){const secret=process.env.SESSION_SECRET;if(!secret||secret.length<32)throw new Error('SESSION_SECRET must contain at least 32 characters.');return new TextEncoder().encode(secret);}
export async function signSession(userId:string,sessionId:string){return new SignJWT({sid:sessionId}).setProtectedHeader({alg:'HS256'}).setSubject(userId).setIssuedAt().setExpirationTime('7d').sign(sessionKey());}
export async function verifySession(token:string){try{const {payload}=await jwtVerify(token,sessionKey());if(typeof payload.sub!=='string'||typeof payload.sid!=='string')return null;return {userId:payload.sub,sessionId:payload.sid};}catch{return null;}}

import { createHash } from 'node:crypto';
import { prisma } from '@/lib/db';

type Outcome<T>={status:number;body:T};type Cached<T>={bodyHash:string;outcome:Outcome<T>;expiresAt:number};
const globalIdem=globalThis as unknown as {vexloIdempotency?:Map<string,Cached<unknown>>;vexloIdemInflight?:Set<string>};
const memory=globalIdem.vexloIdempotency??new Map<string,Cached<unknown>>();const inflight=globalIdem.vexloIdemInflight??new Set<string>();
if(process.env.NODE_ENV!=='production'){globalIdem.vexloIdempotency=memory;globalIdem.vexloIdemInflight=inflight}
const digest=(v:unknown)=>createHash('sha256').update(JSON.stringify(v)).digest('hex');
export class IdempotencyError extends Error{constructor(public code:'KEY_REUSED'|'IN_PROGRESS',message:string){super(message)}}

export async function executeIdempotent<T>(route:string,key:string,body:unknown,run:()=>Promise<Outcome<T>>):Promise<{outcome:Outcome<T>;replayed:boolean}>{
 if(!/^[a-zA-Z0-9._:-]{12,128}$/.test(key))throw new IdempotencyError('KEY_REUSED','Send an Idempotency-Key header between 12 and 128 safe characters.');
 const storageKey=createHash('sha256').update(`${route}:${key}`).digest('hex');const bodyHash=digest(body);const expiresAt=new Date(Date.now()+24*60*60_000);
 if(process.env.NODE_ENV==='production'&&process.env.DATABASE_URL){
  let created=false;try{await prisma.idempotencyRecord.create({data:{key:storageKey,route,bodyHash,expiresAt}});created=true}catch{}
  if(!created){const prior=await prisma.idempotencyRecord.findUnique({where:{key:storageKey}});if(!prior||prior.expiresAt<new Date()){if(prior)await prisma.idempotencyRecord.delete({where:{key:storageKey}});return executeIdempotent(route,key,body,run)}if(prior.bodyHash!==bodyHash)throw new IdempotencyError('KEY_REUSED','This Idempotency-Key was already used with different request data.');if(prior.response!==null&&prior.statusCode!==null)return {outcome:{status:prior.statusCode,body:prior.response as T},replayed:true};throw new IdempotencyError('IN_PROGRESS','An identical request is already being processed.')}
  try{const outcome=await run();await prisma.idempotencyRecord.update({where:{key:storageKey},data:{response:outcome.body as object,statusCode:outcome.status}});return {outcome,replayed:false}}catch(e){await prisma.idempotencyRecord.deleteMany({where:{key:storageKey}});throw e}
 }
 if(process.env.NODE_ENV==='production')throw new Error('Durable idempotency requires DATABASE_URL in production.');
 const now=Date.now();const prior=memory.get(storageKey) as Cached<T>|undefined;if(prior&&prior.expiresAt>now){if(prior.bodyHash!==bodyHash)throw new IdempotencyError('KEY_REUSED','This Idempotency-Key was already used with different request data.');return {outcome:prior.outcome,replayed:true}}
 if(inflight.has(storageKey))throw new IdempotencyError('IN_PROGRESS','An identical request is already being processed.');inflight.add(storageKey);try{const outcome=await run();memory.set(storageKey,{bodyHash,outcome,expiresAt:now+24*60*60_000});return {outcome,replayed:false}}finally{inflight.delete(storageKey)}
}

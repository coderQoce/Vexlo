import { NextResponse } from 'next/server';
import { z } from 'zod';
import { randomUUID } from 'node:crypto';
import { runPaymentPipeline } from '@/lib/agents';
import { clientKey, rateLimit } from '@/lib/rate-limit';
import { executeIdempotent, IdempotencyError } from '@/lib/idempotency';

export const runtime='nodejs';
const schema=z.object({amount:z.number().finite().positive().max(25000),recipient:z.string().trim().min(1).max(80),corridor:z.string().trim().max(40).optional(),policy:z.object({autoLimit:z.number().nonnegative(),dailyCap:z.number().positive(),humanOverride:z.boolean(),agents:z.record(z.string(),z.boolean())}).optional(),manualApproval:z.boolean().optional()});
export async function POST(request:Request){
 const limited=rateLimit(`payments:${clientKey(request)}`,20);if(!limited.ok)return NextResponse.json({error:'Too many payment attempts. Try again shortly.'},{status:429});
 if(String(process.env.NODE_ENV)==='production')return NextResponse.json({error:'Demo payment endpoint is disabled in production.'},{status:410});
 try{const input=schema.parse(await request.json());if(String(process.env.NODE_ENV)==='production')return NextResponse.json({error:'This demo endpoint is not connected to an authenticated, persistent transaction service.'},{status:503});
  const names=['Compliance','Fraud','FX','Routing','Settlement','Notification'];const disabled=names.filter(n=>input.policy?.agents[n]===false);if(disabled.length)return NextResponse.json({error:`Payment paused: required agent${disabled.length>1?'s':''} disabled (${disabled.join(', ')}).`},{status:403});if(input.policy&&input.amount>input.policy.dailyCap)return NextResponse.json({error:'Payment exceeds the configured daily agent spend cap.'},{status:403});if((input.policy?.humanOverride||input.amount>(input.policy?.autoLimit??0))&&input.manualApproval!==true)return NextResponse.json({error:'Manual approval is required by the active policy.'},{status:403});
  const key=request.headers.get('Idempotency-Key')||'';const executed=await executeIdempotent('POST:/api/payments',key,input,async()=>({status:200,body:await runPaymentPipeline({amount:input.amount,recipient:input.recipient,corridor:input.corridor||'USDC → USDC'})}));return NextResponse.json(executed.outcome.body,{headers:{'Cache-Control':'no-store','X-Vexlo-Demo':'simulated','Idempotency-Replayed':String(executed.replayed)}})
 }catch(error){if(error instanceof z.ZodError)return NextResponse.json({error:'Invalid payment request.',issues:error.issues.map(i=>({field:i.path.join('.'),message:i.message}))},{status:400});if(error instanceof IdempotencyError)return NextResponse.json({error:error.message},{status:error.code==='IN_PROGRESS'?409:422});return NextResponse.json({error:error instanceof Error?error.message:'Unable to create demo payment receipt.'},{status:400})}
}

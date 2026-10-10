import { NextResponse } from 'next/server';
import { z } from 'zod';
import { randomUUID } from 'node:crypto';
import { currentUser, unauthorized } from '@/lib/api-auth';
import { getProvider, type ProviderName } from '@/lib/providers';
import { clientKey, rateLimit } from '@/lib/rate-limit';
const schema=z.object({provider:z.enum(['flutterwave','blindpay','lightspark','wise','stellar']),sourceCurrency:z.string().length(3),targetCurrency:z.string().length(3),sourceAmount:z.number().positive().max(25000)});
export const runtime='nodejs';
export async function POST(request:Request){const user=await currentUser();if(!user)return unauthorized();const limited=rateLimit(`quote:${user.id}:${clientKey(request)}`,20);if(!limited.ok)return NextResponse.json({error:'Rate quote limit reached.'},{status:429});try{const input=schema.parse(await request.json());const quote=await getProvider(input.provider as ProviderName).quote({...input,idempotencyKey:randomUUID()});await import('@/lib/db').then(({prisma})=>prisma.auditLog.create({data:{userId:user.id,action:'FX_QUOTE_REQUESTED',metadata:{provider:quote.provider,sourceCurrency:input.sourceCurrency,targetCurrency:input.targetCurrency}}}));return NextResponse.json(quote,{headers:{'Cache-Control':'no-store'}})}catch(e){return NextResponse.json({error:e instanceof z.ZodError?'Invalid quote request.':e instanceof Error?e.message:'Provider quote unavailable.'},{status:e instanceof z.ZodError?400:503})}}

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { currentUser, sameOrigin, unauthorized } from '@/lib/api-auth';
import { prisma } from '@/lib/db';
import { clientKey, rateLimit } from '@/lib/rate-limit';
import { hashPassword, verifyPassword } from '@/lib/security';
export const runtime='nodejs';
const schema=z.object({pin:z.string().regex(/^\d{6}$/),currentPin:z.string().regex(/^\d{6}$/).optional()});
export async function PUT(request:Request){if(!sameOrigin(request))return NextResponse.json({error:'Cross-origin request rejected.'},{status:403});const user=await currentUser();if(!user)return unauthorized();const limited=rateLimit(`pin:${user.id}:${clientKey(request)}`,5);if(!limited.ok)return NextResponse.json({error:'Too many PIN changes.'},{status:429});try{const input=schema.parse(await request.json());if(process.env.NODE_ENV==='production')return NextResponse.json({error:'Use the authenticated KMS-backed PIN service in production; it is not configured.'},{status:503});const fresh=await prisma.user.findUnique({where:{id:user.id},select:{transactionPinHash:true}});if(fresh?.transactionPinHash&&(!input.currentPin||!(await verifyPassword(input.currentPin,fresh.transactionPinHash))))return NextResponse.json({error:'Current PIN did not match.'},{status:403});await prisma.user.update({where:{id:user.id},data:{transactionPinHash:await hashPassword(input.pin)}});await prisma.auditLog.create({data:{userId:user.id,action:'TRANSACTION_PIN_UPDATED'}});return NextResponse.json({ok:true})}catch(error){return NextResponse.json({error:error instanceof z.ZodError?'PIN must contain six digits.':'Unable to update PIN.'},{status:error instanceof z.ZodError?400:500})}}

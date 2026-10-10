import { NextResponse } from 'next/server';
import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { sameOrigin } from '@/lib/api-auth';
import { clientKey, rateLimit } from '@/lib/rate-limit';
import { newOtp, otpHash, verifyPassword } from '@/lib/security';

export const runtime='nodejs';
const schema=z.object({identifier:z.string().trim().min(3).max(254),password:z.string().min(1).max(128)});
export async function POST(request:Request){if(!sameOrigin(request))return NextResponse.json({error:'Cross-origin request rejected.'},{status:403});const rate=rateLimit(`signin:${clientKey(request)}`,8);if(!rate.ok)return NextResponse.json({error:'Too many sign-in attempts. Try again shortly.'},{status:429});try{const {identifier,password}=schema.parse(await request.json());const normalized=identifier.toLowerCase();const user=await prisma.user.findFirst({where:{OR:[{email:normalized},{phone:identifier},{handle:normalized}]}});if(!user||user.status!=='ACTIVE'||!(await verifyPassword(password,user.passwordHash)))return NextResponse.json({error:'Sign-in details did not match.'},{status:401});if(String(process.env.NODE_ENV)==='production')return NextResponse.json({error:'Mock OTP is disabled in production; configure an OTP delivery provider.'},{status:503});const id=`otp_${randomUUID()}`;const code=newOtp();await prisma.otpChallenge.create({data:{id,subject:user.id,codeHash:otpHash(id,code),purpose:'signin',expiresAt:new Date(Date.now()+5*60_000)}});return NextResponse.json({challengeId:id,expiresInSeconds:300,delivery:'unconfigured',...(String(process.env.NODE_ENV)!=='production'&&process.env.AUTH_OTP_MODE==='mock'?{developmentOtp:code}:{})},{headers:{'Cache-Control':'no-store'}})}catch(error){if(error instanceof z.ZodError)return NextResponse.json({error:'Sign-in details are invalid.'},{status:400});return NextResponse.json({error:'Unable to sign in.'},{status:500})}}

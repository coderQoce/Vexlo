import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/db';
import { SESSION_COOKIE, sameOrigin } from '@/lib/api-auth';
import { hashToken, verifySession } from '@/lib/security';

export const runtime='nodejs';
export async function POST(request:Request){if(!sameOrigin(request))return NextResponse.json({error:'Cross-origin request rejected.'},{status:403});const jar=await cookies();const token=jar.get(SESSION_COOKIE)?.value;if(token){const decoded=await verifySession(token);if(decoded)await prisma.session.updateMany({where:{id:decoded.sessionId,tokenHash:hashToken(token),revokedAt:null},data:{revokedAt:new Date()}})}const response=NextResponse.json({ok:true});response.cookies.set(SESSION_COOKIE,'',{httpOnly:true,secure:process.env.NODE_ENV==='production',sameSite:'strict',path:'/',maxAge:0});return response}

import { cookies } from 'next/headers';
import { prisma } from '@/lib/db';
import { hashToken, verifySession } from '@/lib/security';

export const SESSION_COOKIE='vexlo_session';
export function sameOrigin(request:Request){const origin=request.headers.get('origin');if(origin){try{if(new URL(origin).origin!==new URL(request.url).origin)return false}catch{return false}}return request.headers.get('sec-fetch-site')!=='cross-site'}
export async function currentUser(){const token=(await cookies()).get(SESSION_COOKIE)?.value;if(!token)return null;const decoded=await verifySession(token);if(!decoded)return null;const session=await prisma.session.findFirst({where:{id:decoded.sessionId,userId:decoded.userId,revokedAt:null,expiresAt:{gt:new Date()},tokenHash:hashToken(token)},include:{user:true}});return session?.user??null;}
export function unauthorized(){return Response.json({error:'Sign in is required.'},{status:401,headers:{'Cache-Control':'no-store'}})}

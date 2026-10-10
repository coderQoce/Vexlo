import { NextResponse } from 'next/server';
import { currentUser, unauthorized } from '@/lib/api-auth';
import { prisma } from '@/lib/db';
export const runtime='nodejs';
export async function GET(){const user=await currentUser();if(!user)return unauthorized();const wallets=await prisma.wallet.findMany({where:{userId:user.id},select:{id:true,asset:true,network:true,availableMinor:true,pendingMinor:true,updatedAt:true}});return NextResponse.json({wallets:wallets.map((w:{id:string;asset:string;network:string;availableMinor:bigint;pendingMinor:bigint;updatedAt:Date})=>({...w,availableMinor:w.availableMinor.toString(),pendingMinor:w.pendingMinor.toString()}))},{headers:{'Cache-Control':'no-store'}})}

import { NextResponse } from 'next/server';
import { currentUser, unauthorized } from '@/lib/api-auth';
import { prisma } from '@/lib/db';
export const runtime='nodejs';
export async function GET(_request:Request,{params}:{params:Promise<{id:string}>|{id:string}}){const user=await currentUser();if(!user)return unauthorized();const {id}=await params;const transaction=await prisma.transaction.findFirst({where:{idempotencyKey:id,userId:user.id},include:{actions:{include:{agentIdentity:true},orderBy:{createdAt:'asc'}}}});if(!transaction)return NextResponse.json({error:'Receipt not found.'},{status:404});return NextResponse.json({transaction},{headers:{'Cache-Control':'no-store'}})}

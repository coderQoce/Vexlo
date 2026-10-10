import { NextResponse } from 'next/server';
import { currentUser, unauthorized } from '@/lib/api-auth';
import { prisma } from '@/lib/db';
export const runtime='nodejs';
export async function GET(){const user=await currentUser();if(!user)return unauthorized();const actions=await prisma.agentAction.findMany({where:{transaction:{userId:user.id}},include:{agentIdentity:{select:{did:true,name:true}}},orderBy:{createdAt:'desc'},take:100});return NextResponse.json({actions},{headers:{'Cache-Control':'no-store'}})}

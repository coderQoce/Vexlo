import { NextResponse } from 'next/server';
import { currentUser, unauthorized } from '@/lib/api-auth';
export const runtime='nodejs';
export async function GET(){const user=await currentUser();if(!user)return unauthorized();return NextResponse.json({id:user.id,firstName:user.firstName,lastName:user.lastName,handle:user.handle,email:user.email,phone:user.phone,kycTier:user.kycTier},{headers:{'Cache-Control':'no-store'}})}

import { NextResponse } from 'next/server';
import { currentUser, unauthorized } from '@/lib/api-auth';
import { providerStatus } from '@/lib/providers';
export async function GET(){const user=await currentUser();if(!user)return unauthorized();return NextResponse.json(providerStatus(),{headers:{'Cache-Control':'no-store'}})}

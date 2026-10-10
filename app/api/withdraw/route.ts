import { handleFinancialAction } from '@/lib/financial-action';
export const runtime='nodejs';
export async function POST(request:Request){return handleFinancialAction(request,'withdraw')}

import { NextResponse } from 'next/server';
import { runPaymentPipeline, type PaymentReceipt } from '@/lib/agents';
import { executeIdempotent, IdempotencyError } from '@/lib/idempotency';
import { clientKey, rateLimit } from '@/lib/rate-limit';

export const runtime = 'nodejs';
type Action = { tool:'send_payment'|'swap'|'buy_airtime'; amount?:number; recipient?:string; currency?:string; network?:string; phone?:string; confirmed?:boolean };
const money=(n:number)=>`$${n.toFixed(2)} USDC`;

function parseAction(message:string):Action|null {
  const text=message.toLowerCase();
  const amountMatch=text.match(/(?:\$|usd\s*)?(\d+(?:\.\d{1,2})?)(?:\s*(?:usdc|usd))?/i);
  const amount=amountMatch?Number(amountMatch[1]):undefined;
  const recipientMatch=message.match(/@[a-z0-9._-]+/i);
  if(/airtime|data bundle|mobile data|top.?up/i.test(text)) {
    const phoneMatch=message.match(/(?:\+?\d[\d\s()-]{7,}\d)/);
    const networkMatch=text.match(/\b(mtn|airtel|glo|9mobile|safaricom|vodacom|telkom)\b/i);
    return {tool:'buy_airtime',amount,phone:phoneMatch?.[0].replace(/[\s()-]/g,''),network:networkMatch?.[0]};
  }
  if(/\bswap\b|convert/i.test(text)) {
    const currency=text.match(/\b(ngn|kes|ghs|mxn|zar|usd)\b/i)?.[0].toUpperCase();
    return {tool:'swap',amount,currency};
  }
  if(/\b(send|pay|transfer)\b/i.test(text)) return {tool:'send_payment',amount,recipient:recipientMatch?.[0]};
  return null;
}

function missingFields(action:Action):string[] {
  if(action.tool==='send_payment') return [...(!action.amount?['amount']:[]),...(!action.recipient?['recipient handle']:[])];
  if(action.tool==='swap') return [...(!action.amount?['amount']:[]),...(!action.currency?['destination currency (NGN, KES, GHS, or MXN)']:[])];
  return [...(!action.amount?['amount']:[]),...(!action.network?['mobile network']:[]),...(!action.phone?['phone number']:[])];
}

export async function POST(request:Request) {
  try {
    if(process.env.NODE_ENV==='production')return NextResponse.json({error:'The deterministic agent demo is disabled in production.'},{status:410});
    const limited=rateLimit(`agent-chat:${clientKey(request)}`,30);if(!limited.ok)return NextResponse.json({error:'Too many agent requests. Try again shortly.'},{status:429});
    const body=await request.json();
    const message=String(body.message||'').trim().slice(0,1000);
    const action:Action|undefined=body.pendingAction;
    if(action&&body.confirmed===true) {
      const missing=missingFields(action);
      if(missing.length) return NextResponse.json({reply:`I still need ${missing.join(' and ')} before I can prepare this.`,pendingAction:action});
      const amount=Number(action.amount);
      if(!Number.isFinite(amount)||amount<=0||amount>25000) return NextResponse.json({error:'Enter an amount from 0.01 to 25,000 USDC.'},{status:400});
      const policy=body.policy;const names=['Compliance','Fraud','FX','Routing','Settlement','Notification'];
      const disabled=names.filter(n=>policy?.agents?.[n]===false);
      if(disabled.length) return NextResponse.json({error:`Policy paused this action: ${disabled.join(', ')} agent${disabled.length>1?'s are':' is'} disabled.`},{status:403});
      if(Number.isFinite(Number(policy?.dailyCap))&&amount>Number(policy.dailyCap)) return NextResponse.json({error:'This action exceeds your configured daily spend cap.'},{status:403});
      const needsApproval=Boolean(policy?.humanOverride)||amount>Number(policy?.autoLimit??0);
      if(needsApproval&&body.manualApproval!==true) return NextResponse.json({error:'This action needs your manual approval.'},{status:403});
      const payee=action.tool==='send_payment'?String(action.recipient):action.tool==='swap'?`@amara.okafor · ${action.currency}`:`${action.network} ${action.phone}`;
      const corridor=action.tool==='swap'?`USDC → ${action.currency}`:action.tool==='buy_airtime'?`USDC → ${action.network} airtime`:'USDC → USDC';
      const outcome=action.tool==='send_payment'?`Done — I prepared the demo transfer of ${money(amount)} to ${action.recipient}.` : action.tool==='swap'?`Done — I prepared a simulated ${money(amount)} swap to ${action.currency}.`:`Done — I prepared a simulated ${money(amount)} ${action.network} airtime top-up for ${action.phone}.`;
      const executed=await executeIdempotent('POST:/api/agent/chat',request.headers.get('Idempotency-Key')||'',{action,amount,recipient:payee,corridor,policy:body.policy},async()=>({status:200,body:{reply:outcome,receipt:await runPaymentPipeline({amount,recipient:payee,corridor}),completedAction:action}}));
      return NextResponse.json(executed.outcome.body,{headers:{'Cache-Control':'no-store','Idempotency-Replayed':String(executed.replayed)}});
    }
    if(!message) return NextResponse.json({error:'Write a message to Vexlo Agent.'},{status:400});
    if(action) {
      const text=message.toLowerCase();
      const amountMatch=message.match(/(?:\$|usd\s*)?(\d+(?:\.\d{1,2})?)(?:\s*(?:usdc|usd))?/i);
      const handle=message.match(/@[a-z0-9._-]+/i)?.[0];
      const phone=message.match(/(?:\+?\d[\d\s()-]{7,}\d)/)?.[0].replace(/[\s()-]/g,'');
      const network=text.match(/\b(mtn|airtel|glo|9mobile|safaricom|vodacom|telkom)\b/i)?.[0];
      const currency=text.match(/\b(ngn|kes|ghs|mxn|zar|usd)\b/i)?.[0].toUpperCase();
      const updated:Action={...action,amount:action.amount??(amountMatch?Number(amountMatch[1]):undefined),recipient:action.recipient??handle,phone:action.phone??phone,network:action.network??network,currency:action.currency??currency};
      const stillMissing=missingFields(updated);
      if(stillMissing.length) return NextResponse.json({reply:`Thanks. I still need ${stillMissing.join(' and ')}.`,pendingAction:updated});
      const summary=updated.tool==='send_payment'?`I can prepare a zero-fee Vexlo transfer of ${money(updated.amount!)} to ${updated.recipient}.` : updated.tool==='swap'?`I can prepare a simulated swap of ${money(updated.amount!)} into ${updated.currency}.`:`I can prepare a simulated ${money(updated.amount!)} ${updated.network} airtime top-up for ${updated.phone}.`;
      return NextResponse.json({reply:`${summary} Please review and confirm below. No action has happened yet.`,pendingAction:updated});
    }
    const text=message.toLowerCase();
    if(/balance|how much|available/.test(text)) return NextResponse.json({reply:'Your available demo balance is $12,458.90 USDC. This is sample data; no wallet is connected.',tool:'get_balance'});
    if(/rate|exchange|convert|ngn|kes|ghs|mxn/.test(text)&&!/swap|convert .* to/.test(text)) return NextResponse.json({reply:'Current illustrative rates: 1 USDC ≈ ₦1,582.40 NGN, KSh 129.56 KES, GH₵ 15.42 GHS, and $17.18 MXN. These are mock rates, not an executable quote.',tool:'get_rates'});
    const draft=parseAction(message);
    if(draft) {
      const missing=missingFields(draft);
      if(missing.length) return NextResponse.json({reply:`Sure — I can help. What ${missing.join(' and ')} should I use? I’ll show you a review card before preparing anything.`,pendingAction:draft});
      const summary=draft.tool==='send_payment'?`I can prepare a zero-fee Vexlo transfer of ${money(draft.amount!)} to ${draft.recipient}.` : draft.tool==='swap'?`I can prepare a simulated swap of ${money(draft.amount!)} into ${draft.currency}.`:`I can prepare a simulated ${money(draft.amount!)} ${draft.network} airtime top-up for ${draft.phone}.`;
      return NextResponse.json({reply:`${summary} Please review and confirm below. No action has happened yet.`,pendingAction:draft});
    }
    return NextResponse.json({reply:'I can check your balance and corridor rates, or help send USDC, swap currencies, and buy airtime. Tell me the amount and recipient or destination; I’ll ask you to review before preparing a payment.'});
  } catch(error) {if(error instanceof IdempotencyError)return NextResponse.json({error:error.message},{status:error.code==='IN_PROGRESS'?409:422});return NextResponse.json({error:error instanceof Error?error.message:'I could not process that message. Please try again.'},{status:400}); }
}

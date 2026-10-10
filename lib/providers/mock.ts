import type { ProviderAdapter, PayoutRequest, PayoutResult, QuoteRequest, QuoteResult } from './types';
export class MockProvider implements ProviderAdapter {
 readonly name='mock';
 async quote(i:QuoteRequest):Promise<QuoteResult>{const rate=i.sourceCurrency===i.targetCurrency?1:1582.4;return {provider:this.name,quoteId:`mock_${i.idempotencyKey}`,sourceAmount:i.sourceAmount,targetAmount:Number((i.sourceAmount*rate).toFixed(2)),rate,fee:0,expiresAt:new Date(Date.now()+30_000).toISOString(),simulated:true}}
 async payout(i:PayoutRequest):Promise<PayoutResult>{return {provider:this.name,providerRef:`demo_${i.idempotencyKey}`,status:'SIMULATED',amount:i.amount,currency:i.currency,simulated:true}}
}

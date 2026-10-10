export type QuoteRequest={sourceCurrency:string;targetCurrency:string;sourceAmount:number;recipientId?:string;idempotencyKey:string};
export type QuoteResult={provider:string;quoteId:string;sourceAmount:number;targetAmount:number;rate:number;fee:number;expiresAt:string;simulated:boolean;raw?:unknown};
export type PayoutRequest={amount:number;currency:string;recipient:{accountBank:string;accountNumber:string;name?:string};idempotencyKey:string;narration?:string};
export type PayoutResult={provider:string;providerRef:string;status:string;amount:number;currency:string;simulated:boolean;raw?:unknown};
export interface ProviderAdapter { readonly name:string; quote(input:QuoteRequest):Promise<QuoteResult>; payout(input:PayoutRequest):Promise<PayoutResult> }
export class ProviderUnavailableError extends Error { constructor(message:string){super(message);this.name='ProviderUnavailableError'} }

import type { ProviderAdapter, PayoutRequest, PayoutResult, QuoteRequest, QuoteResult } from './types';
import { ProviderUnavailableError } from './types';

/** Lightspark is a Lightning payment rail, not a native Stellar USDC rail.
 * We require the official SDK-backed implementation to be injected at runtime;
 * this adapter fails closed until that account-specific client is configured. */
export type LightsparkPort={quote:(input:QuoteRequest)=>Promise<QuoteResult>;payInvoice:(input:PayoutRequest)=>Promise<PayoutResult>};
export class LightsparkAdapter implements ProviderAdapter {
 readonly name='lightspark';constructor(private port?:LightsparkPort){}
 async quote(input:QuoteRequest){if(!this.port)throw new ProviderUnavailableError('Lightspark SDK client is not injected. Configure a BTC/Lightning conversion bridge before routing USDC through this rail.');return this.port.quote(input)}
 async payout(input:PayoutRequest){if(!this.port)throw new ProviderUnavailableError('Lightspark SDK client is not injected. A Lightning invoice and conversion quote are required.');return this.port.payInvoice(input)}
}

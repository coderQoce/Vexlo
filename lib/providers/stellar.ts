import { Asset, BASE_FEE, Horizon, Memo, Networks, Operation, TransactionBuilder, Transaction } from '@stellar/stellar-sdk';
import type { ProviderAdapter, PayoutRequest, PayoutResult, QuoteRequest, QuoteResult } from './types';
import { ProviderUnavailableError } from './types';

export type StellarKmsSigner={publicKey:string;signTransaction:(transactionXdr:string,networkPassphrase:string)=>Promise<string>};
export class StellarAdapter implements ProviderAdapter {
 readonly name='stellar';private server=new Horizon.Server(process.env.STELLAR_HORIZON_URL||'https://horizon-testnet.stellar.org');
 private network=process.env.STELLAR_NETWORK_PASSPHRASE||Networks.TESTNET;
 constructor(private signer?:StellarKmsSigner){}
 async quote(i:QuoteRequest):Promise<QuoteResult>{if(i.sourceCurrency!==i.targetCurrency)throw new ProviderUnavailableError('Stellar USDC transfers do not provide fiat FX. Route currency conversion through an enabled FX provider.');return {provider:this.name,quoteId:i.idempotencyKey,sourceAmount:i.sourceAmount,targetAmount:i.sourceAmount,rate:1,fee:0,expiresAt:new Date(Date.now()+30_000).toISOString(),simulated:process.env.VEXLO_PROVIDER_MODE!=='live'}}
 async payout(i:PayoutRequest):Promise<PayoutResult>{if(!this.signer)throw new ProviderUnavailableError('Stellar payout requires an injected KMS signer; no private key environment fallback is supported.');if(process.env.VEXLO_LIVE_PAYMENTS_ENABLED!=='true')throw new ProviderUnavailableError('Live payment switch is disabled.');const account=await this.server.loadAccount(this.signer.publicKey);const issuer=process.env.STELLAR_USDC_ISSUER;if(!issuer)throw new ProviderUnavailableError('STELLAR_USDC_ISSUER is not configured.');const asset=new Asset('USDC',issuer);const tx=new TransactionBuilder(account,{fee:BASE_FEE,networkPassphrase:this.network}).addOperation(Operation.payment({destination:i.recipient.accountNumber,asset,amount:i.amount.toFixed(7)})).addMemo(Memo.text(i.idempotencyKey.slice(0,28))).setTimeout(30).build();const signedXdr=await this.signer.signTransaction(tx.toXDR(),this.network);const signed=TransactionBuilder.fromXDR(signedXdr,this.network) as Transaction;const result=await this.server.submitTransaction(signed);return {provider:this.name,providerRef:result.hash,status:'PENDING',amount:i.amount,currency:'USDC',simulated:false,raw:{hash:result.hash,ledger:result.ledger}}}
}

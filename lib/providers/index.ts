import { FlutterwaveAdapter } from './flutterwave';
import { BlindPayAdapter } from './blindpay';
import { LightsparkAdapter } from './lightspark';
import { MockProvider } from './mock';
import { StellarAdapter } from './stellar';
import { WiseAdapter } from './wise';
import type { ProviderAdapter } from './types';
import { ProviderUnavailableError } from './types';

export type ProviderName='flutterwave'|'blindpay'|'lightspark'|'wise'|'stellar';
const liveAdapters:Record<ProviderName,()=>ProviderAdapter>={flutterwave:()=>new FlutterwaveAdapter(),blindpay:()=>new BlindPayAdapter(),lightspark:()=>new LightsparkAdapter(),wise:()=>new WiseAdapter(),stellar:()=>new StellarAdapter()};
export function getProvider(name:ProviderName):ProviderAdapter {if(process.env.VEXLO_PROVIDER_MODE!=='live')return new MockProvider();if(process.env.VEXLO_LIVE_PAYMENTS_ENABLED!=='true')throw new ProviderUnavailableError('Live provider calls are disabled by VEXLO_LIVE_PAYMENTS_ENABLED.');return liveAdapters[name]()}
export function providerStatus(){return {mode:process.env.VEXLO_PROVIDER_MODE==='live'&&process.env.VEXLO_LIVE_PAYMENTS_ENABLED==='true'?'live-configured':'mock',livePaymentsEnabled:process.env.VEXLO_LIVE_PAYMENTS_ENABLED==='true',providers:{flutterwave:Boolean(process.env.FLUTTERWAVE_SECRET_KEY),blindpay:Boolean(process.env.BLINDPAY_API_KEY&&process.env.BLINDPAY_INSTANCE_ID),lightspark:false,wise:Boolean(process.env.WISE_API_TOKEN&&process.env.WISE_PROFILE_ID),stellar:Boolean(process.env.STELLAR_USDC_ISSUER&&process.env.KMS_KEY_REFERENCE)},note:'Credentials being present does not imply production readiness; complete sandbox certification, security review, custody wiring, and operational approval.'}}

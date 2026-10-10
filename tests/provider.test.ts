import { describe, expect, it } from 'vitest';
import { MockProvider } from '../lib/providers/mock';

describe('Mock provider adapter',()=>{
  it('returns an explicitly simulated payout',async()=>{const result=await new MockProvider().payout({amount:12,currency:'NGN',recipient:{accountBank:'044',accountNumber:'demo'},idempotencyKey:'test-1234567890'});expect(result.simulated).toBe(true);expect(result.status).toBe('SIMULATED')});
  it('returns a 30 second simulated quote',async()=>{const result=await new MockProvider().quote({sourceCurrency:'USDC',targetCurrency:'USDC',sourceAmount:10,idempotencyKey:'test-1234567890'});expect(result.simulated).toBe(true);expect(result.targetAmount).toBe(10);expect(new Date(result.expiresAt).getTime()).toBeGreaterThan(Date.now())});
});

import { describe, expect, it } from 'vitest';
import { evaluatePaymentPolicy } from '../lib/policy';

const allOn={Compliance:true,Fraud:true,FX:true,Routing:true,Settlement:true,Notification:true};
describe('Policy Engine',()=>{
  it('allows a payment within the auto-execute limit when every agent is enabled',()=>{expect(evaluatePaymentPolicy({agents:allOn,dailyCap:500,autoLimit:100,humanOverride:false},50,false)).toEqual({allowed:true})});
  it('requires manual approval above the auto-execute limit',()=>{expect(evaluatePaymentPolicy({agents:allOn,dailyCap:500,autoLimit:100,humanOverride:false},125,false).allowed).toBe(false)});
  it('blocks a payment when a required agent is disabled',()=>{expect(evaluatePaymentPolicy({agents:{...allOn,Fraud:false},dailyCap:500,autoLimit:500,humanOverride:false},10,true)).toMatchObject({allowed:false,status:403})});
  it('blocks payment above daily cap even with manual approval',()=>{expect(evaluatePaymentPolicy({agents:allOn,dailyCap:50,autoLimit:500,humanOverride:false},51,true).allowed).toBe(false)});
  it('requires manual approval while human override is enabled',()=>{expect(evaluatePaymentPolicy({agents:allOn,dailyCap:500,autoLimit:500,humanOverride:true},1,false).allowed).toBe(false)});
});

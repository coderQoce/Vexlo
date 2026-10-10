import { randomUUID } from 'node:crypto';

export type AgentName = 'Compliance' | 'Fraud' | 'FX' | 'Routing' | 'Settlement' | 'Notification';
export type AgentReceipt = { agent: AgentName; did: string; action: string; result: string; timestampMs: number; nonce: string; signature: string; publicKey: string; algorithm: 'Ed25519-SIMULATED'; };
export type PaymentReceipt = {
  id: string; status: 'completed' | 'blocked'; simulated: true;
  amount: number; asset: 'USDC'; sender: string; recipient: string; corridor: string;
  createdAt: string; risk: { score: number; factors: { name: string; weight: number; score: number; explanation: string }[] };
  chain: AgentReceipt[]; context: { source: string; items: string[] };
  attestation: Record<string, unknown>; dpop: string; stellarAnchor: string;
};

const agents: { name: AgentName; did: string; action: string; result: string }[] = [
  { name: 'Compliance', did: 'did:web:vexlo.app:agent:compliance', action: 'KYC / sanctions policy check', result: 'passed (demo profile)' },
  { name: 'Fraud', did: 'did:web:vexlo.app:agent:fraud', action: 'Explainable transaction risk assessment', result: 'low risk · flagged factors recorded' },
  { name: 'FX', did: 'did:web:vexlo.app:agent:fx', action: 'Indicative USDC quote and rate lock', result: 'quote locked · simulated 30s window' },
  { name: 'Routing', did: 'did:web:vexlo.app:agent:routing', action: 'Select payment route', result: 'Stellar test route selected' },
  { name: 'Settlement', did: 'did:web:vexlo.app:agent:settlement', action: 'Submit settlement instruction', result: 'simulated settlement accepted' },
  { name: 'Notification', did: 'did:web:vexlo.app:agent:notification', action: 'Prepare delivery confirmation', result: 'demo notification queued' },
];

/** This server-only demonstrator signs each output with a fresh throwaway key.
 * It is not an ACK identity, durable credential, or production signing service. */
export async function runPaymentPipeline(input: { amount: number; recipient: string; sender?: string; corridor?: string }): Promise<PaymentReceipt> {
  const { generateKeyPairSync, sign, createHash } = await import('node:crypto');
  const pair = generateKeyPairSync('ed25519');
  const publicKey = pair.publicKey.export({ type: 'spki', format: 'der' }).toString('base64url');
  const score = input.amount > 5000 ? 0.57 : input.amount > 1000 ? 0.32 : 0.14;
  const factors = [
    { name: 'Amount pattern', weight: 0.35, score: input.amount > 1000 ? 0.45 : 0.12, explanation: input.amount > 1000 ? 'Above the routine demo amount' : 'Within routine demo range' },
    { name: 'Recipient familiarity', weight: 0.25, score: 0.08, explanation: 'Demo recipient handle supplied by the user' },
    { name: 'Account posture', weight: 0.25, score: 0.1, explanation: 'Verified demo profile' },
    { name: 'Corridor signal', weight: 0.15, score: 0.12, explanation: 'Mock corridor health is normal' },
  ];
  const chain: AgentReceipt[] = agents.map(agent => {
    const timestampMs = Date.now();
    const nonce = randomUUID();
    const payload = JSON.stringify({ agentDid: agent.did, action: agent.action, result: agent.result, timestampMs, nonce });
    const signature = sign(null, Buffer.from(payload), pair.privateKey).toString('base64url');
    return { agent: agent.name, did: agent.did, action: agent.action, result: agent.result, timestampMs, nonce, signature, publicKey, algorithm: 'Ed25519-SIMULATED' };
  });
  const id = `vx_demo_${randomUUID()}`;
  const createdAt = new Date().toISOString();
  const attestation = { '@context': ['https://www.w3.org/2018/credentials/v1'], type: ['VerifiableCredential', 'PaymentAttestation'], issuer: 'did:web:vexlo.app (simulated)', issuanceDate: createdAt, credentialSubject: { transactionId: id, amount: input.amount, asset: 'USDC', recipient: input.recipient, settlementStatus: 'simulated' }, proof: { type: 'Ed25519Signature2020', proofPurpose: 'assertionMethod', simulated: true } };
  const digest = createHash('sha256').update(`${id}:${input.amount}:${input.recipient}:${createdAt}`).digest('hex');
  return { id, status: 'completed', simulated: true, amount: input.amount, asset: 'USDC', sender: input.sender || '@amara.okafor', recipient: input.recipient, corridor: input.corridor || 'USDC → USDC', createdAt, risk: { score, factors }, chain, context: { source: 'MCP-compatible simulated context adapter', items: ['Demo account KYC tier: 2', 'Recipient handle entered in this session', 'Mock corridor service: available'] }, attestation, dpop: `SIMULATED-DPOP.${Buffer.from(JSON.stringify({ htm: 'POST', htu: '/api/payments', jti: randomUUID() })).toString('base64url')}`, stellarAnchor: `SIMULATED-STELLAR-${digest.slice(0, 32).toUpperCase()}` };
}

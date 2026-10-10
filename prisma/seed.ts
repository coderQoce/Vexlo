import { PrismaClient } from '@prisma/client';
const prisma=new PrismaClient();
const identities=[
 ['compliance','Compliance','KYC / AML / sanctions'],['fraud','Fraud','Explainable transaction risk'],['fx','FX','Rates and locking'],['routing','Routing','Route selection'],['settlement','Settlement','Stellar settlement'],['notification','Notification','Delivery notices'],
];
async function main(){for(const [slug,name,role] of identities)await prisma.agentIdentity.upsert({where:{did:`did:web:vexlo.app:agent:${slug}`},create:{did:`did:web:vexlo.app:agent:${slug}`,name,role,publicKey:'NOT_CONFIGURED',credential:{simulated:true,issuer:'did:web:vexlo.app',subject:`did:web:vexlo.app:agent:${slug}`,role,warning:'Seed identity only; no signing credential or private key.'}},update:{name,role}});console.info(`Seeded ${identities.length} simulated agent identities.`)}
main().catch(e=>{console.error(e);process.exitCode=1}).finally(()=>prisma.$disconnect());

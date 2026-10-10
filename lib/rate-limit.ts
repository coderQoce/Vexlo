type Bucket={startedAt:number;count:number};
const globalBuckets=globalThis as unknown as {vexloRateBuckets?:Map<string,Bucket>};
const buckets=globalBuckets.vexloRateBuckets??new Map<string,Bucket>();
if(process.env.NODE_ENV!=='production')globalBuckets.vexloRateBuckets=buckets;
/** Process-local limiter for local/dev runs. Production should use a shared Redis/Upstash store. */
export function rateLimit(key:string,limit=12,windowMs=60_000){const now=Date.now();const current=buckets.get(key);if(!current||now-current.startedAt>=windowMs){buckets.set(key,{startedAt:now,count:1});return {ok:true,remaining:limit-1}}if(current.count>=limit)return {ok:false,remaining:0,retryAfterSeconds:Math.ceil((windowMs-(now-current.startedAt))/1000)};current.count++;return {ok:true,remaining:limit-current.count};}
export function clientKey(request:Request){return request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()||'unknown';}

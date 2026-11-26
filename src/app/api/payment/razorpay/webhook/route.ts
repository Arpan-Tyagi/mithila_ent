// Alias kept so a Razorpay dashboard configured with this older URL keeps
// working. It runs the same handler as /api/webhooks/razorpay (SEC-07): one
// implementation, one dedupe table. Prefer the /api/webhooks/razorpay URL.
export { POST } from '@/app/api/webhooks/razorpay/route';

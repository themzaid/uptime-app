import { Queue } from 'bullmq';
import IORedis from 'ioredis';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.production' });
const connection = new IORedis(process.env.REDIS_URL || 'redis://localhost:6379', { maxRetriesPerRequest: null });
const monitorQueue = new Queue('monitor-queue', { connection });
async function run() {
    const jobs = await monitorQueue.getJobSchedulers();
    console.log(JSON.stringify(jobs, null, 2));
    process.exit(0);
}
run();

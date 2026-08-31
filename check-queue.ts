import { monitorQueue } from './src/worker/queue';

async function check() {
  const schedulers = await monitorQueue.getJobSchedulers();
  console.log('Schedulers:', schedulers.map(s => s.id));
  
  const jobs = await monitorQueue.getJobs(['active', 'waiting', 'delayed', 'failed']);
  console.log('Jobs in queue:', jobs.map(j => ({ id: j.id, name: j.name, data: j.data })));
  process.exit(0);
}
check();

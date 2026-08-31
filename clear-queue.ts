import { monitorQueue } from './src/worker/queue';

async function clear() {
  console.log('Pausing queue...');
  await monitorQueue.pause();
  
  const schedulers = await monitorQueue.getJobSchedulers();
  for (const s of schedulers) {
    if (s.id) {
      console.log('Removing scheduler', s.id);
      await monitorQueue.removeJobScheduler(s.id);
    }
  }

  console.log('Obliterating queue...');
  await monitorQueue.obliterate({ force: true });
  
  console.log('Done!');
  process.exit(0);
}
clear();

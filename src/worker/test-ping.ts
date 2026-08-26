// src/worker/test-ping.ts
import { ping } from './ping';

async function run() {
    console.log('Pinging amazon...');
    const res1 = await ping('https://amazon.com');
    console.log(res1);

    console.log('\nPinging a fake site (should fail)...');
    const res2 = await ping('https://this-site-does-not-exist.foo');
    console.log(res2);

    console.log('\nPinging with a 10ms timeout (should timeout)...');
    const res3 = await ping('https://amazon.com', 10);
    console.log(res3);
}

run().catch(console.error);

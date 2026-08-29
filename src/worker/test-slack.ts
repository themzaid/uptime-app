import dotenv from 'dotenv';
dotenv.config({ path: '.env' });
dotenv.config({ path: '.env.local' });

async function test() {
    // Dynamically import so dotenv is loaded FIRST before alerts.ts is evaluated
    const { sendSlackAlert } = await import('./alerts');
    console.log('Testing Slack webhook integration...');
    console.log('Make sure your .env has SLACK_WEBHOOK_URL set!\n');

    console.log('1. Sending "Down" alert...');
    await sendSlackAlert('Test Monitor (Fake Down)', 'https://this-is-a-test.com', 'open');
    
    // Wait a second so they don't arrive in the exact same millisecond
    await new Promise(resolve => setTimeout(resolve, 1000));

    console.log('2. Sending "Up" alert...');
    await sendSlackAlert('Test Monitor (Fake Up)', 'https://this-is-a-test.com', 'resolved');
    
    console.log('\nDone! Check your Slack channel to see if the messages arrived.');
}

test().catch(console.error);

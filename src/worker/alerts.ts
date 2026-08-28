import { Resend } from 'resend';
import { createClerkClient } from '@clerk/backend';

const resend = new Resend(process.env.RESEND_API_KEY);
const clerkClient = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });

export async function sendIncidentEmail(userId: string, monitorName: string, monitorUrl: string, status: 'open' | 'resolved') {
    if (!process.env.RESEND_API_KEY || !process.env.CLERK_SECRET_KEY) {
        console.warn('RESEND_API_KEY or CLERK_SECRET_KEY is not set, skipping email alert.');
        return;
    }

    try {
        const user = await clerkClient.users.getUser(userId);
        const email = user.emailAddresses[0]?.emailAddress;

        if (!email) {
            console.error(`User ${userId} has no email address`);
            return;
        }

        const isDown = status === 'open';
        const subject = isDown
            ? `🚨 Monitor Down: ${monitorName}`
            : `✅ Monitor Up: ${monitorName}`;

        const text = isDown
            ? `Your monitor for ${monitorName} (${monitorUrl}) is currently DOWN.`
            : `Your monitor for ${monitorName} (${monitorUrl}) is back UP and resolved.`;

        const { error } = await resend.emails.send({
            from: 'Uptime Monitor <onboarding@resend.dev>',
            to: 'themzaid@gmail.com', // TODO: Remove hardcode after testing
            subject,
            text,
        });

        if (error) {
            console.error('[Resend Error]:', error);
        } else {
            console.log(`Email alert sent to themzaid@gmail.com (Hardcoded) for monitor ${monitorName} (${status})`);
        }
    } catch (error) {
        console.error('Failed to send incident email:', error);
    }
}

import { clerkClient } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
    // SECURITY: Ensure this backdoor ONLY runs in local development!
    if (process.env.NODE_ENV !== 'development') {
        return new NextResponse('Not found', { status: 404 });
    }
    
    const url = new URL(request.url);
    const email = url.searchParams.get('email');
    
    if (!email) {
        return new NextResponse('Email query parameter is missing', { status: 400 });
    }

    // Await the client per Clerk v7 Next.js rules
    const client = await clerkClient();
    
    // Find the test user by their email
    const users = await client.users.getUserList({ emailAddress: [email] });
    
    if (users.data.length === 0) {
        return new NextResponse('Test user not found in Clerk', { status: 404 });
    }

    // Generate a secure one-time-use SignIn Token from the Clerk Backend SDK
    const signInToken = await client.signInTokens.createSignInToken({
        userId: users.data[0].id,
        expiresInSeconds: 60,
    });

    // Return the raw ticket as JSON so we can consume it programmatically without cross-origin redirects
    return NextResponse.json({ ticket: signInToken.token });
}

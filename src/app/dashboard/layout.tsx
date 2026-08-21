import { auth } from '@clerk/nextjs/server';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
    // In Clerk Core 3 (v7+), auth is an object/namespace and you await protect directly.
    await auth.protect();

    return (
        <div className="flex h-screen flex-col">
            <nav className="bg-gray-100 p-4 font-bold">Uptime Monitor Dashboard</nav>
            <main className="flex-1 p-4">{children}</main>
        </div>
    );
}

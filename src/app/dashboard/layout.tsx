import { auth } from '@clerk/nextjs/server';
import { UserButton } from '@clerk/nextjs';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
    // In Clerk Core 3 (v7+), auth is an object/namespace and you await protect directly.
    await auth.protect();

    return (
        <div className="flex h-screen flex-col bg-gray-50">
            <nav className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between sticky top-0 z-40">
                <div className="font-bold text-xl text-gray-900">Uptime Monitor</div>
                <UserButton />
            </nav>
            <main className="flex-1 overflow-auto">{children}</main>
        </div>
    );
}

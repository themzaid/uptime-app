import { UserButton } from '@clerk/nextjs';

export default function DashboardPage() {
    return (
        <div>
            <header className="flex items-center justify-between">
                <h1 className="text-2xl">Your Monitors</h1>
                <UserButton />
            </header>
            <p className="mt-4">You are successfully logged in!</p>
        </div>
    );
}

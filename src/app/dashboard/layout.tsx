import { auth } from '@clerk/nextjs/server';
import { UserButton } from '@clerk/nextjs';
import { ChartLineUp } from '@phosphor-icons/react/dist/ssr';
import SidebarNav from '../../components/SidebarNav';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
    // In Clerk Core 3 (v7+), auth is an object/namespace and you await protect directly.
    await auth.protect();

    return (
        <div className="flex h-screen bg-[#FDFDFD] overflow-hidden">
            {/* Sidebar */}
            <aside className="w-[200px] bg-white border-r border-gray-200/60 flex flex-col shadow-[4px_0_24px_-12px_rgba(0,0,0,0.05)] z-10 relative">
                <div className="h-20 flex items-center px-6 border-b border-gray-100/80">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-b from-green-500 to-green-600 rounded-xl flex items-center justify-center shadow-sm shadow-green-500/20">
                            <ChartLineUp weight="bold" className="w-5 h-5 text-white" />
                        </div>
                        <span className="font-bold uppercase text-[17px] text-gray-800 tracking-wide">Uptime</span>
                    </div>
                </div>

                <SidebarNav />

                <div className="p-4 mb-4 mx-4 border border-gray-100 bg-gray-50/50 rounded-2xl flex items-center gap-3 transition-colors hover:bg-gray-50">
                    <UserButton afterSignOutUrl="/" appearance={{ elements: { userButtonAvatarBox: "w-9 h-9 shadow-sm" } }} />
                    <div className="flex flex-col">
                        <span className="text-[13px] font-semibold text-gray-900 leading-tight">My Account</span>
                        <span className="text-[11px] text-gray-500 font-medium">Manage profile</span>
                    </div>
                </div>
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 overflow-auto bg-[#FDFDFD]">
                {children}
            </main>
        </div>
    );
}

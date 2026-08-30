import { SignIn } from '@clerk/nextjs';

export default function Page() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <SignIn fallbackRedirectUrl="/dashboard" signUpFallbackRedirectUrl="/dashboard" />
    </div>
  );
}

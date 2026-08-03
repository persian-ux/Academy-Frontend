import { Link } from "react-router-dom";
import { LockKeyhole } from "lucide-react";

export default function AccessDenied() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-16">
      <div className="max-w-md w-full rounded-2xl border border-white/10 bg-white/5 p-8 text-center shadow-2xl backdrop-blur-sm">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-red-500/10 text-red-400">
          <LockKeyhole className="h-7 w-7" />
        </div>
        <h1 className="text-2xl font-bold text-white">Access denied</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Your account does not have permission to open that screen. If you just signed in, try again from the correct role area.
        </p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link
            to="/signin"
            className="inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary/90"
          >
            Back to sign in
          </Link>
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-white/10"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}
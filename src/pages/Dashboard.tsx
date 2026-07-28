import { useAppSelector } from "@/hooks/useAppStore";

export default function Dashboard() {
  const { user } = useAppSelector((state) => state.auth);

  return (
    <div className="min-h-screen pt-20 px-4 pb-4 md:px-8 md:pb-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
          Welcome back, {user!.name || "User"}!
        </h1>
        <p className="text-muted-foreground mb-8">
          This is your learning dashboard.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Stats Card */}
          <div className="p-6 rounded-xl bg-white/5 border border-white/10 hover:border-primary/30 transition-all duration-300">
            <h3 className="text-lg font-semibold text-white mb-2">Courses</h3>
            <p className="text-3xl font-bold text-primary">0</p>
            <p className="text-sm text-muted-foreground mt-1">Enrolled courses</p>
          </div>

          <div className="p-6 rounded-xl bg-white/5 border border-white/10 hover:border-primary/30 transition-all duration-300">
            <h3 className="text-lg font-semibold text-white mb-2">Progress</h3>
            <p className="text-3xl font-bold text-primary">0%</p>
            <p className="text-sm text-muted-foreground mt-1">Overall completion</p>
          </div>

          <div className="p-6 rounded-xl bg-white/5 border border-white/10 hover:border-primary/30 transition-all duration-300">
            <h3 className="text-lg font-semibold text-white mb-2">Achievements</h3>
            <p className="text-3xl font-bold text-primary">0</p>
            <p className="text-sm text-muted-foreground mt-1">Badges earned</p>
          </div>
        </div>
      </div>
    </div>
  );
}
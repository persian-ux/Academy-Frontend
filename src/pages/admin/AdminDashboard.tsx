import { useState, useEffect } from "react";
import { Users, BookOpen, ClipboardCheck, BarChart3, CalendarRange, Loader2 } from "lucide-react";
import { getDashboardStats, type DashboardStats } from "@/services/adminService";

interface StatCard {
  label: string;
  value: number | string;
  icon: React.ReactNode;
  color: string;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadStats = async () => {
      try {
        setLoading(true);
        const res = await getDashboardStats();
        if (res.success) setStats(res.stats);
      } catch {
        setError("Failed to load dashboard stats");
      } finally {
        setLoading(false);
      }
    };
    loadStats();
  }, []);

  const statCards: StatCard[] = [
    {
      label: "Total Users",
      value: stats?.totalUsers ?? 0,
      icon: <Users className="w-6 h-6" />,
      color: "from-blue-500 to-blue-600",
    },
    {
      label: "Students",
      value: stats?.totalStudents ?? 0,
      icon: <Users className="w-6 h-6" />,
      color: "from-green-500 to-green-600",
    },
    {
      label: "Teachers",
      value: stats?.totalTeachers ?? 0,
      icon: <Users className="w-6 h-6" />,
      color: "from-purple-500 to-purple-600",
    },
    {
      label: "Sections",
      value: stats?.totalCourses ?? 0,
      icon: <BookOpen className="w-6 h-6" />,
      color: "from-orange-500 to-orange-600",
    },
    {
      label: "Tests",
      value: stats?.totalTests ?? 0,
      icon: <ClipboardCheck className="w-6 h-6" />,
      color: "from-pink-500 to-pink-600",
    },
    {
      label: "Attendance Records",
      value: stats?.recentAttendance ?? 0,
      icon: <CalendarRange className="w-6 h-6" />,
      color: "from-teal-500 to-teal-600",
    },
    {
      label: "Monthly Reports",
      value: stats?.monthlyReportsGenerated ?? 0,
      icon: <BarChart3 className="w-6 h-6" />,
      color: "from-indigo-500 to-indigo-600",
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-60">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-white">Admin Dashboard</h2>
        <p className="text-muted-foreground text-sm mt-1">
          Overview of your academy management system
        </p>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {statCards.map((card, idx) => (
          <div
            key={idx}
            className="relative p-6 rounded-xl bg-white/5 border border-white/10 hover:border-primary/30 transition-all duration-300 group overflow-hidden"
          >
            <div
              className={`absolute inset-0 bg-gradient-to-br ${card.color} opacity-0 group-hover:opacity-10 transition-opacity duration-300`}
            />
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <div className={`p-2 rounded-lg bg-gradient-to-br ${card.color} bg-opacity-20`}>
                  {card.icon}
                </div>
              </div>
              <p className="text-3xl font-bold text-white mb-1">{card.value}</p>
              <p className="text-sm text-muted-foreground">{card.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="mt-8">
        <h3 className="text-lg font-semibold text-white mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <QuickActionCard
            title="Manage Users"
            description="Create, edit, or remove users"
            icon={<Users className="w-5 h-5" />}
            color="text-blue-400"
            onClick={() => window.location.hash = "#users"}
          />
          <QuickActionCard
            title="Manage Sections"
            description="Add or update sections and classes"
            icon={<BookOpen className="w-5 h-5" />}
            color="text-orange-400"
            onClick={() => window.location.hash = "#courses"}
          />
          <QuickActionCard
            title="Take Attendance"
            description="Mark attendance for any section"
            icon={<ClipboardCheck className="w-5 h-5" />}
            color="text-green-400"
            onClick={() => window.location.hash = "#attendance"}
          />
        </div>
      </div>
    </div>
  );
}

function QuickActionCard({
  title,
  description,
  icon,
  color,
  onClick,
}: {
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex items-start gap-4 p-4 rounded-xl bg-white/5 border border-white/10 hover:border-primary/30 transition-all text-left group"
    >
      <div className={`p-2 rounded-lg bg-white/5 ${color}`}>
        {icon}
      </div>
      <div>
        <h4 className="text-sm font-semibold text-white group-hover:text-primary transition-colors">
          {title}
        </h4>
        <p className="text-xs text-muted-foreground mt-1">{description}</p>
      </div>
    </button>
  );
}
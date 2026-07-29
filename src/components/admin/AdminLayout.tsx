import { useState } from "react";
import { Link, useLocation, Outlet } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  BookOpen,
  ClipboardCheck,
  FileText,
  BarChart3,
  Upload,
  GraduationCap,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

const sidebarItems = [
  { label: "Dashboard", icon: <LayoutDashboard className="w-5 h-5" />, path: "/admin" },
  { label: "Users", icon: <Users className="w-5 h-5" />, path: "/admin/users" },
  { label: "Sections", icon: <BookOpen className="w-5 h-5" />, path: "/admin/courses" },
  { label: "Attendance", icon: <ClipboardCheck className="w-5 h-5" />, path: "/admin/attendance" },
  { label: "Tests", icon: <FileText className="w-5 h-5" />, path: "/admin/tests" },
  { label: "Upload Marks", icon: <Upload className="w-5 h-5" />, path: "/admin/upload-marks" },
  { label: "Class Marks", icon: <GraduationCap className="w-5 h-5" />, path: "/admin/class-marks" },
  { label: "Reports", icon: <BarChart3 className="w-5 h-5" />, path: "/admin/reports" },
  { label: "Monthly Reports", icon: <BarChart3 className="w-5 h-5" />, path: "/admin/monthly-reports" },
];

export default function AdminLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();

  const isActive = (path: string) => {
    if (path === "/admin") return location.pathname === "/admin";
    return location.pathname.startsWith(path);
  };

  return (
    <div className="min-h-screen pt-20 flex">
      {/* Sidebar */}
      <aside
        className={`${
          collapsed ? "w-16" : "w-64"
        } transition-all duration-300 border-r border-white/10 bg-black/20 flex flex-col`}
      >
        <div className="flex items-center justify-end p-3">
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-1.5 hover:bg-white/10 rounded-lg transition-colors text-muted-foreground"
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        <nav className="flex-1 px-2 pb-4 space-y-1 overflow-y-auto">
          {sidebarItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                isActive(item.path)
                  ? "bg-primary/20 text-primary border border-primary/30"
                  : "text-muted-foreground hover:text-white hover:bg-white/5"
              }`}
              title={collapsed ? item.label : undefined}
            >
              <span className="flex-shrink-0">{item.icon}</span>
              {!collapsed && <span>{item.label}</span>}
            </Link>
          ))}
        </nav>

        <div className="p-3 border-t border-white/10">
          <Link
            to="/dashboard"
            className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground hover:text-white transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            {!collapsed && <span>Back to User Dashboard</span>}
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6 md:p-8 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}
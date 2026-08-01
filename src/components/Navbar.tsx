"use client";

import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Menu, X, User, LogOut, Shield, ChevronDown } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/hooks/useAppStore";
import { logout } from "@/store/slices/authSlice";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";

export default function Navbar() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAppSelector((state) => state.auth);
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  // Check if we're on a dashboard or admin page
  const isDashboardPage = location.pathname.startsWith("/admin") || location.pathname.startsWith("/my-marks");

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleLogout = () => {
    dispatch(logout());
    setIsOpen(false);
    navigate("/");
  };

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 h-20 transition-all duration-300 ${
        scrolled
          ? "glass border-b border-white/10"
          : "bg-transparent"
      }`}
    >
      {/* Scale grid pattern background */}
      {scrolled && (
        <div className="absolute inset-0 scale-grid opacity-40 pointer-events-none" />
      )}
      <div className="container mx-auto h-full px-4 md:px-6 flex items-center justify-between relative z-10">
        {/* Logo + Branding - Clicking navigates to / */}
        <Link
          to="/"
          className="flex items-center gap-3 group"
        >
          <div className="animate-spin-slow group-hover:scale-110 transition-transform duration-300">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              className="w-6 h-6 md:w-7 md:h-7"
            >
              <defs>
                <linearGradient id="penGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#2563eb" />
                  <stop offset="100%" stopColor="#fbbf24" />
                </linearGradient>
              </defs>
              <path
                d="M17 3a2.85 2.85 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"
                stroke="url(#penGradient)"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="m15 5 4 4"
                stroke="url(#penGradient)"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <div className="flex flex-col">
            <span className="text-white font-bold text-sm md:text-base leading-tight">
              Nouman Science Academy
            </span>
            <span className="text-muted-foreground text-[10px] md:text-xs leading-tight">
              Inspiring Future Scientists
            </span>
          </div>
        </Link>

        {isDashboardPage && user ? (
          /* On dashboard pages: show user name dropdown on right */
          <div className="flex items-center">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 text-sm text-muted-foreground hover:text-white transition-colors px-3 py-2 rounded-lg hover:bg-white/5">
                  <User className="w-4 h-4" />
                  <span className="text-white font-medium">{user.name}</span>
                  <ChevronDown className="w-3.5 h-3.5" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40">
                <DropdownMenuItem
                  onClick={handleLogout}
                  className="flex items-center gap-2 cursor-pointer text-red-400 focus:text-red-400"
                >
                  <LogOut className="w-4 h-4" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ) : (
          /* Desktop Nav Links - Only show on non-dashboard pages */
          <div className="hidden md:flex items-center gap-8">
            {user ? (
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <User className="w-4 h-4" />
                  <span className="text-white font-medium">{user.name}</span>
                  <span className="px-2 py-0.5 text-[10px] font-semibold uppercase rounded-full bg-primary/20 text-primary">
                    {user.role}
                  </span>
                </div>
                {user.role === "Admin" && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="flex items-center gap-1.5 text-yellow-400 hover:text-yellow-300 transition-colors duration-300 text-sm font-medium">
                        <Shield className="w-4 h-4" />
                        Admin
                        <ChevronDown className="w-3.5 h-3.5" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-40">
                      <DropdownMenuItem asChild>
                        <Link to="/admin" className="flex items-center gap-2 cursor-pointer">
                          <Shield className="w-4 h-4" />
                          Admin Panel
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={handleLogout}
                        className="flex items-center gap-2 cursor-pointer text-red-400 focus:text-red-400"
                      >
                        <LogOut className="w-4 h-4" />
                        Logout
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-1.5 text-muted-foreground hover:text-white transition-colors duration-300 text-sm"
                >
                  <LogOut className="w-4 h-4" />
                  Logout
                </button>
              </div>
            ) : (
              <>
                {/* Nav Links */}
                <a
                  href="#about"
                  onClick={(e) => {
                    e.preventDefault();
                    const el = document.querySelector("#about");
                    if (el) el.scrollIntoView({ behavior: "smooth" });
                  }}
                  className="relative text-muted-foreground hover:text-white transition-colors duration-300 text-sm font-medium group"
                >
                  About
                  <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-primary transition-all duration-300 group-hover:w-full" />
                </a>
                <a
                  href="#achievements"
                  onClick={(e) => {
                    e.preventDefault();
                    const el = document.querySelector("#achievements");
                    if (el) el.scrollIntoView({ behavior: "smooth" });
                  }}
                  className="relative text-muted-foreground hover:text-white transition-colors duration-300 text-sm font-medium group"
                >
                  Achievements
                  <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-primary transition-all duration-300 group-hover:w-full" />
                </a>
                <a
                  href="#teachers"
                  onClick={(e) => {
                    e.preventDefault();
                    const el = document.querySelector("#teachers");
                    if (el) el.scrollIntoView({ behavior: "smooth" });
                  }}
                  className="relative text-muted-foreground hover:text-white transition-colors duration-300 text-sm font-medium group"
                >
                  Teachers
                  <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-primary transition-all duration-300 group-hover:w-full" />
                </a>
                <a
                  href="#students"
                  onClick={(e) => {
                    e.preventDefault();
                    const el = document.querySelector("#students");
                    if (el) el.scrollIntoView({ behavior: "smooth" });
                  }}
                  className="relative text-muted-foreground hover:text-white transition-colors duration-300 text-sm font-medium group"
                >
                  Brilliant Students
                  <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-primary transition-all duration-300 group-hover:w-full" />
                </a>
                <a
                  href="#footer"
                  onClick={(e) => {
                    e.preventDefault();
                    const el = document.querySelector("#footer");
                    if (el) el.scrollIntoView({ behavior: "smooth" });
                  }}
                  className="relative text-muted-foreground hover:text-white transition-colors duration-300 text-sm font-medium group"
                >
                  Contact
                  <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-primary transition-all duration-300 group-hover:w-full" />
                </a>
                <Link
                  to="/signin"
                  className="relative text-muted-foreground hover:text-white transition-colors duration-300 text-sm font-medium group"
                >
                  Sign In
                  <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-primary transition-all duration-300 group-hover:w-full" />
                </Link>
                <a
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    const hero = document.querySelector("#hero");
                    if (hero) hero.scrollIntoView({ behavior: "smooth" });
                  }}
                  className="bg-accent text-accent-foreground px-5 py-2.5 rounded-lg font-semibold text-sm hover:scale-105 hover:shadow-lg hover:shadow-accent/25 transition-all duration-300"
                >
                  Enroll Now
                </a>
              </>
            )}
          </div>
        )}

        {/* Mobile Hamburger - Only show on non-dashboard pages when no user or not logged in */}
        {!isDashboardPage && (
          <button
            className="md:hidden text-white p-2 hover:bg-white/10 rounded-lg transition-colors"
            onClick={() => setIsOpen(!isOpen)}
            aria-label="Toggle menu"
          >
            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        )}
      </div>

      {/* Mobile Menu Overlay - Only show on non-dashboard pages */}
      {!isDashboardPage && (
        <div
          className={`md:hidden fixed inset-0 top-20 z-40 transition-all duration-300 ${
            isOpen
              ? "opacity-100 pointer-events-auto"
              : "opacity-0 pointer-events-none"
          }`}
        >
          <div className="glass h-full border-t border-white/10 flex flex-col items-center gap-6 py-8 px-4">
            {user ? (
              <>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <User className="w-5 h-5" />
                  <span className="text-white font-medium text-lg">{user.name}</span>
                </div>
                {user.role === "Admin" && (
                  <Link
                    to="/admin"
                    onClick={() => setIsOpen(false)}
                    className="flex items-center gap-2 text-yellow-400 hover:text-yellow-300 transition-colors duration-300 text-lg font-medium"
                  >
                    <Shield className="w-5 h-5" />
                    Admin Panel
                  </Link>
                )}
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 text-muted-foreground hover:text-white transition-colors duration-300 text-lg"
                >
                  <LogOut className="w-5 h-5" />
                  Logout
                </button>
              </>
            ) : (
              <>
                <a
                  href="#about"
                  onClick={(e) => {
                    e.preventDefault();
                    setIsOpen(false);
                    const el = document.querySelector("#about");
                    if (el) el.scrollIntoView({ behavior: "smooth" });
                  }}
                  className="text-muted-foreground hover:text-white transition-colors duration-300 text-lg font-medium"
                >
                  About
                </a>
                <a
                  href="#achievements"
                  onClick={(e) => {
                    e.preventDefault();
                    setIsOpen(false);
                    const el = document.querySelector("#achievements");
                    if (el) el.scrollIntoView({ behavior: "smooth" });
                  }}
                  className="text-muted-foreground hover:text-white transition-colors duration-300 text-lg font-medium"
                >
                  Achievements
                </a>
                <a
                  href="#teachers"
                  onClick={(e) => {
                    e.preventDefault();
                    setIsOpen(false);
                    const el = document.querySelector("#teachers");
                    if (el) el.scrollIntoView({ behavior: "smooth" });
                  }}
                  className="text-muted-foreground hover:text-white transition-colors duration-300 text-lg font-medium"
                >
                  Teachers
                </a>
                <a
                  href="#students"
                  onClick={(e) => {
                    e.preventDefault();
                    setIsOpen(false);
                    const el = document.querySelector("#students");
                    if (el) el.scrollIntoView({ behavior: "smooth" });
                  }}
                  className="text-muted-foreground hover:text-white transition-colors duration-300 text-lg font-medium"
                >
                  Brilliant Students
                </a>
                <a
                  href="#footer"
                  onClick={(e) => {
                    e.preventDefault();
                    setIsOpen(false);
                    const el = document.querySelector("#footer");
                    if (el) el.scrollIntoView({ behavior: "smooth" });
                  }}
                  className="text-muted-foreground hover:text-white transition-colors duration-300 text-lg font-medium"
                >
                  Contact
                </a>
                <Link
                  to="/signin"
                  onClick={() => setIsOpen(false)}
                  className="text-muted-foreground hover:text-white transition-colors duration-300 text-lg font-medium"
                >
                  Sign In
                </Link>
                <a
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    setIsOpen(false);
                    const hero = document.querySelector("#hero");
                    if (hero) hero.scrollIntoView({ behavior: "smooth" });
                  }}
                  className="bg-accent text-accent-foreground px-8 py-3 rounded-lg font-semibold text-base hover:scale-105 hover:shadow-lg hover:shadow-accent/25 transition-all duration-300 mt-4"
                >
                  Enroll Now
                </a>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
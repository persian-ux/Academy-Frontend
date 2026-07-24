"use client";

import { useState, useEffect } from "react";
import { BookOpen, Pencil, GraduationCap, Lightbulb } from "lucide-react";
import { cn } from "@/lib/utils";

const cards = [
  { icon: BookOpen, label: "Books", color: "from-blue-500/80 to-blue-600/80" },
  { icon: Pencil, label: "Practice", color: "from-amber-500/80 to-amber-600/80" },
  { icon: GraduationCap, label: "Graduate", color: "from-blue-400/80 to-cyan-500/80" },
  { icon: Lightbulb, label: "Ideas", color: "from-yellow-500/80 to-orange-500/80" },
];

export default function StudyImageSection() {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % cards.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative w-full h-full min-h-[400px] md:min-h-full flex items-center justify-center overflow-hidden bg-gradient-to-br from-blue-950/60 via-background to-amber-950/60">
      {/* Floating circles background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[10%] left-[15%] w-40 h-40 bg-blue-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-[20%] right-[10%] w-60 h-60 bg-amber-500/10 rounded-full blur-3xl animate-pulse animation-delay-2000" />
        <div className="absolute top-[40%] right-[30%] w-32 h-32 bg-cyan-500/10 rounded-full blur-3xl animate-pulse animation-delay-4000" />
        <div className="absolute bottom-[10%] left-[25%] w-24 h-24 bg-violet-500/10 rounded-full blur-3xl" />
      </div>

      {/* Floating small dots */}
      <div className="absolute inset-0 pointer-events-none">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="absolute w-2 h-2 rounded-full bg-white/20"
            style={{
              top: `${15 + i * 12}%`,
              left: `${10 + (i % 3) * 20}%`,
              animation: `float ${3 + i * 0.5}s ease-in-out infinite`,
              animationDelay: `${i * 0.8}s`,
            }}
          />
        ))}
      </div>

      {/* Rotating Cards */}
      <div className="relative z-10 w-full max-w-sm mx-auto px-4">
        <div className="relative h-64 flex items-center justify-center">
          {cards.map((card, index) => {
            const Icon = card.icon;
            const isActive = index === activeIndex;
            const offset = index - activeIndex;
            const rotation = offset * 15;

            return (
              <div
                key={card.label}
                className={cn(
                  "absolute w-48 h-56 rounded-2xl p-6 flex flex-col items-center justify-center gap-4 transition-all duration-700 ease-in-out cursor-pointer",
                  "bg-gradient-to-br shadow-lg border border-white/10",
                  "hover:scale-105 hover:shadow-xl hover:shadow-blue-500/10",
                  card.color
                )}
                style={{
                  transform: `perspective(800px) rotateY(${rotation}deg) translateZ(${isActive ? "60px" : "-40px"}) scale(${isActive ? 1 : 0.85})`,
                  opacity: Math.abs(offset) > 1 ? 0 : 1 - Math.abs(offset) * 0.3,
                  zIndex: cards.length - Math.abs(offset),
                  transition: "all 0.7s cubic-bezier(0.4, 0, 0.2, 1)",
                }}
              >
                <Icon className="w-12 h-12 text-white drop-shadow-lg" />
                <span className="text-white font-semibold text-lg drop-shadow">{card.label}</span>
              </div>
            );
          })}
        </div>

        {/* Dots indicator */}
        <div className="flex justify-center gap-2 mt-6">
          {cards.map((_, index) => (
            <button
              key={index}
              onClick={() => setActiveIndex(index)}
              className={cn(
                "w-2 h-2 rounded-full transition-all duration-300",
                index === activeIndex
                  ? "w-6 bg-primary"
                  : "bg-white/20 hover:bg-white/40"
              )}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>

        {/* Motivational text */}
        <div className="text-center mt-6 animate-fade-in-up">
          <p className="text-lg md:text-xl font-bold text-gradient">
            Unlock Your Potential
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            Join thousands of successful students
          </p>
        </div>
      </div>
    </div>
  );
}


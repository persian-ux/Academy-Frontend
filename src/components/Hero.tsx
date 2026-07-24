"use client";

import { ArrowRight, GraduationCap } from "lucide-react";

export default function Hero() {
  return (
    <section
      id="hero"
      className="relative min-h-screen flex items-center justify-center overflow-hidden pt-32 md:pt-40 px-4"
    >
      {/* Background Decorative Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-background" />

        {/* Floating Circles */}
        <div className="absolute top-1/4 left-[10%] w-32 h-32 md:w-48 md:h-48 rounded-full bg-primary/10 animate-float blur-xl" />
        <div
          className="absolute top-1/3 right-[15%] w-24 h-24 md:w-36 md:h-36 rounded-full bg-accent/10 animate-float blur-xl"
          style={{ animationDelay: "1s" }}
        />
        <div
          className="absolute bottom-1/4 left-[20%] w-20 h-20 md:w-28 md:h-28 rounded-full bg-primary/10 animate-float blur-xl"
          style={{ animationDelay: "2s" }}
        />
        <div
          className="absolute bottom-1/3 right-[10%] w-16 h-16 md:w-24 md:h-24 rounded-full bg-accent/10 animate-float blur-lg"
          style={{ animationDelay: "0.5s" }}
        />
      </div>

      <div className="relative z-10 max-w-4xl mx-auto text-center flex flex-col items-center gap-6 md:gap-8">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-primary/30 bg-primary/5 text-primary text-sm font-medium animate-fade-in-up">
          <GraduationCap className="w-4 h-4" />
          <span>Welcome to the future of science education</span>
        </div>

        {/* Main Heading */}
        <h1 className="text-5xl md:text-7xl lg:text-7xl font-bold tracking-tighter leading-tight animate-fade-in-up-delay-1">
          <span className="text-gradient animate-pulse-gradient">
            Nouman Science Academy
          </span>
        </h1>

        {/* Tagline */}
        <p className="text-lg md:text-xl text-muted-foreground animate-fade-in-up-delay-2">
          Where Knowledge Meets Excellence
        </p>

        {/* Description */}
        <p className="text-base text-muted-foreground max-w-2xl leading-relaxed animate-fade-in-up-delay-3">
          Empowering the next generation of scientists with cutting-edge education,
          state-of-the-art facilities, and mentorship from world-class experts.
          Join us on a journey of discovery and innovation.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 animate-fade-in-up-delay-4">
          <a
            href="#about"
            onClick={(e) => {
              e.preventDefault();
              document.querySelector("#about")?.scrollIntoView({ behavior: "smooth" });
            }}
            className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-8 py-3.5 rounded-lg font-semibold text-base hover:scale-105 hover:shadow-lg hover:shadow-primary/30 transition-all duration-300"
          >
            Start Learning Now
            <ArrowRight className="w-5 h-5" />
          </a>
          <a
            href="#achievements"
            onClick={(e) => {
              e.preventDefault();
              document.querySelector("#achievements")?.scrollIntoView({ behavior: "smooth" });
            }}
            className="inline-flex items-center gap-2 border border-white/20 text-white px-8 py-3.5 rounded-lg font-semibold text-base hover:scale-105 hover:border-primary hover:bg-primary/10 transition-all duration-300"
          >
            Explore Programs
            <GraduationCap className="w-5 h-5" />
          </a>
        </div>
      </div>

      {/* Bottom Gradient Fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent" />
    </section>
  );
}


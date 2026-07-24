"use client";

import { BookOpen, Beaker, Users, Lightbulb } from "lucide-react";

const features = [
  {
    icon: BookOpen,
    title: "Comprehensive Curriculum",
    description:
      "A meticulously designed curriculum covering fundamental sciences, advanced research methodologies, and interdisciplinary studies to build a strong academic foundation.",
    delay: "animate-fade-in-up",
  },
  {
    icon: Beaker,
    title: "State-of-the-Art Labs",
    description:
      "Modern laboratories equipped with cutting-edge technology and equipment, providing hands-on experience in physics, chemistry, biology, and computer science.",
    delay: "animate-fade-in-up-delay-1",
  },
  {
    icon: Users,
    title: "Expert Mentorship",
    description:
      "Learn directly from PhD-level educators and industry professionals who bring real-world experience and personalized guidance to every classroom.",
    delay: "animate-fade-in-up-delay-2",
  },
  {
    icon: Lightbulb,
    title: "Innovation Focus",
    description:
      "A culture of innovation that encourages creative thinking, problem-solving, and original research through projects, competitions, and collaborative initiatives.",
    delay: "animate-fade-in-up-delay-3",
  },
];

export default function About() {
  return (
    <section
      id="about"
      className="relative py-20 md:py-28 px-4"
    >
      <div className="container mx-auto max-w-6xl">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-4xl font-bold text-white mb-4">
            Knowledge Hub
          </h2>
          <p className="text-muted-foreground text-base leading-relaxed max-w-xl mx-auto">
            Discover what makes our academy special — a place where curiosity meets
            opportunity and every student thrives.
          </p>
        </div>

        {/* Feature Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <div
                key={index}
                className={`group ${feature.delay}`}
              >
                <div className="h-full bg-card/50 border border-white/10 rounded-xl p-6 transition-all duration-300 hover:border-primary hover:-translate-y-1 hover:shadow-lg hover:shadow-primary/10">
                  {/* Icon */}
                  <div className="mb-5 inline-flex items-center justify-center w-12 h-12 rounded-lg bg-primary/10 text-primary group-hover:scale-110 transition-transform duration-300">
                    <Icon className="w-6 h-6" />
                  </div>

                  {/* Title */}
                  <h3 className="text-lg font-semibold text-white mb-3">
                    {feature.title}
                  </h3>

                  {/* Description */}
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}


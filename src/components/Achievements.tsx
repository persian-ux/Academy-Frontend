"use client";

const stats = [
  { number: "500+", label: "Graduates" },
  { number: "98%", label: "Success Rate" },
  { number: "45+", label: "Expert Faculty" },
  { number: "25+", label: "Research Projects" },
];

const delays = [
  "animate-fade-in-up",
  "animate-fade-in-up-delay-1",
  "animate-fade-in-up-delay-2",
  "animate-fade-in-up-delay-3",
];

export default function Achievements() {
  return (
    <section
      id="achievements"
      className="relative py-20 md:py-28 px-4"
    >
      {/* Background accent */}
      <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-accent/5 pointer-events-none" />

      <div className="container mx-auto max-w-6xl relative z-10">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-4xl font-bold text-white mb-4">
            Our Achievements
          </h2>
          <p className="text-muted-foreground text-base leading-relaxed max-w-xl mx-auto">
            Excellence by the numbers — our track record speaks for itself.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, index) => (
            <div key={index} className={delays[index]}>
              <div className="text-center bg-card/50 border border-white/10 rounded-xl p-8 transition-all duration-300 hover:scale-105 hover:border-accent hover:shadow-lg hover:shadow-accent/10">
                {/* Number */}
                <div className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent mb-2">
                  {stat.number}
                </div>

                {/* Label */}
                <div className="text-muted-foreground text-sm font-medium uppercase tracking-wider">
                  {stat.label}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}


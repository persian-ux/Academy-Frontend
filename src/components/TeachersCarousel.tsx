"use client";

import { useState, useEffect, useCallback } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

const teachers = [
  {
    name: "Dr. Sarah Chen",
    subject: "Astrophysics",
    bio: "Award-winning astrophysicist with research published in Nature. Passionate about making complex cosmic phenomena accessible to young minds.",
    credentials: "Ph.D. in Astrophysics, MIT",
    initials: "SC",
  },
  {
    name: "Prof. James Mitchell",
    subject: "Organic Chemistry",
    bio: "Over 20 years of teaching excellence with a focus on green chemistry and sustainable laboratory practices. Mentor to numerous national science fair winners.",
    credentials: "Ph.D. in Chemistry, Stanford",
    initials: "JM",
  },
  {
    name: "Dr. Amara Okafor",
    subject: "Molecular Biology",
    bio: "Leading researcher in genetic engineering and CRISPR technology. Dedicated to inspiring the next generation of biotechnologists.",
    credentials: "Ph.D. in Molecular Biology, Cambridge",
    initials: "AO",
  },
  {
    name: "Prof. David Park",
    subject: "Quantum Physics",
    bio: "Former CERN researcher who brings particle physics to life. Known for his interactive demonstrations and ability to simplify the most complex theories.",
    credentials: "Ph.D. in Physics, Caltech",
    initials: "DP",
  },
  {
    name: "Dr. Elena Vasquez",
    subject: "Environmental Science",
    bio: "Climate change expert and sustainability advocate. Leads field research expeditions and empowers students to become environmental stewards.",
    credentials: "Ph.D. in Environmental Science, Yale",
    initials: "EV",
  },
  {
    name: "Prof. Alexander Kim",
    subject: "Computer Science",
    bio: "AI and machine learning specialist with industry experience at Google Brain. Teaches cutting-edge programming and computational thinking.",
    credentials: "Ph.D. in Computer Science, Carnegie Mellon",
    initials: "AK",
  },
];

export default function TeachersCarousel() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  const totalSlides = Math.ceil(teachers.length / getCardsPerView());

  function getCardsPerView() {
    if (typeof window === "undefined") return 3;
    if (window.innerWidth >= 1024) return 3;
    if (window.innerWidth >= 768) return 2;
    return 1;
  }

  const goToSlide = useCallback(
    (index: number) => {
      const maxSlide = totalSlides - 1;
      if (index < 0) setCurrentSlide(maxSlide);
      else if (index > maxSlide) setCurrentSlide(0);
      else setCurrentSlide(index);
    },
    [totalSlides]
  );

  const nextSlide = useCallback(() => goToSlide(currentSlide + 1), [currentSlide, goToSlide]);
  const prevSlide = useCallback(() => goToSlide(currentSlide - 1), [currentSlide, goToSlide]);

  // Auto-advance every 5 seconds
  useEffect(() => {
    if (!isAutoPlaying) return;
    const interval = setInterval(() => {
      setCurrentSlide((prev) => {
        const max = totalSlides - 1;
        return prev >= max ? 0 : prev + 1;
      });
    }, 5000);
    return () => clearInterval(interval);
  }, [isAutoPlaying, totalSlides]);

  // Handle resize
  const [cardsPerView, setCardsPerView] = useState(3);

  useEffect(() => {
    const handleResize = () => {
      setCardsPerView(getCardsPerView());
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Visible teachers based on current slide
  const startIndex = currentSlide * cardsPerView;
  const visibleTeachers = teachers.slice(startIndex, startIndex + cardsPerView);

  // Pause auto-play on hover
  const handleMouseEnter = () => setIsAutoPlaying(false);
  const handleMouseLeave = () => setIsAutoPlaying(true);

  return (
    <section
      id="teachers"
      className="relative py-20 md:py-28 px-4"
    >
      <div className="container mx-auto max-w-6xl">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-4xl font-bold text-white mb-4">
            Meet Our Expert Teachers
          </h2>
          <p className="text-muted-foreground text-base leading-relaxed max-w-xl mx-auto">
            Passionate educators shaping tomorrow&apos;s scientists with dedication,
            expertise, and inspiration.
          </p>
        </div>

        {/* Carousel */}
        <div
          className="relative"
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          {/* Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {visibleTeachers.map((teacher, index) => (
              <div
                key={`${teacher.name}-${index}`}
                className="group relative bg-card/50 border border-white/10 rounded-xl overflow-hidden transition-all duration-300 hover:bg-card/80"
              >
                {/* Image Placeholder with Initials */}
                <div className="relative w-28 h-28 mx-auto mt-6 rounded-lg overflow-hidden bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center transition-transform duration-300 group-hover:scale-110">
                  <span className="text-3xl font-bold text-gradient">
                    {teacher.initials}
                  </span>
                </div>

                {/* Name & Subject (Always Visible) */}
                <div className="p-6 text-center">
                  <h3 className="text-lg font-semibold text-white mb-1">
                    {teacher.name}
                  </h3>
                  <p className="text-primary text-sm font-medium">
                    {teacher.subject}
                  </p>
                </div>

                {/* Bio & Credentials (Visible on Hover) */}
                <div className="px-6 pb-6 text-center opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0">
                  <p className="text-muted-foreground text-sm leading-relaxed mb-3">
                    {teacher.bio}
                  </p>
                  <div className="inline-block px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-medium">
                    {teacher.credentials}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Navigation Arrows */}
          <button
            onClick={prevSlide}
            className="absolute -left-3 md:-left-5 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center rounded-full bg-card border border-white/10 text-white hover:bg-primary hover:border-primary transition-all duration-300 shadow-lg z-10"
            aria-label="Previous slide"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={nextSlide}
            className="absolute -right-3 md:-right-5 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center rounded-full bg-card border border-white/10 text-white hover:bg-primary hover:border-primary transition-all duration-300 shadow-lg z-10"
            aria-label="Next slide"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Dot Indicators */}
        <div className="flex items-center justify-center gap-3 mt-10">
          {Array.from({ length: totalSlides }).map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentSlide(index)}
              className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                index === currentSlide
                  ? "bg-primary w-8"
                  : "bg-white/20 hover:bg-white/40"
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}


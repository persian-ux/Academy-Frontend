"use client";

import { useState, useEffect, useCallback } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

const students = [
  {
    name: "Ahsan Sattar",
    degree: "Doctor of Physical Therapy",
    university: "King Edward Medical University",
    image: "/Ahsan-Sattar.jpeg",
  },
  {
    name: "Captain Dr Asaf Ali Hashmi",
    degree: "MBBS",
    university: "Army Medical College",
    image: "/Asif-Ali.png",
  },
  {
    name: "Aqsa Aslam",
    degree: "BS Mathematics",
    university: "University of Education",
    image: "/Aqsa-Aslam.jpeg",
  },
  {
    name: "Engr. Ali Nawaz",
    degree: "BS Civil Engineering",
    university: "UET Lahore",
    image: "/Ali-Nawaz.jpeg",
  },
  {
    name: "Ali Rizwan",
    degree: "BS Information Engineering Technology",
    university: "University of Lahore",
    image: "/Ali-Rizwan.jpeg",
  },
  {
    name: "Muhammad Tayyab",
    degree: "BS Nursing",
    university: "University of Lahore",
    image: "/Tayyab-Maqbool.jpeg",
  },
  {
    name: "Fazeela Jameel",
    degree: "BS Computer Science",
    university: "University of Education",
    image: "/Fazeela.jpeg",
  },
  {
    name: "Ameer Hamza",
    degree: "Software Engineer",
    university: "Punjab University",
    image: "/Ameer-Hamza.jpeg",
  },
  {
    name: "Mahrukh Iftikhar",
    degree: "BS Chemistry",
    university: "Punjab University",
    image: "/Mahrukh-Iftikhar.jpeg",
  },
  {
    name: "Tamoor Hassan",
    degree: "Soldier in Pakistan Army",
    university: "Pakistan Army",
    image: "/Tamoor.jpeg",
  }
];

export default function BrilliantStudents() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  const totalSlides = Math.ceil(students.length / getCardsPerView());

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

  // Visible students based on current slide
  const startIndex = currentSlide * cardsPerView;
  const visibleStudents = students.slice(startIndex, startIndex + cardsPerView);

  // Pause auto-play on hover
  const handleMouseEnter = () => setIsAutoPlaying(false);
  const handleMouseLeave = () => setIsAutoPlaying(true);

  return (
    <section
      id="students"
      className="relative py-20 md:py-28 px-4"
    >
      <div className="container mx-auto max-w-6xl">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-4xl font-bold text-white mb-4">
            Our Brilliant Students
          </h2>
          <p className="text-muted-foreground text-base leading-relaxed max-w-xl mx-auto">
            Proud achievements of our students who have secured admissions in
            top universities and are pursuing their dreams with excellence.
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
            {visibleStudents.map((student, index) => (
              <div
                key={`${student.name}-${index}`}
                className="group relative bg-card/50 border border-white/10 rounded-xl overflow-hidden transition-all duration-300 hover:bg-card/80"
              >
                {/* Student Image */}
                <div className="relative w-28 h-28 mx-auto mt-6 rounded-lg overflow-hidden bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center transition-transform duration-300 group-hover:scale-110">
                  <img
                    src={student.image}
                    alt={student.name}
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* Name & Degree (Always Visible) */}
                <div className="p-6 text-center">
                  <h3 className="text-lg font-semibold text-white mb-1">
                    {student.name}
                  </h3>
                  <p className="text-primary text-sm font-medium">
                    {student.degree}
                  </p>
                </div>

                {/* University (Visible on Hover) */}
                <div className="px-6 pb-6 text-center opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0">
                  <div className="inline-block px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-medium">
                    {student.university}
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
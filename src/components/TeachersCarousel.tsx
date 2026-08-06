"use client";

import { useState, useEffect, useCallback } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

const teachers = [
  {
    name: "Majid Mehmood",
    subject: "Education",
    bio: "Educator with a strong academic background in education, committed to delivering quality learning experiences and fostering student growth.",
    credentials: "MPhil in Education, Punjab University, Controller of Examination in Riphah International University",
    image: "/Majid-Mehmmod.png",
  },
  {
    name: "Muhammad Zeeshan",
    subject: "Physics",
    bio: "Principal at Riphah International College, Township Campus. Dedicated to academic excellence and student success.",
    credentials: "M.Phil in Physics, Riphah International University Lahore",
    image: "/Muhammad-Zeeshan.jpeg",
  },
  {
    name: "Dr. Abdul Rehman",
    subject: "Islamic Studies",
    bio: "Scholar of Islamic studies committed to imparting deep religious knowledge and values to students.",
    credentials:
      "Ph.D. in Islamic Studies, University of Lahore; MS in Islamic Studies, University of Management and Technology",
    image: "/Dr-AbdulRehman.jpeg",
  },
  {
    name: "Hafiz Asad Zia Ullah Butt",
    subject: "M.Sc in Mathematics",
    bio: "Mathematics educator passionate about fostering analytical thinking and problem-solving skills in students.",
    credentials: "M.Sc in Mathematics, University of Education",
    image: "/Asad-zia.jpeg",
  },
  {
    name: "Dr. Adeel Ahmed",
    subject: "Masters in Nutrition and Dietetics (MS)",
    bio: "Nutrition and dietetics expert dedicated to promoting health and wellness through evidence-based dietary practices.",
    credentials:
      "Masters in Nutrition and Dietetics (MS), University of Management and Technology",
    image: "/Adeel-Ahmad.jpeg",
  },
  {
    name: "Mufti Muhammad Sufyan",
    subject: "Islamic Studies",
    bio: "Islamic scholar committed to guiding students in understanding and practicing Islamic teachings.",
    credentials: "M.A. in Islamic Studies, University of Management and Technology",
    image: "/Mufti-M.Sufyan.jpeg",    
  },
  {
    name: "Dr. Arslan Asif",
    subject: "Nutrition and Dietetics",
    bio: "Nutrition and dietetics expert dedicated to promoting health and wellness through evidence-based dietary practices.",
    credentials:
      "Master in Nutrition and Dietetics (MS), University of Management and Technology",
    image: "/Arslan-Asif.PNG",
  },
  {
    name: "Zunaira Aslam",
    subject: "Physics",
    bio: "Physics scholar passionate about unraveling the mysteries of the universe and inspiring students in scientific inquiry.",
    credentials: "MPhil Physics, University of Education",
    image: "/Zunaira-Aslam.jpeg",
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
            Passionate educators shaping tomorrow's scientists with dedication,
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
                {/* Teacher Image */}
                <div className="relative w-32 h-40 md:w-36 md:h-44 mx-auto mt-6 rounded-2xl overflow-hidden bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center transition-transform duration-300 group-hover:scale-110">
                  <img
                    src={teacher.image}
                    alt={teacher.name}
                    className="w-full h-full object-cover object-top"
                  />
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
"use client";

import HeroSlidePanel from "@/components/HeroSlidePanel";
import HomeHeroControls from "@/components/HomeHeroControls";
import { useSlideshow } from "@/hooks/useSlideshow";
import { CROSSFADE_MS, KEN_BURNS_MS, SLIDE_DURATION_MS, type HeroSlide } from "@/lib/hero";

type HomeHeroCarouselProps = {
  slides: HeroSlide[];
  upcomingEvent?: {
    date: string;
    acronym: string;
    title: string;
    slug: string;
  };
};

/**
 * Editorial-grade, high-corporate hero slider for the GIRSD home page.
 *
 * Each service takes the stage in an unhurried, continuous, and automatic
 * progression with tailored typography, calls to action, contextual cards,
 * and cinematic background photography.
 *
 * The bottom controls are kept ultra-minimalist and floating, with subtle
 * gold-filling progress lines that visually indicate the slide cadence.
 */
export default function HomeHeroCarousel({ slides, upcomingEvent }: HomeHeroCarouselProps) {
  const slideshow = useSlideshow({ slideCount: slides.length, intervalMs: SLIDE_DURATION_MS });
  const { activeIndex, isAutoPlaying } = slideshow;

  return (
    <section
      aria-roledescription="carousel"
      aria-label="GIRSD services and programmes"
      className="group relative flex min-h-[600px] flex-col justify-between overflow-hidden bg-navy text-white sm:min-h-[660px] lg:min-h-[700px]"
    >
      {/* Background imagery with crossfade and Ken Burns slow drift */}
      <div className="absolute inset-0" aria-hidden="true">
        {slides.map((slide, index) => {
          const isActive = index === activeIndex;
          return (
            <div
              key={slide.id || slide.image || index}
              className={`absolute inset-0 overflow-hidden transition-opacity ease-out ${
                isActive ? "opacity-100" : "opacity-0"
              }`}
              style={{ transitionDuration: `${CROSSFADE_MS}ms` }}
            >
              <img
                src={slide.image}
                alt=""
                decoding="async"
                loading={index === 0 ? "eager" : "lazy"}
                fetchPriority={index === 0 ? "high" : "low"}
                width={1920}
                height={1080}
                className={`h-full w-full object-cover object-center ${
                  isActive ? "animate-heroKenBurns" : ""
                }`}
                style={{ animationDuration: `${KEN_BURNS_MS}ms` }}
              />
            </div>
          );
        })}

        {/* Sophisticated dark navy vignettes for guaranteed contrast and depth */}
        <div className="absolute inset-0 bg-gradient-to-r from-navy/95 via-navy/85 to-navy/55" />
        <div className="absolute inset-0 bg-gradient-to-t from-navy via-transparent to-navy/50" />
      </div>

      {/* Main hero slide content stage */}
      <div className="relative mx-auto flex w-full max-w-7xl flex-1 items-center px-4 py-16 sm:py-20 lg:py-24">
        <div className="relative w-full">
          {slides.map((slide, index) => (
            <HeroSlidePanel
              key={slide.id || slide.title || index}
              slide={slide}
              index={index}
              total={slides.length}
              isActive={index === activeIndex}
              upcomingEvent={upcomingEvent}
            />
          ))}
        </div>
      </div>

      {/* High-corporate floating progress indicator (no text clutter, no 01/06) */}
      <HomeHeroControls
        slides={slides}
        activeIndex={activeIndex}
        timerKey={slideshow.timerKey}
        isAutoPlaying={isAutoPlaying}
        onSelect={slideshow.goTo}
        onPrevious={slideshow.previous}
        onNext={slideshow.next}
        onKeyDown={slideshow.handleKeyDown}
      />

      {/* Floating subtle side navigation arrows (visible on hover on desktop) */}
      <div className="pointer-events-none absolute inset-y-0 inset-x-4 z-20 hidden items-center justify-between sm:flex lg:inset-x-8">
        <button
          type="button"
          onClick={slideshow.previous}
          aria-label="Previous slide"
          className="pointer-events-auto flex h-11 w-11 items-center justify-center rounded-full border border-white/15 bg-navy/50 text-white/70 shadow-lg backdrop-blur-md transition-all hover:border-gold hover:bg-navy/85 hover:text-gold hover:scale-105 opacity-0 group-hover:opacity-100 focus:opacity-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-gold"
        >
          <svg
            className="h-5 w-5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        <button
          type="button"
          onClick={slideshow.next}
          aria-label="Next slide"
          className="pointer-events-auto flex h-11 w-11 items-center justify-center rounded-full border border-white/15 bg-navy/50 text-white/70 shadow-lg backdrop-blur-md transition-all hover:border-gold hover:bg-navy/85 hover:text-gold hover:scale-105 opacity-0 group-hover:opacity-100 focus:opacity-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-gold"
        >
          <svg
            className="h-5 w-5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </section>
  );
}

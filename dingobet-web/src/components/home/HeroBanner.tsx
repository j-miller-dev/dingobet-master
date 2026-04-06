"use client";

import Image from "next/image";
import Link from "next/link";
import Autoplay from "embla-carousel-autoplay";
import { useRef } from "react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

const slides = [
  {
    src: "/images/promotion-1.jpg",
    title: "Your Edge. Every Match.",
    subtitle: "Bet on your favourite sports with the best odds in Australia.",
  },
  {
    src: "/images/promotion-2.jpg",
    title: "AFL Season Is Here.",
    subtitle: "Get ahead of the pack with live odds and same-game multis.",
  },
  {
    src: "/images/promotion-3.jpg",
    title: "NRL Round 8 — Don't Miss Out.",
    subtitle: "Markets open now. Best odds guaranteed on every game.",
  },
  {
    src: "/images/promotion-4.jpg",
    title: "New Member Offer.",
    subtitle: "Sign up today and get your first bet matched up to $50.",
  },
  {
    src: "/images/promotion-5.jpg",
    title: "Same Game Multi Builder.",
    subtitle: "Stack your selections and multiply your potential returns.",
  },
  {
    src: "/images/promotion-8.jpg",
    title: "NBA Playoffs — Live Now.",
    subtitle: "In-play betting available on every game, every quarter.",
  },
  {
    src: "/images/promotion-9.jpg",
    title: "Racing Every Day.",
    subtitle: "Win, place and exotic betting across thoroughbred and harness.",
  },
];

export default function HeroBanner() {
  const plugin = useRef(Autoplay({ delay: 5000, stopOnInteraction: true }));

  return (
    <div>
      <Carousel plugins={[plugin.current]} className="w-full">
        <CarouselContent>
          {slides.map((slide, index) => (
            <CarouselItem key={index}>
              <div className="relative h-64 w-full overflow-hidden rounded-xl sm:h-80 lg:h-[420px]">
                <Image
                  src={slide.src}
                  alt={slide.title}
                  fill
                  className="object-cover"
                  priority={index === 0}
                />
                {/* Dark gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent rounded-xl" />

                {/* Text overlay */}
                <div className="absolute bottom-0 left-0 p-6 sm:p-8">
                  <h2 className="text-2xl font-bold text-white drop-shadow-md sm:text-3xl lg:text-4xl">
                    {slide.title}
                  </h2>
                  <p className="mt-2 max-w-md text-sm text-white/80 drop-shadow sm:text-base">
                    {slide.subtitle}
                  </p>
                  <div className="mt-4 flex gap-3">
                    <Link
                      href="/register"
                      className="rounded-md bg-orange-600 px-5 py-2 text-sm font-semibold text-white shadow hover:bg-orange-500"
                    >
                      Get Started
                    </Link>
                    <Link
                      href="/login"
                      className="rounded-md bg-white/20 px-5 py-2 text-sm font-semibold text-white backdrop-blur-sm hover:bg-white/30"
                    >
                      Sign In
                    </Link>
                  </div>
                </div>
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious className="left-3" />
        <CarouselNext className="right-3" />
      </Carousel>
    </div>
  );
}

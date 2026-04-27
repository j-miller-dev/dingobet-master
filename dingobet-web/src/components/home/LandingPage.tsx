"use client";

import Link from "next/link";
import { motion } from "motion/react";

const COLS: string[][] = [
  ["/images/promotion-1.jpg"],
  ["/images/promotion-2.jpg", "/images/promotion-3.jpg"],
  ["/images/promotion-4.jpg"],
];

function PromoImage({ src, index }: { src: string; index: number }) {
  return (
    <motion.div
      className="relative"
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1, ease: "easeOut" }}
      whileHover={{ scale: 1.03 }}
    >
      <img
        alt=""
        src={src}
        className="aspect-2/3 w-full rounded-xl bg-gray-900/5 object-cover shadow-lg"
      />
      <div className="pointer-events-none absolute inset-0 rounded-xl ring-1 ring-gray-900/10 ring-inset" />
    </motion.div>
  );
}

export default function LandingPage() {
  // Flatten images with a global index for stagger delay
  let globalIndex = 0;

  return (
    <div className="bg-white">
      <div className="relative isolate">
        <svg
          aria-hidden="true"
          className="absolute inset-x-0 top-0 -z-10 h-256 w-full mask-[radial-gradient(32rem_32rem_at_center,white,transparent)] stroke-gray-200"
        >
          <defs>
            <pattern
              x="50%"
              y={-1}
              id="hero-pattern"
              width={200}
              height={200}
              patternUnits="userSpaceOnUse"
            >
              <path d="M.5 200V.5H200" fill="none" />
            </pattern>
          </defs>
          <svg x="50%" y={-1} className="overflow-visible fill-gray-50">
            <path
              d="M-200 0h201v201h-201Z M600 0h201v201h-201Z M-400 600h201v201h-201Z M200 800h201v201h-201Z"
              strokeWidth={0}
            />
          </svg>
          <rect fill="url(#hero-pattern)" width="100%" height="100%" strokeWidth={0} />
        </svg>
        <div
          aria-hidden="true"
          className="absolute top-0 right-0 left-1/2 -z-10 -ml-24 transform-gpu overflow-hidden blur-3xl lg:ml-24 xl:ml-48"
        >
          <div
            style={{
              clipPath:
                "polygon(63.1% 29.5%, 100% 17.1%, 76.6% 3%, 48.4% 0%, 44.6% 4.7%, 54.5% 25.3%, 59.8% 49%, 55.2% 57.8%, 44.4% 57.2%, 27.8% 47.9%, 35.1% 81.5%, 0% 97.7%, 39.2% 100%, 35.2% 81.4%, 97.2% 52.8%, 63.1% 29.5%)",
            }}
            className="aspect-801/1036 w-200.25 bg-linear-to-tr from-[#ff80b5] to-[#9089fc] opacity-30"
          />
        </div>

        <div className="overflow-hidden">
          <div className="mx-auto max-w-7xl px-6 pt-16 pb-32 sm:pt-24 lg:px-8 lg:pt-20">
            <div className="mx-auto max-w-2xl gap-x-14 lg:mx-0 lg:flex lg:max-w-none lg:items-center">
              {/* Hero copy */}
              <motion.div
                className="relative w-full lg:max-w-xl lg:shrink-0 xl:max-w-2xl"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
              >
                <h1 className="text-5xl font-semibold tracking-tight text-pretty text-gray-900 sm:text-7xl">
                  Bet smarter. Win bigger. Go Dingo.
                </h1>
                <p className="mt-8 text-lg font-medium text-pretty text-gray-500 sm:max-w-md sm:text-xl/8 lg:max-w-none">
                  Live odds, multi-leg accas, and real-time scores — all in one place. Join thousands of punters already on DingoBet.
                </p>
                <div className="mt-10 flex items-center gap-x-6">
                  <Link
                    href="/register"
                    className="rounded-md bg-orange-500 px-3.5 py-2.5 text-sm font-semibold text-white shadow-xs hover:bg-orange-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-500"
                  >
                    Get started
                  </Link>
                  <Link href="/login" className="text-sm/6 font-semibold text-gray-900">
                    Log in <span aria-hidden="true">→</span>
                  </Link>
                </div>
              </motion.div>

              {/* Mobile: 2×2 grid */}
              <div className="mt-10 grid grid-cols-2 gap-4 sm:hidden">
                {[...COLS[0], ...COLS[1], ...COLS[2]].map((src) => (
                  <PromoImage key={src} src={src} index={globalIndex++} />
                ))}
              </div>

              {/* sm+: staggered columns */}
              <div className="hidden sm:mt-14 sm:flex sm:justify-end sm:gap-8 sm:-mt-44 sm:justify-start sm:pl-20 lg:mt-0 lg:pl-0">
                {/* Column 1 — offset deep */}
                <div className="ml-auto w-44 flex-none space-y-8 sm:ml-0 sm:pt-80 lg:order-last lg:pt-36 xl:order-0 xl:pt-80">
                  {COLS[0].map((src) => (
                    <PromoImage key={src} src={src} index={globalIndex++} />
                  ))}
                </div>

                {/* Column 2 — mid offset, 2 images */}
                <div className="mr-auto w-44 flex-none space-y-8 sm:mr-0 sm:pt-52 lg:pt-36">
                  {COLS[1].map((src) => (
                    <PromoImage key={src} src={src} index={globalIndex++} />
                  ))}
                </div>

                {/* Column 3 — no offset */}
                <div className="w-44 flex-none space-y-8">
                  {COLS[2].map((src) => (
                    <PromoImage key={src} src={src} index={globalIndex++} />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

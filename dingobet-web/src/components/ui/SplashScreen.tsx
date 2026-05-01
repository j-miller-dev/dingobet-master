"use client";

// Deterministic streak positions — no Math.random() to avoid SSR/hydration mismatch
const STREAKS = [
  { left: 3,  w: 1, h: 65,  dur: 1.4, delay: -0.3  },
  { left: 8,  w: 2, h: 120, dur: 1.8, delay: -0.9  },
  { left: 14, w: 1, h: 85,  dur: 2.0, delay: -1.5  },
  { left: 22, w: 1, h: 50,  dur: 1.3, delay: -0.6  },
  { left: 29, w: 3, h: 180, dur: 2.2, delay: -0.1  },
  { left: 36, w: 1, h: 95,  dur: 1.6, delay: -1.2  },
  { left: 43, w: 2, h: 140, dur: 1.9, delay: -0.7  },
  { left: 50, w: 1, h: 70,  dur: 1.5, delay: -1.8  },
  { left: 57, w: 2, h: 160, dur: 2.1, delay: -0.4  },
  { left: 63, w: 1, h: 90,  dur: 1.7, delay: -1.0  },
  { left: 70, w: 3, h: 200, dur: 2.3, delay: -0.2  },
  { left: 76, w: 1, h: 75,  dur: 1.4, delay: -1.4  },
  { left: 82, w: 2, h: 130, dur: 1.8, delay: -0.8  },
  { left: 88, w: 1, h: 55,  dur: 2.0, delay: -1.6  },
  { left: 93, w: 2, h: 110, dur: 1.5, delay: -0.5  },
  { left: 17, w: 1, h: 165, dur: 2.4, delay: -1.1  },
  { left: 47, w: 1, h: 80,  dur: 1.6, delay: -1.9  },
  { left: 66, w: 2, h: 100, dur: 1.9, delay: -0.3  },
];

export default function SplashScreen() {
  return (
    <div
      className="fixed inset-0 z-[100] overflow-hidden"
      style={{ background: "linear-gradient(180deg, #7c2d12 0%, #c2410c 40%, #ea580c 70%, #fb923c 100%)" }}
    >
      <style>{`
        @keyframes streakUp {
          from { transform: translateY(0);                      opacity: 0.65; }
          to   { transform: translateY(calc(-100vh - 300px));   opacity: 0;    }
        }
      `}</style>

      {STREAKS.map((s, i) => (
        <div
          key={i}
          className="absolute rounded-full"
          style={{
            left:       `${s.left}%`,
            bottom:     `-${s.h}px`,
            width:      `${s.w}px`,
            height:     `${s.h}px`,
            background: "rgba(255, 210, 160, 0.4)",
            filter:     "blur(0.5px)",
            animation:  `streakUp ${s.dur}s ${s.delay}s linear infinite`,
          }}
        />
      ))}

      <div className="relative z-10 flex h-full flex-col items-center justify-center gap-3">
        <h1
          className="text-5xl font-black tracking-tight text-white"
          style={{ textShadow: "0 2px 24px rgba(0,0,0,0.25)" }}
        >
          DingoBet
        </h1>
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-orange-200">
          Your edge. Every bet.
        </p>
      </div>
    </div>
  );
}

"use client";

import { LayoutGroup, motion } from "motion/react";
import { usePathname } from "next/navigation";
import {
  NewspaperIcon,
  MagnifyingGlassIcon,
  TicketIcon,
  ChatBubbleLeftRightIcon,
  UserCircleIcon,
} from "@heroicons/react/24/outline";
import {
  NewspaperIcon as NewspaperSolid,
  MagnifyingGlassIcon as MagnifyingGlassSolid,
  TicketIcon as TicketSolid,
  ChatBubbleLeftRightIcon as ChatSolid,
  UserCircleIcon as UserSolid,
} from "@heroicons/react/24/solid";
import { Link } from "@/components/ui/link";
import { useAuthStore } from "@/store/authStore";

const TABS = [
  { label: "Feed",    href: "/feed",    Icon: NewspaperIcon,              IconActive: NewspaperSolid      },
  { label: "Search",  href: "/search",  Icon: MagnifyingGlassIcon,        IconActive: MagnifyingGlassSolid },
  { label: "Betting", href: "/",        Icon: TicketIcon,                 IconActive: TicketSolid          },
  { label: "Chatter", href: "/chatter", Icon: ChatBubbleLeftRightIcon,    IconActive: ChatSolid            },
  { label: "Profile", href: "/profile", Icon: UserCircleIcon,             IconActive: UserSolid            },
];

const HIDE_ON = ["/login", "/register"];

export default function BottomNav() {
  const pathname = usePathname();
  const token = useAuthStore((s) => s.token);

  if (!token || HIDE_ON.includes(pathname)) return null;

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 border-t border-zinc-200 bg-white"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <LayoutGroup id="bottom-nav">
        <div className="flex">
          {TABS.map(({ label, href, Icon, IconActive }) => {
            const current =
              href === "/" ? pathname === "/" : pathname.startsWith(href);

            return (
              <span key={href} className="relative flex flex-1">
                {current && (
                  <motion.span
                    layoutId="bottom-nav-indicator"
                    className="absolute inset-x-3 top-0 h-0.5 rounded-full bg-orange-500"
                  />
                )}
                <Link
                  href={href}
                  data-current={current ? "true" : undefined}
                  className={[
                    "flex flex-1 flex-col items-center gap-1 py-3 text-xs transition-colors duration-150 focus:outline-none",
                    label === "Betting" ? "font-bold" : "font-medium",
                    current ? "text-orange-500" : "text-zinc-400",
                  ].join(" ")}
                >
                  {current
                    ? <IconActive className="h-6 w-6" />
                    : <Icon className="h-6 w-6" />
                  }
                  <span>{label}</span>
                </Link>
              </span>
            );
          })}
        </div>
      </LayoutGroup>
    </nav>
  );
}

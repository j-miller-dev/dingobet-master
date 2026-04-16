"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useAuthStore } from "@/store/authStore";

const HIDDEN_ROUTES = ["/login", "/register"];

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, clearAuth } = useAuthStore();

  if (HIDDEN_ROUTES.includes(pathname)) return null;

  const handleLogout = () => {
    clearAuth();
    router.push("/login");
  };

  return (
    <nav className="border-b border-gray-200 bg-white px-4 py-3">
      <div className="mx-auto flex max-w-7xl items-center justify-between">
        <Link href="/" className="text-xl font-bold text-orange-600">
          DingoBet
        </Link>
        {user && (
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">Hey, {user.firstName}</span>
            <button
              onClick={handleLogout}
              className="text-sm font-medium text-gray-500 hover:text-gray-900"
            >
              Logout
            </button>
          </div>
        )}
      </div>
    </nav>
  );
}

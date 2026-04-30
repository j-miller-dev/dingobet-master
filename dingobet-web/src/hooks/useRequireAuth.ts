import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";

export function useRequireAuth() {
  const router = useRouter();
  const token = useAuthStore((state) => state.token);
  const hydrated = useAuthStore((state) => state._hydrated);

  useEffect(() => {
    // Wait until the store has rehydrated from localStorage before deciding
    // whether to redirect — prevents a flash of protected content or an
    // incorrect redirect when the user is actually logged in.
    if (hydrated && !token) {
      router.push("/login");
    }
  }, [hydrated, token, router]);

  return { token, hydrated };
}

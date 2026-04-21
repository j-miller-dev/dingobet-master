"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import Link from "next/link";
import api from "@/lib/api";
import { useAuthStore } from "@/store/authStore";

export default function RegisterPage() {
  const router = useRouter();
  const { setAuth } = useAuthStore();

  const [form, setForm] = useState({
    email: "",
    password: "",
    username: "",
    firstName: "",
  });

  const {
    mutate: register,
    isPending,
    error,
  } = useMutation({
    mutationFn: (data: typeof form) =>
      api.post("/auth/register", data).then((res) => res.data),
    onSuccess: (data) => {
      setAuth(data.accessToken, data.user);
      router.push("/");
    },
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    register(form);
  };

  return (
    <div className="flex min-h-full flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h1 className="mx-auto text-center text-3xl font-bold text-orange-600">
          DingoBet
        </h1>
        <h2 className="mt-6 text-center text-2xl/9 font-bold tracking-tight text-gray-900">
          Create an account
        </h2>
      </div>

      <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-[480px]">
        <div className="bg-white px-6 py-12 shadow-sm sm:rounded-lg sm:px-12">
          {error && (
            <div className="mb-6 rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">
              Registration failed. Please check your details and try again.
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-6">
            {[
              { name: "email", label: "Email address", type: "email" },
              { name: "username", label: "Username", type: "text" },
              {
                name: "firstName",
                label: "First name (optional)",
                type: "text",
              },
              { name: "password", label: "Password", type: "password" },
            ].map(({ name, label, type }) => (
              <div key={name}>
                <label htmlFor={name} className="block text-sm/6 font-medium text-gray-900">
                  {label}
                </label>
                <div className="mt-2">
                  <input
                    id={name}
                    name={name}
                    type={type}
                    required={name !== "firstName"}
                    value={form[name as keyof typeof form]}
                    onChange={handleChange}
                    className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-orange-600 sm:text-sm/6"
                  />
                </div>
              </div>
            ))}
            <button
              type="submit"
              disabled={isPending}
              className="flex w-full justify-center rounded-md bg-orange-600 px-3 py-1.5 text-sm/6 font-semibold text-white shadow-xs hover:bg-orange-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isPending ? "Creating account..." : "Create account"}
            </button>
          </form>
        </div>
        <p className="mt-10 text-center text-sm/6 text-gray-500">
          Already have an account?{" "}
          <Link href="/login" className="font-semibold text-orange-600 hover:text-orange-500">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}

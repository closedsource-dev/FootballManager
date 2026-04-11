"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

export default function LoginPage() {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setLoading(true);
    try {
      if (mode === "login") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        window.location.href = "/";
      } else {
        // Validate username for signup
        if (!username.trim()) {
          throw new Error("Username is required");
        }
        if (username.length < 3) {
          throw new Error("Username must be at least 3 characters");
        }
        if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
          throw new Error("Username can only contain letters, numbers, hyphens, and underscores");
        }

        // Check if username is already taken
        const { data: existingProfile } = await supabase
          .from("profiles")
          .select("id")
          .eq("username", username)
          .single();

        if (existingProfile) {
          throw new Error("Username already taken");
        }

        // Create account
        const { data: authData, error: signUpError } = await supabase.auth.signUp({ email, password });
        if (signUpError) {
          // Handle duplicate email error
          if (signUpError.message.includes("already registered") || signUpError.message.includes("already exists")) {
            throw new Error("Email already registered");
          }
          throw signUpError;
        }

        // Update profile with username (the trigger creates the profile automatically)
        if (authData.user) {
          const { error: profileError } = await supabase
            .from("profiles")
            .update({ username })
            .eq("id", authData.user.id);

          if (profileError) {
            // Handle unique constraint violation
            if (profileError.code === "23505" && profileError.message.includes("username")) {
              throw new Error("Username already taken");
            }
            throw profileError;
          }
        }

        setMessage("Account created! Confirm your email and sign in.");
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg w-full max-w-sm p-8">
        <div className="text-center mb-8">
          <span className="text-5xl">⚽</span>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mt-3">Football Manager</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {mode === "login" ? "Sign in to your account" : "Create a new account"}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === "signup" && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Username</label>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="your_username"
                className="w-full border dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-600"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                3+ characters, letters, numbers, hyphens, and underscores only
              </p>
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full border dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-600"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full border dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-600"
            />
          </div>

          {error && <p className="text-red-500 text-sm">{error}</p>}
          {message && <p className="text-green-600 text-sm">{message}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-green-700 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-green-800 transition-colors disabled:opacity-50"
          >
            {loading ? "…" : mode === "login" ? "Sign In" : "Create Account"}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-6">
          {mode === "login" ? "Don't have an account?" : "Already have an account?"}{" "}
          <button
            onClick={() => { setMode(mode === "login" ? "signup" : "login"); setError(null); setMessage(null); }}
            className="text-green-700 dark:text-green-400 font-medium hover:underline"
          >
            {mode === "login" ? "Sign up" : "Sign in"}
          </button>
        </p>
      </div>
    </div>
  );
}

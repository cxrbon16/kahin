"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

// Supabase auth is email-based, but we only want username + password. We map
// each username to a synthetic, stable email under this domain. Nothing is
// ever sent here — email confirmation must be OFF in Supabase Auth settings.
const EMAIL_DOMAIN = "kahin.app";

// usernames -> safe email local part: lowercase, only a-z 0-9 . _ -
function usernameToEmail(username: string): string {
  const local = username
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9._-]/g, "");
  return `${local}@${EMAIL_DOMAIN}`;
}

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">(
    "idle",
  );
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    const clean = username.trim();
    if (clean.replace(/[^a-z0-9._-]/gi, "").length < 3) {
      setError("Kullanıcı adı en az 3 karakter olmalı (harf/rakam).");
      setStatus("error");
      return;
    }
    if (password.length < 6) {
      setError("Şifre en az 6 karakter olmalı.");
      setStatus("error");
      return;
    }

    setStatus("loading");
    const supabase = createClient();
    const email = usernameToEmail(clean);

    if (mode === "signup") {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { display_name: clean },
        },
      });

      if (error) {
        setError(translate(error.message));
        setStatus("error");
        return;
      }
      // Email confirmation is OFF, so the user is signed in immediately.
      setStatus("success");
      router.push("/");
      router.refresh();
    } else {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setError(translate(error.message));
        setStatus("error");
        return;
      }
      router.push("/");
      router.refresh();
    }
  }

  return (
    <div className="mx-auto max-w-md">
      <h1 className="mb-2 text-2xl font-bold">
        {mode === "login" ? "Giriş yap" : "Kayıt ol"}
      </h1>
      <p className="mb-6 text-sm text-white/60">
        {mode === "login"
          ? "Kullanıcı adın ve şifrenle giriş yap."
          : "Tahmin ligine katılmak için kullanıcı adı ve şifre seç."}
      </p>

      <form onSubmit={handleSubmit} className="card space-y-4">
        <div>
          <label className="mb-1 block text-xs font-medium text-white/50 uppercase tracking-wider">
            Kullanıcı adı
          </label>
          <input
            type="text"
            required
            autoComplete="username"
            placeholder="Örn: KralTahminci"
            className="input w-full"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-white/50 uppercase tracking-wider">
            Şifre
          </label>
          <input
            type="password"
            required
            autoComplete={mode === "login" ? "current-password" : "new-password"}
            placeholder="••••••••"
            className="input w-full"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        <button
          type="submit"
          className="btn-primary w-full py-3 text-base font-semibold"
          disabled={status === "loading"}
        >
          {status === "loading"
            ? "İşlem yapılıyor…"
            : mode === "login"
            ? "Giriş Yap"
            : "Kayıt Ol"}
        </button>

        {error && <p className="text-sm text-red-400 text-center">{error}</p>}

        <div className="pt-2 text-center text-sm">
          <button
            type="button"
            onClick={() => {
              setMode(mode === "login" ? "signup" : "login");
              setError("");
              setStatus("idle");
            }}
            className="text-white/60 hover:text-white underline underline-offset-4"
          >
            {mode === "login"
              ? "Hesabın yok mu? Yeni hesap oluştur"
              : "Zaten hesabın var mı? Giriş yap"}
          </button>
        </div>
      </form>
    </div>
  );
}

// Friendlier Turkish messages for the common Supabase auth errors.
function translate(message: string): string {
  const m = message.toLowerCase();
  if (m.includes("invalid login")) return "Kullanıcı adı veya şifre hatalı.";
  if (m.includes("already registered") || m.includes("already been registered"))
    return "Bu kullanıcı adı zaten alınmış.";
  if (m.includes("password")) return "Şifre en az 6 karakter olmalı.";
  return message;
}

"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">(
    "idle",
  );
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    setError("");

    const supabase = createClient();

    if (mode === "signup") {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          // Build the confirmation link from the origin the user is actually on,
          // so the email never points at localhost in production.
          emailRedirectTo: `${window.location.origin}/auth/callback`,
          data: {
            display_name: displayName || email.split("@")[0],
          },
        },
      });

      if (error) {
        setError(error.message);
        setStatus("error");
      } else {
        setStatus("success");
        // For password signup, if email confirmation is OFF, they are logged in.
        // If ON, they need to check email.
        setTimeout(() => {
          if (!error) router.push("/");
        }, 1500);
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setError(error.message);
        setStatus("error");
      } else {
        router.push("/");
        router.refresh();
      }
    }
  }

  return (
    <div className="mx-auto max-w-md">
      <h1 className="mb-2 text-2xl font-bold">
        {mode === "login" ? "Giriş yap" : "Kayıt ol"}
      </h1>
      <p className="mb-6 text-sm text-white/60">
        {mode === "login"
          ? "Hesabına erişmek için bilgilerini gir."
          : "Tahmin ligine katılmak için hesap oluştur."}
      </p>

      <form onSubmit={handleSubmit} className="card space-y-4">
        {mode === "signup" && (
          <div>
            <label className="mb-1 block text-xs font-medium text-white/50 uppercase tracking-wider">
              Görüntülenecek Ad (Kullanıcı Adı)
            </label>
            <input
              type="text"
              placeholder="Örn: KralTahminci"
              className="input w-full"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
            />
          </div>
        )}

        <div>
          <label className="mb-1 block text-xs font-medium text-white/50 uppercase tracking-wider">
            E-posta
          </label>
          <input
            type="email"
            required
            placeholder="seninadin@example.com"
            className="input w-full"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-white/50 uppercase tracking-wider">
            Şifre
          </label>
          <input
            type="password"
            required
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
        {status === "success" && mode === "signup" && (
          <p className="text-sm text-emerald-400 text-center">
            Kayıt başarılı! Yönlendiriliyorsunuz...
          </p>
        )}

        <div className="pt-2 text-center text-sm">
          <button
            type="button"
            onClick={() => {
              setMode(mode === "login" ? "signup" : "login");
              setError("");
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

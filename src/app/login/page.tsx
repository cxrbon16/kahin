"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">(
    "idle",
  );
  const [error, setError] = useState("");

  async function sendLink(e: React.FormEvent) {
    e.preventDefault();
    setStatus("sending");
    setError("");

    const supabase = createClient();
    const siteUrl =
      process.env.NEXT_PUBLIC_SITE_URL ?? window.location.origin;

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${siteUrl}/auth/callback` },
    });

    if (error) {
      setError(error.message);
      setStatus("error");
    } else {
      setStatus("sent");
    }
  }

  return (
    <div className="mx-auto max-w-md">
      <h1 className="mb-2 text-2xl font-bold">Giriş yap</h1>
      <p className="mb-6 text-sm text-white/60">
        E-posta adresini gir, sana tek seferlik giriş bağlantısı gönderelim.
        Şifre yok.
      </p>

      {status === "sent" ? (
        <div className="card text-sm">
          <p className="font-medium text-emerald-300">Bağlantı gönderildi.</p>
          <p className="mt-1 text-white/70">
            <strong>{email}</strong> adresine gelen giriş bağlantısına tıkla.
            Gelmediyse spam klasörünü kontrol et.
          </p>
        </div>
      ) : (
        <form onSubmit={sendLink} className="card space-y-3">
          <input
            type="email"
            required
            placeholder="seninadin@example.com"
            className="input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <button
            type="submit"
            className="btn-primary w-full"
            disabled={status === "sending"}
          >
            {status === "sending" ? "Gönderiliyor…" : "Giriş bağlantısı gönder"}
          </button>
          {error && <p className="text-sm text-red-400">{error}</p>}
        </form>
      )}
    </div>
  );
}

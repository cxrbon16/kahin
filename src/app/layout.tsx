import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";
import { getSessionUser } from "@/lib/auth";
import { SignOutButton } from "@/components/SignOutButton";

export const metadata: Metadata = {
  title: "Kâhin — Dünya Kupası 2026 Tahmin Ligi",
  description:
    "Dünya Kupası 2026 grup ve eleme tahminlerini yap, gerçek sonuçlara göre puan topla, arkadaşlarınla kapış.",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isAdmin } = await getSessionUser();

  return (
    <html lang="tr">
      <body>
        <header className="sticky top-0 z-10 border-b border-white/10 bg-pitchdark/80 backdrop-blur">
          <nav className="mx-auto flex max-w-5xl items-center gap-4 px-4 py-3">
            <Link href="/" className="text-lg font-bold tracking-tight">
              ⚽ Kâhin
            </Link>
            <div className="flex flex-1 items-center gap-3 text-sm">
              <Link href="/predict" className="text-white/80 hover:text-white">
                Tahminlerim
              </Link>
              <Link href="/leaderboard" className="text-white/80 hover:text-white">
                Sıralama
              </Link>
              {isAdmin && (
                <Link href="/admin" className="text-amber-300 hover:text-amber-200">
                  Yönetim
                </Link>
              )}
            </div>
            {user ? (
              <div className="flex items-center gap-3 text-sm">
                <span className="hidden text-white/60 sm:inline">{user.email}</span>
                <SignOutButton />
              </div>
            ) : (
              <Link href="/login" className="btn-primary">
                Giriş yap
              </Link>
            )}
          </nav>
        </header>
        <main className="mx-auto max-w-5xl px-4 py-8">{children}</main>
        <footer className="mx-auto max-w-5xl px-4 py-10 text-center text-xs text-white/40">
          Kâhin — Dünya Kupası 2026 tahmin ligi.
        </footer>
      </body>
    </html>
  );
}

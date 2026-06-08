# Kâhin — Deploy (hızlı)

Tahmini süre: ~15 dk. Stack: Next.js + Supabase + Vercel.

## 1. Supabase (DB + Auth)

1. https://supabase.com → **New project**. Region yakın seç, DB şifresini kaydet.
2. **SQL Editor → New query**: `supabase/schema.sql` içeriğini yapıştır → **Run**.
3. Aynı yerde `supabase/seed.sql` → **Run** (48 takım + resmi kura).
4. **Project Settings → API**’den kopyala:
   - `Project URL`
   - `anon` `public` anahtarı
   - `service_role` anahtarı (gizli — sadece sunucu)
5. **Authentication → URL Configuration**:
   - Site URL: `https://SENIN-ALANIN.vercel.app`
   - Redirect URLs: `https://SENIN-ALANIN.vercel.app/auth/callback`
     (yerelde de test edeceksen `http://localhost:3000/auth/callback` ekle)

## 2. GitHub

```bash
git add -A && git commit -m "Kâhin"   # .env.local commit'lenmez (.gitignore'da)
git remote add origin https://github.com/KULLANICI/kahin.git
git push -u origin master
```

## 3. Vercel

1. https://vercel.com → **Add New → Project** → repoyu seç (framework otomatik: Next.js).
2. **Environment Variables** (hepsi Production + Preview):

   | Key | Değer |
   |---|---|
   | `NEXT_PUBLIC_SUPABASE_URL` | Supabase Project URL |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | anon public anahtar |
   | `NEXT_PUBLIC_SITE_URL` | `https://SENIN-ALANIN.vercel.app` |
   | `SUPABASE_SERVICE_ROLE_KEY` | service_role anahtar (gizli) |
   | `FOOTBALL_DATA_API_KEY` | football-data.org/client/register (ücretsiz) |
   | `CRON_SECRET` | rastgele: `openssl rand -hex 24` |
   | `FOOTBALL_DATA_COMPETITION` | `WC` |

3. **Deploy**. Bittiğinde gerçek alan adını öğren; gerekiyorsa `NEXT_PUBLIC_SITE_URL` ve Supabase Redirect URL’lerini bu adresle güncelle, **redeploy**.

> Cron (`vercel.json`) her 30 dk `/api/sync`’i çağırır; `CRON_SECRET` otomatik gönderilir. Otomatik sonuç çekme + puanlama için ekstra ayar gerekmez.

## 4. Deploy sonrası (ilk kurulum)

1. Siteye gir → `/login` → e-posta ile magic link → giriş yap (1 kez).
2. Supabase **SQL Editor**’da kendini admin yap:
   ```sql
   update profiles set is_admin = true
   where id = (select id from auth.users where email = 'korayoray08@gmail.com');
   ```
3. `/admin` görünür. Turnuva başlayınca **Tahminleri kilitle**.
4. Sonuçlar otomatik gelir; elle tetik için `/admin → Şimdi senkronize et`.

## Hızlı doğrulama

| Kontrol | Beklenen |
|---|---|
| `/` açılıyor | Hero + "Hemen başla" |
| `/login` magic link | E-posta geliyor, link `/predict`’e atıyor |
| `/matches` | 104 maç, "Sıradaki maç" kartı |
| `/leaderboard` | Tur tur puan kolonları |
| `curl ".../api/sync?secret=CRON_SECRET"` | JSON `{ ok: true, ... }` |

## Sık takılmalar

| Sorun | Çözüm |
|---|---|
| Magic link redirect hatası | Supabase Redirect URLs’e `/auth/callback` ekli mi |
| `/admin` görünmüyor | `profiles.is_admin = true` yapıldı mı (giriş yaptıktan sonra) |
| Sync 401 | `CRON_SECRET` Vercel’de set mi; URL’deki `secret` ile aynı mı |
| Sync 500 / boş | `SUPABASE_SERVICE_ROLE_KEY` ve `FOOTBALL_DATA_API_KEY` doğru mu |
| Takım eşleşmedi uyarısı | `src/lib/sync/teamMap.ts` alias tablosuna ekle |

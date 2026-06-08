# Kâhin — Dünya Kupası 2026 Tahmin Ligi

Grup sıralamalarını ve eleme turlarını tahmin et, gerçek sonuçlar girildikçe
puan topla, arkadaşlarınla aynı sıralamada kapış.

| Katman | Teknoloji |
|---|---|
| Frontend + backend | Next.js 14 (App Router), TypeScript, Tailwind |
| Veritabanı + Auth | Supabase (Postgres, magic-link giriş, RLS) |
| Hosting | Vercel |

## Nasıl çalışır

- **Grup aşaması:** 12 grubun her birinde takımları bitiş sırasına göre dizersin. İlk 2 bir üst tura çıkar.
- **Eleme:** Son 16 → Çeyrek → Yarı → Final → Şampiyon. Her turda kimlerin yükseleceğini seçersin (üst turun seçenekleri alt turdaki seçimlerinden gelir).
- **Puanlama** (`src/lib/scoring.ts` içinden değiştirilebilir):

  | Olay | Puan |
  |---|---|
  | Grup içi tam pozisyon doğru | 3 |
  | Üst tura çıkanı doğru bilme (sıra fark etmez) | +1 |
  | Son 16'ya çıkan doğru takım | 2 |
  | Çeyrek finale çıkan | 4 |
  | Yarı finale çıkan | 7 |
  | Finale çıkan | 12 |
  | Şampiyon | 25 |

- **Yönetici** maç sonuçlarını `/admin` sayfasından girer; kaydettiğinde herkesin puanı yeniden hesaplanır. Turnuva başlayınca tahminleri "Kilitle".

## Kurulum (yaklaşık 15 dakika)

### 1. Supabase projesi

1. https://supabase.com → yeni proje oluştur.
2. **SQL Editor** → `supabase/schema.sql` içeriğini yapıştır, çalıştır.
3. Aynı yerde `supabase/seed.sql` çalıştır — 48 takım + 12 grup, **resmi 5 Aralık 2025 kurası** (Türkiye D grubunda: ABD, Paraguay, Avustralya).
4. **Project Settings → API**'den şunları al: `Project URL` ve `anon public` anahtarı.
5. **Authentication → URL Configuration**:
   - Site URL: yerelde `http://localhost:3000`, canlıda Vercel adresin.
   - Redirect URLs'e ekle: `http://localhost:3000/auth/callback` ve `https://SENIN-ALANIN.vercel.app/auth/callback`.

### 2. Yerel çalıştırma

```bash
cp .env.local.example .env.local   # değerleri doldur
npm install
npm run dev                        # http://localhost:3000
```

`.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

### 3. Kendini admin yap

Bir kez giriş yaptıktan sonra Supabase SQL Editor'da:

```sql
update profiles set is_admin = true
where id = (select id from auth.users where email = 'korayoray08@gmail.com');
```

Artık üst menüde **Yönetim** linkini görürsün.

### 4. Vercel'e deploy

1. Projeyi bir GitHub deposuna push'la.
2. https://vercel.com → New Project → depoyu seç.
3. Environment Variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `NEXT_PUBLIC_SITE_URL` = `https://SENIN-ALANIN.vercel.app`
4. Deploy. Sonra Supabase'deki Redirect URL'leri canlı adresle güncellemeyi unutma.

## Otomatik sonuç + otomatik puanlama (Dev #2)

Sonuçları elle girmene gerek yok: `/api/sync` endpoint'i [football-data.org](https://www.football-data.org)'dan canlı sonuçları çeker, takımları eşler, `results` satırını günceller. Leaderboard `results`'tan canlı hesaplandığı için **herkes anında yeniden puanlanır**.

| Ne | Nasıl |
|---|---|
| Veri kaynağı | football-data.org v4, `WC` competition (ücretsiz token) |
| Grup puanı | Bir grubun 6 maçı da bitince sıralama yazılır |
| Eleme geçme | Bir turun maçında sahaya çıkan takım = o tura yükseldi |
| Şampiyon | Final maçının galibi |
| Tetikleme | Vercel Cron her 30 dk (`vercel.json`) + admin'de "Şimdi senkronize et" |

Ek environment değişkenleri (hem yerel `.env.local` hem Vercel'de):

```
SUPABASE_SERVICE_ROLE_KEY=...   # Supabase -> Settings -> API (gizli)
FOOTBALL_DATA_API_KEY=...       # football-data.org/client/register (ücretsiz)
CRON_SECRET=...                 # openssl rand -hex 24
FOOTBALL_DATA_COMPETITION=WC    # opsiyonel
```

Elle test: `curl "https://SENIN-ALANIN.vercel.app/api/sync?secret=CRON_SECRET"`.
Sağlayıcı bir takım adını eşleyemezse admin panelinde "Eşleşmeyen takımlar" olarak listelenir; `src/lib/sync/teamMap.ts` içindeki alias tablosuna eklemen yeterli.

## Maç günü akışı

1. Turnuva başlamadan: `/admin` → **Tahminleri kilitle** = Kilitli.
2. Maçlar oynandıkça: hiçbir şey yapmana gerek yok — Cron her 30 dk sonuçları çeker ve herkesi puanlar. Acele lazımsa `/admin` → **Şimdi senkronize et**.
3. (Opsiyonel) Otomatik kaynak bir sonucu kaçırırsa `/admin`'den elle düzeltebilirsin; sonraki senkron üzerine yazar.

## Mimari notlar

- `src/lib/tournament.ts` — turnuva yapısı ve tipler.
- `src/lib/scoring.ts` — tüm puanlama mantığı (tek dosyada).
- `src/lib/data.ts` — veri erişimi + leaderboard hesaplama.
- `src/lib/sync/` — otomatik sonuç çekme (football-data.org → `results`).
- `src/app/api/sync/route.ts` — Cron endpoint'i.
- RLS açık: oyuncular yalnız kendi tahminlerini yazar; sonuç/takım yazımı yalnız admin.
- Bilinen v1 sınırı: tahminler kilitlenene kadar oyuncular birbirinin tahminini okuyabilir (leaderboard hesabı için). İstenirse SECURITY DEFINER fonksiyonla gizlenebilir.

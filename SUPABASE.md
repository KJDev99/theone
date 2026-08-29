# TheOne — Supabase'ga ulash (qadam-baqadam)

Bu qo'llanma ilovani brauzer xotirasidan (`localStorage`) haqiqiy ma'lumotlar
bazasiga o'tkazadi. Oxirida:

- baholar **barcha qurilmalarda** bir xil bo'ladi (telefon, noutbuk, proyektor);
- `/admin` **haqiqiy parol** bilan himoyalanadi — endi uni devtools orqali
  aylanib o'tib bo'lmaydi, chunki tekshiruvni serverning o'zi bajaradi;
- ochiq reyting login talab qilmaydi;
- o'qituvchi telefonda baho qo'ysa, proyektordagi sahifa **o'zi yangilanadi**.

> Supabase ulanmagan bo'lsa ham ilova ishlayveradi — u holda hamma narsa
> avvalgidek shu brauzerda saqlanadi. Ulash to'liq ixtiyoriy va orqaga
> qaytariladigan qadam.

---

## Sizning loyihangiz — tekshirilgan holat

Loyihangizga (`jfuwmcnmzaattdlamzkl`) `anon` kalit bilan murojaat qilib
tekshirildi. Natija:

| Nima                                              | Holat | Izoh                                                                    |
| ------------------------------------------------- | ----- | ----------------------------------------------------------------------- |
| 2.1 Jadvallar                                     | ✅    | `profiles, groups, students, entries, awards` — barcha ustunlar joyida |
| 2.2 Indekslar                                     | ✅    | `schema.sql` bir butun ishga tushgan                                    |
| 2.3 RLS                                           | ✅    | O'qish ochiq (200), tashqaridan yozish rad etildi (`42501`)             |
| 2.4 `handle_new_user` trigger                    | ✅    | Sinov hisobi ochilganda `profiles` ga qator o'zi qo'shildi              |
| 2.5 Realtime                                      | ✅    | Kanal `SUBSCRIBED` holatiga o'tdi                                       |
| `.env.local`                                     | ⚠️→✅ | Yo'q edi — yaratildi (pastga qarang)                                     |
| Yagona o'qituvchi qulfi                           | ⏳    | `single-teacher.sql` ni ishga tushirish kerak (4-qadam)                 |

**Ya'ni 2.1–2.5 ni alohida bajarish shart emas edi** — ular bitta
`schema.sql` faylining bo'limlari, siz uni to'liq ishga tushirganingizda
hammasi bajarilgan. Bo'limlar faqat qaysi qator nima qilishini tushuntirish
uchun ajratilgan.

### Nima uchun ishlamayotgan edi

Kalitlar `.env.local.example` ichiga yozilgan edi, lekin Next.js faqat
`.env.local` faylini o'qiydi — `.example` esa shunchaki namuna. Ustiga-ustak
undagi URL hali `https://YOUR-PROJECT-ref.supabase.co` bo'lib turgan edi.
`.env.local` to'g'ri URL va kalit bilan yaratildi; dev serverni qayta ishga
tushirsangiz ulanish ishlaydi.

### Qoladigan ishlar

Hammasi 4-qadamda batafsil yozilgan, qisqasi:

1. SQL Editor'da `supabase/single-teacher.sql` ni ishga tushiring — bu
   bazani yagona o'qituvchiga qulflaydi.
2. **Authentication → Users** dan sinov hisoblarini o'chiring
   (`claude.probe.delete.me@gmail.com`, `probe.*@bahosystem.uz`).
3. O'sha yerdan **Add user** bilan o'z hisobingizni oching:
   `LOGIN@bahosystem.uz`, parol, **Auto Confirm User** ✅.
4. **Authentication → Providers → Email** → _Allow new users to sign up_ ni
   o'chiring.

---

## 1-qadam — Supabase loyihasi yaratish

1. [supabase.com](https://supabase.com) ga kiring → **New project**.
2. **Name**: `ball-system` (istalgan nom).
3. **Database Password**: kuchli parol o'ylab toping va **saqlab qo'ying** —
   bu bazaning parolі, uni qayta ko'rsatishmaydi.
4. **Region**: foydalanuvchilaringizga eng yaqinini tanlang (masalan
   `Central EU (Frankfurt)`).
5. **Create new project** → 1–2 daqiqa kutasiz.

---

## 2-qadam — SQL'ni ishga tushirish

Loyihada **`supabase/schema.sql`** fayli bor. Uni to'liq nusxalab, Supabase'da
ishga tushiring:

1. Chap menyudan **SQL Editor** → **New query**.
2. `supabase/schema.sql` faylining **hammasini** nusxalab, oynaga qo'ying.
3. **Run** (yoki `Ctrl+Enter`).
4. Pastda `Success. No rows returned` chiqsa — tayyor.

Fayl **idempotent**: uni ikkinchi marta ishga tushirsangiz ham hech narsa
buzilmaydi. Quyida u nima qilishini bo'lim-bo'lim tushuntiraman.

### 2.1 — Jadvallar

| Jadval     | Nima saqlaydi                                                       |
| ---------- | ------------------------------------------------------------------- |
| `profiles` | Har bir o'qituvchi uchun bitta qator: ismi va sozlamalari (`jsonb`) |
| `groups`   | Sinflar: nom, fan, belgi, rang                                      |
| `students` | O'quvchilar: ism, avatar rangi, qaysi guruhda                       |
| `entries`  | Har bir ball: qiymat, sabab, **sana**                               |
| `awards`   | Yulduzlar: haftalik/oylik pyedestal va qo'lda berilgan bonuslar     |

Ikki muhim tafsilot:

- **`teacher_id` har bir jadvalda takrorlangan.** Bu ataylab: 3-bo'limdagi
  xavfsizlik qoidasi shu bitta ustunni solishtirish bilan cheklanadi —
  jadvallarni bir-biriga bog'lab qidirish shart emas, ya'ni tez ishlaydi.
- **`entries.date` — `date` tipi, `timestamp` emas.** Dars kuni vaqt mintaqasi
  tufayli boshqa kunga siljib ketmasligi uchun. Ilovadagi `YYYY-MM-DD` satri
  bilan aynan mos tushadi.

### 2.2 — Indekslar

Reyting doim sanaga qarab kesiladi, profil sahifasi esa o'quvchiga qarab —
shuning uchun `(teacher_id, date)`, `(student_id)` va `(group_id, date)`
indekslari qo'yilgan. Ular ilovaning deyarli barcha so'rovlarini qoplaydi.

Yana ikkita **unique** indeks bor — bu xavfsizlik to'ri: bir davr ikki marta
yakunlanib, **yulduzlar ikki hissa berilib ketmasligi** uchun. Masalan
o'qituvchi telefonda va noutbukda bir vaqtda ilovani ochsa, ikkinchi urinishni
baza rad etadi.

### 2.3 — RLS (Row Level Security) — eng muhim qismi

Bu ilovaning butun xavfsizligi shu yerda. Har bir jadval uchun ikkita qoida:

```sql
-- O'qish: hamma, jumladan tizimga kirmagan mehmon ham
create policy "entries read" on public.entries for select using (true);

-- Yozish: faqat shu qatorning egasi bo'lgan o'qituvchi
create policy "entries write" on public.entries for all
  using (auth.uid() = teacher_id)
  with check (auth.uid() = teacher_id);
```

- `using (true)` — ochiq reyting login'siz ishlashi uchun.
- `auth.uid() = teacher_id` — ball qo'yish, o'chirish, guruh yaratishni **baza
  darajasida** cheklaydi. Kimdir brauzer konsolidan so'rov yuborsa ham,
  Postgres uni rad etadi.
- `with check` — birovning nomidan qator **kiritib** bo'lmasligi uchun.

**Reyting ham yopiq bo'lsin desangiz:** har bir "read" qoidasidagi
`using (true)` ni `using (auth.role() = 'authenticated')` ga almashtiring.

### 2.4 — Yangi foydalanuvchi → profil

O'qituvchi ro'yxatdan o'tganda Supabase `auth.users` jadvaliga yozadi, lekin
ilova u jadvalga to'g'ridan-to'g'ri tega olmaydi. Shuning uchun trigger har bir
yangi hisobni `public.profiles` ga ko'chiradi:

```sql
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
```

### 2.5 — Realtime (ixtiyoriy, lekin tavsiya etiladi)

Oxirgi `do $$ ... $$` bloki to'rt jadvalni `supabase_realtime` nashriga
qo'shadi. Shundan keyin o'qituvchi telefonda ball berganda, sinfdagi
proyektorda ochiq turgan reyting **o'zi yangilanadi** — sahifani qayta yuklash
shart emas.

---

## 3-qadam — Kalitlarni ilovaga ulash

1. Supabase'da **Settings → API** bo'limiga o'ting.
2. Ikkita qiymatni nusxalang:
   - **Project URL**
   - **anon / public** kaliti
3. Loyiha ildizida `.env.local` fayl yarating (namuna: `.env.local.example`):

```bash
NEXT_PUBLIC_SUPABASE_URL=https://jfuwmcnmzaattdlamzkl.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...
```

4. Dev serverni **qayta ishga tushiring** (`Ctrl+C`, keyin `npm run dev`).
   Next.js `NEXT_PUBLIC_*` o'zgaruvchilarni build paytida o'qiydi.

> **`anon` kaliti maxfiy emas** — u brauzerga baribir yetib boradi va shunday
> bo'lishi kerak. Uni himoya qiladigan narsa — 2.3-bo'limdagi RLS qoidalari.
> **`service_role` kalitini esa hech qachon** frontendga qo'ymang: u RLS'ni
> butunlay chetlab o'tadi.

---

## 4-qadam — Yagona o'qituvchi hisobini yaratish

Bu ilovada **bitta o'qituvchi** bo'ladi. Shuning uchun:

- ilovada **ro'yxatdan o'tish yo'q** — faqat kirish oynasi;
- hisob Supabase panelida **bir marta** ochiladi;
- baho qo'yishni **ma'lumotlar bazasining o'zi** shu bitta hisobdan boshqasiga
  ruxsat bermaydi.

### 4.1 — Qulfni o'rnating

SQL Editor'da `supabase/single-teacher.sql` faylini to'liq ishga tushiring.
(Yangi loyihada `schema.sql` ning 6-bo'limi shuni o'zi qiladi — bu alohida
fayl siz allaqachon `schema.sql` ni ishga tushirganingiz uchun.)

U nima qiladi:

| Nima | Nima uchun |
| --- | --- |
| `app_owner` jadvali | Bitta qator sig'adi: `id boolean primary key check (id)`. Yozish siyosati umuman yo'q — hech kim API orqali egalikni o'zgartira olmaydi |
| `is_owner()` funksiyasi | `auth.uid()` shu qatordagi hisobmi — shuni tekshiradi |
| Yangi yozish siyosatlari | `is_owner() and auth.uid() = teacher_id` — ikkalasi birdan |
| Trigger | **Birinchi ochilgan hisob** o'rindiqni egallaydi, keyingilariga tegmaydi |

O'qish o'zgarmadi — reyting hamon login'siz ochiladi.

### 4.2 — Eski sinov hisoblarini o'chiring

**Authentication → Users** da tekshirish uchun ochilgan hisoblarni o'chiring:
`claude.probe.delete.me@gmail.com` va `probe.*@bahosystem.uz`. Hozir
loyihangizda shundan bitta bor.

### 4.3 — O'z hisobingizni oching

**Authentication → Users → Add user → Create new user**:

| Maydon | Nima yozasiz |
| --- | --- |
| Email | `LOGIN@bahosystem.uz` — masalan `nk@bahosystem.uz` |
| Password | Kuchli parol (kamida 6 belgi) |
| Auto Confirm User | **Belgilang** ✅ |

Ilova email ishlatmaydi. Supabase har bir hisobni manzil orqali tanigani uchun
loginingizdan ichki manzil yasaladi va u hech qayerda ko'rsatilmaydi —
ilovaga kirishda faqat `@` gacha bo'lgan qismini, ya'ni **`nk`** ni yozasiz.
Login 2 ta belgidan boshlanadi.

> **Auto Confirm User** ni belgilashingiz shart: tasdiqlash xati boradigan
> haqiqiy pochta yo'q.

Hisobni ochganingizda trigger uni avtomatik o'rindiqqa o'tqazadi. Tekshirish
uchun SQL Editor'da:

```sql
select u.email as login_address, o.claimed_at
from public.app_owner o
join auth.users u on u.id = o.user_id;
```

Bitta qator — sizniki — chiqishi kerak.

### 4.4 — Boshqa hisob ochilmasin

**Authentication → Providers → Email** → _Allow new users to sign up_ ni
o'chirib qo'ying. Endi ikki tomondan qulf bor: yangi hisob umuman ochilmaydi,
ochilgan taqdirda ham baza unga yozishga ruxsat bermaydi.

### Parolni unutsangiz

**Authentication → Users** dan yangi hisob oching, so'ng o'rindiqni unga
ko'chiring (`single-teacher.sql` oxiridagi izohlangan blok):

```sql
insert into public.app_owner (id, user_id)
values (true, (select id from auth.users where email = 'YANGI@bahosystem.uz'))
on conflict (id) do update
  set user_id = excluded.user_id, claimed_at = now();
```

Eski hisobdagi guruh va baholar `teacher_id` bilan bog'langani uchun yangi
hisobga o'tmaydi — shuning uchun avval `/admin/settings` → **Zaxira yuklab
olish** ni bosib nusxa oling, keyin yangi hisobda **Zaxirani yuklash**.

---

## 5-qadam — Eski ma'lumotni bulutga ko'chirish

Ilovadan avval foydalangan bo'lsangiz, brauzerdagi ma'lumot yo'qolmaydi:

1. `/admin/settings` → **Bulut sinxronizatsiyasi** bo'limi.
2. U yerda "Shu brauzerda N ta guruh va M ta o'quvchi saqlangan" degan
   ogohlantirish chiqadi.
3. **Bulutga ko'chirish** tugmasini bosing.

Ko'chirish paytida barcha `grp_a1b2c3` ko'rinishidagi eski ID'lar `uuid` ga
almashtiriladi va bog'lanishlar (kim qaysi guruhda, qaysi ball kimniki)
saqlab qolinadi. Muvaffaqiyatli tugagach brauzerdagi nusxa o'chiriladi.

> Diqqat: ko'chirish hisobingizdagi mavjud ma'lumot **o'rnini bosadi**. Agar
> bulutda allaqachon ma'lumot bo'lsa, avval `/admin/settings` → **Zaxira
> yuklab olish** orqali nusxa oling.

---

## 6-qadam — Tekshirish

| Tekshiruv                                                                       | Kutilgan natija                                                   |
| ------------------------------------------------------------------------------- | ----------------------------------------------------------------- |
| `/admin` ga kirib guruh yarating                                                | Supabase → **Table Editor → groups** da yangi qator paydo bo'ladi |
| Baho qo'ying                                                                    | `entries` jadvalida qator, `date` bugungi sana                    |
| Boshqa brauzerda (yoki telefonda) `/leaderboard` ni oching                      | Login'siz o'sha reyting ko'rinadi                                 |
| Tizimdan chiqib, konsolda `supabase.from('entries').insert(...)` urinib ko'ring | Xato: `new row violates row-level security policy`                |
| Ikkita oynada reytingni ochib, birida baho qo'ying                               | Ikkinchisi bir soniyada o'zi yangilanadi                          |
| `select * from public.app_owner`                                                | Aynan bitta qator — sizning hisobingiz                            |
| `insert into public.app_owner values (true, '...')` ikkinchi marta              | Xato: `duplicate key` — o'rindiq bitta                            |
| Ikkinchi hisob ochib `/admin` ga kiring                                         | «Siz o'qituvchi emassiz» chiqadi va hech narsa saqlanmaydi        |

---

## Ko'p uchraydigan muammolar

**"Ma'lumotlar bazasiga ulanib bo'lmadi"** — `.env.local` dagi URL/kalitni
tekshiring va dev serverni qayta ishga tushiring. Kalitlar `.env.local.example`
da bo'lsa ishlamaydi: Next.js faqat `.env.local` ni o'qiydi.

**Guruh yaratilmayapti, xato: `violates row-level security`** — tizimga
kirmagansiz yoki 2.3-bo'limdagi qoidalar ishga tushmagan. SQL'ni qayta
ishga tushiring.

**Kira olmayapman** — hisob **Auto Confirm User** belgilanmagan holda
ochilgan bo'lishi mumkin. Authentication → Users → hisobingiz → uch nuqta →
_Confirm user_.

**Kirdim, lekin «Siz o'qituvchi emassiz» deyapti** — o'rindiq boshqa hisobda
yoki hali bo'sh. 4-qadam oxiridagi `insert into public.app_owner ...` blokini
o'z loginingiz bilan ishga tushiring.

**Guruh yaratilmayapti, `violates row-level security`** — `app_owner` bo'sh.
Yuqoridagi blok bilan o'rindiqni egallang.

**Loginimni unutdim** — Supabase → **Authentication → Users** da hisob
`login@bahosystem.uz` ko'rinishida turadi; `@` gacha bo'lgan qism sizning
loginingiz.

**Reyting bo'sh** — o'qituvchi hisobi bilan kirib, guruh va o'quvchi
qo'shganingizga ishonch hosil qiling. Ochiq sahifa faqat bazadagi narsani
ko'rsatadi.

**Bir nechta o'qituvchi bir loyihada** — standart holatda ochiq sahifa
hammaning sinflarini birga ko'rsatadi. Faqat bittasiniki ko'rinsin desangiz,
`.env.local` ga o'sha o'qituvchining `user id` sini qo'ying:

```bash
NEXT_PUBLIC_TEACHER_ID=00000000-0000-0000-0000-000000000000
```

(ID'ni Supabase → **Authentication → Users** dan olasiz.)

---

## Vercel'ga joylashtirish

1. Loyihani GitHub'ga yuklang (`.env.local` `.gitignore` da — u yuklanmaydi).
2. Vercel → **New Project** → repozitoriyni tanlang.
3. **Environment Variables** bo'limiga o'sha ikkita o'zgaruvchini qo'shing.
4. **Deploy**.
5. Supabase → **Authentication → URL Configuration** da **Site URL** ni
   Vercel manzilingizga o'zgartiring (email tasdiqlash havolalari to'g'ri
   ishlashi uchun).

---

## Kod qayerda

| Fayl                          | Vazifasi                                                          |
| ----------------------------- | ----------------------------------------------------------------- |
| `supabase/schema.sql`         | Butun baza: jadvallar, indekslar, RLS, trigger, realtime          |
| `src/lib/supabase.js`         | Klient. Env yo'q bo'lsa `isSupabaseConfigured()` false qaytaradi  |
| `src/lib/backend.js`          | `snake_case` qatorlar ↔ ilovadagi obyektlar; barcha o'qish/yozish |
| `src/lib/migrate.js`          | Eski brauzer ma'lumotini o'qish va ID'larni `uuid` ga o'girish    |
| `src/context/AppContext.jsx`  | Ma'lumot: yuklash, optimistik yozish, realtime                    |
| `src/context/AuthContext.jsx` | Kirish: Supabase Auth, yoki env yo'q bo'lsa eski parol            |

### Yozish qanday ishlaydi

Har bir o'zgarish bir xil yo'ldan boradi:

1. Qator brauzerda tayyorlanadi (`crypto.randomUUID()` bilan ID beriladi);
2. **Ekran darhol yangilanadi** — kutish yo'q;
3. Keyin baza xabardor qilinadi;
4. Baza rad etsa — xato xabari chiqadi va haqiqiy holat qayta yuklanadi.

Shuning uchun ball qo'yish tarmoq sekin bo'lsa ham bir zumda ko'rinadi.

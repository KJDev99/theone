# TheOne — marks out of 100

A teacher-facing app for daily marks on a 0–100 scale, weekly and monthly
rankings, streaks and stars. Built with Next.js (App Router), React, JavaScript
and styled-components.

## Run

```bash
npm install
npm run dev      # http://localhost:3000
npm run build && npm start
```

## Two sides

- **Public** (`/`, `/leaderboard`, `/groups`, `/students/:id`) — anyone can look
  up their name, see their average, position, streak, stars and level. Nothing
  can be changed from here.
- **Teacher panel** (`/admin`) — sign-in protected with a plain **login and
  password; no email, and no way to register**. There is exactly one teacher.
  Group creation, adding students, daily grading, resets, awards and settings
  all live behind it. Without Supabase the first sign-in is `admin` /
  `admin123`; change it in *Settings → Access*.

  The lock is client-side, next to the data it guards: it keeps students out of
  the teacher's controls on a shared device, but anyone who opens devtools can
  read the same localStorage the app reads. A real boundary needs a server that
  holds the data and checks the password before handing it over.

## What it does

- **Groups** — one leaderboard per class, with its own colour and icon.
- **Students** — added one at a time or pasted in as a whole register.
- **Daily marks** — every mark is a whole number out of 100. One-tap buttons for
  the marks you give most (100 / 90 / 80 / 70 / 60 by default, editable), a
  slider and keypad for anything else with a reason, "mark everyone", and
  back-dating to any earlier day.
- **Leaderboards** — week, month and all-time; per group or all groups combined.
  **Ranked by average mark, not by total**, so turning up more often cannot
  outrank doing better work; the number of marks breaks a tie. Ranks handle ties
  (two students on 92.0 are both 1st, next is 3rd). Past periods can be browsed
  with the arrows.
- **Awards** — when a week or month finishes, the podium is settled automatically
  on the next launch and stars are handed to 1st/2nd/3rd (amounts configurable).
  Bonus stars can also be given by hand at any time.
- **Streaks** — consecutive days a student's marks averaged a pass. A single weak
  mark does not end a run on its own — the day as a whole has to fall short.
  Weekends are skipped rather than counted as a miss (togglable), and a streak
  survives until the end of the next school day; but a day that *was* graded and
  failed ends it there and then.
- **Reset** — clear this week's, this month's, or all marks, for one group or
  everything. Stars and awards already earned are kept.
- **Parent sharing** — a per-student or per-class summary that can be copied,
  sent through the native share sheet, or printed / saved as PDF.
- **Per-group boards** — the leaderboard has a *By group* view that lays every
  class out as its own table side by side, on top of the combined ranking.
- **Rank movement** — each row shows how far a student moved since the previous
  week or month. Someone who did not score last period reads as *new* rather
  than as a large climb.
- **Levels** — a tier read off the all-time average (Starting out → Bronze →
  Silver → Gold → Diamond → Legend) that survives every reset, so there is
  something to keep chasing.
- **Grading scale** — the pass mark and the excellent mark are settings, and
  every mark in the app is coloured against them. Settings → *Grading* draws the
  bands as a ruler so the numbers are not abstract.
- **Badges** — Champion, Leader, On fire, Perfect week, Climber, Star collector,
  Full marks, Never below and Honours, all recomputed from the marks rather than
  stored.
- **Class race** — group against group on the public home, on the average mark,
  so a class of six is not beaten on headcount alone.
- **Uzbek and English**, **dark and light mode**, responsive from phone to desktop.
- **One control kit** — every input, select, switch, stepper and segmented
  control in the app comes from `components/Fields.jsx`, so no raw browser
  widget is left anywhere. The select is a real listbox with keyboard support
  rather than the operating system dropdown.
- **A top bar on every page** — the current section, today's date, the running
  week average, where the data lives, and a `Ctrl`/`Cmd`+`K` search that finds
  any student from anywhere.

## Where the data lives

Two modes, decided by whether `.env.local` holds Supabase keys.

**With Supabase** (see [SUPABASE.md](SUPABASE.md)) — classes live in Postgres,
every device sees the same board, and `/admin` becomes a real login: the
database itself refuses any write that does not come from the owning teacher's
account, while the public board stays readable by anyone. An existing
browser-only install can be moved across in one click from
Settings → *Cloud sync*.

Supabase Auth identifies an account by an email address, but a teacher should
not need one to keep a grade book, so `lib/auth.js` turns the login they type
into a stable internal address (`nk` → `nk@bahosystem.uz`) that is never shown
back to them. The domain needs a real TLD, because Supabase rejects `.local`
and `.invalid` outright.

**One teacher, enforced by the database.** `supabase/single-teacher.sql` adds
an `app_owner` table that can physically hold one row — a boolean primary key
checked to be true — and rewrites every write policy as
`is_owner() and auth.uid() = teacher_id`. It has no write policy of its own,
so the seat cannot be claimed or moved through the API at all; the trigger
hands it to the first account ever created, and you can reassign it from the
SQL editor. A second account, however it came to exist, can read the public
board and nothing else. The app has no sign-up screen to match: the single
account is created once in Authentication → Users, and `/admin` tells anyone
else who signs in exactly why they see nothing.

**Without it** — everything stays in this browser under `ball-system:v1`, no
server and no account, exactly as the app started out. Useful for trying it
out; the `/admin` password then only hides the controls.

Marks appear on an open board the moment they are given, through Supabase
Realtime.

Either way, Settings → *Your data* exports and re-imports a JSON backup and can
load a demo class.

## Layout

```
src/
  app/
    page.js            public home — find yourself, top of the week
    leaderboard/       public standings, week / month / all-time
    groups/            public class list and class standings
    students/[id]/     profile; teacher controls appear only when signed in
    admin/             layout.js is the sign-in gate for everything below
      page.js          teacher dashboard + quick scoring
      groups/          create, edit, score, reset
      awards/          close periods, hand out bonus stars
      settings/        appearance, scoring, rewards, access, data
  components/     ui.js (layout and display), Fields.jsx (every form control),
                  Shell.jsx (sidebar + top bar + search palette), scoring panel,
                  standings table, dialogs
  context/        AppContext (data) and AuthContext (the /admin gate)
  lib/            calc.js (averages, leaderboards, streaks, awards), dates.js,
                  levels.js (level tiers + grade colours), auth.js, theme.js,
                  i18n.js, demo.js, model.js (the 0–100 scale and settings),
                  supabase.js, backend.js (row mapping), migrate.js
  i18n/           uz.js, en.js
supabase/
  schema.sql          tables, indexes, row-level security, trigger, realtime,
                      and the single-teacher lock
  single-teacher.sql  just the lock, for a project that already ran schema.sql
```

Icons come from `lucide-react`, wrapped in `components/Icons.jsx` so the whole
app shares one stroke weight — there are no emoji in the interface chrome.

Students are drawn as monogram tiles (`lib/identity.js`, `components/PersonAvatar.jsx`):
the initials of the real name over a colour that is stable per student. Uzbek
apostrophes are part of a word, so *O'ktam Yo'ldoshev* reads **OY**, not **OK**.
A teacher can override the colour when editing a student; the group icon stays
an emoji they pick themselves.

`lib/dates.js` keeps every date as a local `YYYY-MM-DD` string so a school day
never shifts across a timezone boundary — and `entries.date` is a Postgres
`date`, not a timestamp, for the same reason.

A class average is always the mean of every mark in the period, never the mean
of the students' averages — the two differ whenever some students were graded
more often than others.

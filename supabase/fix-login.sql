-- ---------------------------------------------------------------------------
-- Bitta hisobning manzilini tuzatish
-- ---------------------------------------------------------------------------
-- Ilova email so'ramaydi: siz yozgan login'dan ichki manzil yasaladi
-- (`ms` -> `ms@bahosystem.uz`). Agar hisob panelda boshqa manzil bilan
-- ochilgan bo'lsa (masalan `ms@gmail.com`), Supabase uni topa olmaydi va
-- kirish "Invalid login credentials" deb rad etiladi — parol to'g'ri
-- bo'lsa ham.
--
-- Quyidagi blok manzilni to'g'rilaydi. Supabase Dashboard -> SQL Editor -> Run.
-- ---------------------------------------------------------------------------

do $$
declare
  -- ---- shu ikkitasini o'zgartiring -------------------------------------
  old_email text := 'ms@gmail.com';        -- hozir bazadagi manzil
  new_login text := 'ms';                  -- ilovaga yozadigan loginingiz
  -- ----------------------------------------------------------------------
  new_email text := new_login || '@bahosystem.uz';
  uid uuid;
begin
  select id into uid from auth.users where email = old_email;
  if uid is null then
    raise exception 'Hisob topilmadi: %', old_email;
  end if;

  if exists (select 1 from auth.users where email = new_email and id <> uid) then
    raise exception 'Bu manzil band: %', new_email;
  end if;

  -- Asosiy yozuv: manzil, tasdiq, va ilova o'qiydigan login/ism.
  update auth.users
     set email              = new_email,
         email_confirmed_at = coalesce(email_confirmed_at, now()),
         raw_user_meta_data = coalesce(raw_user_meta_data, '{}'::jsonb)
                              || jsonb_build_object(
                                   'login', new_login,
                                   'display_name', new_login),
         updated_at         = now()
   where id = uid;

  -- Parol kirishi `identities` dagi nusxaga ham qaraydi, u ham yangilansin.
  update auth.identities
     set identity_data = identity_data || jsonb_build_object('email', new_email),
         updated_at    = now()
   where user_id = uid
     and provider = 'email';

  raise notice 'Tayyor. Endi ilovaga login sifatida "%" ni yozing.', new_login;
end
$$;

-- Tekshirish: bitta qator, manzili `...@bahosystem.uz` bo'lishi kerak.
select email, email_confirmed_at is not null as tasdiqlangan
from auth.users
order by created_at;


-- ---------------------------------------------------------------------------
-- Parolni ham shu yerdan qo'yish (ixtiyoriy)
-- ---------------------------------------------------------------------------
-- Panel kamida 6 ta belgi talab qiladi, SQL esa talab qilmaydi. Qisqa parol
-- xohlasangiz quyidagini izohdan chiqarib ishga tushiring. Bu panel faqat
-- sizniki bo'lgani uchun tanlov sizda, lekin qisqa parol — zaif parol.
--
-- update auth.users
--    set encrypted_password = extensions.crypt('0309', extensions.gen_salt('bf')),
--        updated_at         = now()
--  where email = 'ms@bahosystem.uz';

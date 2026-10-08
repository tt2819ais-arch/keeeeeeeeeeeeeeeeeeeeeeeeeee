================================================================
  SUPABASE — БЕСПЛАТНЫЙ ХОСТИНГ С ВЕЧНОЙ БАЗОЙ
  API = Edge Function, база = Postgres (данные НЕ слетают никогда),
  панель = Storage-статика. Карта не нужна. Всё — через дашборд.
================================================================

ШАГ 1. Проект: https://supabase.com > New project (free) >
  придумай имя/пароль БД > жди ~2 мин. Запомни project ref
  (часть URL до .supabase.co, например abcxyz123).

ШАГ 2. База: слева SQL Editor > New query > вставь целиком
  zcode/supabase/schema.sql > Run. Должно быть Success.

ШАГ 3. Функция API: слева Edge Functions > Create function >
  имя: api > в редактор ВСТАВЬ ЦЕЛИКОМ файл
  zcode/supabase/functions/dist/bundle.js > Deploy.
  (bundle.js уже собран из functions/api/*.js — ничего собирать не надо.
  Пересобрать после правок: cd zcode/supabase/functions/api &&
  npx -y esbuild index-entry.js ... — см. шаг 3б в конце файла.)

ШАГ 4. Секреты функции: Project Settings > Edge Functions >
  Add secret (по одному):
    SUPABASE_URL=https://<ref>.supabase.co
    SUPABASE_SERVICE_ROLE_KEY=<Settings > API > service_role key>
    JWT_SECRET=<сгенерируй: node zcode/api/scripts/gen-secrets.mjs>
    CHEAT_API_SECRET=<оттуда же>
    CHEAT_CRYPTO_KEY_B64=<оттуда же>
    ADMIN_EMAIL=admin@cheat.com
    ADMIN_PASSWORD=123098
    APP_ID=cheat-ios-01

ШАГ 5. Панель: слева Storage > New bucket > имя panel, Public=ON >
  Upload: файлы из zcode/supabase/static/ (index.html, app.js, styles.css).
  ПЕРЕД загрузкой в index.html замени CHANGE_ME на свой project ref.
  Адрес панели: https://<ref>.supabase.co/storage/v1/object/public/panel/index.html
  Роуты через #: .../index.html#/create-key (закладки работают сразу).
  Вход: admin@cheat.com / 123098. Сразу смени пароль:
  PATCH /v1/sellers/admin%40cheat.com {"password":"НОВЫЙ"}.

ШАГ 6. Проверка: открой
  https://<ref>.supabase.co/functions/v1/api/v1/health
  должно быть {"ok":true,...}.

ШАГ 7. Чит и keytest.exe: API_BASE=https://<ref>.supabase.co/functions/v1/api
  (в keytest.exe вставь в поле API Base).

ЛИМИТЫ free: 500K вызовов функций/мес, 500МБ базы — для небольшой
базы ключей за глаза. Проект без активности уходит в сон через неделю
и просыпается сам при первом запросе (~10 сек).
Шифрование/stealth-бан/лимиты — как в zcode/INTEGRATION.txt.

ШАГ 3б (только если правил код функции):
  cd zcode/supabase/functions/api
  npx -y esbuild index.ts --bundle --format=esm --platform=browser --outfile=../dist/bundle.js --minify
  Готовый bundle.js уже лежит в functions/dist/ — просто вставляй его.
================================================================

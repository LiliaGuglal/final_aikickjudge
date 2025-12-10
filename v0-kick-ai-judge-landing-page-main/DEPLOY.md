# Інструкції для деплою

## Виправлені проблеми

1. **Оновлено Tailwind CSS з v4 до v3** - v4 ще в beta і викликає проблеми збірки
2. **Додано залежність `sharp`** - необхідна для оптимізації зображень в Next.js
3. **Виправлено PostCSS конфігурацію** - оновлено для сумісності з Tailwind v3
4. **Оновлено CSS змінні** - замінено OKLCH на HSL для кращої сумісності
5. **Видалено дублікат стилів** - видалено конфліктуючий файл `styles/globals.css`
6. **Оновлено ESLint до v9** - сучасна конфігурація для Next.js
7. **Виправлено Vercel runtime помилку** - видалено некоректну конфігурацію
8. **Додано Node.js версію** - встановлено правильну версію для Vercel
9. **Оновлено Next.js до v16.0.8** - виправлено вразливість CVE-2025-66478
10. **Налаштовано webpack замість Turbopack** - для сумісності з chromadb

## Кроки для деплою

1. Видаліть `node_modules` та lock файли:
   ```bash
   pnpm run clean
   rm -rf node_modules pnpm-lock.yaml
   ```

2. Встановіть залежності:
   ```bash
   pnpm install
   ```

3. Перевірте збірку локально:
   ```bash
   pnpm run build
   ```

4. Налаштуйте environment variables на Vercel:
   - Перейдіть до Settings > Environment Variables у вашому Vercel проекті
   - Додайте змінні з файлу `.env.example`:
     - `GEMINI_API_KEY` - ваш API ключ від Google Gemini
     - `CHROMA_URL` - встановіть `:memory:`
     - `VECTOR_SIMILARITY_THRESHOLD` - встановіть `0.3`
     - `VECTOR_SEARCH_ENABLED` - встановіть `true`

5. Якщо збірка успішна, задеплойте на Vercel:
   - Commit та push зміни
   - Vercel автоматично перебудує проект

## Змінені файли

- `package.json` - оновлено Next.js до v16.0.8, ESLint до v9, додано engines
- `tailwind.config.js` - створено конфігурацію для v3
- `postcss.config.mjs` - оновлено для Tailwind v3
- `app/globals.css` - виправлено CSS змінні та директиви
- `eslint.config.mjs` - нова конфігурація ESLint v9 для Next.js
- `.nvmrc` - встановлено Node.js версію 18
- `.npmrc` - додано налаштування npm
- `next.config.mjs` - налаштовано webpack для сумісності з chromadb
- `.env.example` - шаблон environment variables
- Видалено `vercel.json` - Next.js автоматично розпізнається Vercel
- Видалено `styles/globals.css` - дублікат файлу стилів
- Видалено `.eslintrc.json` - замінено на нову конфігурацію
# Vector Search System for KickAI

Система векторного пошуку для покращення відповідей KickAI чат-бота через семантичний пошук WAKO правил та прецедентів.

## Швидкий старт

### Режим розробки (In-Memory)
За замовчуванням використовується in-memory режим - не потребує Docker:
```bash
pnpm dev
```

### Продакшн режим (Docker)
Для продакшн використання з Docker:

1. **Запуск векторної бази даних**
```bash
pnpm vector:start
```

2. **Перевірка статусу**
```bash
pnpm vector:logs
```

3. **Зупинка**
```bash
pnpm vector:stop
```

4. **Оновити .env.local**
```env
CHROMA_URL=http://localhost:8000
```

## Архітектура

- **EmbeddingService** - Перетворення тексту в вектори
- **VectorSearchService** - Семантичний пошук та індексування
- **ChromaDB** - Векторна база даних
- **Integration Layer** - Інтеграція з існуючим чат API

## Конфігурація

Налаштування через змінні середовища:

```env
CHROMA_URL=http://localhost:8000
VECTOR_SIMILARITY_THRESHOLD=0.3
```

## Використання

Система автоматично інтегрується в існуючий чат API для покращення контексту відповідей.

## Розробка

- Тести: `pnpm test`
- Лінтинг: `pnpm lint`
- Типи: TypeScript з повною типізацією

## Встановлення залежностей

```bash
pnpm install
```
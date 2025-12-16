# Используйте многостадийную сборку
FROM node:20-alpine AS builder

# Установка рабочих зависимостей
WORKDIR /app

# Копирование файлов package
COPY package*.json ./

# Используем npm ci
RUN npm ci && npm cache clean --force

# Копирование исходного кода
COPY . .

# Генерируем Prisma клиент перед сборкой, чтобы .next содержит готовый файл
RUN npm run db:generate

# Сборка приложения
RUN npm run build

# Этап 2: Production runtime
FROM node:20-alpine AS runner

# Создание пользователя без прав для безопасности
RUN addgroup nodegroup && adduser -D -G nodegroup -s /bin/sh nodeuser

# Установка рабочих зависимостей только для runtime
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.next/standalone ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/package*.json ./

# Настройка рабочего каталога
WORKDIR /app

# Установка curl для healthcheck (выполняем как root до переключения на nodeuser)
RUN apk update && apk add --no-cache curl

# Переключение на пользователя nodeuser
USER nodeuser

# Оптимизация для production
ENV NODE_ENV=production
ENV NODE_OPTIONS="--max-old-space-size=4096"

# Открываем порт
EXPOSE 3000

# Запуск приложения
CMD ["node", ".next/standalone/server.js"]

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/api/health || exit 1

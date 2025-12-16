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

# Устанавливаем рабочий каталог до копирования файлов, чтобы всё шло в /app
WORKDIR /app

# Установка рабочих зависимостей только для runtime
COPY --from=builder /app/node_modules ./node_modules
RUN mkdir -p .next/standalone
COPY --from=builder /app/.next/standalone ./.next/standalone
COPY --from=builder /app/public ./public
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/prisma ./prisma
COPY docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

# Установка curl и su-exec для healthcheck/entrypoint (выполняем как root)
RUN apk update && apk add --no-cache curl su-exec

# Оптимизация для production
ENV NODE_ENV=production
ENV NODE_OPTIONS="--max-old-space-size=4096"

# Открываем порт
EXPOSE 3000

# Запуск приложения
ENTRYPOINT ["/usr/local/bin/docker-entrypoint.sh"]
CMD ["node", ".next/standalone/server.js"]

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/api/health || exit 1

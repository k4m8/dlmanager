# Используйте многостадийную сборку
FROM node:20-alpine AS builder

# Установка рабочих зависимостей
WORKDIR /app

# Копирование файлов package
COPY package*.json ./

# Установка зависимостей
RUN npm ci --only=production && npm cache clean --force

# Копирование исходного кода
COPY . .

# Сборка приложения
RUN npm run build

# Этап 2: Production runtime
FROM node:20-alpine AS runner

# Создание пользователя без прав для безопасности
RUN addgroup -g nodegroup && adduser -g -G nodegroup -s /bin/sh -c "nodeuser"

# Установка рабочих зависимостей только для runtime
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.next/standalone ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/package*.json ./

# Настройка рабочего каталога
WORKDIR /app

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
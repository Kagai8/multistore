# syntax=docker/dockerfile:1
#
# Multi-stage build for the Multi-Store app.
#
#   stage "build"   : PHP 8.4 + Node 26 -> composer deps, npm deps, compiled assets
#   stage "runtime" : PHP 8.4 + Apache   -> lean image, no Node, no dev deps, no .env
#
# PHP 8.4 and Node 26 match the developer machine, so what you test locally is what
# ships. Nothing secret is baked in: every APP_*/DB_* value arrives at runtime via
# environment variables (see docker-compose.yml for the local set).

# ----------------------------------------------------------------- build stage
FROM php:8.4-cli AS build

RUN apt-get update && apt-get install -y --no-install-recommends \
        git unzip ca-certificates \
        libpq-dev libonig-dev libzip-dev \
        libpng-dev libjpeg62-turbo-dev libfreetype6-dev \
    && docker-php-ext-configure gd --with-freetype --with-jpeg \
    && docker-php-ext-install -j"$(nproc)" pdo_pgsql mbstring exif pcntl bcmath gd zip \
    && rm -rf /var/lib/apt/lists/*

# Node 26 copied out of the official glibc image, so the version matches the host.
# (An Alpine source would be musl-linked and would not run on Debian.)
COPY --from=node:26-bookworm-slim /usr/local/bin/node /usr/local/bin/node
COPY --from=node:26-bookworm-slim /usr/local/lib/node_modules /usr/local/lib/node_modules
RUN ln -sf ../lib/node_modules/npm/bin/npm-cli.js /usr/local/bin/npm \
    && ln -sf ../lib/node_modules/npm/bin/npx-cli.js /usr/local/bin/npx \
    && node -v && npm -v

COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

WORKDIR /app

# Manifests first, so dependency layers stay cached when only app code changes.
COPY composer.json composer.lock ./
RUN composer install --no-dev --no-autoloader --no-scripts --no-interaction --prefer-dist

COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund

# Application source. .dockerignore keeps .env, node_modules, vendor, tests and
# prebuilt assets out of the context.
COPY . .

# vite.config.ts calls the wayfinder plugin, which shells out to
# `php artisan wayfinder:generate` — that is why the asset build lives in this
# stage instead of a Node-only one.
#
# A throwaway APP_KEY lets those artisan-backed steps boot. .dockerignore keeps
# the real .env out of the context, and the dummy is deleted below, so neither a
# secret nor an environment file reaches the runtime image.
RUN printf 'APP_ENV=production\nAPP_KEY=base64:%s\n' "$(head -c 32 /dev/urandom | base64 -w0)" > .env \
    && composer dump-autoload --optimize --no-dev --no-interaction \
    && npm run build \
    && rm -rf node_modules .env public/hot

# --------------------------------------------------------------- runtime stage
FROM php:8.4-apache

RUN apt-get update && apt-get install -y --no-install-recommends \
        libpq-dev libonig-dev libzip-dev \
        libpng-dev libjpeg62-turbo-dev libfreetype6-dev \
        unzip curl \
    && docker-php-ext-configure gd --with-freetype --with-jpeg \
    && docker-php-ext-install -j"$(nproc)" pdo_pgsql mbstring exif pcntl bcmath gd zip opcache \
    && a2enmod rewrite headers \
    && rm -rf /var/lib/apt/lists/*

# PHP limits sized for XLSX/CSV imports and Excel/PDF exports.
COPY docker/php.ini /usr/local/etc/php/conf.d/zz-app.ini

COPY 000-default.conf /etc/apache2/sites-available/000-default.conf
COPY docker/entrypoint.sh /usr/local/bin/entrypoint
RUN chmod +x /usr/local/bin/entrypoint

COPY --from=build /app /var/www/html

RUN mkdir -p \
        /var/www/html/storage/app/public \
        /var/www/html/storage/app/private \
        /var/www/html/storage/framework/cache/data \
        /var/www/html/storage/framework/sessions \
        /var/www/html/storage/framework/views \
        /var/www/html/storage/logs \
        /var/www/html/bootstrap/cache \
    && chown -R www-data:www-data /var/www/html/storage /var/www/html/bootstrap/cache

WORKDIR /var/www/html

# Apache listens on 80 by default; the entrypoint rewrites it to $PORT when one
# is supplied (Render and most PaaS platforms inject PORT).
EXPOSE 80 8080

HEALTHCHECK --interval=30s --timeout=5s --start-period=60s --retries=5 \
    CMD curl -fsS "http://127.0.0.1:${PORT:-80}/up" || exit 1

ENTRYPOINT ["/usr/local/bin/entrypoint"]
CMD ["apache2-foreground"]

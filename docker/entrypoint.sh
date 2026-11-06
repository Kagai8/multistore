#!/bin/sh
#
# Container entrypoint.
#
# Boot sequence: validate config -> honour $PORT -> link storage -> wait for the
# database -> migrate -> (optional) seed -> warm caches -> hand over to Apache.
#
# Deliberately POSIX sh: Debian's /bin/sh is dash, which has no brace expansion
# and no `[[ ]]`.

set -e

# ---------------------------------------------------------------- guard rails
if [ "$APP_ENV" = "production" ] && [ -z "$APP_KEY" ]; then
    echo "[entrypoint] APP_KEY is empty. Refusing to start in production." >&2
    exit 1
fi

# ------------------------------------------------------------- dynamic port
# Render/Heroku inject $PORT. Locally we keep Apache's default of 80.
if [ -n "$PORT" ] && [ "$PORT" != "80" ]; then
    echo "[entrypoint] Apache will listen on port ${PORT}."
    sed -ri "s/^Listen 80$/Listen ${PORT}/" /etc/apache2/ports.conf
    sed -ri "s/:80>/:${PORT}>/" /etc/apache2/sites-available/000-default.conf
fi

# ------------------------------------------------------------------ storage
# Dev mode mounts storage as an empty volume, so the skeleton must exist before
# Laravel writes to it. Harmless in production, where the image already has them.
mkdir -p storage/app/public storage/app/private storage/framework/cache/data \
         storage/framework/sessions storage/framework/views storage/logs \
         bootstrap/cache 2>/dev/null || true

# Products, brands, categories and company logos are stored on the "public"
# disk, so the symlink must exist before the first request.
#
# Dev mode mounts public/ from the host, so an absolute /var/www/html path would
# be dangling on the Mac. A relative link is valid in both places.
if [ "$SKIP_CACHE" = "true" ]; then
    php artisan storage:link --relative --force >/dev/null 2>&1 || true
else
    php artisan storage:link --force >/dev/null 2>&1 || true
fi

# --------------------------------------------------------- wait for database
if [ "${DB_CONNECTION:-pgsql}" != "sqlite" ]; then
    echo "[entrypoint] Waiting for the database at ${DB_HOST}:${DB_PORT}..."
    attempt=0
    until php -r "try { new PDO('pgsql:host='.getenv('DB_HOST').';port='.getenv('DB_PORT').';dbname='.getenv('DB_DATABASE'), (getenv('DB_USERNAME') ?: null), (getenv('DB_PASSWORD') ?: null)); exit(0); } catch (Throwable \$e) { exit(1); }" 2>/dev/null; do
        attempt=$((attempt + 1))
        if [ "$attempt" -ge 30 ]; then
            echo "[entrypoint] Database unreachable after 60s. Giving up." >&2
            exit 1
        fi
        sleep 2
    done
    echo "[entrypoint] Database is up."
fi

# ------------------------------------------------------------------- migrate
php artisan migrate --force

# Seeding is opt-in. Running it on every boot duplicates data and is wrong for
# a live deployment; set RUN_SEEDERS=true only on a throwaway local stack.
if [ "$RUN_SEEDERS" = "true" ]; then
    echo "[entrypoint] RUN_SEEDERS=true -> seeding."
    php artisan db:seed --force
fi

# ------------------------------------------------------------- warm caches
# Cached here rather than at build time so container env vars are honoured.
# route:cache is intentionally omitted: routes/web.php, routes/api.php and
# routes/settings.php each define a closure route, and route caching would fail.
if [ "$SKIP_CACHE" = "true" ]; then
    # Dev overlay (docker-compose.dev.yml): the code is bind-mounted, so cached
    # config/views would go stale the moment a file is saved.
    echo "[entrypoint] SKIP_CACHE=true -> clearing caches instead of caching."
    php artisan config:clear >/dev/null
    php artisan event:clear >/dev/null 2>&1 || true
    php artisan view:clear >/dev/null
else
    php artisan config:cache
    php artisan event:cache
    php artisan view:cache
fi

# Files created above are root-owned; hand storage back to Apache.
chown -R www-data:www-data storage bootstrap/cache 2>/dev/null || true

echo "[entrypoint] Ready. Starting: $*"
exec "$@"

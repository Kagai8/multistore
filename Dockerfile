# 1. Start with PHP 8.3 and Apache
FROM php:8.3-apache

# 2. Install Linux Libraries
RUN apt-get update && apt-get install -y \
    libpng-dev \
    libonig-dev \
    libxml2-dev \
    libzip-dev \
    zip \
    unzip \
    git \
    curl \
    libpq-dev \
    && docker-php-ext-install pdo_pgsql mbstring exif pcntl bcmath gd zip

# 3. Install Node.js 20
RUN curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get install -y nodejs

# 4. Install Composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

# 5. Set working folder
WORKDIR /var/www/html

# 6. Copy project files
COPY . .

# 7. Install PHP Dependencies
RUN composer install --no-dev --optimize-autoloader --no-interaction

# 8. Install Node Dependencies & Build
RUN npm install
RUN npm run build

# 9. Fix Permissions
RUN chown -R www-data:www-data /var/www/html/storage /var/www/html/bootstrap/cache

# 🟢 FIX: Copy our custom Apache config (Replacing the broken default)
COPY 000-default.conf /etc/apache2/sites-available/000-default.conf

# 10. Handle Render's Dynamic Port
# Render gives us a random port. We must update our config to listen on it.
RUN sed -i 's/80/${PORT}/g' /etc/apache2/ports.conf /etc/apache2/sites-available/000-default.conf

# 11. Enable Rewrite Module (Required for Laravel)
RUN a2enmod rewrite

# 12. Startup Command (Migrate -> Seed -> Start)
CMD ["bash", "-c", "php artisan migrate --force && (php artisan db:seed --force || true) && apache2-foreground"]

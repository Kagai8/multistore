# 1. Start with PHP 8.3 and Apache
FROM php:8.3-apache

# 2. Install Linux Libraries (Postgres, Zip, Git, etc.)
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

# 10. Configure Apache Root
ENV APACHE_DOCUMENT_ROOT /var/www/html/public
RUN sed -ri -e 's!/var/www/html!${APACHE_DOCUMENT_ROOT}!g' /etc/apache2/sites-available/*.conf
RUN sed -ri -e 's!/var/www/!${APACHE_DOCUMENT_ROOT}!g' /etc/apache2/apache2.conf

# 🟢 FIX 1: Enable .htaccess (Critical for Laravel Routing)
RUN sed -i '/<Directory \/var\/www\/>/,/<\/Directory>/ s/AllowOverride None/AllowOverride All/' /etc/apache2/apache2.conf

# 11. Handle Render's Port
RUN sed -i 's/80/${PORT}/g' /etc/apache2/ports.conf /etc/apache2/sites-available/*.conf

# 12. Enable Rewrite Module
RUN a2enmod rewrite

# 🟢 FIX 2: Auto-run Migrations & Seeds on Startup
CMD ["bash", "-c", "php artisan migrate --force && (php artisan db:seed --force || true) && apache2-foreground"]

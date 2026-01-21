# 1. Use PHP 8.3 with Apache
FROM php:8.3-apache

# 2. Install Linux Libraries (Postgres, Zip, etc.)
RUN apt-get update && apt-get install -y \
    libpng-dev \
    libonig-dev \
    libxml2-dev \
    zip \
    unzip \
    git \
    curl \
    libpq-dev \
    && docker-php-ext-install pdo_pgsql mbstring exif pcntl bcmath gd

# 3. Install Node.js 20 (Crucial for Vite)
RUN curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get install -y nodejs

# 4. Get Composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

# 5. Set Working Directory
WORKDIR /var/www/html

# 6. Copy Project Files
COPY . .

# 7. Install Dependencies
# PHP
RUN composer install --no-dev --optimize-autoloader --no-interaction
# Node
RUN npm install
RUN npm run build

# 8. Set Permissions (Laravel needs this)
RUN chown -R www-data:www-data /var/www/html/storage /var/www/html/bootstrap/cache

# 9. Configure Apache to point to /public
ENV APACHE_DOCUMENT_ROOT /var/www/html/public
RUN sed -ri -e 's!/var/www/html!${APACHE_DOCUMENT_ROOT}!g' /etc/apache2/sites-available/*.conf
RUN sed -ri -e 's!/var/www/!${APACHE_DOCUMENT_ROOT}!g' /etc/apache2/apache2.conf

# 10. Handle Render's Dynamic Port
# Render assigns a random port. We update Apache ports.conf to listen on it.
RUN sed -i 's/80/${PORT}/g' /etc/apache2/ports.conf /etc/apache2/sites-available/*.conf

# 11. Start Apache
CMD ["apache2-foreground"]

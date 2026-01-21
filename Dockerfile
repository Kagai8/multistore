# 1. Start with PHP 8.3 and Apache
FROM php:8.3-apache

# 2. Install Linux Libraries (Postgres, Zip, Git, etc.)
# 🟢 FIX: Added 'libzip-dev' so PHP can compile the zip extension
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

# 3. Install Node.js 20 (Required for your React Frontend)
RUN curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get install -y nodejs

# 4. Install Composer (The PHP package manager)
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

# 5. Set the working folder
WORKDIR /var/www/html

# 6. Copy your project files into the server
COPY . .

# 7. Install PHP Dependencies
RUN composer install --no-dev --optimize-autoloader --no-interaction

# 8. Install Node Dependencies & Build the Frontend
RUN npm install
RUN npm run build

# 9. Fix Permissions (Make sure Apache can read the files)
RUN chown -R www-data:www-data /var/www/html/storage /var/www/html/bootstrap/cache

# 10. Configure Apache to look at the 'public' folder
ENV APACHE_DOCUMENT_ROOT /var/www/html/public
RUN sed -ri -e 's!/var/www/html!${APACHE_DOCUMENT_ROOT}!g' /etc/apache2/sites-available/*.conf
RUN sed -ri -e 's!/var/www/!${APACHE_DOCUMENT_ROOT}!g' /etc/apache2/apache2.conf

# 11. Handle Render's Port (Render assigns a random port, we must listen to it)
RUN sed -i 's/80/${PORT}/g' /etc/apache2/ports.conf /etc/apache2/sites-available/*.conf

# 12. Turn on the Rewrite Module (Important for Laravel URLs)
RUN a2enmod rewrite

# 13. Start the Server
CMD ["apache2-foreground"]

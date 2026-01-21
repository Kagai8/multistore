#!/bin/bash

# Exit immediately if a command fails
set -e

echo "--- 🛠️  STARTING DEPLOYMENT ---"

# 1. Install PHP Dependencies (Composer)
echo "📦 Installing PHP dependencies..."
composer install --no-dev --optimize-autoloader --no-interaction

# 2. Install Node Dependencies & Build Assets (Vite)
echo "📦 Installing Node dependencies..."
npm install

echo "🎨 Building Frontend Assets..."
npm run build

# 3. Clear Caches (Vital for production)
echo "🧹 Clearing & Caching Configs..."
php artisan config:cache
php artisan event:cache
php artisan route:cache
php artisan view:cache

# 4. Run Database Migrations
echo "🗄️  Running Database Migrations..."
php artisan migrate --force

echo "✅ DEPLOYMENT SUCCESS!"

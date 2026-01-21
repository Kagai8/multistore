#!/bin/bash

# Exit immediately if a command fails
set -e

echo "--- 🛠️  STARTING DEPLOYMENT ---"

# -----------------------------------------------------------
# 1. Download & Install PHP Dependencies
# -----------------------------------------------------------
echo "📥 Downloading Composer..."
curl -sS https://getcomposer.org/installer | php

echo "📦 Installing PHP dependencies..."
# We use 'php composer.phar' because we just downloaded it
php composer.phar install --no-dev --optimize-autoloader --no-interaction

# -----------------------------------------------------------
# 2. Install Node Dependencies & Build Assets (Vite)
# -----------------------------------------------------------
echo "📦 Installing Node dependencies..."
npm install

echo "🎨 Building Frontend Assets..."
npm run build

# -----------------------------------------------------------
# 3. Clear Caches & Migrate
# -----------------------------------------------------------
echo "🧹 Clearing & Caching Configs..."
php artisan config:cache
php artisan event:cache
php artisan route:cache
php artisan view:cache

echo "🗄️  Running Database Migrations..."
php artisan migrate --force

echo "✅ DEPLOYMENT SUCCESS!"

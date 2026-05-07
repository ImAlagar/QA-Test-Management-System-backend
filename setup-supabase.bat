@echo off
title QA Test Management - Supabase Setup
color 0A

echo ========================================
echo QA Test Management System - Supabase Setup
echo ========================================
echo.

echo Step 1: Installing dependencies...
call npm install
echo.

echo Step 2: Generating Prisma client...
call npx prisma generate
echo.

echo Step 3: Pushing schema to Supabase...
call npx prisma db push
echo.

echo Step 4: Setting up database with seed data...
node setup-supabase.js
echo.

echo Step 5: Starting the server...
echo.
echo Server will start at http://localhost:5000
echo Press Ctrl+C to stop the server
echo.

npm run dev
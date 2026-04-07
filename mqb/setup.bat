@echo off
REM MQB - Installation et Démarrage (Windows)

echo 🚀 MQB - Setup and Launch
echo =========================

REM Check if package.json exists
if not exist "package.json" (
    echo ❌ Package.json not found. Make sure you're in the mqb directory.
    exit /b 1
)

echo 📦 Installing dependencies...
call npm install

if errorlevel 1 (
    echo ❌ Failed to install dependencies
    exit /b 1
)

echo 🗄️ Creating database...
call npm run db:push

if errorlevel 1 (
    echo ❌ Failed to create database
    exit /b 1
)

echo 🌱 Seeding database with demo data...
call npm run seed

if errorlevel 1 (
    echo ❌ Failed to seed database
    exit /b 1
)

echo.
echo ✅ Setup complete!
echo.
echo 📝 Next steps:
echo 1. Create .env.local with:
echo    - DATABASE_URL=file:./database.db
echo    - EMAIL_USER=suzinabot@gmail.com
echo    - EMAIL_PASS=^<your_gmail_app_password^>
echo    - JWT_SECRET=your_secret_key_here
echo.
echo 2. Start development server:
echo    npm run dev
echo.
echo 3. Open http://localhost:3000
echo.
echo 🔐 Test Credentials:
echo    Admin: admin@mqb.local / MQB@2024!
echo    Student: etudiant1@mqb.local / MQB@2024!
echo    Teacher: prof.martin@mqb.local / MQB@2024!
echo.
echo Good luck! 🎓

pause

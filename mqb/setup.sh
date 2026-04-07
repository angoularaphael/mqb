#!/bin/bash

# MQB - Installation et Démarrage

echo "🚀 MQB - Setup and Launch"
echo "========================="

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Package.json not found. Make sure you're in the mqb directory."
    exit 1
fi

echo "📦 Installing dependencies..."
npm install

echo "🗄️ Creating database..."
npm run db:push

echo "🌱 Seeding database with demo data..."
npm run seed

echo ""
echo "✅ Setup complete!"
echo ""
echo "📝 Next steps:"
echo "1. Create .env.local with:"
echo "   - DATABASE_URL=file:./database.db"
echo "   - EMAIL_USER=suzinabot@gmail.com"
echo "   - EMAIL_PASS=<your_gmail_app_password>"
echo "   - JWT_SECRET=your_secret_key_here"
echo ""
echo "2. Start development server:"
echo "   npm run dev"
echo ""
echo "3. Open http://localhost:3000"
echo ""
echo "🔐 Test Credentials:"
echo "   Admin: admin@mqb.local / MQB@2024!"
echo "   Student: etudiant1@mqb.local / MQB@2024!"
echo "   Teacher: prof.martin@mqb.local / MQB@2024!"
echo ""
echo "Good luck! 🎓"

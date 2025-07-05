#!/bin/bash
# scripts/reset-and-seed.sh - VERSION CORRIGÉE

echo "🔄 Resetting database and seeding with test data..."

# 1. Reset la base de données
echo "1. Resetting database..."
npx prisma migrate reset --force

# 2. Generate le client Prisma
echo "2. Generating Prisma client..."
npx prisma generate

# 3. Push le schema
echo "3. Pushing schema..."
npx prisma db push

# 4. Seed avec les données de test
echo "4. Seeding with test data..."
npx ts-node prisma/seed-with-test-data.ts

echo "✅ Database ready for testing!"
echo ""
echo "🌐 You can now:"
echo "   - Start the server: npm run start:dev"
echo "   - Open Prisma Studio: npx prisma studio"
echo "   - Test with the endpoints below"
echo ""
echo "🔐 Test users:"
echo "   marie.tremblay@email.com / password123"
echo "   jean.lapointe@email.com / password123"
echo "   admin@grandogo.com / password123"
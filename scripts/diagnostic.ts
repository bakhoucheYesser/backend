// scripts/diagnostic.ts - Script pour diagnostiquer les problèmes
import { PrismaClient } from '@prisma/client';

async function diagnostic() {
  console.log('🔍 Starting diagnostic...\n');

  const prisma = new PrismaClient();

  try {
    // 1. Test connexion à la base
    console.log('1. Testing database connection...');
    await prisma.$connect();
    console.log('✅ Database connection: OK\n');

    // 2. Vérifier les modèles Prisma disponibles
    console.log('2. Checking Prisma models...');
    const prismaModels = Object.keys(prisma).filter(key =>
      !key.startsWith('$') && !key.startsWith('_')
    );
    console.log('Available models:', prismaModels);

    // Vérifier les modèles requis
    const requiredModels = ['user', 'vehicleType', 'estimate', 'pricingRule'];
    const missingModels = requiredModels.filter(
      (model) => !prismaModels.includes(model),
    );

    if (missingModels.length > 0) {
      console.log('❌ Missing models:', missingModels);
      console.log('   → Run: npx prisma generate && npx prisma db push\n');
    } else {
      console.log('✅ All required models: OK\n');
    }

    // 3. Test des tables
    console.log('3. Testing table access...');

    try {
      const vehicleCount = await prisma.vehicleType.count();
      console.log(`✅ VehicleType table: ${vehicleCount} records`);
    } catch (error) {
      console.log('❌ VehicleType table: Error -', error.message);
    }

    try {
      const estimateCount = await prisma.estimate.count();
      console.log(`✅ Estimate table: ${estimateCount} records`);
    } catch (error) {
      console.log('❌ Estimate table: Error -', error.message);
    }

    try {
      const ruleCount = await prisma.pricingRule.count();
      console.log(`✅ PricingRule table: ${ruleCount} records\n`);
    } catch (error) {
      console.log('❌ PricingRule table: Error -', error.message, '\n');
    }

    // 4. Test création d'un véhicule
    console.log('4. Testing vehicle creation...');
    try {
      const testVehicle = await prisma.vehicleType.upsert({
        where: { id: 'test-diagnostic' },
        update: {},
        create: {
          id: 'test-diagnostic',
          name: 'test',
          displayName: 'Test Vehicle',
          description: 'Diagnostic test vehicle',
          basePrice: 25.00,
          perMinute: 1.00,
          perKm: 1.50,
          maxWeight: 100,
          dimensions: '1ft x 1ft x 1ft',
          isActive: false, // Pas actif pour ne pas polluer
        },
      });

      // Supprimer le véhicule de test
      await prisma.vehicleType.delete({
        where: { id: 'test-diagnostic' }
      });

      console.log('✅ Vehicle CRUD operations: OK\n');
    } catch (error) {
      console.log('❌ Vehicle CRUD operations: Error -', error.message, '\n');
    }

    console.log('🎉 Diagnostic completed!');

  } catch (error) {
    console.error('❌ Diagnostic failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Exécuter le diagnostic si c'est le script principal
if (require.main === module) {
  diagnostic();
}

export default diagnostic;

// Package.json - Ajouter ce script
/*
{
  "scripts": {
    "diagnostic": "ts-node scripts/diagnostic.ts"
  }
}
*/

// Commandes à exécuter en séquence:
/*
1. npm run diagnostic          # Voir les problèmes
2. npx prisma generate         # Régénérer le client
3. npx prisma db push          # Appliquer le schéma
4. npm run diagnostic          # Revérifier
5. npm run db:seed             # Peupler les données
6. npm run start:dev           # Démarrer le serveur
7. curl http://localhost:3000/api/estimate/vehicles  # Tester
*/

// prisma/seed.ts - VERSION CORRIGÉE
import { PrismaClient, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding vehicle types...');

  // Créer les types de véhicules avec les bons types Decimal
  const vehicles = [
    {
      id: 'pickup',
      name: 'pickup',
      displayName: 'Pickup',
      description: 'Perfect for smaller items',
      basePrice: new Prisma.Decimal(40.00),
      perMinute: new Prisma.Decimal(1.50),
      perKm: new Prisma.Decimal(2.00),
      maxWeight: 500,
      dimensions: '6ft x 4ft x 2ft',
      imageUrl: '/images/illustrations/pickup_truck.svg',
    },
    {
      id: 'van',
      name: 'van',
      displayName: 'Van',
      description: 'Good for medium loads',
      basePrice: new Prisma.Decimal(50.00),
      perMinute: new Prisma.Decimal(1.75),
      perKm: new Prisma.Decimal(2.25),
      maxWeight: 1000,
      dimensions: '8ft x 5ft x 4ft',
      imageUrl: '/images/illustrations/van_truck.svg',
    },
    {
      id: 'xl',
      name: 'xl',
      displayName: 'XL Truck',
      description: 'Ideal for larger items',
      basePrice: new Prisma.Decimal(65.00),
      perMinute: new Prisma.Decimal(2.00),
      perKm: new Prisma.Decimal(2.50),
      maxWeight: 2000,
      dimensions: '10ft x 6ft x 3ft',
      imageUrl: '/images/illustrations/xl_truck.svg',
    },
    {
      id: 'box',
      name: 'box',
      displayName: 'Box Truck',
      description: 'For full moves',
      basePrice: new Prisma.Decimal(85.00),
      perMinute: new Prisma.Decimal(2.50),
      perKm: new Prisma.Decimal(3.00),
      maxWeight: 4000,
      dimensions: '12ft x 7ft x 6ft',
      imageUrl: '/images/illustrations/box_truck.svg',
    },
  ];

  for (const vehicle of vehicles) {
    try {
      const result = await prisma.vehicleType.upsert({
        where: { id: vehicle.id },
        update: vehicle,
        create: vehicle,
      });
      console.log(`✅ Created/Updated vehicle: ${result.displayName}`);
    } catch (error) {
      console.error(`❌ Failed to create vehicle ${vehicle.id}:`, error);
    }
  }

  // Optionnel: Créer quelques règles de pricing par défaut
  console.log('🌱 Seeding pricing rules...');

  const pricingRules = [
    {
      id: 'weekend_surge',
      name: 'Weekend Surge Pricing',
      type: 'SURGE',
      conditions: {
        days: ['Saturday', 'Sunday'],
        hours: { start: 8, end: 18 }
      },
      adjustment: new Prisma.Decimal(15.0), // 15% augmentation
      isActive: false, // Désactivé pour MVP
      validFrom: new Date('2024-01-01'),
      validTo: new Date('2025-12-31'),
    },
    {
      id: 'distance_discount',
      name: 'Long Distance Discount',
      type: 'DISCOUNT',
      conditions: {
        minDistance: 50000 // 50km+
      },
      adjustment: new Prisma.Decimal(-10.0), // 10% réduction
      isActive: false, // Désactivé pour MVP
      validFrom: new Date('2024-01-01'),
    }
  ];

  for (const rule of pricingRules) {
    try {
      const result = await prisma.pricingRule.upsert({
        where: { id: rule.id },
        update: rule,
        create: rule,
      });
      console.log(`✅ Created/Updated pricing rule: ${result.name}`);
    } catch (error) {
      console.error(`❌ Failed to create pricing rule ${rule.id}:`, error);
    }
  }

  console.log('✅ Seeding completed successfully!');

  // Vérifier les données créées
  const vehicleCount = await prisma.vehicleType.count();
  const ruleCount = await prisma.pricingRule.count();

  console.log(`📊 Database summary:`);
  console.log(`   - Vehicle types: ${vehicleCount}`);
  console.log(`   - Pricing rules: ${ruleCount}`);
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

// package.json - Scripts à ajouter/vérifier
/*
{
  "scripts": {
    "db:seed": "ts-node prisma/seed.ts",
    "db:reset": "npx prisma migrate reset --force",
    "db:push": "npx prisma db push",
    "db:studio": "npx prisma studio"
  },
  "devDependencies": {
    "ts-node": "^10.9.1"
  }
}
*/
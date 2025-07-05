// prisma/seed-with-uuids.ts - Version avec UUIDs corrects
import {
  PrismaClient,
  Prisma,
  EstimateStatus,
  BookingStatus,
  PaymentStatus,
} from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting comprehensive seeding with proper UUIDs...');

  // 1. Créer les types de véhicules (garder les IDs personnalisés pour les véhicules)
  console.log('🚛 Seeding vehicle types...');
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
    await prisma.vehicleType.upsert({
      where: { id: vehicle.id },
      update: vehicle,
      create: vehicle,
    });
  }

  // 2. Créer des utilisateurs de test
  console.log('👥 Seeding test users...');
  const hashedPassword = await bcrypt.hash('password123', 12);

  // Supprimer les anciens utilisateurs avec IDs personnalisés s'ils existent
  await prisma.user.deleteMany({
    where: {
      email: {
        in: [
          'marie.tremblay@email.com',
          'jean.lapointe@email.com',
          'sophie.gagnon@email.com',
          'admin@grandogo.com',
        ],
      }
    }
  });

  const user1 = await prisma.user.create({
    data: {
      email: 'marie.tremblay@email.com',
      nom: 'Tremblay',
      prenom: 'Marie',
      password: hashedPassword,
      role: 'USER',
    },
  });

  const user2 = await prisma.user.create({
    data: {
      email: 'jean.lapointe@email.com',
      nom: 'Lapointe',
      prenom: 'Jean',
      password: hashedPassword,
      role: 'USER',
    },
  });

  const user3 = await prisma.user.create({
    data: {
      email: 'sophie.gagnon@email.com',
      nom: 'Gagnon',
      prenom: 'Sophie',
      password: hashedPassword,
      role: 'USER',
    },
  });

  const admin = await prisma.user.create({
    data: {
      email: 'admin@grandogo.com',
      nom: 'Admin',
      prenom: 'GrandoGo',
      password: hashedPassword,
      role: 'ADMIN',
    },
  });

  console.log('✅ Users created with UUIDs');

  // 3. Créer des estimations de test (laisser Prisma générer les UUIDs)
  console.log('📋 Seeding test estimates...');

  const estimate1 = await prisma.estimate.create({
    data: {
      pickupAddress: '1234 Rue Saint-Denis, Montréal, QC H2X 3K2',
      pickupCoordinates: '45.5088,-73.5878',
      destinationAddress: '5678 Avenue Mont-Royal, Montréal, QC H2T 2T4',
      destinationCoordinates: '45.5276,-73.5956',
      vehicleType: 'van',
      distance: 8500,
      estimatedDuration: 45,
      basePrice: new Prisma.Decimal(50.00),
      laborCost: new Prisma.Decimal(78.75),
      mileageCost: new Prisma.Decimal(19.13),
      bookingFee: new Prisma.Decimal(8.87),
      totalPrice: new Prisma.Decimal(156.75),
      status: EstimateStatus.CALCULATED,
      userId: user1.id,
    },
  });

  const estimate2 = await prisma.estimate.create({
    data: {
      pickupAddress: '789 Boulevard René-Lévesque, Québec, QC G1R 2L3',
      pickupCoordinates: '46.8139,-71.208',
      destinationAddress: '321 Rue de la Couronne, Québec, QC G1K 6E1',
      destinationCoordinates: '46.8053,-71.2092',
      vehicleType: 'pickup',
      distance: 3200,
      estimatedDuration: 25,
      basePrice: new Prisma.Decimal(40.00),
      laborCost: new Prisma.Decimal(37.50),
      mileageCost: new Prisma.Decimal(6.40),
      bookingFee: new Prisma.Decimal(5.03),
      totalPrice: new Prisma.Decimal(88.93),
      status: EstimateStatus.SAVED,
      userId: user2.id,
    },
  });

  const estimate3 = await prisma.estimate.create({
    data: {
      pickupAddress: '456 Rue Sherbrooke Ouest, Montréal, QC H3A 1B4',
      pickupCoordinates: '45.5048,-73.5747',
      destinationAddress: '890 Avenue des Pins, Montréal, QC H2W 1P8',
      destinationCoordinates: '45.5108,-73.5825',
      vehicleType: 'xl',
      distance: 4500,
      estimatedDuration: 35,
      basePrice: new Prisma.Decimal(65.00),
      laborCost: new Prisma.Decimal(70.00),
      mileageCost: new Prisma.Decimal(11.25),
      bookingFee: new Prisma.Decimal(8.78),
      totalPrice: new Prisma.Decimal(155.03),
      status: EstimateStatus.CALCULATED,
      userId: user3.id,
    },
  });

  const estimate4 = await prisma.estimate.create({
    data: {
      pickupAddress: '123 Chemin Sainte-Foy, Québec, QC G1S 2M1',
      pickupCoordinates: '46.7616,-71.2808',
      destinationAddress: '567 Boulevard Charest Est, Québec, QC G1K 3J3',
      destinationCoordinates: '46.8225,-71.2048',
      vehicleType: 'box',
      distance: 15000,
      estimatedDuration: 60,
      basePrice: new Prisma.Decimal(85.00),
      laborCost: new Prisma.Decimal(150.00),
      mileageCost: new Prisma.Decimal(45.00),
      bookingFee: new Prisma.Decimal(16.80),
      totalPrice: new Prisma.Decimal(296.80),
      status: EstimateStatus.BOOKED,
      userId: null,
    },
  });

  console.log('✅ Estimates created with UUIDs:');
  console.log(`   - Estimate 1: ${estimate1.id}`);
  console.log(`   - Estimate 2: ${estimate2.id}`);
  console.log(`   - Estimate 3: ${estimate3.id}`);
  console.log(`   - Estimate 4: ${estimate4.id}`);

  // 4. Créer des réservations de test
  console.log('📅 Seeding test bookings...');
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(10, 0, 0, 0);

  const nextWeek = new Date();
  nextWeek.setDate(nextWeek.getDate() + 7);
  nextWeek.setHours(14, 0, 0, 0);

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  yesterday.setHours(9, 0, 0, 0);

  const booking1 = await prisma.booking.create({
    data: {
      estimateId: estimate1.id,
      userId: user1.id,
      customerName: 'Marie Tremblay',
      customerEmail: 'marie.tremblay@email.com',
      customerPhone: '+1-514-555-0123',
      scheduledAt: tomorrow,
      status: BookingStatus.CONFIRMED,
      paymentStatus: PaymentStatus.AUTHORIZED,
    },
  });

  const booking2 = await prisma.booking.create({
    data: {
      estimateId: estimate2.id,
      userId: user2.id,
      customerName: 'Jean Lapointe',
      customerEmail: 'jean.lapointe@email.com',
      customerPhone: '+1-418-555-0456',
      scheduledAt: nextWeek,
      status: BookingStatus.PENDING,
      paymentStatus: PaymentStatus.PENDING,
    },
  });

  const booking3 = await prisma.booking.create({
    data: {
      estimateId: estimate4.id,
      userId: null,
      customerName: 'Luc Martineau',
      customerEmail: 'luc.martineau@email.com',
      customerPhone: '+1-418-555-0789',
      scheduledAt: yesterday,
      status: BookingStatus.COMPLETED,
      paymentStatus: PaymentStatus.CAPTURED,
    },
  });

  console.log('✅ Bookings created with UUIDs');

  // 5. Créer des fichiers uploadés fictifs
  console.log('📁 Seeding test uploaded files...');
  await prisma.uploadedFile.create({
    data: {
      filename: 'photo-1234567890-chair.jpg',
      originalName: 'old_chair.jpg',
      mimetype: 'image/jpeg',
      size: 2048576,
      path: '/uploads/photos/photo-1234567890-chair.jpg',
      thumbnailPath: '/uploads/thumbnails/photo-1234567890-chair_thumb.jpg',
      category: 'item_photo',
      description: 'Chaise antique à déménager',
      bookingId: booking1.id,
      estimateId: estimate1.id,
      userId: user1.id,
    },
  });

  await prisma.uploadedFile.create({
    data: {
      filename: 'photo-1234567891-sofa.jpg',
      originalName: 'sofa_living_room.jpg',
      mimetype: 'image/jpeg',
      size: 3145728,
      path: '/uploads/photos/photo-1234567891-sofa.jpg',
      thumbnailPath: '/uploads/thumbnails/photo-1234567891-sofa_thumb.jpg',
      category: 'item_photo',
      description: 'Canapé 3 places',
      bookingId: booking1.id,
      estimateId: estimate1.id,
      userId: user1.id,
    },
  });

  console.log('✅ Files created');

  // 6. Créer des règles de prix
  console.log('💰 Seeding pricing rules...');
  await prisma.pricingRule.upsert({
    where: { id: 'weekend_surge' },
    update: {},
    create: {
      id: 'weekend_surge',
      name: 'Weekend Surge Pricing',
      type: 'SURGE',
      conditions: {
        days: ['Saturday', 'Sunday'],
        hours: { start: 8, end: 18 }
      },
      adjustment: new Prisma.Decimal(15.0),
      isActive: false,
      validFrom: new Date('2024-01-01'),
      validTo: new Date('2025-12-31'),
    },
  });

  // 7. Statistiques finales
  const stats = {
    users: await prisma.user.count(),
    vehicles: await prisma.vehicleType.count(),
    estimates: await prisma.estimate.count(),
    bookings: await prisma.booking.count(),
    files: await prisma.uploadedFile.count(),
    rules: await prisma.pricingRule.count(),
  };

  console.log('✅ Seeding completed successfully!');
  console.log('📊 Database summary:');
  console.log(`   - Users: ${stats.users}`);
  console.log(`   - Vehicle types: ${stats.vehicles}`);
  console.log(`   - Estimates: ${stats.estimates}`);
  console.log(`   - Bookings: ${stats.bookings}`);
  console.log(`   - Uploaded files: ${stats.files}`);
  console.log(`   - Pricing rules: ${stats.rules}`);

  console.log('\n🔐 Test user credentials:');
  console.log('   marie.tremblay@email.com / password123');
  console.log('   jean.lapointe@email.com / password123');
  console.log('   sophie.gagnon@email.com / password123');
  console.log('   admin@grandogo.com / password123 (ADMIN)');

  console.log('\n📋 Test estimate IDs (use these for bookings):');
  console.log(`   - Estimate 1 (Marie): ${estimate1.id}`);
  console.log(`   - Estimate 2 (Jean): ${estimate2.id}`);
  console.log(`   - Estimate 3 (Sophie): ${estimate3.id}`);
  console.log(`   - Estimate 4 (Anonymous): ${estimate4.id}`);
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
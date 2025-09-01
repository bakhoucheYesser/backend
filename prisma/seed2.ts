import { PrismaClient, Prisma } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log(
    '🌱 Création de données complètes pour la plateforme multi-fournisseurs...',
  );

  const hashedPassword = await bcrypt.hash('password123', 12);

  // 1. TYPES DE VÉHICULES
  console.log('🚛 Création des types de véhicules...');
  const vehicleTypes = [
    {
      id: 'pickup',
      name: 'pickup',
      displayName: 'Pickup',
      description: 'Parfait pour les petits objets et déménagements légers',
      basePrice: new Prisma.Decimal(40.0),
      perMinute: new Prisma.Decimal(1.5),
      perKm: new Prisma.Decimal(2.0),
      maxWeight: 500,
      dimensions: '6ft x 4ft x 2ft',
      imageUrl: '/images/vehicles/pickup.svg',
    },
    {
      id: 'van',
      name: 'van',
      displayName: 'Fourgonnette',
      description: 'Idéal pour les charges moyennes',
      basePrice: new Prisma.Decimal(50.0),
      perMinute: new Prisma.Decimal(1.75),
      perKm: new Prisma.Decimal(2.25),
      maxWeight: 1000,
      dimensions: '8ft x 5ft x 4ft',
      imageUrl: '/images/vehicles/van.svg',
    },
    {
      id: 'truck_xl',
      name: 'truck_xl',
      displayName: 'Camion XL',
      description: 'Pour les gros objets et déménagements importants',
      basePrice: new Prisma.Decimal(65.0),
      perMinute: new Prisma.Decimal(2.0),
      perKm: new Prisma.Decimal(2.5),
      maxWeight: 2000,
      dimensions: '10ft x 6ft x 3ft',
      imageUrl: '/images/vehicles/truck_xl.svg',
    },
    {
      id: 'box_truck',
      name: 'box_truck',
      displayName: 'Camion-Boîte',
      description: 'Pour les déménagements complets',
      basePrice: new Prisma.Decimal(85.0),
      perMinute: new Prisma.Decimal(2.5),
      perKm: new Prisma.Decimal(3.0),
      maxWeight: 4000,
      dimensions: '12ft x 7ft x 6ft',
      imageUrl: '/images/vehicles/box_truck.svg',
    },
  ];
  for (const vehicle of vehicleTypes) {
    await prisma.vehicleType.upsert({
      where: { id: vehicle.id },
      update: vehicle,
      create: vehicle,
    });
  }

  // 1.x. ITEM TYPES (catalogue) — NEW
  console.log('📦 Création du catalogue ItemType...');
  const itemTypes = [
    // meubles
    {
      category: 'meuble',
      type: 'canape_3p',
      label: 'Canapé 3 places',
      defaultVolumeM3: new Prisma.Decimal(1.2),
      defaultWeightKg: new Prisma.Decimal(70),
      isFragileDefault: false,
      isBulkyDefault: true,
    },
    {
      category: 'meuble',
      type: 'fauteuil',
      label: 'Fauteuil',
      defaultVolumeM3: new Prisma.Decimal(0.4),
      defaultWeightKg: new Prisma.Decimal(25),
      isFragileDefault: false,
      isBulkyDefault: false,
    },
    {
      category: 'meuble',
      type: 'table_salon',
      label: 'Table de salon',
      defaultVolumeM3: new Prisma.Decimal(0.3),
      defaultWeightKg: new Prisma.Decimal(20),
      isFragileDefault: false,
      isBulkyDefault: false,
    },
    {
      category: 'meuble',
      type: 'chaise',
      label: 'Chaise',
      defaultVolumeM3: new Prisma.Decimal(0.1),
      defaultWeightKg: new Prisma.Decimal(8),
      isFragileDefault: false,
      isBulkyDefault: false,
    },
    // électroménager
    {
      category: 'electromenager',
      type: 'frigo',
      label: 'Réfrigérateur',
      defaultVolumeM3: new Prisma.Decimal(0.6),
      defaultWeightKg: new Prisma.Decimal(70),
      isFragileDefault: false,
      isBulkyDefault: true,
    },
    {
      category: 'electromenager',
      type: 'tv_55',
      label: 'TV 55"',
      defaultVolumeM3: new Prisma.Decimal(0.05),
      defaultWeightKg: new Prisma.Decimal(18),
      isFragileDefault: true,
      isBulkyDefault: false,
    },
    {
      category: 'electromenager',
      type: 'poele',
      label: 'Cuisinière',
      defaultVolumeM3: new Prisma.Decimal(0.5),
      defaultWeightKg: new Prisma.Decimal(65),
      isFragileDefault: false,
      isBulkyDefault: true,
    },
    // divers
    {
      category: 'divers',
      type: 'matelas_queen',
      label: 'Matelas Queen',
      defaultVolumeM3: new Prisma.Decimal(0.7),
      defaultWeightKg: new Prisma.Decimal(35),
      isFragileDefault: false,
      isBulkyDefault: true,
    },
  ];
  for (const it of itemTypes) {
    await prisma.itemType.upsert({
      where: { category_type: { category: it.category, type: it.type } },
      update: it,
      create: it,
    });
  }

  // 2. UTILISATEURS (CLIENTS, FOURNISSEURS, CONDUCTEURS)
  console.log('👥 Création des utilisateurs...');
  const client1 = await prisma.user.upsert({
    where: { email: 'marie.client@email.com' },
    update: {},
    create: {
      email: 'marie.client@email.com',
      nom: 'Tremblay',
      prenom: 'Marie',
      password: hashedPassword,
      role: 'CLIENT',
    },
  });
  const client2 = await prisma.user.upsert({
    where: { email: 'jean.client@email.com' },
    update: {},
    create: {
      email: 'jean.client@email.com',
      nom: 'Lapointe',
      prenom: 'Jean',
      password: hashedPassword,
      role: 'CLIENT',
    },
  });
  const provider1User = await prisma.user.upsert({
    where: { email: 'transport.quebec@email.com' },
    update: {},
    create: {
      email: 'transport.quebec@email.com',
      nom: 'Gagnon',
      prenom: 'Pierre',
      password: hashedPassword,
      role: 'PROVIDER',
    },
  });
  const provider2User = await prisma.user.upsert({
    where: { email: 'demenagement.mtl@email.com' },
    update: {},
    create: {
      email: 'demenagement.mtl@email.com',
      nom: 'Martin',
      prenom: 'Sophie',
      password: hashedPassword,
      role: 'PROVIDER',
    },
  });
  const provider3User = await prisma.user.upsert({
    where: { email: 'express.livraison@email.com' },
    update: {},
    create: {
      email: 'express.livraison@email.com',
      nom: 'Dubois',
      prenom: 'Marc',
      password: hashedPassword,
      role: 'PROVIDER',
    },
  });
  const driver1User = await prisma.user.upsert({
    where: { email: 'alex.driver@email.com' },
    update: {},
    create: {
      email: 'alex.driver@email.com',
      nom: 'Bouchard',
      prenom: 'Alexandre',
      password: hashedPassword,
      role: 'DRIVER',
    },
  });
  const driver2User = await prisma.user.upsert({
    where: { email: 'julie.driver@email.com' },
    update: {},
    create: {
      email: 'julie.driver@email.com',
      nom: 'Rousseau',
      prenom: 'Julie',
      password: hashedPassword,
      role: 'DRIVER',
    },
  });
  const driver3User = await prisma.user.upsert({
    where: { email: 'simon.driver@email.com' },
    update: {},
    create: {
      email: 'simon.driver@email.com',
      nom: 'Levesque',
      prenom: 'Simon',
      password: hashedPassword,
      role: 'DRIVER',
    },
  });
  const admin = await prisma.user.upsert({
    where: { email: 'admin@grandogo.com' },
    update: {},
    create: {
      email: 'admin@grandogo.com',
      nom: 'Admin',
      prenom: 'GrandoGo',
      password: hashedPassword,
      role: 'ADMIN',
    },
  });

  // 3. FOURNISSEURS
  console.log('🏢 Création des fournisseurs...');
  const provider1 = await prisma.provider.upsert({
    where: { userId: provider1User.id },
    update: {},
    create: {
      userId: provider1User.id,
      companyName: 'Transport Québec Express',
      businessType: 'COMPANY',
      licenseNumber: 'TQE-2024-001',
      insuranceNumber: 'INS-987654321',
      taxNumber: 'QST-123456789',
      baseAddress: '1234 Boulevard René-Lévesque, Québec, QC G1R 2L3',
      baseCoordinates: '46.8139,-71.2080',
      serviceRadius: 25,
      serviceAreas: ['Quebec', 'Levis', 'Sainte-Foy'],
      isVerified: true,
      isActive: true,
      rating: new Prisma.Decimal(4.8),
      totalJobs: 127,
      totalEarnings: new Prisma.Decimal(15750.5),
      commissionRate: new Prisma.Decimal(12.5),
      avgResponseTime: 8,
      cancellationRate: new Prisma.Decimal(2.1),
      punctualityRate: new Prisma.Decimal(96.5),
    },
  });
  const provider2 = await prisma.provider.upsert({
    where: { userId: provider2User.id },
    update: {},
    create: {
      userId: provider2User.id,
      companyName: 'Déménagement Montréal Pro',
      businessType: 'COMPANY',
      licenseNumber: 'DMP-2024-002',
      insuranceNumber: 'INS-876543210',
      taxNumber: 'QST-987654321',
      baseAddress: '5678 Rue Saint-Denis, Montréal, QC H2S 3L6',
      baseCoordinates: '45.5088,-73.5878',
      serviceRadius: 30,
      serviceAreas: ['Montreal', 'Laval', 'Longueuil', 'Brossard'],
      isVerified: true,
      isActive: true,
      rating: new Prisma.Decimal(4.9),
      totalJobs: 203,
      totalEarnings: new Prisma.Decimal(28420.75),
      commissionRate: new Prisma.Decimal(10.0),
      avgResponseTime: 5,
      cancellationRate: new Prisma.Decimal(1.5),
      punctualityRate: new Prisma.Decimal(98.2),
    },
  });
  const provider3 = await prisma.provider.upsert({
    where: { userId: provider3User.id },
    update: {},
    create: {
      userId: provider3User.id,
      companyName: 'Express Livraison Plus',
      businessType: 'SMALL_BUSINESS',
      licenseNumber: 'ELP-2024-003',
      baseAddress: '789 Avenue des Pins, Montréal, QC H2W 1P8',
      baseCoordinates: '45.5108,-73.5825',
      serviceRadius: 15,
      serviceAreas: ['Montreal', 'Westmount'],
      isVerified: true,
      isActive: true,
      rating: new Prisma.Decimal(4.6),
      totalJobs: 89,
      totalEarnings: new Prisma.Decimal(8950.25),
      commissionRate: new Prisma.Decimal(15.0),
      avgResponseTime: 12,
      cancellationRate: new Prisma.Decimal(3.2),
      punctualityRate: new Prisma.Decimal(94.8),
    },
  });

  // 4. CONDUCTEURS
  console.log('🚗 Création des conducteurs...');
  const driver1 = await prisma.driver.create({
    data: {
      userId: driver1User.id,
      providerId: provider1.id,
      licenseNumber: 'QC-ABC-123456',
      licenseExpiry: new Date('2026-08-15'),
      licenseClass: 'Class 3',
      experienceYears: 8,
      languages: ['Français', 'Anglais'],
      isActive: true,
      isAvailable: true,
      currentLocation: '46.8139,-71.2080',
      lastSeen: new Date(),
      rating: new Prisma.Decimal(4.7),
      totalTrips: 156,
    },
  });
  const driver2 = await prisma.driver.create({
    data: {
      userId: driver2User.id,
      providerId: provider2.id,
      licenseNumber: 'QC-DEF-789012',
      licenseExpiry: new Date('2025-12-20'),
      licenseClass: 'Class 3',
      experienceYears: 5,
      languages: ['Français', 'Anglais', 'Espagnol'],
      isActive: true,
      isAvailable: false,
      currentLocation: '45.5088,-73.5878',
      lastSeen: new Date(),
      rating: new Prisma.Decimal(4.9),
      totalTrips: 278,
    },
  });
  const driver3 = await prisma.driver.create({
    data: {
      userId: driver3User.id,
      providerId: provider3.id,
      licenseNumber: 'QC-GHI-345678',
      licenseExpiry: new Date('2027-03-10'),
      licenseClass: 'Class 5',
      experienceYears: 3,
      languages: ['Français'],
      isActive: true,
      isAvailable: true,
      currentLocation: '45.5108,-73.5825',
      lastSeen: new Date(),
      rating: new Prisma.Decimal(4.5),
      totalTrips: 92,
    },
  });

  // 5. VÉHICULES
  console.log('🚚 Création des véhicules...');
  const vehicle1 = await prisma.vehicle.create({
    data: {
      providerId: provider1.id,
      ownerId: provider1User.id,
      vehicleTypeId: 'van',
      brand: 'Ford',
      model: 'Transit',
      year: 2022,
      licensePlate: 'QC-123-ABC',
      color: 'Blanc',
      vin: 'WF0AXXGCDA1234567',
      actualMaxWeight: 1200,
      actualDimensions: '8.5ft x 5.2ft x 4.1ft',
      fuelType: 'Essence',
      photos: [
        '/images/vehicles/ford-transit-1.jpg',
        '/images/vehicles/ford-transit-2.jpg',
      ],
      insuranceDoc: '/docs/insurance-qc123abc.pdf',
      registrationDoc: '/docs/registration-qc123abc.pdf',
      isActive: true,
      isAvailable: true,
      lastMaintenanceAt: new Date('2024-06-15'),
      nextMaintenanceAt: new Date('2024-12-15'),
      mileage: 45620,
    },
  });
  const vehicle2 = await prisma.vehicle.create({
    data: {
      providerId: provider2.id,
      ownerId: provider2User.id,
      vehicleTypeId: 'truck_xl',
      brand: 'Chevrolet',
      model: 'Express 3500',
      year: 2023,
      licensePlate: 'QC-456-DEF',
      color: 'Bleu',
      vin: 'WF0BXXGCDA7890123',
      actualMaxWeight: 2200,
      actualDimensions: '10.2ft x 6.1ft x 3.2ft',
      fuelType: 'Diesel',
      photos: ['/images/vehicles/chevy-express-1.jpg'],
      isActive: true,
      isAvailable: false,
      lastMaintenanceAt: new Date('2024-07-01'),
      nextMaintenanceAt: new Date('2025-01-01'),
      mileage: 28350,
    },
  });
  const vehicle3 = await prisma.vehicle.create({
    data: {
      providerId: provider3.id,
      ownerId: provider3User.id,
      vehicleTypeId: 'pickup',
      brand: 'Toyota',
      model: 'Tacoma',
      year: 2021,
      licensePlate: 'QC-789-GHI',
      color: 'Rouge',
      actualMaxWeight: 600,
      fuelType: 'Essence',
      photos: ['/images/vehicles/toyota-tacoma-1.jpg'],
      isActive: true,
      isAvailable: true,
      lastMaintenanceAt: new Date('2024-05-20'),
      nextMaintenanceAt: new Date('2024-11-20'),
      mileage: 67890,
    },
  });
  const vehicle4 = await prisma.vehicle.create({
    data: {
      providerId: provider2.id,
      ownerId: provider2User.id,
      vehicleTypeId: 'box_truck',
      brand: 'Isuzu',
      model: 'NPR',
      year: 2022,
      licensePlate: 'QC-321-JKL',
      color: 'Blanc',
      actualMaxWeight: 4500,
      actualDimensions: '12.5ft x 7.2ft x 6.1ft',
      fuelType: 'Diesel',
      isActive: true,
      isAvailable: true,
      lastMaintenanceAt: new Date('2024-06-30'),
      nextMaintenanceAt: new Date('2024-12-30'),
      mileage: 12450,
    },
  });

  // 6. DISPONIBILITÉS DES FOURNISSEURS
  console.log('📅 Création des disponibilités...');
  const provider1Availabilities = [
    { dayOfWeek: 1, startTime: '07:00', endTime: '19:00' },
    { dayOfWeek: 2, startTime: '07:00', endTime: '19:00' },
    { dayOfWeek: 3, startTime: '07:00', endTime: '19:00' },
    { dayOfWeek: 4, startTime: '07:00', endTime: '19:00' },
    { dayOfWeek: 5, startTime: '07:00', endTime: '19:00' },
    { dayOfWeek: 6, startTime: '08:00', endTime: '17:00' },
  ];
  for (const avail of provider1Availabilities) {
    await prisma.providerAvailability.create({
      data: {
        providerId: provider1.id,
        dayOfWeek: avail.dayOfWeek,
        startTime: avail.startTime,
        endTime: avail.endTime,
        type: 'AVAILABLE',
        isRecurring: true,
        isActive: true,
      },
    });
  }
  for (let day = 1; day <= 7; day++) {
    await prisma.providerAvailability.create({
      data: {
        providerId: provider2.id,
        dayOfWeek: day,
        startTime: day <= 5 ? '06:00' : '08:00',
        endTime: day <= 5 ? '20:00' : '18:00',
        type: 'AVAILABLE',
        isRecurring: true,
        isActive: true,
      },
    });
  }

  // 7. ESTIMATIONS
  console.log('📋 Création des estimations...');
  const estimate1 = await prisma.estimate.create({
    data: {
      pickupAddress: '1234 Rue Saint-Denis, Montréal, QC H2X 3K2',
      pickupCoordinates: '45.5088,-73.5878',
      destinationAddress: '5678 Avenue Mont-Royal, Montréal, QC H2T 2T4',
      destinationCoordinates: '45.5276,-73.5956',
      vehicleType: 'van',
      assignedProviderId: provider2.id,
      assignedVehicleId: vehicle1.id,
      distance: 8500,
      estimatedDuration: 45,
      basePrice: new Prisma.Decimal(50.0),
      laborCost: new Prisma.Decimal(78.75),
      mileageCost: new Prisma.Decimal(19.13),
      bookingFee: new Prisma.Decimal(8.87),
      totalPrice: new Prisma.Decimal(156.75),
      providerEarning: new Prisma.Decimal(141.08),
      platformFee: new Prisma.Decimal(15.67),
      status: 'BOOKED',
      userId: client1.id,

      // NEW traces (exemple)
      volumeM3: new Prisma.Decimal(1.8),
      laborMin: new Prisma.Decimal(52.0),
      movers: 2,
      breakdown: { note: 'seed example' } as any,
    },
  });
  const estimate2 = await prisma.estimate.create({
    data: {
      pickupAddress: '789 Boulevard René-Lévesque, Québec, QC G1R 2L3',
      pickupCoordinates: '46.8139,-71.208',
      destinationAddress: '321 Rue de la Couronne, Québec, QC G1K 6E1',
      destinationCoordinates: '46.8053,-71.2092',
      vehicleType: 'pickup',
      assignedProviderId: provider1.id,
      assignedVehicleId: vehicle3.id,
      distance: 3200,
      estimatedDuration: 25,
      basePrice: new Prisma.Decimal(40.0),
      laborCost: new Prisma.Decimal(37.5),
      mileageCost: new Prisma.Decimal(6.4),
      bookingFee: new Prisma.Decimal(5.03),
      totalPrice: new Prisma.Decimal(88.93),
      providerEarning: new Prisma.Decimal(77.82),
      platformFee: new Prisma.Decimal(11.11),
      status: 'CALCULATED',
      userId: client2.id,

      volumeM3: new Prisma.Decimal(0.95),
      laborMin: new Prisma.Decimal(28.0),
      movers: 2,
      breakdown: { note: 'seed example' } as any,
    },
  });

  // 7.x. ESTIMATE ITEMS — NEW (attach to estimates)
  console.log('🧱 Ajout d’items aux estimations...');
  // Find ItemTypes
  const itCanape = await prisma.itemType.findUnique({
    where: {
      category_type: {
        category: 'meuble',
        type: 'canape_3p',
      },
    },
  });
  const itFrigo = await prisma.itemType.findUnique({
    where: {
      category_type: {
        category: 'electromenager',
        type: 'frigo',
      },
    },
  });
  const itTv = await prisma.itemType.findUnique({
    where: {
      category_type: {
        category: 'electromenager',
        type: 'tv_55',
      },
    },
  });

  const est1_item1 = await prisma.estimateItem.create({
    data: {
      estimateId: estimate1.id,
      itemTypeId: itCanape?.id,
      category: 'meuble',
      type: 'canape_3p',
      qty: 1,
      fragile: false,
      bulky: true,
    },
  });
  const est1_item2 = await prisma.estimateItem.create({
    data: {
      estimateId: estimate1.id,
      itemTypeId: itFrigo?.id,
      category: 'electromenager',
      type: 'frigo',
      qty: 1,
      fragile: false,
      bulky: true,
    },
  });
  const est2_item1 = await prisma.estimateItem.create({
    data: {
      estimateId: estimate2.id,
      itemTypeId: itTv?.id,
      category: 'electromenager',
      type: 'tv_55',
      qty: 1,
      fragile: true,
      bulky: false,
    },
  });

  // 8. RÉSERVATIONS
  console.log('📅 Création des réservations...');
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(10, 0, 0, 0);

  const booking1 = await prisma.booking.create({
    data: {
      estimateId: estimate1.id,
      userId: client1.id,
      providerId: provider2.id,
      vehicleId: vehicle1.id,
      driverId: driver2.id,
      customerName: 'Marie Tremblay',
      customerEmail: 'marie.client@email.com',
      customerPhone: '+1-514-555-0123',
      scheduledAt: tomorrow,
      status: 'CONFIRMED',
      paymentStatus: 'AUTHORIZED',
      customerRating: 5,
      customerReview: 'Service excellent, très professionnel!',
    },
  });

  // 8.x. UploadedFile liés à des items — NEW
  console.log('🖼️ Ajout de photos liées aux items...');
  await prisma.uploadedFile.createMany({
    data: [
      {
        filename: 'item-canape1.jpg',
        originalName: 'canape.jpg',
        mimetype: 'image/jpeg',
        size: 450000,
        path: '/uploads/canape1.jpg',
        category: 'item_photo',
        estimateId: estimate1.id,
        estimateItemId: est1_item1.id,
      },
      {
        filename: 'item-frigo1.png',
        originalName: 'frigo.png',
        mimetype: 'image/png',
        size: 520000,
        path: '/uploads/frigo1.png',
        category: 'item_photo',
        estimateId: estimate1.id,
        estimateItemId: est1_item2.id,
      },
      {
        filename: 'item-tv55.webp',
        originalName: 'tv.webp',
        mimetype: 'image/webp',
        size: 380000,
        path: '/uploads/tv55.webp',
        category: 'item_photo',
        estimateId: estimate2.id,
        estimateItemId: est2_item1.id,
      },
    ],
  });

  // 9. GAINS
  console.log('💰 Création des gains...');
  await prisma.earning.create({
    data: {
      providerId: provider2.id,
      bookingId: booking1.id,
      totalAmount: new Prisma.Decimal(156.75),
      platformFee: new Prisma.Decimal(15.67),
      providerEarning: new Prisma.Decimal(141.08),
      taxes: new Prisma.Decimal(21.16),
      payoutStatus: 'PAID',
      payoutMethod: 'bank_transfer',
      payoutReference: 'TRF-20240715-001',
      payoutDate: new Date('2024-07-15'),
      periodStart: new Date('2024-07-01'),
      periodEnd: new Date('2024-07-31'),
    },
  });

  // 10. NOTIFICATIONS
  console.log('🔔 Création des notifications...');
  await prisma.notification.create({
    data: {
      userId: provider2User.id,
      type: 'BOOKING_REQUEST',
      title: 'Nouvelle demande de réservation',
      message:
        'Vous avez reçu une nouvelle demande de réservation pour demain à 10h00.',
      data: { bookingId: booking1.id, vehicleType: 'van' },
    },
  });
  await prisma.notification.create({
    data: {
      userId: client1.id,
      type: 'BOOKING_CONFIRMED',
      title: 'Réservation confirmée',
      message: 'Votre réservation pour demain à 10h00 a été confirmée.',
      data: { bookingId: booking1.id },
      isRead: true,
      readAt: new Date(),
    },
  });

  // 11. RÈGLES DE PRIX
  console.log('💲 Création des règles de prix...');
  await prisma.pricingRule.create({
    data: {
      name: 'Majoration Weekend',
      type: 'SURGE',
      conditions: {
        days: ['Saturday', 'Sunday'],
        hours: { start: 8, end: 18 },
      },
      adjustment: new Prisma.Decimal(20.0),
      isActive: true,
      validFrom: new Date('2024-01-01'),
      validTo: new Date('2025-12-31'),
    },
  });
  await prisma.pricingRule.create({
    data: {
      name: 'Réduction Fournisseur Premium',
      type: 'DISCOUNT',
      conditions: { providerRating: { min: 4.8 }, totalJobs: { min: 100 } },
      adjustment: new Prisma.Decimal(-5.0),
      isActive: true,
      validFrom: new Date('2024-01-01'),
      providerId: provider2.id,
    },
  });

  // 12. ZONES DE SERVICE
  console.log('🗺️ Zones de service déjà créées par la migration');

  // 13. STATISTIQUES FINALES
  const stats = {
    users: await prisma.user.count(),
    providers: await prisma.provider.count(),
    drivers: await prisma.driver.count(),
    vehicles: await prisma.vehicle.count(),
    vehicleTypes: await prisma.vehicleType.count(),
    estimates: await prisma.estimate.count(),
    estimateItems: await prisma.estimateItem.count(),
    bookings: await prisma.booking.count(),
    earnings: await prisma.earning.count(),
    notifications: await prisma.notification.count(),
    serviceAreas: await prisma.serviceArea.count(),
    providerAvailabilities: await prisma.providerAvailability.count(),
    pricingRules: await prisma.pricingRule.count(),
    itemTypes: await prisma.itemType.count(),
    uploadedFiles: await prisma.uploadedFile.count(),
  };

  console.log('✅ Création de données terminée avec succès!');
  console.log('📊 Résumé de la base de données:');
  console.log(`   - Utilisateurs: ${stats.users}`);
  console.log(`   - Fournisseurs: ${stats.providers}`);
  console.log(`   - Conducteurs: ${stats.drivers}`);
  console.log(`   - Véhicules: ${stats.vehicles}`);
  console.log(`   - Types de véhicules: ${stats.vehicleTypes}`);
  console.log(`   - Estimations: ${stats.estimates}`);
  console.log(`   - Items d’estimation: ${stats.estimateItems}`);
  console.log(`   - Réservations: ${stats.bookings}`);
  console.log(`   - Gains: ${stats.earnings}`);
  console.log(`   - Notifications: ${stats.notifications}`);
  console.log(`   - Zones de service: ${stats.serviceAreas}`);
  console.log(
    `   - Disponibilités fournisseurs: ${stats.providerAvailabilities}`,
  );
  console.log(`   - Règles de prix: ${stats.pricingRules}`);
  console.log(`   - ItemTypes: ${stats.itemTypes}`);
  console.log(`   - Fichiers uploadés: ${stats.uploadedFiles}`);

  console.log('\n🔐 Comptes de test créés:');
  console.log('👤 CLIENTS:');
  console.log('   marie.client@email.com / password123');
  console.log('   jean.client@email.com / password123');
  console.log('\n🏢 FOURNISSEURS:');
  console.log(
    '   transport.quebec@email.com / password123 (Transport Québec Express)',
  );
  console.log(
    '   demenagement.mtl@email.com / password123 (Déménagement Montréal Pro)',
  );
  console.log(
    '   express.livraison@email.com / password123 (Express Livraison Plus)',
  );
  console.log('\n🚗 CONDUCTEURS:');
  console.log('   alex.driver@email.com / password123 (Chez Transport Québec)');
  console.log(
    '   julie.driver@email.com / password123 (Chez Déménagement MTL)',
  );
  console.log(
    '   simon.driver@email.com / password123 (Chez Express Livraison)',
  );
  console.log('\n👑 ADMIN:');
  console.log('   admin@grandogo.com / password123');
  console.log('\n🚚 Véhicules disponibles:');
  console.log('   - Ford Transit (QC-123-ABC) - Fournisseur: Transport Québec');
  console.log(
    '   - Chevrolet Express (QC-456-DEF) - Fournisseur: Déménagement MTL',
  );
  console.log(
    '   - Toyota Tacoma (QC-789-GHI) - Fournisseur: Express Livraison',
  );
  console.log('   - Isuzu NPR (QC-321-JKL) - Fournisseur: Déménagement MTL');
}

main()
  .catch((e) => {
    console.error('❌ Erreur lors de la création des données:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

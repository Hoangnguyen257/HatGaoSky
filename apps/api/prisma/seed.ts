import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed for VietSky Airlines...');

  // 1. Clean existing records in reverse dependency order
  await prisma.exportJob.deleteMany();
  await prisma.sentEmail.deleteMany();
  await prisma.systemSetting.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.bookingRequestLog.deleteMany();
  await prisma.discount.deleteMany();
  await prisma.refund.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.bookingService.deleteMany();
  await prisma.ticket.deleteMany();
  await prisma.passenger.deleteMany();
  await prisma.booking.deleteMany();
  await prisma.seat.deleteMany();
  await prisma.flightFare.deleteMany();
  await prisma.flight.deleteMany();
  await prisma.airport.deleteMany();
  await prisma.aircraft.deleteMany();
  await prisma.mileTransaction.deleteMany();
  await prisma.reward.deleteMany();
  await prisma.loyaltyAccount.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.user.deleteMany();

  console.log('✅ Cleaned old records.');

  // 2. Create Users & Roles
  const passwordAdmin = await bcrypt.hash('Admin@123456', 10);
  const passwordManager = await bcrypt.hash('Manager@123456', 10);
  const passwordStaff = await bcrypt.hash('Staff@123456', 10);
  const passwordCustomer = await bcrypt.hash('Customer@123456', 10);

  // Admin User
  const admin = await prisma.user.create({
    data: {
      email: 'admin@vietsky.vn',
      passwordHash: passwordAdmin,
      fullName: 'Nguyen Quan Tri (System Admin)',
      role: 'ADMIN',
      phone: '0901234567',
      status: 'ACTIVE',
      mfaEnabled: true,
      mfaSecret: 'JBSWY3DPEHPK3PXP',
    },
  });

  // Staff Manager User
  const manager = await prisma.user.create({
    data: {
      email: 'manager@vietsky.vn',
      passwordHash: passwordManager,
      fullName: 'Le Thi Truong Phong (Staff Manager)',
      role: 'STAFF_MANAGER',
      phone: '0902345678',
      status: 'ACTIVE',
      mfaEnabled: true,
      mfaSecret: 'JBSWY3DPEHPK3PXP',
    },
  });

  // Staff User
  const staff = await prisma.user.create({
    data: {
      email: 'staff@vietsky.vn',
      passwordHash: passwordStaff,
      fullName: 'Tran Van Nhan Vien (Operations Staff)',
      role: 'STAFF',
      phone: '0903456789',
      status: 'ACTIVE',
      mfaEnabled: true,
      mfaSecret: 'JBSWY3DPEHPK3PXP',
    },
  });

  // Customer 1: Platinum Member
  const customer1 = await prisma.user.create({
    data: {
      email: 'customer@vietsky.vn',
      passwordHash: passwordCustomer,
      fullName: 'Nguyen Van An',
      role: 'CUSTOMER',
      phone: '0988889999',
      status: 'ACTIVE',
      customerProfile: {
        create: {
          memberCode: 'VSK-889900',
          dateOfBirth: new Date('1990-05-15'),
          passportNumber: 'C8912345',
          nationality: 'VNM',
          gender: 'MALE',
        },
      },
      loyaltyAccount: {
        create: {
          tier: 'PLATINUM',
          totalMilesEarned: 35000,
          availableMiles: 25400,
          tierExpiryDate: new Date('2027-12-31'),
          transactions: {
            create: [
              {
                type: 'EARN',
                amount: 15400,
                balanceAfter: 15400,
                description: 'Tích lũy dặm chuyến bay quốc tế SGN-NRT',
              },
              {
                type: 'EARN',
                amount: 10000,
                balanceAfter: 25400,
                description: 'Thưởng thăng hạng hội viên Platinum',
              },
            ],
          },
        },
      },
    },
  });

  // Customer 2: Silver Member
  const customer2 = await prisma.user.create({
    data: {
      email: 'member@vietsky.vn',
      passwordHash: passwordCustomer,
      fullName: 'Pham Thi Bich',
      role: 'CUSTOMER',
      phone: '0977778888',
      status: 'ACTIVE',
      customerProfile: {
        create: {
          memberCode: 'VSK-112233',
          dateOfBirth: new Date('1995-08-20'),
          passportNumber: 'B7654321',
          nationality: 'VNM',
          gender: 'FEMALE',
        },
      },
      loyaltyAccount: {
        create: {
          tier: 'SILVER',
          totalMilesEarned: 5200,
          availableMiles: 3800,
          tierExpiryDate: new Date('2027-06-30'),
          transactions: {
            create: [
              {
                type: 'EARN',
                amount: 3800,
                balanceAfter: 3800,
                description: 'Tích lũy dặm chuyến bay khứ hồi SGN-HAN',
              },
            ],
          },
        },
      },
    },
  });

  console.log('✅ Created Demo Users for all 5 roles.');

  // 3. Create Airports
  const airportsData = [
    { code: 'SGN', name: 'Sân bay Quốc tế Tân Sơn Nhất', city: 'Hồ Chí Minh', country: 'Việt Nam', terminal: 'T1 / T2' },
    { code: 'HAN', name: 'Sân bay Quốc tế Nội Bài', city: 'Hà Nội', country: 'Việt Nam', terminal: 'T1 / T2' },
    { code: 'DAD', name: 'Sân bay Quốc tế Đà Nẵng', city: 'Đà Nẵng', country: 'Việt Nam', terminal: 'T1' },
    { code: 'CXR', name: 'Sân bay Quốc tế Cam Ranh', city: 'Nha Trang', country: 'Việt Nam', terminal: 'T1 / T2' },
    { code: 'PQC', name: 'Sân bay Quốc tế Phú Quốc', city: 'Phú Quốc', country: 'Việt Nam', terminal: 'T1' },
    { code: 'BKK', name: 'Suvarnabhumi Airport', city: 'Bangkok', country: 'Thailand', terminal: 'Main' },
    { code: 'SIN', name: 'Singapore Changi Airport', city: 'Singapore', country: 'Singapore', terminal: 'T3' },
    { code: 'ICN', name: 'Incheon International Airport', city: 'Seoul', country: 'South Korea', terminal: 'T2' },
    { code: 'NRT', name: 'Narita International Airport', city: 'Tokyo', country: 'Japan', terminal: 'T1' },
  ];

  const airportsMap = new Map();
  for (const ap of airportsData) {
    const record = await prisma.airport.create({ data: ap });
    airportsMap.set(ap.code, record.id);
  }
  console.log(`✅ Created ${airportsData.length} airports.`);

  // 4. Create Aircrafts
  const dreamliner = await prisma.aircraft.create({
    data: {
      model: 'Boeing 787-9 Dreamliner',
      registrationNumber: 'VN-A899',
      totalCapacity: 294,
      firstSeats: 8,
      businessSeats: 28,
      economySeats: 258,
    },
  });

  const airbus350 = await prisma.aircraft.create({
    data: {
      model: 'Airbus A350-900',
      registrationNumber: 'VN-A688',
      totalCapacity: 305,
      firstSeats: 0,
      businessSeats: 29,
      economySeats: 276,
    },
  });

  const airbus321 = await prisma.aircraft.create({
    data: {
      model: 'Airbus A321neo',
      registrationNumber: 'VN-A321',
      totalCapacity: 203,
      firstSeats: 0,
      businessSeats: 16,
      economySeats: 187,
    },
  });

  console.log('✅ Created 3 Fleet Aircrafts.');

  // 5. Create Realistic Flights (scheduled for today + upcoming 7 days)
  const now = new Date();
  const day1 = new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000);
  const day2 = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000);
  const day3 = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);

  const setTime = (baseDate: Date, hours: number, minutes: number) => {
    const d = new Date(baseDate);
    d.setHours(hours, minutes, 0, 0);
    return d;
  };

  const flightsToSeed = [
    // SGN -> HAN (Gold Route)
    {
      flightNumber: 'VSK-102',
      aircraftId: dreamliner.id,
      originAirportId: airportsMap.get('SGN'),
      destinationAirportId: airportsMap.get('HAN'),
      depHours: 6, depMins: 30, arrHours: 8, arrMins: 45, duration: 135,
      fares: [
        { cabinClass: 'ECONOMY', basePrice: 1450000, availableSeats: 150 },
        { cabinClass: 'BUSINESS', basePrice: 4200000, availableSeats: 20 },
        { cabinClass: 'FIRST', basePrice: 8500000, availableSeats: 6 },
      ]
    },
    {
      flightNumber: 'VSK-104',
      aircraftId: airbus350.id,
      originAirportId: airportsMap.get('SGN'),
      destinationAirportId: airportsMap.get('HAN'),
      depHours: 11, depMins: 15, arrHours: 13, arrMins: 30, duration: 135,
      fares: [
        { cabinClass: 'ECONOMY', basePrice: 1650000, availableSeats: 180 },
        { cabinClass: 'BUSINESS', basePrice: 4500000, availableSeats: 24 },
      ]
    },
    {
      flightNumber: 'VSK-108',
      aircraftId: airbus321.id,
      originAirportId: airportsMap.get('SGN'),
      destinationAirportId: airportsMap.get('HAN'),
      depHours: 19, depMins: 45, arrHours: 22, arrMins: 0, duration: 135,
      fares: [
        { cabinClass: 'ECONOMY', basePrice: 1250000, availableSeats: 120 },
        { cabinClass: 'BUSINESS', basePrice: 3800000, availableSeats: 14 },
      ]
    },

    // HAN -> SGN (Return)
    {
      flightNumber: 'VSK-101',
      aircraftId: dreamliner.id,
      originAirportId: airportsMap.get('HAN'),
      destinationAirportId: airportsMap.get('SGN'),
      depHours: 9, depMins: 45, arrHours: 12, arrMins: 0, duration: 135,
      fares: [
        { cabinClass: 'ECONOMY', basePrice: 1450000, availableSeats: 160 },
        { cabinClass: 'BUSINESS', basePrice: 4200000, availableSeats: 22 },
        { cabinClass: 'FIRST', basePrice: 8500000, availableSeats: 7 },
      ]
    },
    {
      flightNumber: 'VSK-105',
      aircraftId: airbus321.id,
      originAirportId: airportsMap.get('HAN'),
      destinationAirportId: airportsMap.get('SGN'),
      depHours: 16, depMins: 20, arrHours: 18, arrMins: 35, duration: 135,
      fares: [
        { cabinClass: 'ECONOMY', basePrice: 1550000, availableSeats: 140 },
        { cabinClass: 'BUSINESS', basePrice: 3950000, availableSeats: 12 },
      ]
    },

    // SGN -> DAD (Da Nang)
    {
      flightNumber: 'VSK-202',
      aircraftId: airbus321.id,
      originAirportId: airportsMap.get('SGN'),
      destinationAirportId: airportsMap.get('DAD'),
      depHours: 7, depMins: 0, arrHours: 8, arrMins: 25, duration: 85,
      fares: [
        { cabinClass: 'ECONOMY', basePrice: 1100000, availableSeats: 110 },
        { cabinClass: 'BUSINESS', basePrice: 2800000, availableSeats: 10 },
      ]
    },
    // DAD -> SGN
    {
      flightNumber: 'VSK-201',
      aircraftId: airbus321.id,
      originAirportId: airportsMap.get('DAD'),
      destinationAirportId: airportsMap.get('SGN'),
      depHours: 14, depMins: 10, arrHours: 15, arrMins: 35, duration: 85,
      fares: [
        { cabinClass: 'ECONOMY', basePrice: 1150000, availableSeats: 105 },
        { cabinClass: 'BUSINESS', basePrice: 2900000, availableSeats: 11 },
      ]
    },

    // SGN -> PQC (Phu Quoc Island)
    {
      flightNumber: 'VSK-402',
      aircraftId: airbus321.id,
      originAirportId: airportsMap.get('SGN'),
      destinationAirportId: airportsMap.get('PQC'),
      depHours: 8, depMins: 30, arrHours: 9, arrMins: 30, duration: 60,
      fares: [
        { cabinClass: 'ECONOMY', basePrice: 950000, availableSeats: 130 },
        { cabinClass: 'BUSINESS', basePrice: 2400000, availableSeats: 14 },
      ]
    },

    // SGN -> CXR (Nha Trang)
    {
      flightNumber: 'VSK-502',
      aircraftId: airbus321.id,
      originAirportId: airportsMap.get('SGN'),
      destinationAirportId: airportsMap.get('CXR'),
      depHours: 10, depMins: 0, arrHours: 11, arrMins: 10, duration: 70,
      fares: [
        { cabinClass: 'ECONOMY', basePrice: 890000, availableSeats: 115 },
        { cabinClass: 'BUSINESS', basePrice: 2200000, availableSeats: 12 },
      ]
    },

    // International: SGN -> BKK (Bangkok)
    {
      flightNumber: 'VSK-802',
      aircraftId: airbus350.id,
      originAirportId: airportsMap.get('SGN'),
      destinationAirportId: airportsMap.get('BKK'),
      depHours: 9, depMins: 0, arrHours: 10, arrMins: 35, duration: 95,
      fares: [
        { cabinClass: 'ECONOMY', basePrice: 2650000, availableSeats: 160 },
        { cabinClass: 'BUSINESS', basePrice: 6200000, availableSeats: 22 },
      ]
    },

    // International: SGN -> SIN (Singapore)
    {
      flightNumber: 'VSK-812',
      aircraftId: airbus350.id,
      originAirportId: airportsMap.get('SGN'),
      destinationAirportId: airportsMap.get('SIN'),
      depHours: 13, depMins: 45, arrHours: 16, arrMins: 55, duration: 130,
      fares: [
        { cabinClass: 'ECONOMY', basePrice: 3100000, availableSeats: 155 },
        { cabinClass: 'BUSINESS', basePrice: 7800000, availableSeats: 20 },
      ]
    },

    // International: HAN -> ICN (Seoul)
    {
      flightNumber: 'VSK-832',
      aircraftId: dreamliner.id,
      originAirportId: airportsMap.get('HAN'),
      destinationAirportId: airportsMap.get('ICN'),
      depHours: 23, depMins: 30, arrHours: 5, arrMins: 50, duration: 260,
      fares: [
        { cabinClass: 'ECONOMY', basePrice: 6500000, availableSeats: 180 },
        { cabinClass: 'BUSINESS', basePrice: 15500000, availableSeats: 22 },
        { cabinClass: 'FIRST', basePrice: 28000000, availableSeats: 6 },
      ]
    },

    // International: SGN -> NRT (Tokyo)
    {
      flightNumber: 'VSK-852',
      aircraftId: dreamliner.id,
      originAirportId: airportsMap.get('SGN'),
      destinationAirportId: airportsMap.get('NRT'),
      depHours: 0, depMins: 20, arrHours: 7, arrMins: 40, duration: 320,
      fares: [
        { cabinClass: 'ECONOMY', basePrice: 8200000, availableSeats: 175 },
        { cabinClass: 'BUSINESS', basePrice: 18900000, availableSeats: 24 },
        { cabinClass: 'FIRST', basePrice: 34000000, availableSeats: 6 },
      ]
    },
  ];

  let primaryFlightId = '';
  // Generate flights for Today + upcoming 7 days
  const targetDates: Date[] = [];
  for (let i = 0; i <= 7; i++) {
    targetDates.push(new Date(now.getTime() + i * 24 * 60 * 60 * 1000));
  }
  for (const tDate of targetDates) {
    for (const item of flightsToSeed) {
      const dep = setTime(tDate, item.depHours, item.depMins);
      const arr = new Date(dep.getTime() + item.duration * 60 * 1000);

      const flight = await prisma.flight.create({
        data: {
          flightNumber: item.flightNumber,
          aircraftId: item.aircraftId,
          originAirportId: item.originAirportId,
          destinationAirportId: item.destinationAirportId,
          departureTime: dep,
          arrivalTime: arr,
          durationMinutes: item.duration,
          status: 'SCHEDULED',
          fares: {
            create: item.fares.map((f) => ({
              cabinClass: f.cabinClass,
              basePrice: f.basePrice,
              baggageAllowanceKg: f.cabinClass === 'FIRST' ? 40 : f.cabinClass === 'BUSINESS' ? 30 : 20,
              cabinBaggageKg: f.cabinClass === 'FIRST' ? 14 : f.cabinClass === 'BUSINESS' ? 10 : 7,
              availableSeats: f.availableSeats,
            })),
          },
        },
      });

      if (!primaryFlightId && item.flightNumber === 'VSK-102') {
        primaryFlightId = flight.id;
      }

      // Generate Seats for the flight
      // Business rows 1-3, Economy rows 10-20
      const seatsToInsert = [];
      // Business
      for (let r = 1; r <= 3; r++) {
        for (const col of ['A', 'C', 'D', 'G']) {
          seatsToInsert.push({
            aircraftId: item.aircraftId,
            flightId: flight.id,
            seatNumber: `${r}${col}`,
            cabinClass: 'BUSINESS',
            row: r,
            col,
            status: 'AVAILABLE',
          });
        }
      }
      // Economy
      for (let r = 10; r <= 20; r++) {
        for (const col of ['A', 'B', 'C', 'D', 'E', 'F']) {
          // Pre-occupy a few seats to simulate realistic booked/held state
          const isPreBooked = (r === 12 && col === 'B') || (r === 15 && col === 'E');
          seatsToInsert.push({
            aircraftId: item.aircraftId,
            flightId: flight.id,
            seatNumber: `${r}${col}`,
            cabinClass: 'ECONOMY',
            row: r,
            col,
            status: isPreBooked ? 'BOOKED' : 'AVAILABLE',
          });
        }
      }

      await prisma.seat.createMany({ data: seatsToInsert });
    }
  }

  console.log(`✅ Generated multi-day flights with seat maps.`);

  // 6. Create Discounts
  const discountsData = [
    {
      code: 'VIETSKY2026',
      description: 'Giảm 10% cho toàn bộ các chặng bay nội địa Việt Nam',
      discountType: 'PERCENTAGE',
      value: 10,
      minBookingAmount: 1000000,
      maxDiscountAmount: 300000,
      startDate: new Date('2026-01-01'),
      endDate: new Date('2026-12-31'),
      usageLimit: 500,
      usedCount: 42,
      isActive: true,
    },
    {
      code: 'FLYBUSINESS',
      description: 'Giảm 500.000 VNĐ khi đặt vé hạng Thương gia',
      discountType: 'FIXED',
      value: 500000,
      minBookingAmount: 3500000,
      cabinCondition: 'BUSINESS',
      startDate: new Date('2026-01-01'),
      endDate: new Date('2026-12-31'),
      usageLimit: 200,
      usedCount: 15,
      isActive: true,
    },
    {
      code: 'GOLDMEMBER',
      description: 'Ưu đãi đặc quyền 15% cho Hội viên Vàng & Bạch Kim',
      discountType: 'PERCENTAGE',
      value: 15,
      minBookingAmount: 1500000,
      tierCondition: 'GOLD',
      startDate: new Date('2026-01-01'),
      endDate: new Date('2026-12-31'),
      usageLimit: 300,
      usedCount: 28,
      isActive: true,
    },
    {
      code: 'SUMMERFLY',
      description: 'Khuyến mãi hè sôi động giảm 200.000 VNĐ',
      discountType: 'FIXED',
      value: 200000,
      minBookingAmount: 800000,
      startDate: new Date('2026-05-01'),
      endDate: new Date('2026-09-30'),
      usageLimit: 1000,
      usedCount: 0,
      isActive: true,
    },
  ];

  for (const d of discountsData) {
    await prisma.discount.create({ data: d });
  }
  console.log('✅ Created 4 active promo discounts.');

  // 7. Create Loyalty Rewards Catalog
  const rewardsData = [
    {
      title: 'Thêm 10kg hành lý ký gửi miễn phí',
      description: 'Áp dụng cho mọi chặng bay nội địa và quốc tế của VietSky Airlines',
      category: 'BAGGAGE_VOUCHER',
      milesRequired: 1500,
      stock: 500,
      imageUrl: '/images/rewards/baggage.svg',
    },
    {
      title: 'Vé vào phòng chờ Thương gia Lotus Lounge',
      description: 'Trải nghiệm không gian sang trọng, buffet cao cấp tại SGN, HAN hoặc DAD',
      category: 'LOUNGE_ACCESS',
      milesRequired: 3000,
      stock: 250,
      imageUrl: '/images/rewards/lounge.svg',
    },
    {
      title: 'Voucher giảm giá vé máy bay 500.000 VNĐ',
      description: 'Khấu trừ trực tiếp vào giá vé khi thanh toán đặt chỗ trực tuyến',
      category: 'TICKET_DISCOUNT',
      milesRequired: 4500,
      stock: 300,
      imageUrl: '/images/rewards/voucher.svg',
    },
    {
      title: 'Nâng hạng ghế Thương gia chặng nội địa',
      description: 'Nâng từ hạng Phổ thông lên hạng Thương gia (tùy thuộc vào tình trạng chỗ)',
      category: 'MEAL_UPGRADE',
      milesRequired: 8000,
      stock: 80,
      imageUrl: '/images/rewards/upgrade.svg',
    },
  ];

  for (const r of rewardsData) {
    await prisma.reward.create({ data: r });
  }
  console.log('✅ Created Loyalty Rewards Catalog.');

  // 8. Create Sample Booking (PNR: VSK89A)
  if (primaryFlightId) {
    const seat12A = await prisma.seat.findFirst({
      where: { flightId: primaryFlightId, seatNumber: '12A' },
    });

    if (seat12A) {
      await prisma.seat.update({
        where: { id: seat12A.id },
        data: { status: 'BOOKED' },
      });

      const sampleBooking = await prisma.booking.create({
        data: {
          pnr: 'VSK89A',
          userId: customer1.id,
          customerEmail: 'customer@vietsky.vn',
          customerPhone: '0988889999',
          customerName: 'Nguyen Van An',
          status: 'CONFIRMED',
          bookingType: 'INDIVIDUAL',
          totalAmount: 1850000,
          paidAmount: 1850000,
          balanceDue: 0,
          passengers: {
            create: [
              {
                firstName: 'An',
                lastName: 'Nguyen Van',
                passengerType: 'ADULT',
                dateOfBirth: new Date('1990-05-15'),
                passportNumber: 'C8912345',
                nationality: 'VNM',
              },
            ],
          },
          services: {
            create: [
              {
                serviceType: 'BAGGAGE',
                serviceName: 'Hành lý ký gửi bổ sung 15kg',
                quantity: 1,
                unitPrice: 250000,
                totalPrice: 250000,
                detailsJson: JSON.stringify({ weightKg: 15 }),
                status: 'CONFIRMED',
              },
              {
                serviceType: 'MEAL',
                serviceName: 'Suất ăn nóng: Cơm gà Hội An đặc biệt',
                quantity: 1,
                unitPrice: 150000,
                totalPrice: 150000,
                detailsJson: JSON.stringify({ mealCode: 'HOIAN_CHICKEN' }),
                status: 'CONFIRMED',
              },
            ],
          },
          payments: {
            create: [
              {
                transactionCode: 'TXN-98421099',
                method: 'CREDIT_CARD',
                amount: 1850000,
                status: 'SUCCESS',
                gatewayRef: 'SIM_CARD_88910',
                cardLastFour: '4242',
                paidAt: new Date(),
              },
            ],
          },
        },
      });

      const pax = await prisma.passenger.findFirst({
        where: { bookingId: sampleBooking.id },
      });

      if (pax) {
        await prisma.ticket.create({
          data: {
            bookingId: sampleBooking.id,
            passengerId: pax.id,
            flightId: primaryFlightId,
            seatId: seat12A.id,
            cabinClass: 'ECONOMY',
            ticketNumber: '738-9842109841',
            status: 'ISSUED',
            price: 1450000,
          },
        });
      }

      await prisma.sentEmail.create({
        data: {
          recipientEmail: 'customer@vietsky.vn',
          subject: 'Xác nhận đặt vé thành công - Mã đặt chỗ VSK89A',
          template: 'BOOKING_CONFIRMATION',
          contentHtml: `<h2>Kính gửi Quý khách Nguyen Van An,</h2><p>Mã đặt chỗ của quý khách là <strong>VSK89A</strong> cho chuyến bay VSK-102 từ SGN đi HAN.</p>`,
          status: 'SENT',
        },
      });
    }
  }

  // 9. System Settings
  const settings = [
    { key: 'session_timeout_minutes', value: '60', description: 'Thời gian hết hạn phiên đăng nhập' },
    { key: 'seat_hold_ttl_minutes', value: '15', description: 'Thời gian giữ chỗ ghế tạm thời (phút)' },
    { key: 'payment_timeout_minutes', value: '30', description: 'Thời gian chờ thanh toán trước khi hủy chỗ' },
    { key: 'airline_hotline', value: '1900 6868', description: 'Tổng đài chăm sóc khách hàng 24/7' },
    { key: 'support_email', value: 'support@vietsky.vn', description: 'Email hỗ trợ chính thức' },
    { key: 'currency', value: 'VND', description: 'Đơn vị tiền tệ mặc định' },
  ];

  for (const s of settings) {
    await prisma.systemSetting.create({ data: s });
  }

  // 10. Audit Log Sample
  await prisma.auditLog.create({
    data: {
      actorId: admin.id,
      actorRole: 'ADMIN',
      action: 'SYSTEM_INIT',
      entityName: 'SYSTEM',
      detailsJson: JSON.stringify({ message: 'Khởi tạo hệ thống VietSky Airlines thành công' }),
      ipAddress: '127.0.0.1',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
    },
  });

  console.log('✅ Seed completed successfully!');
  console.log('==================================================');
  console.log('🎉 VietSky Airlines Demo Accounts:');
  console.log('1. Admin:         admin@vietsky.vn     / Admin@123456');
  console.log('2. Staff Manager: manager@vietsky.vn   / Manager@123456');
  console.log('3. Staff:         staff@vietsky.vn     / Staff@123456');
  console.log('4. Customer (Plat):customer@vietsky.vn / Customer@123456');
  console.log('5. Customer (Silv):member@vietsky.vn   / Customer@123456');
  console.log('==================================================');
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

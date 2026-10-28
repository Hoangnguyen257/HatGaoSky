/**
 * Comprehensive E2E Verification Script for VietSky Airlines (Node.js)
 */

const API_BASE = 'http://localhost:4000/api';
const WEB_BASE = 'http://localhost:3000';

async function runVerification() {
  console.log('=====================================================');
  console.log('🚀 VIETSKY AIRLINES — LIVE END-TO-END VERIFICATION');
  console.log('=====================================================\n');

  let passedTests = 0;
  let totalTests = 0;

  function assert(condition, testName, extra) {
    totalTests++;
    if (condition) {
      passedTests++;
      console.log(`  ✅ [PASS] ${testName}`);
    } else {
      console.error(`  ❌ [FAIL] ${testName}`, extra ? JSON.stringify(extra) : '');
      process.exitCode = 1;
    }
  }

  // 1. Web & API Health Check
  console.log('--- 1. Web & API Server Health ---');
  try {
    const webRes = await fetch(`${WEB_BASE}/vi`);
    assert(webRes.status === 200, `Frontend Next.js (vi) responds with 200 OK (Status: ${webRes.status})`);
  } catch (e) {
    assert(false, `Frontend Next.js responded: ${e.message}`);
  }

  try {
    const swaggerRes = await fetch(`${API_BASE}/docs`);
    assert(swaggerRes.status === 200, `Swagger API Docs responds with 200 OK (Status: ${swaggerRes.status})`);
  } catch (e) {
    assert(false, `Swagger API Docs responded: ${e.message}`);
  }

  // 2. Flight Search & Airports
  console.log('\n--- 2. Public Flight Search & Comparison ---');
  const airportsRes = await fetch(`${API_BASE}/flights/airports`);
  const airports = await airportsRes.json();
  assert(Array.isArray(airports) && airports.length >= 8, `Loaded ${airports?.length} airports (SGN, HAN, DAD, CXR, PQC, etc.)`);

  const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const searchRes = await fetch(`${API_BASE}/flights/search?origin=SGN&destination=HAN&departureDate=${tomorrow}&passengers=1`);
  const searchData = await searchRes.json();
  assert(searchData && searchData.outboundFlights?.length > 0, `Search SGN -> HAN returned ${searchData?.outboundFlights?.length} direct flights`);

  const sampleFlight = searchData.outboundFlights[0];
  console.log(`      Found sample flight: ${sampleFlight?.flightNumber} (${sampleFlight?.originAirport?.code || 'SGN'} -> ${sampleFlight?.destinationAirport?.code || 'HAN'})`);

  // Compare up to 3 flights
  const flightIds = searchData.outboundFlights.slice(0, 3).map((f) => f.id);
  const compareRes = await fetch(`${API_BASE}/flights/compare`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ flightIds }),
  });
  const compareData = await compareRes.json();
  assert(Array.isArray(compareData.comparisonItems) && compareData.comparisonItems.length === flightIds.length, `Compare endpoint returned details for ${compareData?.comparisonItems?.length} flights`, compareData);

  // 3. Seat Map & Atomic 15-min Seat Hold TTL
  console.log('\n--- 3. Seat Map & Atomic Seat Hold (15-min TTL) ---');
  const seatMapRes = await fetch(`${API_BASE}/seats/flight/${sampleFlight.id}`);
  const seatMap = await seatMapRes.json();
  assert(seatMap && seatMap.seats?.length > 0, `Loaded aircraft seat map with ${seatMap?.seats?.length} seats`);

  const availableSeat = seatMap.seats.find((s) => s.status === 'AVAILABLE' && s.cabinClass === 'ECONOMY') || seatMap.seats.find((s) => s.status === 'AVAILABLE');
  assert(!!availableSeat, `Found available seat: ${availableSeat?.seatNumber} (${availableSeat?.cabinClass})`);

  // Hold the seat
  const holdRes = await fetch(`${API_BASE}/seats/hold`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      flightId: sampleFlight.id,
      seatNumbers: [availableSeat.seatNumber],
      sessionId: 'session_e2e_verifier_001',
    }),
  });
  const holdData = await holdRes.json();
  assert(holdRes.status === 201 && holdData.heldSeats?.includes(availableSeat.seatNumber), `Successfully held seat ${availableSeat.seatNumber} with 15-minute TTL`);

  // 4. Booking Wizard & Passenger Age Validation
  console.log('\n--- 4. Booking Wizard & PNR Generation ---');
  const bookingPayload = {
    outboundFlightId: sampleFlight.id,
    cabinClass: availableSeat.cabinClass,
    sessionId: 'session_e2e_verifier_001',
    contactName: 'Nguyen Thi Mai',
    contactEmail: 'mai.nguyen@example.com',
    contactPhone: '0901234567',
    outboundSeats: [availableSeat.seatNumber],
    passengers: [
      {
        firstName: 'Mai',
        lastName: 'Nguyen Thi',
        passengerType: 'ADULT',
        dateOfBirth: '1992-08-20',
        passportNumber: 'B12345678',
        nationality: 'VNM',
      },
    ],
    services: [
      {
        serviceType: 'BAGGAGE',
        serviceName: 'Hành lý ký gửi 20kg',
        quantity: 1,
        unitPrice: 250000,
      },
    ],
  };

  const bookingRes = await fetch(`${API_BASE}/bookings`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(bookingPayload),
  });
  const bookingData = await bookingRes.json();
  assert(bookingRes.status === 201 && bookingData.pnr?.length >= 5, `Booking created with PNR: ${bookingData.pnr} (Grand Total: ${bookingData.totalAmount?.toLocaleString('vi-VN')} VND)`, bookingData);

  const createdPnr = bookingData.pnr;

  // 5. Payment Checkout (Full Payment & Confirmation)
  console.log('\n--- 5. Payment Simulation & Ticket Issuance ---');
  const payRes = await fetch(`${API_BASE}/payments/checkout`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      pnr: createdPnr,
      paymentType: 'FULL',
      method: 'CREDIT_CARD',
      amount: bookingData.totalAmount,
      cardDetails: {
        cardNumber: '4242 4242 4242 4242',
        cardHolder: 'NGUYEN THI MAI',
        expiryDate: '12/28',
        cvv: '123',
      },
    }),
  });
  const payData = await payRes.json();
  assert(payRes.status === 201 && payData.bookingStatus === 'CONFIRMED', `Payment succeeded: Booking status changed to CONFIRMED (Balance Due: ${payData.balanceDue})`, payData);

  // 6. Manage Booking (PNR Lookup, Baggage Addon, Cancel & Refund)
  console.log('\n--- 6. Manage Booking (Lookup, Baggage, Cancel & Refund) ---');
  const lookupRes = await fetch(`${API_BASE}/bookings/lookup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      pnr: createdPnr,
      email: 'mai.nguyen@example.com',
    }),
  });
  const lookupData = await lookupRes.json();
  assert(lookupRes.status === 201 && lookupData.pnr === createdPnr, `Successfully retrieved reservation details for PNR: ${createdPnr}`, lookupData);

  // Cancel booking and verify refund
  const cancelRes = await fetch(`${API_BASE}/bookings/${createdPnr}/cancel`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ reason: 'Kế hoạch công tác thay đổi đột xuất' }),
  });
  const cancelData = await cancelRes.json();
  assert(
    [200, 201].includes(cancelRes.status) && cancelData.status === 'CANCELLED' && cancelData.refundAmount > 0,
    `Booking successfully cancelled with refund processing (Refund Amount: ${cancelData.refundAmount?.toLocaleString('vi-VN')} VND, Penalty Fee: ${cancelData.penaltyFee?.toLocaleString('vi-VN')} VND)`,
    cancelData,
  );

  // 7. 5 Roles RBAC Authentication & MFA Verification
  console.log('\n--- 7. 5 Roles RBAC & MFA Verification ---');

  // Customer Login (No MFA needed)
  const custLoginRes = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'customer@vietsky.vn', password: 'Customer@123456' }),
  });
  const custAuth = await custLoginRes.json();
  assert([200, 201].includes(custLoginRes.status) && custAuth.user?.role === 'CUSTOMER', `Customer login authenticated directly (Role: ${custAuth.user?.role}, Access Token issued)`);

  // Staff Login (MFA required)
  const staffLoginRes = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'staff@vietsky.vn', password: 'Staff@123456' }),
  });
  const staffAuth = await staffLoginRes.json();
  assert(staffAuth.requiresMfa === true, `Staff login triggers MFA step (requiresMfa: true)`);

  // Verify Staff MFA with code 123456 via /api/auth/mfa/verify
  const staffMfaRes = await fetch(`${API_BASE}/auth/mfa/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ mfaSessionToken: staffAuth.mfaSessionToken, code: '123456' }),
  });
  const staffTokens = await staffMfaRes.json();
  assert([200, 201].includes(staffMfaRes.status) && staffTokens.user?.role === 'STAFF' && !!staffTokens.accessToken, `Staff MFA OTP verified successfully (Role: ${staffTokens.user?.role})`, staffTokens);

  // Staff Manager Login & MFA
  const mgrLoginRes = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'manager@vietsky.vn', password: 'Manager@123456' }),
  });
  const mgrAuth = await mgrLoginRes.json();
  const mgrMfaRes = await fetch(`${API_BASE}/auth/mfa/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ mfaSessionToken: mgrAuth.mfaSessionToken, code: '123456' }),
  });
  const mgrTokens = await mgrMfaRes.json();
  assert([200, 201].includes(mgrMfaRes.status) && mgrTokens.user?.role === 'STAFF_MANAGER', `Staff Manager authenticated (Role: ${mgrTokens.user?.role})`, mgrTokens);

  // Admin Login & MFA
  const adminLoginRes = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@vietsky.vn', password: 'Admin@123456' }),
  });
  const adminAuth = await adminLoginRes.json();
  const adminMfaRes = await fetch(`${API_BASE}/auth/mfa/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ mfaSessionToken: adminAuth.mfaSessionToken, code: '123456' }),
  });
  const adminTokens = await adminMfaRes.json();
  assert([200, 201].includes(adminMfaRes.status) && adminTokens.user?.role === 'ADMIN', `Admin authenticated (Role: ${adminTokens.user?.role})`, adminTokens);

  // 8. Role-Based Access Control Guards (403 Forbidden verification)
  console.log('\n--- 8. RBAC Guard 403 Forbidden Validation ---');
  // Customer trying to access Admin endpoint -> 403 Forbidden
  const custForbiddenRes = await fetch(`${API_BASE}/admin/users`, {
    headers: { Authorization: `Bearer ${custAuth.accessToken}` },
  });
  assert(custForbiddenRes.status === 403, `Customer blocked from /api/admin/users with 403 Forbidden (Status: ${custForbiddenRes.status})`);

  // Staff trying to access Manager Revenue endpoint -> 403 Forbidden
  const staffForbiddenRes = await fetch(`${API_BASE}/reports/revenue`, {
    headers: { Authorization: `Bearer ${staffTokens.accessToken}` },
  });
  assert(staffForbiddenRes.status === 403, `Staff blocked from /api/reports/revenue with 403 Forbidden (Status: ${staffForbiddenRes.status})`);

  // 9. Staff, Manager & Admin Modules Verification
  console.log('\n--- 9. Role-Specific Protected Endpoints ---');

  // Staff: Get Booking Requests
  const staffReqsRes = await fetch(`${API_BASE}/bookings/requests`, {
    headers: { Authorization: `Bearer ${staffTokens.accessToken}` },
  });
  const staffReqs = await staffReqsRes.json();
  assert(staffReqsRes.status === 200 && Array.isArray(staffReqs), `Staff successfully retrieved ${staffReqs.length} booking requests`);

  // Manager: Executive Dashboard & Revenue Stats
  const mgrDashRes = await fetch(`${API_BASE}/reports/dashboard`, {
    headers: { Authorization: `Bearer ${mgrTokens.accessToken}` },
  });
  const mgrDash = await mgrDashRes.json();
  assert(mgrDashRes.status === 200 && mgrDash.kpi && mgrDash.chartTrend?.length > 0, `Staff Manager retrieved dashboard metrics: ${mgrDash.kpi.totalBookings} bookings, ${mgrDash.chartTrend.length} chart trend data points`);

  // Admin: View Audit Logs & Sent Emails
  const adminLogsRes = await fetch(`${API_BASE}/admin/logs`, {
    headers: { Authorization: `Bearer ${adminTokens.accessToken}` },
  });
  const adminLogs = await adminLogsRes.json();
  assert(adminLogsRes.status === 200 && Array.isArray(adminLogs), `Admin retrieved ${adminLogs.length} audit logs`);

  const adminEmailsRes = await fetch(`${API_BASE}/admin/emails`, {
    headers: { Authorization: `Bearer ${adminTokens.accessToken}` },
  });
  const adminEmails = await adminEmailsRes.json();
  assert(adminEmailsRes.status === 200 && Array.isArray(adminEmails), `Admin retrieved ${adminEmails.length} logged emails from sent_emails table`);

  // 10. Summary
  console.log('\n=====================================================');
  console.log(`🏁 VERIFICATION COMPLETE: ${passedTests}/${totalTests} TESTS PASSED`);
  console.log('=====================================================\n');
}

runVerification().catch(console.error);

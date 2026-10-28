export function generateTicketEmailHtml(booking: any): string {
  const pnr = booking.pnr;
  const customerName = booking.customerName || 'Quý khách';
  const tickets = booking.tickets || [];
  const primaryTicket = tickets[0] || {};
  const flight = primaryTicket.flight || {};
  const origin = flight.originAirport || { code: 'SGN', city: 'Hồ Chí Minh', name: 'Tân Sơn Nhất' };
  const destination = flight.destinationAirport || { code: 'HAN', city: 'Hà Nội', name: 'Nội Bài' };
  const aircraft = flight.aircraft || { model: 'Airbus A321neo', registrationNumber: 'VN-A321' };

  const depDate = flight.departureTime ? new Date(flight.departureTime) : new Date();
  const arrDate = flight.arrivalTime ? new Date(flight.arrivalTime) : new Date(depDate.getTime() + 2 * 3600 * 1000);
  const boardingDate = new Date(depDate.getTime() - 40 * 60 * 1000);

  const formatTime = (d: Date) =>
    d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', hour12: false });
  const formatDate = (d: Date) =>
    d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });

  // Generate HTML for each ticket
  const ticketsHtml = tickets
    .map((tkt: any, idx: number) => {
      const pax = tkt.passenger || booking.passengers?.[idx] || booking.passengers?.[0] || {};
      const fullName = `${(pax.lastName || '').toUpperCase()} / ${(pax.firstName || '').toUpperCase()} ${
        pax.passengerType === 'ADULT' ? 'MR/MS' : pax.passengerType === 'CHILD' ? 'CHD' : 'INF'
      }`;
      const passport = pax.passportNumber || 'N/A';
      const cabin = (tkt.cabinClass || 'ECONOMY').toUpperCase();
      const seat = tkt.seat?.seatNumber || '12A';
      const gate = `Gate ${((pnr.charCodeAt(0) + idx * 3) % 16) + 1}`;
      const baggage = cabin === 'FIRST' ? '40kg Ký gửi + 18kg Xách tay' : cabin === 'BUSINESS' ? '32kg Ký gửi + 14kg Xách tay' : '23kg Ký gửi + 12kg Xách tay';

      return `
        <div style="background: #ffffff; border: 2px solid #e2e8f0; border-radius: 12px; margin-bottom: 20px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.06);">
          <!-- Ticket Header -->
          <div style="background: linear-gradient(135deg, #0a1a38 0%, #0f2b5c 100%); color: #ffffff; padding: 12px 18px; display: flex; justify-content: space-between; align-items: center;">
            <div>
              <span style="font-weight: 900; font-size: 14px; color: #f59e0b; letter-spacing: 1px;">HẠT GẠO SKY</span>
              <span style="font-size: 11px; color: #cbd5e1; margin-left: 8px;">· THẺ LÊN TÀU BAY ĐIỆN TỬ</span>
            </div>
            <div style="text-align: right;">
              <span style="background: #f59e0b; color: #0a1a38; font-weight: bold; font-size: 10px; padding: 3px 8px; border-radius: 6px; text-transform: uppercase;">
                ${cabin}
              </span>
            </div>
          </div>

          <!-- Ticket Content -->
          <div style="padding: 18px;">
            <!-- Passenger info -->
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 14px;">
              <tr>
                <td style="width: 60%; vertical-align: top;">
                  <span style="font-size: 10px; color: #64748b; font-weight: bold; text-transform: uppercase;">Hành khách / Passenger Name</span>
                  <div style="font-size: 16px; font-weight: 900; color: #0f172a; font-family: monospace;">${fullName}</div>
                  <span style="font-size: 11px; color: #64748b;">CCCD/Hộ chiếu: <strong>${passport}</strong> · Vé: <strong>${tkt.ticketNumber}</strong></span>
                </td>
                <td style="width: 40%; text-align: right; vertical-align: top;">
                  <span style="font-size: 10px; color: #64748b; font-weight: bold; text-transform: uppercase;">Mã đặt chỗ (PNR)</span>
                  <div style="font-size: 22px; font-weight: 900; color: #0f2b5c; letter-spacing: 2px; font-family: monospace;">${pnr}</div>
                  <span style="font-size: 11px; color: #64748b;">Tàu bay: <strong>${aircraft.model}</strong></span>
                </td>
              </tr>
            </table>

            <!-- Route Banner -->
            <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 12px 16px; margin-bottom: 14px;">
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="width: 40%; text-align: left;">
                    <div style="font-size: 26px; font-weight: 900; color: #0f172a; font-family: monospace;">${origin.code}</div>
                    <div style="font-size: 12px; font-weight: bold; color: #334155;">${origin.city}</div>
                    <div style="font-size: 11px; color: #64748b;">Khởi hành: <strong>${formatTime(depDate)}</strong></div>
                  </td>
                  <td style="width: 20%; text-align: center;">
                    <span style="font-size: 20px;">✈</span>
                    <div style="font-size: 9px; color: #10b981; font-weight: bold; background: #ecfdf5; padding: 2px 6px; border-radius: 4px; display: inline-block;">Bay thẳng</div>
                  </td>
                  <td style="width: 40%; text-align: right;">
                    <div style="font-size: 26px; font-weight: 900; color: #0f172a; font-family: monospace;">${destination.code}</div>
                    <div style="font-size: 12px; font-weight: bold; color: #334155;">${destination.city}</div>
                    <div style="font-size: 11px; color: #64748b;">Hạ cánh: <strong>${formatTime(arrDate)}</strong></div>
                  </td>
                </tr>
              </table>
            </div>

            <!-- Specs Grid -->
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 14px; text-align: center;">
              <tr>
                <td style="background: #f1f5f9; padding: 8px; border-radius: 8px; border: 1px solid #e2e8f0; width: 20%;">
                  <span style="font-size: 9px; color: #64748b; font-weight: bold; text-transform: uppercase;">Chuyến bay</span>
                  <div style="font-size: 13px; font-weight: 900; color: #0f2b5c; font-family: monospace;">${flight.flightNumber || 'VSK-108'}</div>
                </td>
                <td style="width: 2%;"></td>
                <td style="background: #f1f5f9; padding: 8px; border-radius: 8px; border: 1px solid #e2e8f0; width: 20%;">
                  <span style="font-size: 9px; color: #64748b; font-weight: bold; text-transform: uppercase;">Ngày bay</span>
                  <div style="font-size: 12px; font-weight: bold; color: #1e293b;">${formatDate(depDate)}</div>
                </td>
                <td style="width: 2%;"></td>
                <td style="background: #fef3c7; padding: 8px; border-radius: 8px; border: 1px solid #fde68a; width: 20%;">
                  <span style="font-size: 9px; color: #92400e; font-weight: bold; text-transform: uppercase;">Giờ lên tàu</span>
                  <div style="font-size: 14px; font-weight: 900; color: #78350f; font-family: monospace;">${formatTime(boardingDate)}</div>
                </td>
                <td style="width: 2%;"></td>
                <td style="background: #f1f5f9; padding: 8px; border-radius: 8px; border: 1px solid #e2e8f0; width: 16%;">
                  <span style="font-size: 9px; color: #64748b; font-weight: bold; text-transform: uppercase;">Cổng</span>
                  <div style="font-size: 13px; font-weight: 900; color: #0f172a; font-family: monospace;">${gate}</div>
                </td>
                <td style="width: 2%;"></td>
                <td style="background: #0f2b5c; color: #ffffff; padding: 8px; border-radius: 8px; width: 16%;">
                  <span style="font-size: 9px; color: #fbbf24; font-weight: bold; text-transform: uppercase;">Ghế</span>
                  <div style="font-size: 16px; font-weight: 900; font-family: monospace;">${seat}</div>
                </td>
              </tr>
            </table>

            <!-- Notice & Baggage -->
            <div style="background: #fffbeb; border: 1px solid #fef3c7; border-radius: 8px; padding: 8px 12px; font-size: 11px; color: #92400e; margin-bottom: 12px;">
              ⚠️ <strong>Lưu ý cửa ra máy bay:</strong> Cửa đóng 15 phút trước giờ khởi hành (Lúc ${formatTime(new Date(depDate.getTime() - 15 * 60 * 1000))}). Hành lý miễn cước: <strong>${baggage}</strong>.
            </div>

            <!-- Barcode simulation -->
            <div style="text-align: center; background: #ffffff; border: 1px solid #cbd5e1; border-radius: 6px; padding: 8px;">
              <div style="font-family: monospace; letter-spacing: 4px; font-size: 18px; font-weight: bold; color: #0f172a;">
                |||||| | |||| |||||||| |||| |||||||||| ||||| ||||||| ||| ||||||||
              </div>
              <div style="font-family: monospace; font-size: 9px; color: #64748b; letter-spacing: 1px; margin-top: 4px;">
                M1${(pax.lastName || 'KHACH').toUpperCase()}/${(pax.firstName || 'AN').toUpperCase()} E${pnr} ${origin.code}${destination.code}VSK ${flight.flightNumber || '0108'}
              </div>
            </div>
          </div>
        </div>
      `;
    })
    .join('');

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Vé máy bay điện tử - Hạt Gạo Sky (PNR: ${pnr})</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
  <div style="max-width: 650px; margin: 30px auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(15, 43, 92, 0.1);">
    
    <!-- Hero Brand Header -->
    <div style="background: linear-gradient(135deg, #071739 0%, #0f2b5c 50%, #1740a3 100%); padding: 30px 24px; text-align: center; color: #ffffff;">
      <div style="display: inline-block; width: 44px; height: 44px; line-height: 44px; font-size: 26px; background: rgba(245, 158, 11, 0.2); border: 1px solid rgba(245, 158, 11, 0.4); border-radius: 12px; margin-bottom: 8px;">
        🪷
      </div>
      <h1 style="margin: 0; font-size: 24px; font-weight: 900; letter-spacing: 2px; color: #fbbf24;">HẠT GẠO SKY</h1>
      <p style="margin: 4px 0 0 0; font-size: 11px; text-transform: uppercase; letter-spacing: 2px; color: #94a3b8;">
        HÃNG HÀNG KHÔNG QUỐC GIA VIỆT NAM · NATIONAL CARRIER OF VIETNAM
      </p>
    </div>

    <!-- Confirmation Salutation Banner -->
    <div style="padding: 24px 24px 16px 24px; text-align: center;">
      <h2 style="margin: 0 0 6px 0; color: #0f172a; font-size: 20px; font-weight: 800;">
        Xác nhận Đặt vé & Thẻ lên tàu bay điện tử
      </h2>
      <p style="margin: 0; color: #64748b; font-size: 13px;">
        Cảm ơn <strong>${customerName}</strong> đã tin tưởng lựa chọn đồng hành cùng <strong>Hạt Gạo Sky</strong>!
      </p>

      <div style="display: inline-block; margin-top: 14px; padding: 10px 20px; background: #eff6ff; border: 2px dashed #3b82f6; border-radius: 10px;">
        <span style="font-size: 11px; font-weight: bold; color: #1e40af; text-transform: uppercase; display: block;">MÃ ĐẶT CHỖ CỦA BẠN (PNR)</span>
        <span style="font-size: 26px; font-weight: 900; color: #0f2b5c; letter-spacing: 3px; font-family: monospace;">${pnr}</span>
      </div>
    </div>

    <!-- Tickets List -->
    <div style="padding: 0 24px;">
      <h3 style="margin: 0 0 12px 0; font-size: 14px; color: #334155; text-transform: uppercase; letter-spacing: 1px;">
        Danh sách Thẻ lên tàu bay (${tickets.length} vé)
      </h3>
      ${ticketsHtml}
    </div>

    <!-- Payment Summary Box -->
    <div style="margin: 10px 24px 24px 24px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px;">
      <h4 style="margin: 0 0 10px 0; font-size: 13px; color: #0f172a;">Chi tiết thanh toán đơn hàng</h4>
      <table style="width: 100%; font-size: 12px; color: #475569;">
        <tr>
          <td style="padding: 4px 0;">Tổng tiền thanh toán:</td>
          <td style="padding: 4px 0; text-align: right; font-weight: bold; color: #0f172a; font-size: 14px;">${booking.totalAmount?.toLocaleString('vi-VN')} VND</td>
        </tr>
        <tr>
          <td style="padding: 4px 0;">Đã thanh toán:</td>
          <td style="padding: 4px 0; text-align: right; font-weight: bold; color: #10b981;">${booking.paidAmount?.toLocaleString('vi-VN')} VND</td>
        </tr>
        <tr>
          <td style="padding: 4px 0;">Trạng thái đặt chỗ:</td>
          <td style="padding: 4px 0; text-align: right; font-weight: bold; color: #0f2b5c;">${booking.status || 'CONFIRMED'}</td>
        </tr>
      </table>
    </div>

    <!-- Important Guidelines for Travel -->
    <div style="margin: 0 24px 24px 24px; padding: 16px; background: #f1f5f9; border-radius: 12px; font-size: 11px; color: #475569; line-height: 1.6;">
      <h4 style="margin: 0 0 8px 0; font-size: 12px; color: #0f172a;">Hướng dẫn thủ tục trước chuyến bay:</h4>
      <ul style="margin: 0; padding-left: 18px;">
        <li>Quý khách vui lòng có mặt tại sân bay ít nhất <strong>02 tiếng trước giờ khởi hành</strong> đối với chuyến bay nội địa, và <strong>03 tiếng</strong> đối với chuyến bay quốc tế.</li>
        <li>Mang theo <strong>CCCD / Hộ chiếu bản gốc hợp lệ</strong> và xuất trình email này hoặc mã đặt chỗ <strong>${pnr}</strong> tại quầy làm thủ tục.</li>
        <li>Quý khách có thể quản lý chỗ ngồi, mua thêm hành lý ký gửi hoặc xuất trình mã vé tại website: <a href="http://localhost:3000/vi/manage-booking?pnr=${pnr}" style="color: #0f2b5c; font-weight: bold;">Quản lý đặt chỗ Hạt Gạo Sky</a>.</li>
      </ul>
    </div>

    <!-- Email Footer -->
    <div style="background: #0a1a38; color: #94a3b8; padding: 24px; text-align: center; font-size: 11px;">
      <p style="margin: 0 0 6px 0; font-size: 12px; color: #ffffff; font-weight: bold;">
        HẠT GẠO SKY AIRLINES JOINT STOCK COMPANY
      </p>
      <p style="margin: 0 0 6px 0;">
        Tổng đài chăm sóc khách hàng 24/7: <strong style="color: #fbbf24;">1900 6868</strong> · Email: <strong style="color: #ffffff;">contact@hatgaosky.vn</strong>
      </p>
      <p style="margin: 0; font-size: 10px; color: #64748b;">
        © 2026 Hạt Gạo Sky. Giấy phép kinh doanh vận chuyển hàng không cấp bởi Cục Hàng không Việt Nam (CAAV).
      </p>
    </div>

  </div>
</body>
</html>
  `;
}

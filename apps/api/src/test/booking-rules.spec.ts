describe('VietSky Airlines - Business Rule Verification', () => {
  describe('1. Passenger Age & Family Traveling Rules', () => {
    function validatePassengers(passengers: Array<{ type: string; age: number }>) {
      let adultCount = 0;
      let childCount = 0;
      let infantCount = 0;

      for (const p of passengers) {
        if (p.type === 'INFANT') {
          if (p.age >= 2) throw new Error('Infant must be under 2 years old');
          infantCount++;
        } else if (p.type === 'CHILD') {
          if (p.age < 2 || p.age >= 12) throw new Error('Child must be between 2 and 11 years old');
          childCount++;
        } else {
          if (p.age < 12) throw new Error('Adult must be at least 12 years old');
          adultCount++;
        }
      }

      if ((childCount > 0 || infantCount > 0) && adultCount === 0) {
        throw new Error('Children and infants must be accompanied by an adult');
      }
      if (infantCount > adultCount) {
        throw new Error('Only 1 infant per adult is allowed');
      }
      return true;
    }

    it('should reject a child booking without an accompanying adult', () => {
      expect(() =>
        validatePassengers([{ type: 'CHILD', age: 7 }]),
      ).toThrow('Children and infants must be accompanied by an adult');
    });

    it('should reject an infant with age 3', () => {
      expect(() =>
        validatePassengers([
          { type: 'ADULT', age: 32 },
          { type: 'INFANT', age: 3 },
        ]),
      ).toThrow('Infant must be under 2 years old');
    });

    it('should reject multiple infants for a single adult', () => {
      expect(() =>
        validatePassengers([
          { type: 'ADULT', age: 30 },
          { type: 'INFANT', age: 1 },
          { type: 'INFANT', age: 1 },
        ]),
      ).toThrow('Only 1 infant per adult is allowed');
    });

    it('should allow valid family booking (1 adult, 1 child, 1 infant)', () => {
      expect(
        validatePassengers([
          { type: 'ADULT', age: 35 },
          { type: 'CHILD', age: 6 },
          { type: 'INFANT', age: 1 },
        ]),
      ).toBe(true);
    });
  });

  describe('2. Seat Hold TTL & Concurrency Protection', () => {
    it('should treat seat as available if hold TTL has expired', () => {
      const now = new Date('2026-10-27T10:00:00Z');
      const expiredHeldUntil = new Date('2026-10-27T09:55:00Z');

      const isSeatLocked = (status: string, heldUntil: Date, session: string, currentSession: string) => {
        if (status === 'BOOKED') return true;
        if (status === 'HELD' && heldUntil > now && session !== currentSession) return true;
        return false;
      };

      // Expired hold can be acquired by a new session
      expect(isSeatLocked('HELD', expiredHeldUntil, 'old-session', 'new-session')).toBe(false);
    });

    it('should block another session if seat is actively held within TTL', () => {
      const now = new Date('2026-10-27T10:00:00Z');
      const activeHeldUntil = new Date('2026-10-27T10:14:00Z');

      const isSeatLocked = (status: string, heldUntil: Date, session: string, currentSession: string) => {
        if (status === 'BOOKED') return true;
        if (status === 'HELD' && heldUntil > now && session !== currentSession) return true;
        return false;
      };

      expect(isSeatLocked('HELD', activeHeldUntil, 'user-A', 'user-B')).toBe(true);
      expect(isSeatLocked('HELD', activeHeldUntil, 'user-A', 'user-A')).toBe(false);
    });
  });

  describe('3. Payment & Prepayment Rules', () => {
    it('should require at least 30% for prepayment', () => {
      const totalAmount = 5000000;
      const minThreshold = totalAmount * 0.3; // 1,500,000

      const validatePrepay = (amount: number) => {
        if (amount < minThreshold) throw new Error('Minimum prepayment is 30%');
        return true;
      };

      expect(() => validatePrepay(1000000)).toThrow('Minimum prepayment is 30%');
      expect(validatePrepay(1500000)).toBe(true);
      expect(validatePrepay(2000000)).toBe(true);
    });

    it('should set status to CONFIRMED on full payment and PARTIALLY_PAID on partial', () => {
      const calculateStatus = (paid: number, total: number) => {
        if (paid >= total) return 'CONFIRMED';
        if (paid > 0) return 'PARTIALLY_PAID';
        return 'PENDING_PAYMENT';
      };

      expect(calculateStatus(0, 3000000)).toBe('PENDING_PAYMENT');
      expect(calculateStatus(1000000, 3000000)).toBe('PARTIALLY_PAID');
      expect(calculateStatus(3000000, 3000000)).toBe('CONFIRMED');
    });
  });

  describe('4. Cancellation Rules & Refund Calculation', () => {
    it('should deduct cancellation penalty and refund remaining amount', () => {
      const fareRulePenaltyPerTicket = 300000;

      const calculateRefund = (ticketCount: number, paidAmount: number) => {
        const totalPenalty = ticketCount * fareRulePenaltyPerTicket;
        const refundAmount = Math.max(0, paidAmount - totalPenalty);
        return { penalty: totalPenalty, refund: refundAmount };
      };

      const result = calculateRefund(2, 4000000);
      expect(result.penalty).toBe(600000);
      expect(result.refund).toBe(3400000);

      // If penalty exceeds paid amount
      const zeroRefund = calculateRefund(2, 500000);
      expect(zeroRefund.refund).toBe(0);
    });
  });
});

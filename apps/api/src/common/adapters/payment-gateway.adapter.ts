import { Injectable, Logger } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';

export interface PaymentRequest {
  bookingId: string;
  amount: number;
  method: 'CREDIT_CARD' | 'EWALLET' | 'BANK_TRANSFER';
  cardDetails?: {
    cardNumber: string;
    cardHolder: string;
    expiryDate: string;
    cvv: string;
  };
  ewalletProvider?: 'MOMO' | 'ZALOPAY' | 'VNPAY';
}

export interface PaymentResult {
  success: boolean;
  transactionCode: string;
  gatewayRef: string;
  cardLastFour?: string;
  qrPayload?: string;
  errorMessage?: string;
}

export interface RefundRequest {
  transactionCode: string;
  amount: number;
  reason: string;
}

export interface RefundResult {
  success: boolean;
  refundRef: string;
  refundedAmount: number;
  errorMessage?: string;
}

export abstract class PaymentGatewayAdapter {
  abstract processPayment(req: PaymentRequest): Promise<PaymentResult>;
  abstract processRefund(req: RefundRequest): Promise<RefundResult>;
}

@Injectable()
export class MockPaymentGatewayAdapter implements PaymentGatewayAdapter {
  private readonly logger = new Logger('PaymentGatewayAdapter');

  async processPayment(req: PaymentRequest): Promise<PaymentResult> {
    const txnCode = `TXN-${Date.now().toString().slice(-8)}${Math.floor(100 + Math.random() * 900)}`;
    const gatewayRef = `GW-${uuidv4().slice(0, 8).toUpperCase()}`;

    this.logger.log(`💳 [PAYMENT PROCESS] Method: ${req.method} | Amount: ${req.amount.toLocaleString()} VND | Txn: ${txnCode}`);

    if (req.method === 'CREDIT_CARD') {
      const cardNum = req.cardDetails?.cardNumber || '4242424242424242';
      const lastFour = cardNum.replace(/\s+/g, '').slice(-4) || '4242';
      return {
        success: true,
        transactionCode: txnCode,
        gatewayRef,
        cardLastFour: lastFour,
      };
    }

    if (req.method === 'EWALLET') {
      return {
        success: true,
        transactionCode: txnCode,
        gatewayRef,
        qrPayload: `vietqr://ewallet/${req.ewalletProvider || 'MOMO'}?amount=${req.amount}&txn=${txnCode}`,
      };
    }

    if (req.method === 'BANK_TRANSFER') {
      return {
        success: true,
        transactionCode: txnCode,
        gatewayRef,
        qrPayload: `00020101021238540010A000000727012400069704220110VIETSKY9990208QRIBFTTA520460115303704540${req.amount}5802VN62170813VIETSKY${txnCode.slice(-6)}6304ABCD`,
      };
    }

    return {
      success: true,
      transactionCode: txnCode,
      gatewayRef,
    };
  }

  async processRefund(req: RefundRequest): Promise<RefundResult> {
    const refundRef = `RFD-${uuidv4().slice(0, 8).toUpperCase()}`;
    this.logger.log(`🔄 [REFUND PROCESS] Ref: ${refundRef} | Orig Txn: ${req.transactionCode} | Amount: ${req.amount.toLocaleString()} VND`);

    return {
      success: true,
      refundRef,
      refundedAmount: req.amount,
    };
  }
}

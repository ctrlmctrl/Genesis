import QRCode from 'qrcode';

export interface PaymentDetails {
  amount: number;
  upiId: string;
  merchantName: string;
  transactionId: string;
  description: string;
}

export class PaymentService {
  generateUPIQRCode(paymentDetails: PaymentDetails): Promise<string> {
    const upiString = `upi://pay?pa=${paymentDetails.upiId}&pn=${paymentDetails.merchantName}&am=${paymentDetails.amount}&cu=INR&tn=${paymentDetails.description}&tr=${paymentDetails.transactionId}`;
    
    return QRCode.toDataURL(upiString, {
      width: 300,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    });
  }

  generateUPILink(paymentDetails: PaymentDetails): string {
    return `upi://pay?pa=${paymentDetails.upiId}&pn=${paymentDetails.merchantName}&am=${paymentDetails.amount}&cu=INR&tn=${paymentDetails.description}&tr=${paymentDetails.transactionId}`;
  }

  generatePaymentId(): string {
    return 'PAY_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  generatePaymentIdentifier(): string {
    // Generate a unique identifier for UPI transaction matching
    const timestamp = Date.now().toString();
    const random = Math.random().toString(36).substr(2, 6).toUpperCase();
    return `GEN${timestamp.slice(-6)}${random}`;
  }

  formatAmount(amount: number): string {
    return `₹${amount.toFixed(2)}`;
  }

  validateUPIId(upiId: string): boolean {
    const upiRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+$/;
    return upiRegex.test(upiId);
  }
}

export const paymentService = new PaymentService();

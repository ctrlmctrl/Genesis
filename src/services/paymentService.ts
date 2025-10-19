import QRCode from 'qrcode';

export interface PaymentDetails {
  amount: number;
  upiId: string;
  description: string;
}

export class PaymentService {
  generateUPIQRCode(paymentDetails: PaymentDetails): Promise<string> {
    const upiString = `upi://pay?pa=${paymentDetails.upiId}&am=${paymentDetails.amount}&cu=INR&tn=${paymentDetails.description}`;
    
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
    return `upi://pay?pa=${paymentDetails.upiId}&am=${paymentDetails.amount}&cu=INR&tn=${paymentDetails.description}`;
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

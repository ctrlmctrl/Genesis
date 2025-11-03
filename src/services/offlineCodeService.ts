import { collection, addDoc, query, where, getDocs, updateDoc } from "firebase/firestore";
import { db } from "../firebase";
import { dataService } from './dataService';

export interface OfflinePaymentCode {
  id: string;
  code: string;
  eventId: string;
  amount: number;
  generatedBy: string; // Admin/Volunteer ID
  generatedAt: string;
  usedBy?: string; // Participant ID
  usedAt?: string;
  isUsed: boolean;
  expiresAt: string;
}

export class OfflineCodeService {
  private codes: OfflinePaymentCode[] = [];

  constructor() {
    this.loadCodesFromStorage();
  }

  private loadCodesFromStorage(): void {
    try {
      const stored = localStorage.getItem('offline_payment_codes');
      if (stored) {
        this.codes = JSON.parse(stored);
      }
    } catch (error) {
      console.error('Error loading offline payment codes:', error);
      this.codes = [];
    }
  }

  private saveCodesToStorage(): void {
    try {
      localStorage.setItem('offline_payment_codes', JSON.stringify(this.codes));
    } catch (error) {
      console.error('Error saving offline payment codes:', error);
    }
  }

  generateCode(eventId: string, amount: number, generatedBy: string): OfflinePaymentCode {
    // Generate a unique 6-character alphanumeric code
    const code = this.generateUniqueCode();

    // Set expiration to 24 hours from now
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    const newCode: OfflinePaymentCode = {
      id: `code_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      code,
      eventId,
      amount,
      generatedBy,
      generatedAt: new Date().toISOString(),
      isUsed: false,
      expiresAt: expiresAt.toISOString(),
    };

    this.codes.push(newCode);
    this.saveCodesToStorage();

    return newCode;
  }

  private generateUniqueCode(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';

    do {
      code = '';
      for (let i = 0; i < 6; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
      }
    } while (this.codes.some(c => c.code === code && !c.isUsed));

    return code;
  }

  validateCode(code: string): { isValid: boolean; codeData?: OfflinePaymentCode; error?: string } {
    const codeData = this.codes.find(c => c.code === code);

    if (!codeData) {
      return { isValid: false, error: 'Invalid code' };
    }

    if (codeData.isUsed) {
      return { isValid: false, error: 'Code has already been used' };
    }

    const now = new Date();
    const expiresAt = new Date(codeData.expiresAt);

    if (now > expiresAt) {
      return { isValid: false, error: 'Code has expired' };
    }

    return { isValid: true, codeData };
  }

  useCode(code: string, participantId: string): Promise<boolean> {
    return new Promise(async (resolve) => {
      const validation = this.validateCode(code);

      if (!validation.isValid || !validation.codeData) {
        resolve(false);
        return;
      }

      try {
        // Mark the code as used
        const codeIndex = this.codes.findIndex(c => c.code === code);
        if (codeIndex !== -1) {
          this.codes[codeIndex].isUsed = true;
          this.codes[codeIndex].usedBy = participantId;
          this.codes[codeIndex].usedAt = new Date().toISOString();
          this.saveCodesToStorage();
        }

        // Update participant payment status
        await dataService.updatePaymentStatus(
          participantId,
          'offline_paid',
          'offline'
        );

        resolve(true);
      } catch (error) {
        console.error('Error using offline payment code:', error);
        resolve(false);
      }
    });
  }

  getCodesByEvent(eventId: string): OfflinePaymentCode[] {
    return this.codes.filter(c => c.eventId === eventId);
  }

  getCodesByGenerator(generatedBy: string): OfflinePaymentCode[] {
    return this.codes.filter(c => c.generatedBy === generatedBy);
  }

  getUnusedCodes(): OfflinePaymentCode[] {
    return this.codes.filter(c => !c.isUsed && new Date(c.expiresAt) > new Date());
  }

  getUsedCodes(): OfflinePaymentCode[] {
    return this.codes.filter(c => c.isUsed);
  }

  getAllCodes(): OfflinePaymentCode[] {
    return [...this.codes];
  }

  // Clean up expired codes (call this periodically)
  cleanupExpiredCodes(): void {
    const now = new Date();
    this.codes = this.codes.filter(c => new Date(c.expiresAt) > now);
    this.saveCodesToStorage();
  }

  // Get statistics
  getCodeStats(): {
    total: number;
    used: number;
    unused: number;
    expired: number;
  } {
    const now = new Date();
    const total = this.codes.length;
    const used = this.codes.filter(c => c.isUsed).length;
    const expired = this.codes.filter(c => !c.isUsed && new Date(c.expiresAt) <= now).length;
    const unused = total - used - expired;

    return { total, used, unused, expired };
  }
}

export const offlineCodeService = new OfflineCodeService();

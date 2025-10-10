export interface QRCodeData {
  uniqueId: string;
  type: 'GENESIS_PARTICIPANT';
  version: string;
}

export class QRCodeService {
  private static readonly QR_VERSION = '1.0';
  private static readonly QR_PREFIX = 'GENESIS';

  /**
   * Generate a simple UUID-like unique identifier
   */
  private static generateSimpleUUID(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : ((r & 0x3) | 0x8);
      return v.toString(16);
    });
  }

  /**
   * Generate a unique QR code identifier
   * Format: GENESIS:1.0:unique-uuid
   */
  static generateUniqueQRCode(): string {
    const uniqueId = this.generateSimpleUUID();
    return `${this.QR_PREFIX}:${this.QR_VERSION}:${uniqueId}`;
  }

  /**
   * Parse QR code data to extract unique identifier
   */
  static parseQRCode(qrCode: string): QRCodeData | null {
    try {
      const parts = qrCode.split(':');
      
      if (parts.length !== 3) {
        return null;
      }

      const [prefix, version, uniqueId] = parts;

      if (prefix !== this.QR_PREFIX) {
        return null;
      }

      // Validate UUID format
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(uniqueId)) {
        return null;
      }

      return {
        uniqueId,
        type: 'GENESIS_PARTICIPANT',
        version
      };
    } catch (error) {
      console.error('Error parsing QR code:', error);
      return null;
    }
  }

  /**
   * Validate QR code format
   */
  static isValidQRCode(qrCode: string): boolean {
    const parsed = this.parseQRCode(qrCode);
    return parsed !== null;
  }

  /**
   * Get unique identifier from QR code
   */
  static getUniqueId(qrCode: string): string | null {
    const parsed = this.parseQRCode(qrCode);
    return parsed ? parsed.uniqueId : null;
  }
}

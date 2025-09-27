import QRCode from 'qrcode';

export const generateQRCode = async (data: string): Promise<string> => {
  try {
    const qrCodeDataURL = await QRCode.toDataURL(data, {
      width: 300,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    });
    return qrCodeDataURL;
  } catch (error) {
    console.error('Error generating QR code:', error);
    throw new Error('Failed to generate QR code');
  }
};

export const parseQRCodeData = (qrData: string): { eventId: string; participantId: string; email: string } | null => {
  try {
    // Expected format: EVENT:eventId:participantId:email:timestamp
    const parts = qrData.split(':');
    if (parts.length >= 5 && parts[0] === 'EVENT') {
      return {
        eventId: parts[1],
        participantId: parts[2],
        email: parts[3],
      };
    }
    return null;
  } catch (error) {
    console.error('Error parsing QR code data:', error);
    return null;
  }
};

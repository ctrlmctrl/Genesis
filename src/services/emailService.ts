interface EmailTemplate {
  subject: string;
  html: string;
  text: string;
}

interface PaymentNotificationData {
  participantName: string;
  eventTitle: string;
  paymentStatus: 'paid' | 'offline_paid' | 'failed';
  paymentMethod?: 'online' | 'offline';
  amount?: number;
  teamName?: string;
  isTeamLead?: boolean;
  participantEmail: string;
  teamLeadEmail?: string;
}

export class EmailService {
  private generatePaymentVerifiedTemplate(data: PaymentNotificationData): EmailTemplate {
    const subject = `Payment Verified - ${data.eventTitle}`;
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Payment Verified</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #06b6d4, #3b82f6); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f8fafc; padding: 30px; border-radius: 0 0 10px 10px; }
          .status-badge { display: inline-block; background: #10b981; color: white; padding: 8px 16px; border-radius: 20px; font-weight: bold; }
          .event-details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #06b6d4; }
          .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎉 Payment Verified!</h1>
            <p>Your registration is now confirmed</p>
          </div>
          <div class="content">
            <p>Dear ${data.participantName},</p>
            
            <p>Great news! Your payment for <strong>${data.eventTitle}</strong> has been verified and your registration is now confirmed.</p>
            
            <div class="event-details">
              <h3>Event Details</h3>
              <p><strong>Event:</strong> ${data.eventTitle}</p>
              <p><strong>Payment Status:</strong> <span class="status-badge">✓ Verified</span></p>
              <p><strong>Payment Method:</strong> ${data.paymentMethod === 'online' ? 'Online UPI' : 'Offline'}</p>
              ${data.amount ? `<p><strong>Amount:</strong> ₹${data.amount}</p>` : ''}
              ${data.teamName ? `<p><strong>Team:</strong> ${data.teamName}</p>` : ''}
              ${data.isTeamLead ? `<p><strong>Role:</strong> Team Lead</p>` : ''}
            </div>
            
            <p>You can now access your QR code and event details from your participant dashboard.</p>
            
            <p>We look forward to seeing you at the event!</p>
            
            <div class="footer">
              <p>Best regards,<br>Genesis Events Team</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;
    
    const text = `
Payment Verified - ${data.eventTitle}

Dear ${data.participantName},

Great news! Your payment for ${data.eventTitle} has been verified and your registration is now confirmed.

Event Details:
- Event: ${data.eventTitle}
- Payment Status: Verified
- Payment Method: ${data.paymentMethod === 'online' ? 'Online UPI' : 'Offline'}
${data.amount ? `- Amount: ₹${data.amount}` : ''}
${data.teamName ? `- Team: ${data.teamName}` : ''}
${data.isTeamLead ? `- Role: Team Lead` : ''}

You can now access your QR code and event details from your participant dashboard.

We look forward to seeing you at the event!

Best regards,
Genesis Events Team
    `;
    
    return { subject, html, text };
  }

  private generatePaymentFailedTemplate(data: PaymentNotificationData): EmailTemplate {
    const subject = `Payment Verification Failed - ${data.eventTitle}`;
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Payment Verification Failed</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #ef4444, #dc2626); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f8fafc; padding: 30px; border-radius: 0 0 10px 10px; }
          .status-badge { display: inline-block; background: #ef4444; color: white; padding: 8px 16px; border-radius: 20px; font-weight: bold; }
          .event-details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ef4444; }
          .action-button { display: inline-block; background: #06b6d4; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 10px 0; }
          .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>⚠️ Payment Verification Failed</h1>
            <p>Action required to complete your registration</p>
          </div>
          <div class="content">
            <p>Dear ${data.participantName},</p>
            
            <p>We were unable to verify your payment for <strong>${data.eventTitle}</strong>. This could be due to:</p>
            
            <ul>
              <li>Unclear or incomplete receipt image</li>
              <li>Receipt doesn't match the payment amount</li>
              <li>Receipt is from a different transaction</li>
              <li>Image quality is too poor to read</li>
            </ul>
            
            <div class="event-details">
              <h3>Event Details</h3>
              <p><strong>Event:</strong> ${data.eventTitle}</p>
              <p><strong>Payment Status:</strong> <span class="status-badge">✗ Verification Failed</span></p>
              <p><strong>Payment Method:</strong> ${data.paymentMethod === 'online' ? 'Online UPI' : 'Offline'}</p>
              ${data.amount ? `<p><strong>Amount:</strong> ₹${data.amount}</p>` : ''}
              ${data.teamName ? `<p><strong>Team:</strong> ${data.teamName}</p>` : ''}
              ${data.isTeamLead ? `<p><strong>Role:</strong> Team Lead</p>` : ''}
            </div>
            
            <p><strong>What you need to do:</strong></p>
            <ol>
              <li>Go to your participant dashboard</li>
              <li>Find this event in your registrations</li>
              <li>Click "Re-upload Receipt"</li>
              <li>Upload a clear, high-quality image of your payment receipt</li>
            </ol>
            
            <p>Please ensure the receipt clearly shows:</p>
            <ul>
              <li>Payment amount (₹${data.amount || 'X'})</li>
              <li>Transaction date and time</li>
              <li>UPI ID or payment reference</li>
            </ul>
            
            <div class="footer">
              <p>If you have any questions, please contact our support team.</p>
              <p>Best regards,<br>Genesis Events Team</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;
    
    const text = `
Payment Verification Failed - ${data.eventTitle}

Dear ${data.participantName},

We were unable to verify your payment for ${data.eventTitle}. This could be due to:

- Unclear or incomplete receipt image
- Receipt doesn't match the payment amount
- Receipt is from a different transaction
- Image quality is too poor to read

Event Details:
- Event: ${data.eventTitle}
- Payment Status: Verification Failed
- Payment Method: ${data.paymentMethod === 'online' ? 'Online UPI' : 'Offline'}
${data.amount ? `- Amount: ₹${data.amount}` : ''}
${data.teamName ? `- Team: ${data.teamName}` : ''}
${data.isTeamLead ? `- Role: Team Lead` : ''}

What you need to do:
1. Go to your participant dashboard
2. Find this event in your registrations
3. Click "Re-upload Receipt"
4. Upload a clear, high-quality image of your payment receipt

Please ensure the receipt clearly shows:
- Payment amount (₹${data.amount || 'X'})
- Transaction date and time
- UPI ID or payment reference

If you have any questions, please contact our support team.

Best regards,
Genesis Events Team
    `;
    
    return { subject, html, text };
  }

  async sendPaymentNotification(data: PaymentNotificationData): Promise<boolean> {
    try {
      // In a real implementation, you would integrate with an email service like:
      // - SendGrid
      // - AWS SES
      // - Mailgun
      // - Nodemailer with SMTP
      
      // For now, we'll simulate the email sending
      console.log('Sending payment notification email:', {
        to: data.participantEmail,
        subject: data.paymentStatus === 'failed' 
          ? this.generatePaymentFailedTemplate(data).subject
          : this.generatePaymentVerifiedTemplate(data).subject,
        data
      });
      
      // Simulate email sending delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // If this is a team event and the participant is not the team lead,
      // also send notification to team lead
      if (data.teamLeadEmail && data.teamLeadEmail !== data.participantEmail) {
        console.log('Sending team lead notification:', {
          to: data.teamLeadEmail,
          subject: data.paymentStatus === 'failed' 
            ? this.generatePaymentFailedTemplate(data).subject
            : this.generatePaymentVerifiedTemplate(data).subject,
          data
        });
      }
      
      return true;
    } catch (error) {
      console.error('Error sending payment notification email:', error);
      return false;
    }
  }

  // Method to send email to team lead when any team member's payment status changes
  async sendTeamLeadNotification(teamLeadEmail: string, teamMemberName: string, eventTitle: string, paymentStatus: 'paid' | 'offline_paid' | 'failed'): Promise<boolean> {
    try {
      const subject = `Team Member Payment Update - ${eventTitle}`;
      const message = `
        Team member ${teamMemberName}'s payment for ${eventTitle} has been ${paymentStatus === 'failed' ? 'rejected' : 'verified'}.
        ${paymentStatus === 'failed' ? 'Please ask them to re-upload their payment receipt.' : 'Your team registration is progressing well!'}
      `;
      
      console.log('Sending team lead notification:', {
        to: teamLeadEmail,
        subject,
        message
      });
      
      return true;
    } catch (error) {
      console.error('Error sending team lead notification:', error);
      return false;
    }
  }
}

export const emailService = new EmailService();

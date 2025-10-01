import ExcelJS from 'exceljs';
// @ts-ignore
import { saveAs } from 'file-saver';
import { Participant, Event } from '../types';

export class ExcelService {
  async exportParticipantsToExcel(participants: Participant[], event: Event): Promise<void> {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Participants');

    // Add headers
    worksheet.columns = [
      { header: 'S.No', key: 'sno', width: 10 },
      { header: 'Full Name', key: 'fullName', width: 20 },
      { header: 'Email', key: 'email', width: 25 },
      { header: 'Phone', key: 'phone', width: 15 },
      { header: 'College', key: 'college', width: 20 },
      { header: 'Registration Date', key: 'registrationDate', width: 20 },
      { header: 'Payment Status', key: 'paymentStatus', width: 15 },
      { header: 'Payment Method', key: 'paymentMethod', width: 15 },
      { header: 'Verification Status', key: 'verificationStatus', width: 15 },
      { header: 'Verification Time', key: 'verificationTime', width: 20 },
      { header: 'Team Name', key: 'teamName', width: 15 },
      { header: 'Team Lead', key: 'isTeamLead', width: 10 },
    ];

    // Add data
    participants.forEach((participant, index) => {
      worksheet.addRow({
        sno: index + 1,
        fullName: participant.fullName,
        email: participant.email,
        phone: participant.phone,
        college: participant.college,
        registrationDate: new Date(participant.registrationDate).toLocaleDateString(),
        paymentStatus: participant.paymentStatus,
        paymentMethod: participant.paymentMethod || 'N/A',
        verificationStatus: participant.isVerified ? 'Verified' : 'Pending',
        verificationTime: participant.verificationTime ? new Date(participant.verificationTime).toLocaleString() : 'N/A',
        teamName: participant.teamName || 'N/A',
        isTeamLead: participant.isTeamLead ? 'Yes' : 'No',
      });
    });

    // Style the header row
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' }
    };

    const buffer = await workbook.xlsx.writeBuffer();
    const data = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const fileName = `${event.title.replace(/[^a-zA-Z0-9]/g, '_')}_participants_${new Date().toISOString().split('T')[0]}.xlsx`;
    saveAs(data, fileName);
  }

  async exportEventSummary(events: Event[]): Promise<void> {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Events');

    // Add headers
    worksheet.columns = [
      { header: 'S.No', key: 'sno', width: 10 },
      { header: 'Event Title', key: 'title', width: 25 },
      { header: 'Description', key: 'description', width: 40 },
      { header: 'Date', key: 'date', width: 15 },
      { header: 'Time', key: 'time', width: 10 },
      { header: 'Location', key: 'location', width: 20 },
      { header: 'Entry Fee', key: 'entryFee', width: 15 },
      { header: 'Payment Method', key: 'paymentMethod', width: 15 },
      { header: 'Current Participants', key: 'currentParticipants', width: 20 },
      { header: 'Max Participants', key: 'maxParticipants', width: 20 },
      { header: 'Status', key: 'status', width: 10 },
      { header: 'Created Date', key: 'createdDate', width: 15 },
    ];

    // Add data
    events.forEach((event, index) => {
      worksheet.addRow({
        sno: index + 1,
        title: event.title,
        description: event.description,
        date: new Date(event.date).toLocaleDateString(),
        time: event.time,
        location: event.location,
        entryFee: `₹${event.entryFee}`,
        paymentMethod: event.paymentMethod,
        currentParticipants: event.currentParticipants,
        maxParticipants: event.maxParticipants || 'Unlimited',
        status: event.isActive ? 'Active' : 'Inactive',
        createdDate: new Date(event.createdAt).toLocaleDateString(),
      });
    });

    // Style the header row
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' }
    };

    const buffer = await workbook.xlsx.writeBuffer();
    const data = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const fileName = `events_summary_${new Date().toISOString().split('T')[0]}.xlsx`;
    saveAs(data, fileName);
  }
}

export const excelService = new ExcelService();
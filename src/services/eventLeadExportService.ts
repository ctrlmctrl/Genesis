import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { Participant, Event } from '../types';

class EventLeadExportService {
  async exportEventParticipants(eventId: string, participants: Participant[], event: Event): Promise<void> {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Event Participants');

    // Set up headers
    const headers = [
      'Participant ID',
      'Full Name',
      'Email',
      'Phone',
      'College/Institution',
      'Standard/Year',
      'Stream/Branch',
      'Registration Date',
      'Payment Status',
      'Payment Method',
      'Verification Status',
      'Verification Time',
      'Team Name',
      'Team Lead',
      'QR Code'
    ];

    // Add headers
    worksheet.addRow(headers);

    // Style headers
    const headerRow = worksheet.getRow(1);
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF1F2937' }
    };

    // Add data rows
    participants.forEach(participant => {
      const row = [
        participant.id,
        participant.fullName,
        participant.email,
        participant.phone,
        participant.college,
        participant.standard,
        participant.stream,
        new Date(participant.registrationDate).toLocaleDateString(),
        participant.paymentStatus === 'paid' ? 'Paid' :
        participant.paymentStatus === 'offline_paid' ? 'Offline Paid' : 'Pending',
        participant.paymentMethod || 'N/A',
        participant.isVerified ? 'Verified' : 'Pending',
        participant.verificationTime ? new Date(participant.verificationTime).toLocaleString() : 'N/A',
        participant.teamName || 'N/A',
        participant.isTeamLead ? 'Yes' : 'No',
        participant.qrCode
      ];
      worksheet.addRow(row);
    });

    // Auto-fit columns
    worksheet.columns.forEach(column => {
      if (column.eachCell) {
        let maxLength = 0;
        column.eachCell({ includeEmpty: true }, (cell) => {
          const columnLength = cell.value ? cell.value.toString().length : 10;
          if (columnLength > maxLength) {
            maxLength = columnLength;
          }
        });
        column.width = Math.min(maxLength + 2, 50);
      }
    });

    // Add event information sheet
    const eventSheet = workbook.addWorksheet('Event Information');
    eventSheet.addRow(['Event Title', event.title]);
    eventSheet.addRow(['Event Description', event.description]);
    eventSheet.addRow(['Event Date', new Date(event.date).toLocaleDateString()]);
    eventSheet.addRow(['Event Time', event.time]);
    eventSheet.addRow(['Event Room', event.roomNo || 'Not assigned']);
    eventSheet.addRow(['Entry Fee', `₹${event.entryFee}`]);
    eventSheet.addRow(['Total Participants', participants.length]);
    eventSheet.addRow(['Verified Participants', participants.filter(p => p.isVerified).length]);
    eventSheet.addRow(['Paid Participants', participants.filter(p => p.paymentStatus === 'paid' || p.paymentStatus === 'offline_paid').length]);
    eventSheet.addRow(['Team Event', event.isTeamEvent ? 'Yes' : 'No']);
    if (event.isTeamEvent) {
      eventSheet.addRow(['Team Size', event.membersPerTeam || 'N/A']);
      const uniqueTeams = new Set(participants.filter(p => p.teamName).map(p => p.teamName));
      eventSheet.addRow(['Number of Teams', uniqueTeams.size]);
    }

    // Style event information sheet
    eventSheet.columns.forEach(column => {
      column.width = 30;
    });

    // Generate filename
    const eventTitle = event.title.replace(/[^a-zA-Z0-9]/g, '_');
    const filename = `${eventTitle}_Participants_${new Date().toISOString().split('T')[0]}.xlsx`;

    // Save file
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    saveAs(blob, filename);
  }

  async exportTeamDetails(eventId: string, participants: Participant[], event: Event): Promise<void> {
    if (!event.isTeamEvent) {
      throw new Error('This is not a team event');
    }

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Team Details');

    // Group participants by team
    const teams = new Map<string, Participant[]>();
    participants.forEach(participant => {
      if (participant.teamName) {
        if (!teams.has(participant.teamName)) {
          teams.set(participant.teamName, []);
        }
        teams.get(participant.teamName)!.push(participant);
      }
    });

    // Add team information
    let rowIndex = 1;
    teams.forEach((teamMembers, teamName) => {
      // Team header
      worksheet.addRow([`Team: ${teamName}`]);
      const teamHeaderRow = worksheet.getRow(rowIndex);
      teamHeaderRow.font = { bold: true, size: 14, color: { argb: 'FFFFFFFF' } };
      teamHeaderRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF1F2937' }
      };
      rowIndex++;

      // Team member headers
      const memberHeaders = ['Name', 'Email', 'Phone', 'College', 'Standard', 'Stream', 'Team Lead', 'Payment Status', 'Verification Status'];
      worksheet.addRow(memberHeaders);
      const memberHeaderRow = worksheet.getRow(rowIndex);
      memberHeaderRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      memberHeaderRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF374151' }
      };
      rowIndex++;

      // Team members
      teamMembers.forEach(member => {
        const memberRow = [
          member.fullName,
          member.email,
          member.phone,
          member.college,
          member.standard,
          member.stream,
          member.isTeamLead ? 'Yes' : 'No',
          member.paymentStatus === 'paid' ? 'Paid' :
          member.paymentStatus === 'offline_paid' ? 'Offline Paid' : 'Pending',
          member.isVerified ? 'Verified' : 'Pending'
        ];
        worksheet.addRow(memberRow);
        rowIndex++;
      });

      // Add empty row between teams
      worksheet.addRow([]);
      rowIndex++;
    });

    // Auto-fit columns
    worksheet.columns.forEach(column => {
      if (column.eachCell) {
        let maxLength = 0;
        column.eachCell({ includeEmpty: true }, (cell) => {
          const columnLength = cell.value ? cell.value.toString().length : 10;
          if (columnLength > maxLength) {
            maxLength = columnLength;
          }
        });
        column.width = Math.min(maxLength + 2, 50);
      }
    });

    // Generate filename
    const eventTitle = event.title.replace(/[^a-zA-Z0-9]/g, '_');
    const filename = `${eventTitle}_TeamDetails_${new Date().toISOString().split('T')[0]}.xlsx`;

    // Save file
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    saveAs(blob, filename);
  }
}

export const eventLeadExportService = new EventLeadExportService();

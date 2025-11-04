
import ExcelJS from 'exceljs';
// @ts-ignore
import { saveAs } from 'file-saver';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import type { Participant, Event } from '../types';

export class ExcelService {
  async exportFormattedParticipantsToExcel(participants: Participant[], event: Event): Promise<void> {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Formatted Participants');

    // Define columns
    worksheet.columns = [
      { header: 'Sr. No', key: 'srno', width: 8, alignment: { horizontal: 'center', vertical: 'middle' } },
      { header: 'Participant Name', key: 'name', width: 25, alignment: { horizontal: 'center', vertical: 'middle' } },
      { header: 'College Name', key: 'college', width: 25, alignment: { horizontal: 'center', vertical: 'middle' } },
      { header: 'Contact Number', key: 'phone', width: 15, alignment: { horizontal: 'center', vertical: 'middle' } },
      { header: 'Team Name', key: 'teamName', width: 20, alignment: { horizontal: 'center', vertical: 'middle' } },
      { header: 'Payment Status', key: 'paymentStatus', width: 15, alignment: { horizontal: 'center', vertical: 'middle' } },
      { header: 'Check-in Status', key: 'verificationStatus', width: 18, alignment: { horizontal: 'center', vertical: 'middle' } },
    ];

    // Center align all cells after adding data

  let srno = 1;
    if (event.isTeamEvent) {
      // Group by team
      const teamGroups = participants.reduce((acc, participant) => {
        const teamName = participant.teamName || 'No Team';
        if (!acc[teamName]) acc[teamName] = [];
        acc[teamName].push(participant);
        return acc;
      }, {} as Record<string, Participant[]>);

      Object.entries(teamGroups).forEach(([teamName, teamMembers]) => {
        // Sort so team lead is first
        teamMembers.sort((a, b) => (b.isTeamLead ? 1 : 0) - (a.isTeamLead ? 1 : 0));
        const teamLead = teamMembers.find(m => m.isTeamLead) || teamMembers[0];
        // Add rows for each member, but merge cells for team columns
        const startRow = worksheet.rowCount + 1;
        teamMembers.forEach((member, idx) => {
          worksheet.addRow({
            srno: idx === 0 ? srno : '',
            name: member.fullName,
            college: member.college,
            phone: member.phone,
            teamName: idx === 0 ? teamName : '',
            paymentStatus: idx === 0 ? teamLead.paymentStatus : '',
            verificationStatus: idx === 0 ? (teamLead.isVerified ? 'Verified' : 'Pending') : '',
          });
        });
        // Merge cells for team columns
        if (teamMembers.length > 1) {
          worksheet.mergeCells(`A${startRow}:A${startRow + teamMembers.length - 1}`);
          worksheet.mergeCells(`E${startRow}:E${startRow + teamMembers.length - 1}`);
          worksheet.mergeCells(`F${startRow}:F${startRow + teamMembers.length - 1}`);
          worksheet.mergeCells(`G${startRow}:G${startRow + teamMembers.length - 1}`);
        }
        srno++;
      });
    } else {
      // Individual event
      participants.forEach((p, idx) => {
        worksheet.addRow({
          srno: idx + 1,
          name: p.fullName,
          college: p.college,
          phone: p.phone,
          teamName: '',
          paymentStatus: p.paymentStatus,
          verificationStatus: p.isVerified ? 'Verified' : 'Pending',
        });
      });
    }

    // Style header
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' }
    };

    // Explicitly center align all cells (including merged)
    worksheet.eachRow((row) => {
      row.eachCell((cell) => {
        cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
      });
    });

    const buffer = await workbook.xlsx.writeBuffer();
    const data = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const fileName = `${event.title.replace(/[^a-zA-Z0-9]/g, '_')}_formatted_${new Date().toISOString().split('T')[0]}.xlsx`;
    saveAs(data, fileName);
  }
  async exportParticipantsToExcel(participants: Participant[], event: Event): Promise<void> {
    const workbook = new ExcelJS.Workbook();
    
    // Add event info sheet
    const eventSheet = workbook.addWorksheet('Event Info');
    eventSheet.columns = [
      { header: 'Property', key: 'property', width: 20 },
      { header: 'Value', key: 'value', width: 40 }
    ];
    
    eventSheet.addRows([
      { property: 'Event Title', value: event.title },
      { property: 'Description', value: event.description },
      { property: 'Date', value: new Date(event.date).toLocaleDateString() },
      { property: 'Time', value: event.time },
      { property: 'Room', value: event.roomNo || 'Not assigned' },
      { property: 'Entry Fee', value: `₹${event.entryFee}` },
      { property: 'Payment Method', value: event.paymentMethod },
      { property: 'Total Participants', value: participants.length },
      { property: 'Team Event', value: event.isTeamEvent ? 'Yes' : 'No' },
      { property: 'Export Date', value: new Date().toLocaleString() }
    ]);

    // Style event info sheet
    eventSheet.getRow(1).font = { bold: true };
    eventSheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' }
    };

    // Add participants sheet
    const worksheet = workbook.addWorksheet('Participants');

    // Add headers
    worksheet.columns = [
      { header: 'S.No', key: 'sno', width: 8 },
      { header: 'Full Name', key: 'fullName', width: 20 },
      { header: 'Email', key: 'email', width: 25 },
      { header: 'Phone', key: 'phone', width: 15 },
      { header: 'College', key: 'college', width: 25 },
      { header: 'Standard', key: 'standard', width: 12 },
      { header: 'Stream', key: 'stream', width: 20 },
      { header: 'Registration Date', key: 'registrationDate', width: 18 },
      { header: 'Payment Status', key: 'paymentStatus', width: 15 },
      { header: 'Payment Method', key: 'paymentMethod', width: 15 },
      { header: 'Verification Status', key: 'verificationStatus', width: 15 },
      { header: 'Verification Time', key: 'verificationTime', width: 20 },
      { header: 'Team Name', key: 'teamName', width: 20 },
      { header: 'Team Lead', key: 'isTeamLead', width: 10 },
      { header: 'Registration Type', key: 'registrationType', width: 15 },
    ];

    // Add data
    participants.forEach((participant, index) => {
      worksheet.addRow({
        sno: index + 1,
        fullName: participant.fullName,
        email: participant.email,
        phone: participant.phone,
        college: participant.college,
        standard: participant.standard,
        stream: participant.stream,
        registrationDate: new Date(participant.registrationDate).toLocaleDateString(),
        paymentStatus: participant.paymentStatus,
        paymentMethod: participant.paymentMethod || 'N/A',
        verificationStatus: participant.isVerified ? 'Verified' : 'Pending',
        verificationTime: participant.verificationTime ? new Date(participant.verificationTime).toLocaleString() : 'N/A',
        teamName: participant.teamName || 'N/A',
        isTeamLead: participant.isTeamLead ? 'Yes' : 'No',
        registrationType: participant.registrationType || 'regular',
      });
    });

    // Style the header row
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' }
    };

  // Add team details sheet if it's a team event
  if (event.isTeamEvent) {
    const teamSheet = workbook.addWorksheet('Team Details');
    
    // Group participants by team
    const teamGroups = participants.reduce((acc, participant) => {
      const teamName = participant.teamName || 'Individual';
      if (!acc[teamName]) {
        acc[teamName] = [];
      }
      acc[teamName].push(participant);
      return acc;
    }, {} as Record<string, Participant[]>);

    teamSheet.columns = [
      { header: 'Team Name', key: 'teamName', width: 20 },
      { header: 'Member Name', key: 'memberName', width: 20 },
      { header: 'Email', key: 'email', width: 25 },
      { header: 'Phone', key: 'phone', width: 15 },
      { header: 'College', key: 'college', width: 25 },
      { header: 'Standard', key: 'standard', width: 12 },
      { header: 'Stream', key: 'stream', width: 20 },
      { header: 'Role', key: 'role', width: 10 },
      { header: 'Payment Status', key: 'paymentStatus', width: 15 },
      { header: 'Verification Status', key: 'verificationStatus', width: 15 },
    ];

    let rowIndex = 1;
    Object.entries(teamGroups).forEach(([teamName, teamMembers]) => {
      // Find team lead for payment info
      const teamLead = teamMembers.find(member => member.isTeamLead);
      const teamPaymentStatus = teamLead?.paymentStatus || 'pending';
      const teamPaymentAmount = teamLead?.entryFeePaid || event.entryFee;
      
      teamMembers.forEach((member, memberIndex) => {
        teamSheet.addRow({
          teamName: memberIndex === 0 ? teamName : '', // Only show team name for first member
          memberName: member.fullName,
          email: member.email,
          phone: member.phone,
          college: member.college,
          standard: member.standard,
          stream: member.stream,
          role: member.isTeamLead ? 'Team Lead' : 'Member',
          paymentStatus: member.isTeamLead ? teamPaymentStatus : 'Team Payment', // Show team payment status for lead, "Team Payment" for members
          verificationStatus: member.isVerified ? 'Verified' : 'Pending',
        });
        rowIndex++;
      });
      
      // Add team payment summary row
      teamSheet.addRow({
        teamName: '',
        memberName: '',
        email: '',
        phone: '',
        college: '',
        role: '',
        paymentStatus: `Team Total: ₹${teamPaymentAmount}`,
        verificationStatus: '',
      });
      rowIndex++;
      
      // Add empty row between teams
      teamSheet.addRow({});
      rowIndex++;
    });

    // Style team sheet header
    teamSheet.getRow(1).font = { bold: true };
    teamSheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' }
    };
  }

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
        roomNo: event.roomNo || 'Not assigned',
        entryFee: `₹${event.entryFee}`,
        paymentMethod: event.paymentMethod,
        currentParticipants: event.currentParticipants,
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

  async exportParticipantsToPDF(participants: Participant[], event: Event): Promise<void> {
    const doc = new jsPDF('landscape', 'mm', 'a4');
    
    // Add title
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text(event.title, 20, 20);
    
    // Add event details
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text(`Date: ${new Date(event.date).toLocaleDateString()}`, 20, 30);
    doc.text(`Time: ${event.time}`, 20, 35);
    doc.text(`Room: ${event.roomNo || 'Not assigned'}`, 20, 40);
    doc.text(`Entry Fee: ₹${event.entryFee}`, 20, 45);
    doc.text(`Total Participants: ${participants.length}`, 20, 50);
    doc.text(`Export Date: ${new Date().toLocaleString()}`, 20, 55);
    
    // Add participants table
    const tableData = participants.map((participant, index) => [
      index + 1,
      participant.fullName,
      participant.phone,
      participant.college,
      participant.standard,
      participant.stream,
      participant.paymentStatus,
      participant.isVerified ? 'Verified' : 'Pending',
      participant.teamName || 'N/A',
      participant.isTeamLead ? 'Yes' : 'No'
    ]);

    (doc as any).autoTable({
      head: [['S.No', 'Name', 'Phone', 'College', 'Standard', 'Stream', 'Payment', 'Verified', 'Team', 'Team Lead']],
      body: tableData,
      startY: 65,
      styles: {
        fontSize: 8,
        cellPadding: 2,
      },
      headStyles: {
        fillColor: [64, 64, 64],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
      },
      alternateRowStyles: {
        fillColor: [245, 245, 245],
      },
      columnStyles: {
        0: { cellWidth: 10 }, // S.No
        1: { cellWidth: 30 }, // Name
        2: { cellWidth: 20 }, // Phone
        3: { cellWidth: 35 }, // College
        4: { cellWidth: 15 }, // Standard
        5: { cellWidth: 25 }, // Stream
        6: { cellWidth: 18 }, // Payment
        7: { cellWidth: 18 }, // Verified
        8: { cellWidth: 20 }, // Team
        9: { cellWidth: 18 }, // Team Lead
      },
    });

    // Add team details if it's a team event
    if (event.isTeamEvent) {
      const teamGroups = participants.reduce((acc, participant) => {
        const teamName = participant.teamName || 'Individual';
        if (!acc[teamName]) {
          acc[teamName] = [];
        }
        acc[teamName].push(participant);
        return acc;
      }, {} as Record<string, Participant[]>);

      // Add new page for team details
      doc.addPage();
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('Team Details', 20, 20);

      let yPosition = 35;
      Object.entries(teamGroups).forEach(([teamName, teamMembers]) => {
        // Find team lead for payment info
        const teamLead = teamMembers.find(member => member.isTeamLead);
        const teamPaymentStatus = teamLead?.paymentStatus || 'pending';
        const teamPaymentAmount = teamLead?.entryFeePaid || event.entryFee;
        
        // Add team name and payment info
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text(`Team: ${teamName}`, 20, yPosition);
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text(`Payment: ${teamPaymentStatus} | Amount: ₹${teamPaymentAmount}`, 20, yPosition + 8);
        yPosition += 20;

        // Add team members table
        const teamTableData = teamMembers.map(member => [
          member.fullName,
          member.phone,
          member.college,
          member.standard,
          member.stream,
          member.isTeamLead ? 'Team Lead' : 'Member',
          member.isTeamLead ? teamPaymentStatus : 'Team Payment',
          member.isVerified ? 'Verified' : 'Pending'
        ]);

        (doc as any).autoTable({
          head: [['Name', 'Phone', 'College', 'Standard', 'Stream', 'Role', 'Payment', 'Verified']],
          body: teamTableData,
          startY: yPosition,
          styles: {
            fontSize: 8,
            cellPadding: 2,
          },
          headStyles: {
            fillColor: [64, 64, 64],
            textColor: [255, 255, 255],
            fontStyle: 'bold',
          },
          alternateRowStyles: {
            fillColor: [245, 245, 245],
          },
          columnStyles: {
            0: { cellWidth: 35 }, // Name
            1: { cellWidth: 25 }, // Phone
            2: { cellWidth: 40 }, // College
            3: { cellWidth: 15 }, // Standard
            4: { cellWidth: 25 }, // Stream
            5: { cellWidth: 20 }, // Role
            6: { cellWidth: 20 }, // Payment
            7: { cellWidth: 20 }, // Verified
          },
        });

        yPosition = (doc as any).lastAutoTable.finalY + 15;
        
        // Check if we need a new page
        if (yPosition > 250) {
          doc.addPage();
          yPosition = 20;
        }
      });
    }

    // Save the PDF
    const fileName = `${event.title.replace(/[^a-zA-Z0-9]/g, '_')}_participants_${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(fileName);
  }

  async exportEventSummaryToPDF(events: Event[]): Promise<void> {
    const doc = new jsPDF('landscape', 'mm', 'a4');
    
    // Add title
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('Events Summary', 20, 20);
    doc.text(`Export Date: ${new Date().toLocaleString()}`, 20, 30);
    
    // Add events table
    const tableData = events.map((event, index) => [
      index + 1,
      event.title,
      new Date(event.date).toLocaleDateString(),
      event.time,
      event.roomNo || 'Not assigned',
      `₹${event.entryFee}`,
      event.currentParticipants,
      event.isActive ? 'Active' : 'Inactive'
    ]);

    (doc as any).autoTable({
      head: [['S.No', 'Event Title', 'Date', 'Time', 'Room', 'Entry Fee', 'Participants', 'Status']],
      body: tableData,
      startY: 40,
      styles: {
        fontSize: 8,
        cellPadding: 2,
      },
      headStyles: {
        fillColor: [64, 64, 64],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
      },
      alternateRowStyles: {
        fillColor: [245, 245, 245],
      },
      columnStyles: {
        0: { cellWidth: 15 }, // S.No
        1: { cellWidth: 50 }, // Event Title
        2: { cellWidth: 25 }, // Date
        3: { cellWidth: 20 }, // Time
        4: { cellWidth: 25 }, // Room
        5: { cellWidth: 20 }, // Entry Fee
        6: { cellWidth: 25 }, // Participants
        7: { cellWidth: 20 }, // Status
      },
    });

    // Save the PDF
    const fileName = `events_summary_${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(fileName);
  }
}

export const excelService = new ExcelService();
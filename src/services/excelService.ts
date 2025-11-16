
import ExcelJS from 'exceljs';
// @ts-ignore
import { saveAs } from 'file-saver';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import type { Participant, Event } from '../types';

export class ExcelService {
  async exportFormattedParticipantsToExcel(participants: Participant[], event: Event): Promise<void> {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Participants');

    // Define columns (initial widths will be adjusted later)
    worksheet.columns = [
      { header: 'Sr. No', key: 'srno', width: 8 },
      { header: 'Participant Name', key: 'name', width: 25 },
      { header: 'College Name', key: 'college', width: 25 },
      { header: 'Contact Number', key: 'phone', width: 15 },
      { header: 'Team Name', key: 'teamName', width: 20 },
      { header: 'Payment Status', key: 'paymentStatus', width: 15 },
      { header: 'Check-in Status', key: 'verificationStatus', width: 18 },
    ];

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
        // Ensure team lead comes first
        teamMembers.sort((a, b) => (b.isTeamLead ? 1 : 0) - (a.isTeamLead ? 1 : 0));
        const teamLead = teamMembers.find(m => m.isTeamLead) || teamMembers[0];
        const startRow = worksheet.rowCount + 1;

        teamMembers.forEach((member, idx) => {
          worksheet.addRow({
            srno: idx === 0 ? srno : '',
            name: member.fullName,
            college: member.college,
            phone: member.phone,
            teamName: idx === 0 ? teamName : '',
            paymentStatus: idx === 0 ? this.formatPaymentStatus(teamLead.paymentStatus) : '',
            verificationStatus: idx === 0 ? (teamLead.isVerified ? 'Verified' : 'Pending') : '',
          });
        });

        // Merge team columns for nicer print layout
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
          paymentStatus: this.formatPaymentStatus(p.paymentStatus),
          verificationStatus: p.isVerified ? 'Verified' : 'Pending',
        });
      });
    }

    // === Header Styling ===
    const headerRow = worksheet.getRow(1);
    headerRow.font = { bold: true, color: { argb: 'FF1F497D' } };
    headerRow.alignment = { horizontal: 'center', vertical: 'middle' };

    // headerRow.eachCell may be undefined in typings, so guard it
    if (typeof headerRow.eachCell === 'function') {
      headerRow.eachCell((cell: ExcelJS.Cell) => {
        // add border to header
        cell.border = {
          top: { style: 'thin', color: { argb: 'FF999999' } },
          left: { style: 'thin', color: { argb: 'FF999999' } },
          bottom: { style: 'thin', color: { argb: 'FF999999' } },
          right: { style: 'thin', color: { argb: 'FF999999' } },
        };
        // keep header background transparent -> don't assign fill or explicitly set to undefined safely
        // TypeScript complains about cell.fill possibly undefined, so check cell exists
        if (cell) {
          (cell as any).fill = undefined;
        }
      });
    }

    // === Body Styling with borders and zebra striping ===
    worksheet.eachRow((row, rowNumber) => {
      // eachCell may be undefined on some typings - guard it
      if (typeof row.eachCell === 'function') {
        row.eachCell((cell: ExcelJS.Cell) => {
          // alignment
          cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };

          // borders
          cell.border = {
            top: { style: 'thin', color: { argb: 'FFBBBBBB' } },
            left: { style: 'thin', color: { argb: 'FFBBBBBB' } },
            bottom: { style: 'thin', color: { argb: 'FFBBBBBB' } },
            right: { style: 'thin', color: { argb: 'FFBBBBBB' } },
          };
        });
      }

      // zebra striping for readability (skip header row)
      if (rowNumber > 1 && rowNumber % 2 === 0) {
        if (typeof row.eachCell === 'function') {
          row.eachCell((cell: ExcelJS.Cell) => {
            cell.fill = {
              type: 'pattern',
              pattern: 'solid',
              fgColor: { argb: 'FFF9F9F9' }, // very light gray
            };
          });
        }
      }
    });

    // === Auto-fit column widths (safe approach) ===
    worksheet.columns?.forEach((column) => {
      if (!column) return;
      // column.eachCell may be undefined on some typings, guard it
      let maxLength = 0;
      column.eachCell?.({ includeEmpty: true }, (cell: ExcelJS.Cell) => {
        const v = cell.value;
        const text = v === null || v === undefined ? '' : v.toString();
        if (text.length > maxLength) maxLength = text.length;
      });

      // Add some padding and bounds
      const calculated = Math.min(Math.max(maxLength + 4, 12), 50);
      // assign width safely
      (column.width as number) = calculated;
    });

    // Freeze header row for digital viewing
    worksheet.views = [{ state: 'frozen', ySplit: 1 }];

    // Workbook metadata
    workbook.creator = 'Genesis Event System';
    workbook.created = new Date();

    // Save
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const fileName = `${event.title.replace(/[^a-zA-Z0-9]/g, '_')}_participants_${new Date().toISOString().split('T')[0]}.xlsx`;
    saveAs(blob, fileName);
  }

  // helper: human-friendly payment text
  private formatPaymentStatus(status?: string): string {
    switch (status) {
      case 'paid': return 'Paid';
      case 'offline_paid': return 'Offline Paid';
      case 'under_verification': return 'Under Verification';
      case 'pending': return 'Pending';
      case 'failed': return 'Failed';
      default: return 'N/A';
    }
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

  async exportEventSummary(events: Event[], allParticipants: Participant[]): Promise<void> {
    const workbook = new ExcelJS.Workbook();
    const summarySheet = workbook.addWorksheet('Event Summary');

    // === 1️⃣ Summary Sheet Columns ===
    summarySheet.columns = [
      { header: 'S.No', key: 'sno', width: 6 },
      { header: 'Event Title', key: 'title', width: 30 },
      { header: 'Date', key: 'date', width: 15 },
      { header: 'Time', key: 'time', width: 15 },
      { header: 'Room', key: 'room', width: 20 },
      { header: 'Entry Fee (Reg/On-Spot)', key: 'entryFee', width: 22 },
      { header: 'Teams', key: 'teams', width: 15 },
      { header: 'Paid Participants', key: 'participants', width: 18 },
      { header: 'Paid Pre-Registrations', key: 'preReg', width: 20 },
      { header: 'Paid On-Spot Registrations', key: 'onSpot', width: 24 },
      { header: 'Total Amount (₹)', key: 'totalAmount', width: 18 },
      { header: 'Payment Method', key: 'paymentMethod', width: 18 },
    ];

    let grandTotalParticipants = 0;
    let grandTotalAmount = 0;

    // === 2️⃣ Summary Sheet Calculations (Accurate Total Fees) ===
    for (let i = 0; i < events.length; i++) {
      const event = events[i];
      const participantsForEvent = allParticipants.filter(p => p.eventId === event.id);

      // Only paid or offline paid participants
      const paidParticipants = participantsForEvent.filter(
        p => p.paymentStatus === 'paid' || p.paymentStatus === 'offline_paid'
      );

      let teamCount = 0;
      let paidCount = 0;
      let preReg = 0;
      let onSpot = 0;
      let totalAmount = 0;

      if (event.isTeamEvent) {
        // === Team Event Fee Calculation ===
        const teamGroups = paidParticipants.reduce((acc, p) => {
          const teamName = p.teamName || 'No Team';
          if (!acc[teamName]) acc[teamName] = [];
          acc[teamName].push(p);
          return acc;
        }, {} as Record<string, Participant[]>);

        Object.values(teamGroups).forEach(teamMembers => {
          const lead = teamMembers.find(m => m.isTeamLead);
          if (!lead || (lead.paymentStatus !== 'paid' && lead.paymentStatus !== 'offline_paid')) return;

          const teamSize = teamMembers.length;
          const entryFee =
            lead.registrationType === 'on_spot'
              ? event.onSpotEntryFee || event.entryFee || 0
              : event.entryFee || 0;

          // Add to counts
          teamCount++;
          paidCount += teamSize;
          if (lead.registrationType === 'on_spot') onSpot += teamSize;
          else preReg += teamSize;

          // Add the *actual fee paid for team* (once per team)
          totalAmount += entryFee;
        });
      } else {
        // === Individual Event Fee Calculation ===
        paidParticipants.forEach(p => {
          const entryFee =
            p.registrationType === 'on_spot'
              ? event.onSpotEntryFee || event.entryFee || 0
              : event.entryFee || 0;

          paidCount++;
          if (p.registrationType === 'on_spot') onSpot++;
          else preReg++;

          // Add *individual fee* per participant
          totalAmount += entryFee;
        });
      }

      grandTotalParticipants += paidCount;
      grandTotalAmount += totalAmount;

      const entryFeeDisplay = event.onSpotEntryFee
        ? `₹${event.entryFee} / ₹${event.onSpotEntryFee}`
        : `₹${event.entryFee}`;

      summarySheet.addRow({
        sno: i + 1,
        title: event.title,
        date: new Date(event.date).toLocaleDateString(),
        time: event.time || '—',
        room: event.roomNo || 'Not Assigned',
        entryFee: entryFeeDisplay,
        teams: event.isTeamEvent ? teamCount : '—',
        participants: paidCount,
        preReg,
        onSpot,
        totalAmount,
        paymentMethod: event.paymentMethod,
      });
    }

    // Grand Total Row
    const totalRow = summarySheet.addRow({
      sno: '',
      title: 'Grand Total',
      participants: grandTotalParticipants,
      totalAmount: grandTotalAmount,
    });
    totalRow.font = { bold: true };
    totalRow.alignment = { horizontal: 'center' };

    // === 3️⃣ Style Summary Sheet ===
    const headerRow = summarySheet.getRow(1);
    headerRow.font = { bold: true, color: { argb: 'FF1F497D' } };
    headerRow.alignment = { horizontal: 'center', vertical: 'middle' };

    summarySheet.eachRow((row, rowNumber) => {
      row.eachCell((cell) => {
        cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
        cell.border = {
          top: { style: 'thin', color: { argb: 'FFAAAAAA' } },
          left: { style: 'thin', color: { argb: 'FFAAAAAA' } },
          bottom: { style: 'thin', color: { argb: 'FFAAAAAA' } },
          right: { style: 'thin', color: { argb: 'FFAAAAAA' } },
        };
      });
      if (rowNumber > 1 && rowNumber % 2 === 0 && rowNumber !== summarySheet.rowCount) {
        row.eachCell((cell) => {
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFF9F9F9' },
          };
        });
      }
    });

    summarySheet.views = [{ state: 'frozen', ySplit: 1 }];

    // === 4️⃣ EVENT-SPECIFIC SHEETS (Paid-only entries) ===
    // === 4️⃣ EVENT-SPECIFIC SHEETS (Paid-only entries with full team details) ===
    // === 4️⃣ EVENT-SPECIFIC SHEETS (Paid-only entries with full team details) ===
    // === 4️⃣ EVENT-SPECIFIC SHEETS (Paid-only entries with full team details, no team total) ===
    for (const event of events) {
      let participants: Participant[] = [];

      if (event.isTeamEvent) {
        // Group all participants by team for this event
        const eventParticipants = allParticipants.filter(p => p.eventId === event.id);
        const teamGroups = eventParticipants.reduce((acc, participant) => {
          const teamName = participant.teamName || 'No Team';
          if (!acc[teamName]) acc[teamName] = [];
          acc[teamName].push(participant);
          return acc;
        }, {} as Record<string, Participant[]>);

        // Collect all members of teams whose lead is paid/offline_paid
        Object.values(teamGroups).forEach(teamMembers => {
          const lead = teamMembers.find(m => m.isTeamLead);
          if (lead && (lead.paymentStatus === 'paid' || lead.paymentStatus === 'offline_paid')) {
            participants.push(...teamMembers);
          }
        });
      } else {
        // For individual events → only include paid/offline_paid participants
        participants = allParticipants.filter(
          p =>
            p.eventId === event.id &&
            (p.paymentStatus === 'paid' || p.paymentStatus === 'offline_paid')
        );
      }

      const worksheet = workbook.addWorksheet(`${event.title.substring(0, 25)} Paid`);
      worksheet.columns = [
        { header: 'Sr. No', key: 'srno', width: 8 },
        { header: 'Participant Name', key: 'name', width: 25 },
        { header: 'College Name', key: 'college', width: 25 },
        { header: 'Contact Number', key: 'phone', width: 15 },
        { header: 'Team Name', key: 'teamName', width: 20 },
        { header: 'Registration Type', key: 'registrationType', width: 18 },
        { header: 'Payment Status', key: 'paymentStatus', width: 15 },
        { header: 'Check-in Status', key: 'verificationStatus', width: 18 },
      ];

      let srno = 1;

      if (event.isTeamEvent) {
        // Regroup after filtering
        const teamGroups = participants.reduce((acc, participant) => {
          const teamName = participant.teamName || 'No Team';
          if (!acc[teamName]) acc[teamName] = [];
          acc[teamName].push(participant);
          return acc;
        }, {} as Record<string, Participant[]>);

        Object.entries(teamGroups).forEach(([teamName, members]) => {
          const lead = members.find(m => m.isTeamLead);
          if (!lead) return;

          // Sort so lead appears first
          members.sort((a, b) => (b.isTeamLead ? 1 : 0) - (a.isTeamLead ? 1 : 0));

          const startRow = worksheet.rowCount + 1;

          members.forEach((member, idx) => {
            worksheet.addRow({
              srno: idx === 0 ? srno : '',
              name: member.fullName,
              college: member.college,
              phone: member.phone,
              teamName: idx === 0 ? teamName : '',
              registrationType: member.registrationType || 'regular',
              paymentStatus: idx === 0
                ? (lead.paymentStatus === 'offline_paid' ? 'Offline Paid' : 'Paid')
                : '',
              verificationStatus: idx === 0 ? (lead.isVerified ? 'Verified' : 'Pending') : '',
            });
          });

          // Merge for cleaner look
          if (members.length > 1) {
            worksheet.mergeCells(`A${startRow}:A${startRow + members.length - 1}`);
            worksheet.mergeCells(`E${startRow}:E${startRow + members.length - 1}`);
            worksheet.mergeCells(`G${startRow}:G${startRow + members.length - 1}`);
            worksheet.mergeCells(`H${startRow}:H${startRow + members.length - 1}`);
          }

          srno++;
        });
      } else {
        // Individual events
        participants.forEach((p, idx) => {
          worksheet.addRow({
            srno: idx + 1,
            name: p.fullName,
            college: p.college,
            phone: p.phone,
            teamName: '',
            registrationType: p.registrationType || 'regular',
            paymentStatus: p.paymentStatus === 'offline_paid' ? 'Offline Paid' : 'Paid',
            verificationStatus: p.isVerified ? 'Verified' : 'Pending',
          });
        });
      }

      // === Style Rows ===
      worksheet.eachRow((row, rowNumber) => {
        row.eachCell((cell) => {
          cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
          cell.border = {
            top: { style: 'thin', color: { argb: 'FFBBBBBB' } },
            left: { style: 'thin', color: { argb: 'FFBBBBBB' } },
            bottom: { style: 'thin', color: { argb: 'FFBBBBBB' } },
            right: { style: 'thin', color: { argb: 'FFBBBBBB' } },
          };
        });
        if (rowNumber > 1 && rowNumber % 2 === 0) {
          row.eachCell((cell) => {
            cell.fill = {
              type: 'pattern',
              pattern: 'solid',
              fgColor: { argb: 'FFF9F9F9' },
            };
          });
        }
      });

      worksheet.views = [{ state: 'frozen', ySplit: 1 }];
    }

    // === 5️⃣ SAVE FILE ===
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    const fileName = `Event_Report_PaidOnly_${new Date().toISOString().split('T')[0]}.xlsx`;
    saveAs(blob, fileName);
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
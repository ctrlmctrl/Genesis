// Demo Export Generator
// This script generates sample Excel and PDF files to show the export format

const ExcelJS = require('exceljs');
const { jsPDF } = require('jspdf');
require('jspdf-autotable');

// Sample data for individual event
const sampleIndividualEvent = {
  id: 'event_001',
  title: 'Tech Conference 2024',
  description: 'Annual technology conference featuring latest innovations',
  date: '2024-12-15',
  time: '09:00',
  roomNo: 'Auditorium A',
  entryFee: 500,
  paymentMethod: 'online',
  currentParticipants: 25,
  isTeamEvent: false,
  isActive: true,
  createdAt: '2024-11-01T10:00:00Z'
};

const sampleIndividualParticipants = [
  {
    id: 'p001',
    fullName: 'John Smith',
    email: 'john.smith@email.com',
    phone: '9876543210',
    college: 'ABC Engineering College',
    registrationDate: '2024-11-10T14:30:00Z',
    paymentStatus: 'paid',
    paymentMethod: 'online',
    isVerified: true,
    verificationTime: '2024-11-10T15:00:00Z',
    teamName: null,
    isTeamLead: false,
    paymentIdentifier: 'GEN123456ABC123',
    registrationType: 'regular'
  },
  {
    id: 'p002',
    fullName: 'Sarah Johnson',
    email: 'sarah.j@email.com',
    phone: '8765432109',
    college: 'XYZ University',
    registrationDate: '2024-11-11T09:15:00Z',
    paymentStatus: 'paid',
    paymentMethod: 'online',
    isVerified: true,
    verificationTime: '2024-11-11T10:00:00Z',
    teamName: null,
    isTeamLead: false,
    paymentIdentifier: 'GEN123456DEF456',
    registrationType: 'regular'
  },
  {
    id: 'p003',
    fullName: 'Michael Brown',
    email: 'mike.brown@email.com',
    phone: '7654321098',
    college: 'DEF Institute of Technology',
    registrationDate: '2024-11-12T16:45:00Z',
    paymentStatus: 'pending',
    paymentMethod: null,
    isVerified: false,
    verificationTime: null,
    teamName: null,
    isTeamLead: false,
    paymentIdentifier: 'GEN123456GHI789',
    registrationType: 'regular'
  },
  {
    id: 'p004',
    fullName: 'Emily Davis',
    email: 'emily.davis@email.com',
    phone: '6543210987',
    college: 'Tech University',
    registrationDate: '2024-11-13T11:00:00Z',
    paymentStatus: 'paid',
    paymentMethod: 'online',
    isVerified: true,
    verificationTime: '2024-11-13T12:00:00Z',
    teamName: null,
    isTeamLead: false,
    paymentIdentifier: 'GEN123456JKL012',
    registrationType: 'regular'
  },
  {
    id: 'p005',
    fullName: 'Robert Wilson',
    email: 'robert.w@email.com',
    phone: '5432109876',
    college: 'Engineering College',
    registrationDate: '2024-11-14T14:00:00Z',
    paymentStatus: 'offline_paid',
    paymentMethod: 'offline',
    isVerified: true,
    verificationTime: '2024-11-14T15:00:00Z',
    teamName: null,
    isTeamLead: false,
    paymentIdentifier: 'GEN123456MNO345',
    registrationType: 'regular'
  }
];

// Sample data for team event
const sampleTeamEvent = {
  id: 'event_002',
  title: 'Hackathon 2024',
  description: '48-hour coding competition for innovative solutions',
  date: '2024-12-20',
  time: '18:00',
  roomNo: 'Computer Lab 1',
  entryFee: 1000,
  paymentMethod: 'online',
  currentParticipants: 12,
  isTeamEvent: true,
  teamSize: 4,
  maxTeams: 10,
  isActive: true,
  createdAt: '2024-11-01T10:00:00Z'
};

const sampleTeamParticipants = [
  // Team 1: Code Warriors
  {
    id: 'p006',
    fullName: 'Alice Wilson',
    email: 'alice.w@email.com',
    phone: '6543210987',
    college: 'Tech University',
    registrationDate: '2024-11-13T11:00:00Z',
    paymentStatus: 'paid',
    paymentMethod: 'online',
    isVerified: true,
    verificationTime: '2024-11-13T12:00:00Z',
    teamName: 'Code Warriors',
    isTeamLead: true,
    paymentIdentifier: 'GEN123456PQR678',
    registrationType: 'team'
  },
  {
    id: 'p007',
    fullName: 'Bob Davis',
    email: 'bob.davis@email.com',
    phone: '5432109876',
    college: 'Tech University',
    registrationDate: '2024-11-13T11:05:00Z',
    paymentStatus: 'paid',
    paymentMethod: 'online',
    isVerified: true,
    verificationTime: '2024-11-13T12:00:00Z',
    teamName: 'Code Warriors',
    isTeamLead: false,
    paymentIdentifier: 'GEN123456STU901',
    registrationType: 'team'
  },
  {
    id: 'p008',
    fullName: 'Carol Martinez',
    email: 'carol.m@email.com',
    phone: '4321098765',
    college: 'Engineering College',
    registrationDate: '2024-11-13T11:10:00Z',
    paymentStatus: 'paid',
    paymentMethod: 'online',
    isVerified: true,
    verificationTime: '2024-11-13T12:00:00Z',
    teamName: 'Code Warriors',
    isTeamLead: false,
    paymentIdentifier: 'GEN123456VWX234',
    registrationType: 'team'
  },
  {
    id: 'p009',
    fullName: 'David Lee',
    email: 'david.lee@email.com',
    phone: '3210987654',
    college: 'Engineering College',
    registrationDate: '2024-11-13T11:15:00Z',
    paymentStatus: 'paid',
    paymentMethod: 'online',
    isVerified: true,
    verificationTime: '2024-11-13T12:00:00Z',
    teamName: 'Code Warriors',
    isTeamLead: false,
    paymentIdentifier: 'GEN123456YZA567',
    registrationType: 'team'
  },
  // Team 2: Innovation Squad
  {
    id: 'p010',
    fullName: 'Emma Taylor',
    email: 'emma.taylor@email.com',
    phone: '2109876543',
    college: 'Innovation Institute',
    registrationDate: '2024-11-14T14:00:00Z',
    paymentStatus: 'paid',
    paymentMethod: 'online',
    isVerified: true,
    verificationTime: '2024-11-14T15:00:00Z',
    teamName: 'Innovation Squad',
    isTeamLead: true,
    paymentIdentifier: 'GEN123456BCD890',
    registrationType: 'team'
  },
  {
    id: 'p011',
    fullName: 'Frank Anderson',
    email: 'frank.a@email.com',
    phone: '1098765432',
    college: 'Innovation Institute',
    registrationDate: '2024-11-14T14:05:00Z',
    paymentStatus: 'paid',
    paymentMethod: 'online',
    isVerified: true,
    verificationTime: '2024-11-14T15:00:00Z',
    teamName: 'Innovation Squad',
    isTeamLead: false,
    paymentIdentifier: 'GEN123456EFG123',
    registrationType: 'team'
  },
  {
    id: 'p012',
    fullName: 'Grace Thompson',
    email: 'grace.t@email.com',
    phone: '0987654321',
    college: 'Digital University',
    registrationDate: '2024-11-14T14:10:00Z',
    paymentStatus: 'pending',
    paymentMethod: null,
    isVerified: false,
    verificationTime: null,
    teamName: 'Innovation Squad',
    isTeamLead: false,
    paymentIdentifier: 'GEN123456HIJ456',
    registrationType: 'team'
  }
];

// Generate Excel for individual event
async function generateIndividualEventExcel() {
  const workbook = new ExcelJS.Workbook();
  
  // Event Info Sheet
  const eventSheet = workbook.addWorksheet('Event Info');
  eventSheet.columns = [
    { header: 'Property', key: 'property', width: 20 },
    { header: 'Value', key: 'value', width: 40 }
  ];
  
  eventSheet.addRows([
    { property: 'Event Title', value: sampleIndividualEvent.title },
    { property: 'Description', value: sampleIndividualEvent.description },
    { property: 'Date', value: new Date(sampleIndividualEvent.date).toLocaleDateString() },
    { property: 'Time', value: sampleIndividualEvent.time },
    { property: 'Room', value: sampleIndividualEvent.roomNo },
    { property: 'Entry Fee', value: `₹${sampleIndividualEvent.entryFee}` },
    { property: 'Payment Method', value: sampleIndividualEvent.paymentMethod },
    { property: 'Total Participants', value: sampleIndividualParticipants.length },
    { property: 'Team Event', value: 'No' },
    { property: 'Export Date', value: new Date().toLocaleString() }
  ]);

  // Style event info sheet
  eventSheet.getRow(1).font = { bold: true };
  eventSheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFE0E0E0' }
  };

  // Participants Sheet
  const participantsSheet = workbook.addWorksheet('Participants');
  participantsSheet.columns = [
    { header: 'S.No', key: 'sno', width: 8 },
    { header: 'Full Name', key: 'fullName', width: 20 },
    { header: 'Email', key: 'email', width: 25 },
    { header: 'Phone', key: 'phone', width: 15 },
    { header: 'College', key: 'college', width: 25 },
    { header: 'Registration Date', key: 'registrationDate', width: 18 },
    { header: 'Payment Status', key: 'paymentStatus', width: 15 },
    { header: 'Payment Method', key: 'paymentMethod', width: 15 },
    { header: 'Verification Status', key: 'verificationStatus', width: 15 },
    { header: 'Verification Time', key: 'verificationTime', width: 20 },
    { header: 'Team Name', key: 'teamName', width: 20 },
    { header: 'Team Lead', key: 'isTeamLead', width: 10 },
    { header: 'Payment ID', key: 'paymentId', width: 20 },
    { header: 'Registration Type', key: 'registrationType', width: 15 },
  ];

  // Add participant data
  sampleIndividualParticipants.forEach((participant, index) => {
    participantsSheet.addRow({
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
      paymentId: participant.paymentIdentifier || 'N/A',
      registrationType: participant.registrationType || 'regular',
    });
  });

  // Style participants sheet
  participantsSheet.getRow(1).font = { bold: true };
  participantsSheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFE0E0E0' }
  };

  // Save Excel file
  await workbook.xlsx.writeFile('demo_individual_event_export.xlsx');
  console.log('✅ Individual event Excel file generated: demo_individual_event_export.xlsx');
}

// Generate Excel for team event
async function generateTeamEventExcel() {
  const workbook = new ExcelJS.Workbook();
  
  // Event Info Sheet
  const eventSheet = workbook.addWorksheet('Event Info');
  eventSheet.columns = [
    { header: 'Property', key: 'property', width: 20 },
    { header: 'Value', key: 'value', width: 40 }
  ];
  
  eventSheet.addRows([
    { property: 'Event Title', value: sampleTeamEvent.title },
    { property: 'Description', value: sampleTeamEvent.description },
    { property: 'Date', value: new Date(sampleTeamEvent.date).toLocaleDateString() },
    { property: 'Time', value: sampleTeamEvent.time },
    { property: 'Room', value: sampleTeamEvent.roomNo },
    { property: 'Entry Fee', value: `₹${sampleTeamEvent.entryFee}` },
    { property: 'Payment Method', value: sampleTeamEvent.paymentMethod },
    { property: 'Total Participants', value: sampleTeamParticipants.length },
    { property: 'Team Event', value: 'Yes' },
    { property: 'Team Size', value: sampleTeamEvent.teamSize },
    { property: 'Max Teams', value: sampleTeamEvent.maxTeams },
    { property: 'Export Date', value: new Date().toLocaleString() }
  ]);

  // Style event info sheet
  eventSheet.getRow(1).font = { bold: true };
  eventSheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFE0E0E0' }
  };

  // Participants Sheet
  const participantsSheet = workbook.addWorksheet('Participants');
  participantsSheet.columns = [
    { header: 'S.No', key: 'sno', width: 8 },
    { header: 'Full Name', key: 'fullName', width: 20 },
    { header: 'Email', key: 'email', width: 25 },
    { header: 'Phone', key: 'phone', width: 15 },
    { header: 'College', key: 'college', width: 25 },
    { header: 'Registration Date', key: 'registrationDate', width: 18 },
    { header: 'Payment Status', key: 'paymentStatus', width: 15 },
    { header: 'Payment Method', key: 'paymentMethod', width: 15 },
    { header: 'Verification Status', key: 'verificationStatus', width: 15 },
    { header: 'Verification Time', key: 'verificationTime', width: 20 },
    { header: 'Team Name', key: 'teamName', width: 20 },
    { header: 'Team Lead', key: 'isTeamLead', width: 10 },
    { header: 'Payment ID', key: 'paymentId', width: 20 },
    { header: 'Registration Type', key: 'registrationType', width: 15 },
  ];

  // Add participant data
  sampleTeamParticipants.forEach((participant, index) => {
    participantsSheet.addRow({
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
      paymentId: participant.paymentIdentifier || 'N/A',
      registrationType: participant.registrationType || 'regular',
    });
  });

  // Style participants sheet
  participantsSheet.getRow(1).font = { bold: true };
  participantsSheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFE0E0E0' }
  };

  // Team Details Sheet
  const teamSheet = workbook.addWorksheet('Team Details');
  
  // Group participants by team
  const teamGroups = sampleTeamParticipants.reduce((acc, participant) => {
    const teamName = participant.teamName || 'Individual';
    if (!acc[teamName]) {
      acc[teamName] = [];
    }
    acc[teamName].push(participant);
    return acc;
  }, {});

  teamSheet.columns = [
    { header: 'Team Name', key: 'teamName', width: 20 },
    { header: 'Member Name', key: 'memberName', width: 20 },
    { header: 'Email', key: 'email', width: 25 },
    { header: 'Phone', key: 'phone', width: 15 },
    { header: 'College', key: 'college', width: 25 },
    { header: 'Role', key: 'role', width: 10 },
    { header: 'Payment Status', key: 'paymentStatus', width: 15 },
    { header: 'Verification Status', key: 'verificationStatus', width: 15 },
  ];

  Object.entries(teamGroups).forEach(([teamName, teamMembers]) => {
    teamMembers.forEach((member, memberIndex) => {
      teamSheet.addRow({
        teamName: memberIndex === 0 ? teamName : '', // Only show team name for first member
        memberName: member.fullName,
        email: member.email,
        phone: member.phone,
        college: member.college,
        role: member.isTeamLead ? 'Team Lead' : 'Member',
        paymentStatus: member.paymentStatus,
        verificationStatus: member.isVerified ? 'Verified' : 'Pending',
      });
    });
    // Add empty row between teams
    teamSheet.addRow({});
  });

  // Style team sheet header
  teamSheet.getRow(1).font = { bold: true };
  teamSheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFE0E0E0' }
  };

  // Save Excel file
  await workbook.xlsx.writeFile('demo_team_event_export.xlsx');
  console.log('✅ Team event Excel file generated: demo_team_event_export.xlsx');
}

// Generate PDF for individual event
function generateIndividualEventPDF() {
  const doc = new jsPDF('landscape', 'mm', 'a4');
  
  // Add title
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text(sampleIndividualEvent.title, 20, 20);
  
  // Add event details
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text(`Date: ${new Date(sampleIndividualEvent.date).toLocaleDateString()}`, 20, 30);
  doc.text(`Time: ${sampleIndividualEvent.time}`, 20, 35);
  doc.text(`Room: ${sampleIndividualEvent.roomNo}`, 20, 40);
  doc.text(`Entry Fee: ₹${sampleIndividualEvent.entryFee}`, 20, 45);
  doc.text(`Total Participants: ${sampleIndividualParticipants.length}`, 20, 50);
  doc.text(`Export Date: ${new Date().toLocaleString()}`, 20, 55);
  
  // Add participants table
  const tableData = sampleIndividualParticipants.map((participant, index) => [
    index + 1,
    participant.fullName,
    participant.phone,
    participant.college,
    participant.paymentStatus,
    participant.isVerified ? 'Verified' : 'Pending',
    participant.teamName || 'N/A',
    participant.isTeamLead ? 'Yes' : 'No'
  ]);

  doc.autoTable({
    head: [['S.No', 'Name', 'Phone', 'College', 'Payment', 'Verified', 'Team', 'Team Lead']],
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
      1: { cellWidth: 35 }, // Name
      2: { cellWidth: 25 }, // Phone
      3: { cellWidth: 40 }, // College
      4: { cellWidth: 20 }, // Payment
      5: { cellWidth: 20 }, // Verified
      6: { cellWidth: 25 }, // Team
      7: { cellWidth: 20 }, // Team Lead
    },
  });

  // Save PDF file
  doc.save('demo_individual_event_export.pdf');
  console.log('✅ Individual event PDF file generated: demo_individual_event_export.pdf');
}

// Generate PDF for team event
function generateTeamEventPDF() {
  const doc = new jsPDF('landscape', 'mm', 'a4');
  
  // Add title
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text(sampleTeamEvent.title, 20, 20);
  
  // Add event details
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text(`Date: ${new Date(sampleTeamEvent.date).toLocaleDateString()}`, 20, 30);
  doc.text(`Time: ${sampleTeamEvent.time}`, 20, 35);
  doc.text(`Room: ${sampleTeamEvent.roomNo}`, 20, 40);
  doc.text(`Entry Fee: ₹${sampleTeamEvent.entryFee}`, 20, 45);
  doc.text(`Total Participants: ${sampleTeamParticipants.length}`, 20, 50);
  doc.text(`Export Date: ${new Date().toLocaleString()}`, 20, 55);
  
  // Add participants table
  const tableData = sampleTeamParticipants.map((participant, index) => [
    index + 1,
    participant.fullName,
    participant.phone,
    participant.college,
    participant.paymentStatus,
    participant.isVerified ? 'Verified' : 'Pending',
    participant.teamName || 'N/A',
    participant.isTeamLead ? 'Yes' : 'No'
  ]);

  doc.autoTable({
    head: [['S.No', 'Name', 'Phone', 'College', 'Payment', 'Verified', 'Team', 'Team Lead']],
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
      1: { cellWidth: 35 }, // Name
      2: { cellWidth: 25 }, // Phone
      3: { cellWidth: 40 }, // College
      4: { cellWidth: 20 }, // Payment
      5: { cellWidth: 20 }, // Verified
      6: { cellWidth: 25 }, // Team
      7: { cellWidth: 20 }, // Team Lead
    },
  });

  // Add team details page
  const teamGroups = sampleTeamParticipants.reduce((acc, participant) => {
    const teamName = participant.teamName || 'Individual';
    if (!acc[teamName]) {
      acc[teamName] = [];
    }
    acc[teamName].push(participant);
    return acc;
  }, {});

  // Add new page for team details
  doc.addPage();
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('Team Details', 20, 20);

  let yPosition = 35;
  Object.entries(teamGroups).forEach(([teamName, teamMembers]) => {
    // Add team name
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text(`Team: ${teamName}`, 20, yPosition);
    yPosition += 10;

    // Add team members table
    const teamTableData = teamMembers.map(member => [
      member.fullName,
      member.phone,
      member.college,
      member.isTeamLead ? 'Team Lead' : 'Member',
      member.paymentStatus,
      member.isVerified ? 'Verified' : 'Pending'
    ]);

    doc.autoTable({
      head: [['Name', 'Phone', 'College', 'Role', 'Payment', 'Verified']],
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
        0: { cellWidth: 40 }, // Name
        1: { cellWidth: 30 }, // Phone
        2: { cellWidth: 50 }, // College
        3: { cellWidth: 25 }, // Role
        4: { cellWidth: 25 }, // Payment
        5: { cellWidth: 25 }, // Verified
      },
    });

    yPosition = doc.lastAutoTable.finalY + 15;
    
    // Check if we need a new page
    if (yPosition > 250) {
      doc.addPage();
      yPosition = 20;
    }
  });

  // Save PDF file
  doc.save('demo_team_event_export.pdf');
  console.log('✅ Team event PDF file generated: demo_team_event_export.pdf');
}

// Run the demo generation
async function generateDemoFiles() {
  console.log('🚀 Generating demo export files...\n');
  
  try {
    await generateIndividualEventExcel();
    await generateTeamEventExcel();
    generateIndividualEventPDF();
    generateTeamEventPDF();
    
    console.log('\n🎉 All demo files generated successfully!');
    console.log('\n📁 Generated files:');
    console.log('📊 demo_individual_event_export.xlsx - Individual event Excel export');
    console.log('📊 demo_team_event_export.xlsx - Team event Excel export');
    console.log('📄 demo_individual_event_export.pdf - Individual event PDF export');
    console.log('📄 demo_team_event_export.pdf - Team event PDF export');
    
    console.log('\n💡 These files show exactly how your exports will look!');
    console.log('   - Individual events: 2 sheets (Event Info + Participants)');
    console.log('   - Team events: 3 sheets (Event Info + Participants + Team Details)');
    console.log('   - PDFs: Professional formatted tables with event details');
    
  } catch (error) {
    console.error('❌ Error generating demo files:', error);
  }
}

// Execute the demo generation
generateDemoFiles();

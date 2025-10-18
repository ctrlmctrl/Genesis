// Simple PDF Demo Generator
const { jsPDF } = require('jspdf');
require('jspdf-autotable');

// Generate Individual Event PDF
function generateIndividualPDF() {
  const doc = new jsPDF('landscape', 'mm', 'a4');
  
  // Add title
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('Tech Conference 2024', 20, 20);
  
  // Add event details
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text('Date: 12/15/2024', 20, 30);
  doc.text('Time: 09:00', 20, 35);
  doc.text('Room: Auditorium A', 20, 40);
  doc.text('Entry Fee: ₹500', 20, 45);
  doc.text('Total Participants: 5', 20, 50);
  doc.text(`Export Date: ${new Date().toLocaleString()}`, 20, 55);
  
  // Add participants table
  const tableData = [
    ['1', 'John Smith', '9876543210', 'ABC Engineering College', 'paid', 'Verified', 'N/A', 'No'],
    ['2', 'Sarah Johnson', '8765432109', 'XYZ University', 'paid', 'Verified', 'N/A', 'No'],
    ['3', 'Michael Brown', '7654321098', 'DEF Institute of Technology', 'pending', 'Pending', 'N/A', 'No'],
    ['4', 'Emily Davis', '6543210987', 'Tech University', 'paid', 'Verified', 'N/A', 'No'],
    ['5', 'Robert Wilson', '5432109876', 'Engineering College', 'offline_paid', 'Verified', 'N/A', 'No']
  ];

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
  console.log('✅ Individual event PDF generated: demo_individual_event_export.pdf');
}

// Generate Team Event PDF
function generateTeamPDF() {
  const doc = new jsPDF('landscape', 'mm', 'a4');
  
  // Add title
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('Hackathon 2024', 20, 20);
  
  // Add event details
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text('Date: 12/20/2024', 20, 30);
  doc.text('Time: 18:00', 20, 35);
  doc.text('Room: Computer Lab 1', 20, 40);
  doc.text('Entry Fee: ₹1000', 20, 45);
  doc.text('Total Participants: 7', 20, 50);
  doc.text(`Export Date: ${new Date().toLocaleString()}`, 20, 55);
  
  // Add participants table
  const tableData = [
    ['1', 'Alice Wilson', '6543210987', 'Tech University', 'paid', 'Verified', 'Code Warriors', 'Yes'],
    ['2', 'Bob Davis', '5432109876', 'Tech University', 'paid', 'Verified', 'Code Warriors', 'No'],
    ['3', 'Carol Martinez', '4321098765', 'Engineering College', 'paid', 'Verified', 'Code Warriors', 'No'],
    ['4', 'David Lee', '3210987654', 'Engineering College', 'paid', 'Verified', 'Code Warriors', 'No'],
    ['5', 'Emma Taylor', '2109876543', 'Innovation Institute', 'paid', 'Verified', 'Innovation Squad', 'Yes'],
    ['6', 'Frank Anderson', '1098765432', 'Innovation Institute', 'paid', 'Verified', 'Innovation Squad', 'No'],
    ['7', 'Grace Thompson', '0987654321', 'Digital University', 'pending', 'Pending', 'Innovation Squad', 'No']
  ];

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
  doc.addPage();
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('Team Details', 20, 20);

  // Team 1: Code Warriors
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Team: Code Warriors', 20, 35);

  const team1Data = [
    ['Alice Wilson', '6543210987', 'Tech University', 'Team Lead', 'paid', 'Verified'],
    ['Bob Davis', '5432109876', 'Tech University', 'Member', 'paid', 'Verified'],
    ['Carol Martinez', '4321098765', 'Engineering College', 'Member', 'paid', 'Verified'],
    ['David Lee', '3210987654', 'Engineering College', 'Member', 'paid', 'Verified']
  ];

  doc.autoTable({
    head: [['Name', 'Phone', 'College', 'Role', 'Payment', 'Verified']],
    body: team1Data,
    startY: 45,
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

  // Team 2: Innovation Squad
  const team2Y = doc.lastAutoTable.finalY + 20;
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Team: Innovation Squad', 20, team2Y);

  const team2Data = [
    ['Emma Taylor', '2109876543', 'Innovation Institute', 'Team Lead', 'paid', 'Verified'],
    ['Frank Anderson', '1098765432', 'Innovation Institute', 'Member', 'paid', 'Verified'],
    ['Grace Thompson', '0987654321', 'Digital University', 'Member', 'pending', 'Pending']
  ];

  doc.autoTable({
    head: [['Name', 'Phone', 'College', 'Role', 'Payment', 'Verified']],
    body: team2Data,
    startY: team2Y + 10,
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

  // Save PDF file
  doc.save('demo_team_event_export.pdf');
  console.log('✅ Team event PDF generated: demo_team_event_export.pdf');
}

// Generate both PDFs
console.log('🚀 Generating PDF demo files...\n');

try {
  generateIndividualPDF();
  generateTeamPDF();
  
  console.log('\n🎉 PDF demo files generated successfully!');
  console.log('\n📁 Generated files:');
  console.log('📄 demo_individual_event_export.pdf - Individual event PDF export');
  console.log('📄 demo_team_event_export.pdf - Team event PDF export');
  
} catch (error) {
  console.error('❌ Error generating PDF files:', error);
}

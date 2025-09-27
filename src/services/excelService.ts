import * as XLSX from 'xlsx';
// @ts-ignore
import { saveAs } from 'file-saver';
import { Participant, Event } from '../types';

export class ExcelService {
  exportParticipantsToExcel(participants: Participant[], event: Event): void {
    const worksheetData = participants.map((participant, index) => ({
      'S.No': index + 1,
      'First Name': participant.firstName,
      'Last Name': participant.lastName,
      'Email': participant.email,
      'Phone': participant.phone,
      'Registration Date': new Date(participant.registrationDate).toLocaleDateString(),
      'Payment Status': participant.paymentStatus,
      'Payment Method': participant.paymentMethod || 'N/A',
      'Verification Status': participant.isVerified ? 'Verified' : 'Pending',
      'Verification Time': participant.verificationTime ? new Date(participant.verificationTime).toLocaleString() : 'N/A',
      'Age': participant.additionalInfo?.age || 'N/A',
      'Emergency Contact': participant.additionalInfo?.emergencyContact || 'N/A',
      'Emergency Phone': participant.additionalInfo?.emergencyPhone || 'N/A',
      'T-Shirt Size': participant.additionalInfo?.tshirtSize || 'N/A',
      'Dietary Restrictions': participant.additionalInfo?.dietaryRestrictions || 'N/A',
      'Medical Conditions': participant.additionalInfo?.medicalConditions || 'N/A',
      'Special Requests': participant.additionalInfo?.specialRequests || 'N/A',
    }));

    const worksheet = XLSX.utils.json_to_sheet(worksheetData);
    const workbook = XLSX.utils.book_new();
    
    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Participants');
    
    // Generate Excel file
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const data = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    
    // Save file
    const fileName = `${event.title.replace(/[^a-zA-Z0-9]/g, '_')}_participants_${new Date().toISOString().split('T')[0]}.xlsx`;
    saveAs(data, fileName);
  }

  exportEventSummary(events: Event[]): void {
    const worksheetData = events.map((event, index) => ({
      'S.No': index + 1,
      'Event Title': event.title,
      'Description': event.description,
      'Date': new Date(event.date).toLocaleDateString(),
      'Time': event.time,
      'Location': event.location,
      'Entry Fee': `₹${event.entryFee}`,
      'Payment Method': event.paymentMethod,
      'Current Participants': event.currentParticipants,
      'Status': event.isActive ? 'Active' : 'Inactive',
      'Created Date': new Date(event.createdAt).toLocaleDateString(),
    }));

    const worksheet = XLSX.utils.json_to_sheet(worksheetData);
    const workbook = XLSX.utils.book_new();
    
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Events');
    
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const data = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    
    const fileName = `events_summary_${new Date().toISOString().split('T')[0]}.xlsx`;
    saveAs(data, fileName);
  }
}

export const excelService = new ExcelService();

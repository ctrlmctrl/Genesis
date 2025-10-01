// Local Storage Service for persistent data
class LocalStorageService {
  private getStorageKey(key: string): string {
    return `genesis_event_manager_${key}`;
  }

  // Events
  saveEvents(events: any[]): void {
    localStorage.setItem(this.getStorageKey('events'), JSON.stringify(events));
  }

  getEvents(): any[] {
    const data = localStorage.getItem(this.getStorageKey('events'));
    return data ? JSON.parse(data) : [];
  }

  // Participants
  saveParticipants(participants: any[]): void {
    localStorage.setItem(this.getStorageKey('participants'), JSON.stringify(participants));
  }

  getParticipants(): any[] {
    const data = localStorage.getItem(this.getStorageKey('participants'));
    return data ? JSON.parse(data) : [];
  }

  // Verification Records
  saveVerificationRecords(records: any[]): void {
    localStorage.setItem(this.getStorageKey('verification_records'), JSON.stringify(records));
  }

  getVerificationRecords(): any[] {
    const data = localStorage.getItem(this.getStorageKey('verification_records'));
    return data ? JSON.parse(data) : [];
  }

  // Clear all data
  clearAllData(): void {
    const keys = ['events', 'participants', 'verification_records'];
    keys.forEach(key => {
      localStorage.removeItem(this.getStorageKey(key));
    });
  }

  // Export all data
  exportAllData(): any {
    return {
      events: this.getEvents(),
      participants: this.getParticipants(),
      verificationRecords: this.getVerificationRecords(),
      exportDate: new Date().toISOString()
    };
  }

  // Import data
  importData(data: any): void {
    if (data.events) this.saveEvents(data.events);
    if (data.participants) this.saveParticipants(data.participants);
    if (data.verificationRecords) this.saveVerificationRecords(data.verificationRecords);
  }
}

export const localStorageService = new LocalStorageService();

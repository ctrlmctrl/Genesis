import { db } from "../firebase";
import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  updateDoc,
  doc,
  Timestamp,
} from "firebase/firestore";
import { dataService } from "./dataService";

export interface OfflinePaymentCode {
  id?: string;
  code: string;
  eventId: string;
  amount: number;
  generatedBy: string; // Admin/Volunteer ID
  generatedAt: string;
  usedBy?: string; // Participant ID
  usedAt?: string;
  isUsed: boolean;
  expiresAt: string;
}

export class OfflineCodeService {
  private codes: OfflinePaymentCode[] = [];

  constructor() {
    this.loadCodesFromFirebase();
  }

  // 🔹 Load all codes from Firebase (optional cache)
  async loadCodesFromFirebase(): Promise<void> {
    try {
      const snapshot = await getDocs(collection(db, "offline_payment_codes"));
      this.codes = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as OfflinePaymentCode[];
    } catch (error) {
      console.error("Error loading offline payment codes:", error);
      this.codes = [];
    }
  }

  // 🔹 Generate new offline code (event + amount specific)
  async generateCode(
    eventId: string,
    amount: number,
    generatedBy: string
  ): Promise<OfflinePaymentCode> {
    const code = this.generateUniqueCode();

    // Expiration → 24 hours from now
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    const newCode: OfflinePaymentCode = {
      code,
      eventId,
      amount,
      generatedBy,
      generatedAt: new Date().toISOString(),
      isUsed: false,
      expiresAt: expiresAt.toISOString(),
    };

    try {
      const docRef = await addDoc(
        collection(db, "offline_payment_codes"),
        newCode
      );
      newCode.id = docRef.id;
      this.codes.push(newCode);
      return newCode;
    } catch (error) {
      console.error("Error generating offline payment code:", error);
      throw error;
    }
  }

  // 🔹 Unique 6-digit alphanumeric generator
  private generateUniqueCode(): string {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let code = "";
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }

  // 🔹 Validate the code (checks event, amount, expiry, and used state)
  async validateCode(
    code: string,
    eventId: string,
    eventFee: number
  ): Promise<{ isValid: boolean; codeData?: OfflinePaymentCode; error?: string }> {
    try {
      const q = query(
        collection(db, "offline_payment_codes"),
        where("code", "==", code),
        where("eventId", "==", eventId)
      );
      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        return { isValid: false, error: "Invalid code or event." };
      }

      const docSnap = snapshot.docs[0];
      const data = docSnap.data() as OfflinePaymentCode;
      const now = new Date();
      const expiresAt = new Date(data.expiresAt);

      if (data.isUsed) {
        return { isValid: false, error: "This code has already been used." };
      }

      if (now > expiresAt) {
        return { isValid: false, error: "This code has expired." };
      }

      if (data.amount !== eventFee) {
        return {
          isValid: false,
          error: `Code amount (₹${data.amount}) does not match event fee (₹${eventFee}).`,
        };
      }

      return { isValid: true, codeData: { id: docSnap.id, ...data } };
    } catch (error) {
      console.error("Error validating code:", error);
      return { isValid: false, error: "Error validating code." };
    }
  }

  // 🔹 Use code (mark as used + update payment)
  async useCode(
    code: string,
    eventId: string,
    eventFee: number,
    participantId: string
  ): Promise<boolean> {
    const validation = await this.validateCode(code, eventId, eventFee);

    if (!validation.isValid || !validation.codeData) {
      console.warn("Invalid or mismatched code usage:", validation.error);
      return false;
    }

    try {
      const docRef = doc(db, "offline_payment_codes", validation.codeData.id!);
      await updateDoc(docRef, {
        isUsed: true,
        usedBy: participantId,
        usedAt: Timestamp.now(),
      });

      await dataService.updatePaymentStatus(
        participantId,
        "offline_paid",
        "offline"
      );

      console.log("Offline code marked as used and participant updated.");
      return true;
    } catch (error) {
      console.error("Error using offline payment code:", error);
      return false;
    }
  }

  // 🔹 Get codes by event
  async getCodesByEvent(eventId: string): Promise<OfflinePaymentCode[]> {
    const q = query(
      collection(db, "offline_payment_codes"),
      where("eventId", "==", eventId)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as OfflinePaymentCode[];
  }

  // 🔹 Get unused codes
  async getUnusedCodes(): Promise<OfflinePaymentCode[]> {
    const q = query(
      collection(db, "offline_payment_codes"),
      where("isUsed", "==", false)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as OfflinePaymentCode[];
  }

  // 🔹 Get used codes
  async getUsedCodes(): Promise<OfflinePaymentCode[]> {
    const q = query(
      collection(db, "offline_payment_codes"),
      where("isUsed", "==", true)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as OfflinePaymentCode[];
  }
  // Get statistics
  async getCodeStats(): Promise<{
    total: number;
    used: number;
    unused: number;
    expired: number;
  }> {
    const snapshot = await getDocs(collection(db, 'offlinePaymentCodes'));
    const codes = snapshot.docs.map(doc => doc.data() as OfflinePaymentCode);
    const now = new Date();

    const total = codes.length;
    const used = codes.filter(c => c.isUsed).length;
    const expired = codes.filter(c => !c.isUsed && new Date(c.expiresAt) <= now).length;
    const unused = total - used - expired;

    return { total, used, unused, expired };
  }

}

export const offlineCodeService = new OfflineCodeService();

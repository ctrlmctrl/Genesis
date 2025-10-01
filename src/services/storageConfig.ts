// Storage Configuration - Choose your storage method
import { dataService } from './dataService';
import { localStorageService } from './localStorageService';
import { firebaseService } from './firebaseService';
import { jsonServerService } from './jsonServerService';

export type StorageType = 'memory' | 'localStorage' | 'firebase' | 'jsonServer';

// Change this to switch storage methods
export const STORAGE_TYPE: StorageType = 'localStorage';

// Get the appropriate service based on configuration
export const getStorageService = () => {
  if (STORAGE_TYPE === 'localStorage') {
    return localStorageService;
  } else if (STORAGE_TYPE === 'firebase') {
    return firebaseService;
  } else if (STORAGE_TYPE === 'jsonServer') {
    return jsonServerService;
  } else {
    return dataService;
  }
};

// Storage service instance
export const storageService = getStorageService();

export type UserRole = 'RESIDENT' | 'COLLECTOR' | 'ADMIN';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  phone?: string;
  avatar?: string;
  houseId?: string;
  status: 'ACTIVE' | 'INACTIVE';
  createdAt: string;
}

export interface House {
  id: string;
  houseNumber: string;
  residentId: string;
  residentName: string;
  address: string;
  latitude: number;
  longitude: number;
  phone: string;
  assignedCollectorId?: string;
  assignedCollectorName?: string;
  pickupStatus: 'PENDING' | 'SCHEDULED' | 'COLLECTOR_ON_WAY' | 'COMPLETED';
  nextPickupDate: string;
  lastPickupDate?: string;
}

export type WasteCategory =
  | 'Plastic'
  | 'Paper'
  | 'Cardboard'
  | 'Glass'
  | 'Metal'
  | 'Food Waste'
  | 'Organic Waste'
  | 'E-waste'
  | 'Hazardous Waste'
  | 'General Waste';

export type WasteType = 'Dry Waste' | 'Wet Waste';

export interface DetectionItem {
  object: string;
  category: WasteCategory | string;
  wasteType: WasteType;
  confidence: number;
  recyclable: boolean;
  recommendedBin: string;
  disposalMethod: string;
}

export interface WasteDetectionResponse {
  success: boolean;
  garbageDetected: boolean;
  humanDetected?: boolean;
  nonWasteDetected?: boolean;
  detections: DetectionItem[];
  message?: string;
  error?: string;
}

export interface WasteScan {
  id: string;
  residentId: string;
  residentName?: string;
  houseId: string;
  image: string;
  detectedObject: string;
  category: string;
  wasteType: WasteType;
  confidence: number;
  recyclable: boolean;
  recommendedBin: string;
  disposalMethod: string;
  latitude?: number;
  longitude?: number;
  date: string;
  time: string;
  timestamp: number;
}

export type ReportStatus =
  | 'REPORTED'
  | 'ASSIGNED'
  | 'COLLECTOR ON THE WAY'
  | 'COLLECTED'
  | 'COMPLETED';

export interface GarbageReport {
  id: string;
  residentId: string;
  residentName: string;
  houseId: string;
  address: string;
  image: string;
  latitude: number;
  longitude: number;
  description: string;
  date: string;
  time: string;
  timestamp: number;
  status: ReportStatus;
  assignedCollectorId?: string;
  assignedCollectorName?: string;
}

export interface Vehicle {
  id: string;
  registrationNumber: string;
  vehicleType: string;
  capacityKg: number;
  assignedCollectorId?: string;
  assignedCollectorName?: string;
  status: 'AVAILABLE' | 'ACTIVE' | 'MAINTENANCE';
  model?: string;
}

export interface PickupTask {
  id: string;
  houseId: string;
  houseNumber: string;
  residentId: string;
  residentName: string;
  address: string;
  latitude: number;
  longitude: number;
  phone: string;
  scheduledTime: string;
  wasteType: WasteType | 'Both Dry & Wet';
  status: 'PENDING' | 'COLLECTOR_ON_WAY' | 'COMPLETED';
  collectorId?: string;
  collectorName?: string;
  distanceKm?: number;
  weightKg?: number;
  completedAt?: string;
  scanImage?: string;
  detectionCategory?: string;
}

export interface CollectorLocation {
  collectorId: string;
  collectorName: string;
  latitude: number;
  longitude: number;
  timestamp: string;
  isOnline: boolean;
  vehicleId?: string;
  status: 'IDLE' | 'ON_DUTY' | 'EN_ROUTE' | 'COLLECTING';
  currentHouseId?: string;
  completedPickupsToday: number;
  pendingPickupsToday: number;
}

export interface AppNotification {
  id: string;
  userId: string;
  title: string;
  message: string;
  date: string;
  time: string;
  timestamp: number;
  read: boolean;
  type: 'PICKUP' | 'ASSIGNMENT' | 'ALERT' | 'REPORT';
}

export interface AdminStats {
  totalResidents: number;
  totalCollectors: number;
  activeCollectors: number;
  totalHouses: number;
  totalVehicles: number;
  totalWasteCollectedKg: number;
  dryWasteKg: number;
  wetWasteKg: number;
  totalScans: number;
  categoryBreakdown: Record<string, number>;
  pendingPickups: number;
  completedPickups: number;
}

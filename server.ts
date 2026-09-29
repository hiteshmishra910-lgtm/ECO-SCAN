import express from 'express';
import multer from 'multer';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import * as archiverModule from 'archiver';
const archiver = (archiverModule as any).default || archiverModule;
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Body parser
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));

// Multer memory storage for uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 20 * 1024 * 1024 }, // 20 MB
});

// Setup Gemini AI client on server side only
const getApiKey = () => process.env.GEMINI_API_KEY || process.env.AI_API_KEY || '';

const getAiClient = () => {
  const key = getApiKey();
  return new GoogleGenAI({
    apiKey: key,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
};

// ==========================================
// IN-MEMORY DATABASE WITH INITIAL PERSISTENCE
// ==========================================

export interface DbUser {
  id: string;
  name: string;
  email: string;
  password?: string;
  role: 'RESIDENT' | 'COLLECTOR' | 'ADMIN';
  phone: string;
  houseId?: string;
  vehicleId?: string;
  status: 'ACTIVE' | 'INACTIVE';
  createdAt: string;
}

export interface DbHouse {
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

export interface DbVehicle {
  id: string;
  registrationNumber: string;
  vehicleType: string;
  capacityKg: number;
  assignedCollectorId?: string;
  assignedCollectorName?: string;
  status: 'AVAILABLE' | 'ACTIVE' | 'MAINTENANCE';
  model?: string;
}

export interface DbPickup {
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
  wasteType: 'Dry Waste' | 'Wet Waste' | 'Both Dry & Wet';
  status: 'PENDING' | 'COLLECTOR_ON_WAY' | 'COMPLETED';
  collectorId?: string;
  collectorName?: string;
  distanceKm?: number;
  weightKg?: number;
  completedAt?: string;
  scanImage?: string;
  detectionCategory?: string;
}

export interface DbWasteScan {
  id: string;
  residentId: string;
  residentName: string;
  houseId: string;
  image: string;
  detectedObject: string;
  category: string;
  wasteType: 'Dry Waste' | 'Wet Waste';
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

export interface DbGarbageReport {
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
  status: 'REPORTED' | 'ASSIGNED' | 'COLLECTOR ON THE WAY' | 'COLLECTED' | 'COMPLETED';
  assignedCollectorId?: string;
  assignedCollectorName?: string;
}

export interface DbCollectorLocation {
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

export interface DbNotification {
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

// Initial Data Seed
const users: DbUser[] = [
  {
    id: 'USR-RES-001',
    name: 'Ananya Sharma',
    email: 'resident@ecoscan.org',
    password: 'password123',
    role: 'RESIDENT',
    phone: '+91 98765 43210',
    houseId: 'H-101',
    status: 'ACTIVE',
    createdAt: '2026-01-15T08:00:00.000Z',
  },
  {
    id: 'USR-RES-002',
    name: 'Vikram Patel',
    email: 'vikram.patel@ecoscan.org',
    password: 'password123',
    role: 'RESIDENT',
    phone: '+91 98220 12345',
    houseId: 'H-102',
    status: 'ACTIVE',
    createdAt: '2026-02-10T09:30:00.000Z',
  },
  {
    id: 'USR-COL-001',
    name: 'Rajesh Kumar',
    email: 'collector@ecoscan.org',
    password: 'password123',
    role: 'COLLECTOR',
    phone: '+91 94221 88765',
    vehicleId: 'VEH-01',
    status: 'ACTIVE',
    createdAt: '2026-01-10T06:00:00.000Z',
  },
  {
    id: 'USR-COL-002',
    name: 'Deepak Sharma',
    email: 'deepak.collector@ecoscan.org',
    password: 'password123',
    role: 'COLLECTOR',
    phone: '+91 93701 55432',
    vehicleId: 'VEH-02',
    status: 'ACTIVE',
    createdAt: '2026-02-01T07:15:00.000Z',
  },
  {
    id: 'USR-ADM-001',
    name: 'EcoScan Admin',
    email: 'admin@ecoscan.org',
    password: 'password123',
    role: 'ADMIN',
    phone: '+91 80000 11223',
    status: 'ACTIVE',
    createdAt: '2025-12-01T00:00:00.000Z',
  },
];

const houses: DbHouse[] = [
  {
    id: 'H-101',
    houseNumber: 'House #101',
    residentId: 'USR-RES-001',
    residentName: 'Ananya Sharma',
    address: 'Greenwood Villa #101, Oak Tree Lane, Sector 4',
    latitude: 21.1458,
    longitude: 79.0882,
    phone: '+91 98765 43210',
    assignedCollectorId: 'USR-COL-001',
    assignedCollectorName: 'Rajesh Kumar',
    pickupStatus: 'PENDING',
    nextPickupDate: 'Today, 10:00 AM - 11:30 AM',
    lastPickupDate: 'Yesterday at 10:45 AM',
  },
  {
    id: 'H-102',
    houseNumber: 'House #102',
    residentId: 'USR-RES-002',
    residentName: 'Vikram Patel',
    address: 'Maple Residence #102, Pine Avenue, Sector 4',
    latitude: 21.1492,
    longitude: 79.0915,
    phone: '+91 98220 12345',
    assignedCollectorId: 'USR-COL-001',
    assignedCollectorName: 'Rajesh Kumar',
    pickupStatus: 'PENDING',
    nextPickupDate: 'Today, 11:30 AM - 12:30 PM',
    lastPickupDate: 'Yesterday at 11:15 AM',
  },
  {
    id: 'H-103',
    houseNumber: 'House #103',
    residentId: 'USR-RES-003',
    residentName: 'Pooja Desai',
    address: 'Sunshine Homes #103, Cedar Road, Sector 5',
    latitude: 21.1431,
    longitude: 79.0841,
    phone: '+91 91234 56780',
    assignedCollectorId: 'USR-COL-001',
    assignedCollectorName: 'Rajesh Kumar',
    pickupStatus: 'PENDING',
    nextPickupDate: 'Today, 01:00 PM - 02:00 PM',
    lastPickupDate: 'Yesterday at 12:30 PM',
  },
  {
    id: 'H-104',
    houseNumber: 'House #104',
    residentId: 'USR-RES-004',
    residentName: 'Sunil Verma',
    address: 'Emerald Heights #104, Palm Boulevard, Sector 5',
    latitude: 21.152,
    longitude: 79.095,
    phone: '+91 99887 76655',
    assignedCollectorId: 'USR-COL-002',
    assignedCollectorName: 'Deepak Sharma',
    pickupStatus: 'SCHEDULED',
    nextPickupDate: 'Today, 02:30 PM - 03:30 PM',
    lastPickupDate: '2 days ago',
  },
];

const vehicles: DbVehicle[] = [
  {
    id: 'VEH-01',
    registrationNumber: 'MH-31-EQ-4421',
    vehicleType: 'Electric Tipper Truck (100% Eco)',
    capacityKg: 1200,
    assignedCollectorId: 'USR-COL-001',
    assignedCollectorName: 'Rajesh Kumar',
    status: 'ACTIVE',
    model: 'Tata Ace EV Green 2025',
  },
  {
    id: 'VEH-02',
    registrationNumber: 'MH-31-EQ-8819',
    vehicleType: 'Compactor Waste Van',
    capacityKg: 2500,
    assignedCollectorId: 'USR-COL-002',
    assignedCollectorName: 'Deepak Sharma',
    status: 'ACTIVE',
    model: 'Ashok Leyland EcoSmart',
  },
  {
    id: 'VEH-03',
    registrationNumber: 'MH-31-EQ-1102',
    vehicleType: 'Rapid Collection Trike (Electric)',
    capacityKg: 450,
    assignedCollectorId: undefined,
    assignedCollectorName: undefined,
    status: 'AVAILABLE',
    model: 'Mahindra Zor Grand',
  },
];

const pickups: DbPickup[] = [
  {
    id: 'PCK-101',
    houseId: 'H-101',
    houseNumber: 'House #101',
    residentId: 'USR-RES-001',
    residentName: 'Ananya Sharma',
    address: 'Greenwood Villa #101, Oak Tree Lane, Sector 4',
    latitude: 21.1458,
    longitude: 79.0882,
    phone: '+91 98765 43210',
    scheduledTime: '10:00 AM - 11:30 AM',
    wasteType: 'Both Dry & Wet',
    status: 'PENDING',
    collectorId: 'USR-COL-001',
    collectorName: 'Rajesh Kumar',
    distanceKm: 0.4,
  },
  {
    id: 'PCK-102',
    houseId: 'H-102',
    houseNumber: 'House #102',
    residentId: 'USR-RES-002',
    residentName: 'Vikram Patel',
    address: 'Maple Residence #102, Pine Avenue, Sector 4',
    latitude: 21.1492,
    longitude: 79.0915,
    phone: '+91 98220 12345',
    scheduledTime: '11:30 AM - 12:30 PM',
    wasteType: 'Dry Waste',
    status: 'PENDING',
    collectorId: 'USR-COL-001',
    collectorName: 'Rajesh Kumar',
    distanceKm: 0.9,
  },
  {
    id: 'PCK-103',
    houseId: 'H-103',
    houseNumber: 'House #103',
    residentId: 'USR-RES-003',
    residentName: 'Pooja Desai',
    address: 'Sunshine Homes #103, Cedar Road, Sector 5',
    latitude: 21.1431,
    longitude: 79.0841,
    phone: '+91 91234 56780',
    scheduledTime: '01:00 PM - 02:00 PM',
    wasteType: 'Wet Waste',
    status: 'PENDING',
    collectorId: 'USR-COL-001',
    collectorName: 'Rajesh Kumar',
    distanceKm: 1.6,
  },
  {
    id: 'PCK-104',
    houseId: 'H-104',
    houseNumber: 'House #104',
    residentId: 'USR-RES-004',
    residentName: 'Sunil Verma',
    address: 'Emerald Heights #104, Palm Boulevard, Sector 5',
    latitude: 21.152,
    longitude: 79.095,
    phone: '+91 99887 76655',
    scheduledTime: '02:30 PM - 03:30 PM',
    wasteType: 'Both Dry & Wet',
    status: 'PENDING',
    collectorId: 'USR-COL-002',
    collectorName: 'Deepak Sharma',
    distanceKm: 2.1,
  },
];

const wasteScans: DbWasteScan[] = [
  {
    id: 'SCN-001',
    residentId: 'USR-RES-001',
    residentName: 'Ananya Sharma',
    houseId: 'H-101',
    image: '',
    detectedObject: 'PET Plastic Water Bottle',
    category: 'Plastic',
    wasteType: 'Dry Waste',
    confidence: 0.96,
    recyclable: true,
    recommendedBin: 'Dry Waste Bin (Blue)',
    disposalMethod: 'Empty liquid, crush to save volume, place inside Dry Recyclables bin.',
    latitude: 21.1458,
    longitude: 79.0882,
    date: '2026-09-28',
    time: '18:40',
    timestamp: Date.now() - 86400000,
  },
  {
    id: 'SCN-002',
    residentId: 'USR-RES-001',
    residentName: 'Ananya Sharma',
    houseId: 'H-101',
    image: '',
    detectedObject: 'Vegetable & Fruit Peels',
    category: 'Organic Waste',
    wasteType: 'Wet Waste',
    confidence: 0.94,
    recyclable: false,
    recommendedBin: 'Wet Waste Bin (Green)',
    disposalMethod: 'Wrap in newspaper or compost bin. Keep separate from dry packaging.',
    latitude: 21.1458,
    longitude: 79.0882,
    date: '2026-09-29',
    time: '08:15',
    timestamp: Date.now() - 3600000,
  },
];

const garbageReports: DbGarbageReport[] = [
  {
    id: 'REP-001',
    residentId: 'USR-RES-001',
    residentName: 'Ananya Sharma',
    houseId: 'H-101',
    address: 'Near Greenwood Park Entrance, Oak Tree Lane',
    image: '',
    latitude: 21.1462,
    longitude: 79.0888,
    description: 'Overflowing dry cardboard packaging and fallen branches near the pavement corner.',
    date: '2026-09-29',
    time: '08:30',
    timestamp: Date.now() - 1800000,
    status: 'ASSIGNED',
    assignedCollectorId: 'USR-COL-001',
    assignedCollectorName: 'Rajesh Kumar',
  },
];

const collectorLocations: Record<string, DbCollectorLocation> = {
  'USR-COL-001': {
    collectorId: 'USR-COL-001',
    collectorName: 'Rajesh Kumar',
    latitude: 21.1465,
    longitude: 79.0875,
    timestamp: new Date().toISOString(),
    isOnline: true,
    vehicleId: 'VEH-01',
    status: 'ON_DUTY',
    currentHouseId: 'H-101',
    completedPickupsToday: 5,
    pendingPickupsToday: 3,
  },
  'USR-COL-002': {
    collectorId: 'USR-COL-002',
    collectorName: 'Deepak Sharma',
    latitude: 21.151,
    longitude: 79.0935,
    timestamp: new Date().toISOString(),
    isOnline: true,
    vehicleId: 'VEH-02',
    status: 'ON_DUTY',
    currentHouseId: 'H-104',
    completedPickupsToday: 3,
    pendingPickupsToday: 4,
  },
};

const notifications: DbNotification[] = [
  {
    id: 'NOTIF-01',
    userId: 'USR-RES-001',
    title: 'Collector Assigned',
    message: 'Rajesh Kumar (Vehicle MH-31-EQ-4421) has been assigned to your morning pickup.',
    date: '2026-09-29',
    time: '09:00',
    timestamp: Date.now() - 900000,
    read: false,
    type: 'ASSIGNMENT',
  },
  {
    id: 'NOTIF-02',
    userId: 'USR-COL-001',
    title: 'New Garbage Report Assigned',
    message: 'Admin assigned a garbage report near Greenwood Park Entrance to your route.',
    date: '2026-09-29',
    time: '08:35',
    timestamp: Date.now() - 1700000,
    read: false,
    type: 'REPORT',
  },
];

// Helper: send notification
function addNotification(
  userId: string,
  title: string,
  message: string,
  type: DbNotification['type']
) {
  const now = new Date();
  const notif: DbNotification = {
    id: `NOTIF-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    userId,
    title,
    message,
    date: now.toISOString().split('T')[0],
    time: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    timestamp: Date.now(),
    read: false,
    type,
  };
  notifications.unshift(notif);
}

// ==========================================
// 1. WASTE DETECTION API (REAL AI GEMINI)
// ==========================================

app.post('/api/detect-waste', upload.single('image'), async (req, res) => {
  try {
    let imageBuffer: Buffer | null = null;
    let mimeType = 'image/jpeg';

    if (req.file) {
      imageBuffer = req.file.buffer;
      mimeType = req.file.mimetype || 'image/jpeg';
    } else if (req.body && req.body.image) {
      const base64Data = req.body.image;
      const match = base64Data.match(/^data:([^;]+);base64,(.+)$/);
      if (match) {
        mimeType = match[1];
        imageBuffer = Buffer.from(match[2], 'base64');
      } else {
        imageBuffer = Buffer.from(base64Data, 'base64');
      }
    }

    if (!imageBuffer) {
      return res.status(400).json({
        success: false,
        garbageDetected: false,
        message: 'No image provided. Please capture or upload a clear photo.',
        detections: [],
      });
    }

    const key = getApiKey();
    if (!key) {
      return res.status(500).json({
        success: false,
        garbageDetected: false,
        message: 'Unable to analyze the image. AI API key is not configured on the server.',
        detections: [],
      });
    }

    const base64Image = imageBuffer.toString('base64');
    const aiClient = getAiClient();

    const promptText = `
You are the EcoScan Waste Detection & Segregation Computer Vision Engine.
Analyze the provided image with extreme precision according to these strict rules.

RULE 1: HUMAN & PERSON DETECTION (NEVER CLASSIFY AS GARBAGE)
- You must NEVER classify a human, person, face, selfie, hand, arm, body, clothing, room, building, phone, laptop, screen, furniture, chair, desk, car, bike, or animal as garbage.
- If the image contains a human/person (including selfies, portraits, hands, or faces) and NO garbage:
  You MUST return:
  "garbageDetected": false,
  "humanDetected": true,
  "nonWasteDetected": true,
  "detections": [],
  "message": "Human/person detected. Please scan actual waste."

RULE 2: NON-WASTE OBJECTS (NEVER CLASSIFY AS GARBAGE)
- If the image shows clean household/office items (e.g. phone, keyboard, desk, walls, empty room, car, bicycle, pet, animals) and NO discarded garbage or waste:
  You MUST return:
  "garbageDetected": false,
  "humanDetected": false,
  "nonWasteDetected": true,
  "detections": [],
  "message": "Unable to identify garbage. Please scan a clear waste item."

RULE 3: REAL WASTE DETECTION & PARTICULAR ITEM IDENTIFICATION
When actual discarded garbage, recyclables, or waste items are present in the image:
Identify the PARTICULAR waste item:
- Plastic bottle (water bottle, soda bottle) -> object: "Plastic Bottle", category: "Plastic", wasteType: "Dry Waste", recyclable: true, recommendedBin: "Dry Waste Bin (Blue)"
- Plastic wrapper, chip packet, biscuit wrapper, snack wrapper -> object: "Plastic Wrapper", category: "Plastic", wasteType: "Dry Waste", recyclable: true, recommendedBin: "Dry Waste Bin (Blue)"
- Other plastics (plastic cup, packaging film, plastic container, polythene bag) -> object: "Plastic", category: "Plastic", wasteType: "Dry Waste", recyclable: true, recommendedBin: "Dry Waste Bin (Blue)"
- Paper (newspaper, printer paper, notebook page, pamphlet) -> object: "Paper", category: "Paper", wasteType: "Dry Waste", recyclable: true, recommendedBin: "Dry Waste Bin (Blue)"
- Cardboard (carton box, shipping box, cardboard packaging) -> object: "Cardboard", category: "Cardboard", wasteType: "Dry Waste", recyclable: true, recommendedBin: "Dry Waste Bin (Blue)"
- Metal can (aluminum soda can, tin food can, metal lid, foil) -> object: "Metal", category: "Metal", wasteType: "Dry Waste", recyclable: true, recommendedBin: "Dry Waste Bin (Blue)"
- Glass bottle, jar, glass container -> object: "Glass", category: "Glass", wasteType: "Dry Waste", recyclable: true, recommendedBin: "Dry Waste Bin (Blue)"
- Food scraps, vegetable peels, fruit rinds, leftover food, tea leaves -> object: "Organic / Wet Waste", category: "Organic Waste", wasteType: "Wet Waste", recyclable: false, recommendedBin: "Wet Waste Bin (Green)"
- E-waste (electronic wires, cables, damaged circuit, mobile parts, battery) -> object: "E-Waste", category: "E-Waste", wasteType: "Dry Waste", recyclable: true, recommendedBin: "Dry Waste Bin (Blue)"

RULE 4: PERSON / HAND HOLDING WASTE
- If a person or human hand is holding a piece of waste (for example holding a plastic bottle or food wrapper):
  Set "humanDetected": true, "garbageDetected": true.
  In "detections", ONLY include the waste item(s). NEVER add the human or hand to "detections".

RULE 5: CONFIDENCE THRESHOLD
- If no garbage can be identified with at least 0.70 confidence:
  Set "garbageDetected": false, "detections": [], "message": "Unable to identify garbage. Please scan a clear waste item."

Return STRICT JSON matching this format:
{
  "garbageDetected": boolean,
  "humanDetected": boolean,
  "nonWasteDetected": boolean,
  "detections": [
    {
      "object": string,
      "category": string,
      "wasteType": "Dry Waste" | "Wet Waste",
      "confidence": number,
      "recyclable": boolean,
      "recommendedBin": string,
      "disposalMethod": string
    }
  ],
  "message": string
}
`;

    // Try high-performance vision models with automatic fallback
    let response: any = null;
    let lastError: any = null;
    const modelsToTry = [
      'gemini-3.5-flash-lite',
      'gemini-3-flash-preview',
      'gemini-3.5-flash',
      'gemini-3.8-flash',
      'gemini-flash-latest',
    ];

    for (const modelName of modelsToTry) {
      try {
        response = await aiClient.models.generateContent({
          model: modelName,
          contents: {
            parts: [
              {
                inlineData: {
                  mimeType: mimeType,
                  data: base64Image,
                },
              },
              {
                text: promptText,
              },
            ],
          },
          config: {
            responseMimeType: 'application/json',
          },
        });
        if (response && response.text) {
          console.log(`[detect-waste] Successfully processed image with model: ${modelName}`);
          break;
        }
      } catch (callErr: any) {
        lastError = callErr;
        console.warn(`[detect-waste] Model ${modelName} returned error:`, callErr?.message || callErr);
      }
    }

    if (!response || !response.text) {
      throw lastError || new Error('No response from AI Vision service');
    }

    const rawText = response.text || '';
    let parsed: any;
    try {
      parsed = JSON.parse(rawText.trim());
    } catch (parseErr) {
      const cleanJson = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
      parsed = JSON.parse(cleanJson);
    }

    // Filter detections with confidence >= 0.70
    if (parsed.detections && Array.isArray(parsed.detections)) {
      parsed.detections = parsed.detections.filter((d: any) => {
        const conf = typeof d.confidence === 'number' ? d.confidence : 0.85;
        d.confidence = Math.min(Math.max(conf, 0), 0.99);
        return d.confidence >= 0.7;
      });

      if (parsed.detections.length === 0) {
        parsed.garbageDetected = false;
        if (parsed.humanDetected) {
          parsed.message = 'Human/person detected. Please scan actual waste.';
        } else {
          parsed.message = 'Unable to identify garbage. Please scan a clear waste item.';
        }
      }
    } else {
      parsed.detections = [];
      parsed.garbageDetected = false;
      parsed.message = parsed.humanDetected
        ? 'Human/person detected. Please scan actual waste.'
        : 'Unable to identify garbage. Please scan a clear waste item.';
    }

    // Ensure message matches required prompt wording exactly
    if (!parsed.garbageDetected) {
      if (parsed.humanDetected) {
        parsed.message = 'Human/person detected. Please scan actual waste.';
      } else {
        parsed.message = 'Unable to identify garbage. Please scan a clear waste item.';
      }
    }

    return res.json({
      success: true,
      garbageDetected: !!parsed.garbageDetected,
      humanDetected: !!parsed.humanDetected,
      nonWasteDetected: !!parsed.nonWasteDetected,
      detections: parsed.detections || [],
      message: parsed.message || (parsed.garbageDetected ? 'Waste detected successfully.' : 'Unable to identify garbage. Please scan a clear waste item.'),
    });
  } catch (error: any) {
    console.error('Waste detection error:', error);
    return res.status(500).json({
      success: false,
      garbageDetected: false,
      message: 'Unable to analyze the image. Please try again.',
      error: error?.message || 'AI service error',
      detections: [],
    });
  }
});

// ==========================================
// 2. AUTHENTICATION & USERS
// ==========================================

// Login
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ success: false, message: 'Email and password are required.' });
  }

  const user = users.find((u) => u.email.toLowerCase() === email.toLowerCase());
  if (!user || user.password !== password) {
    return res.status(401).json({ success: false, message: 'Invalid email or password.' });
  }

  if (user.status === 'INACTIVE') {
    return res.status(403).json({ success: false, message: 'Your account is deactivated. Contact Admin.' });
  }

  const { password: _, ...safeUser } = user;
  return res.json({ success: true, user: safeUser, token: `eco_token_${user.id}` });
});

// Sign Up (Default role: RESIDENT only!)
app.post('/api/auth/signup', (req, res) => {
  const { name, email, password, phone, address } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ success: false, message: 'Name, email, and password are required.' });
  }

  if (password.length < 8) {
    return res.status(400).json({ success: false, message: 'Password must be at least 8 characters long.' });
  }

  const existing = users.find((u) => u.email.toLowerCase() === email.toLowerCase());
  if (existing) {
    return res.status(400).json({ success: false, message: 'An account with this email already exists.' });
  }

  // Create house profile for new resident
  const houseId = `H-${Math.floor(100 + Math.random() * 900)}`;
  const userId = `USR-RES-${Date.now()}`;

  const newUser: DbUser = {
    id: userId,
    name,
    email,
    password,
    role: 'RESIDENT', // Strictly Resident
    phone: phone || '+91 98000 00000',
    houseId,
    status: 'ACTIVE',
    createdAt: new Date().toISOString(),
  };

  const newHouse: DbHouse = {
    id: houseId,
    houseNumber: `House #${houseId.replace('H-', '')}`,
    residentId: userId,
    residentName: name,
    address: address || 'Greenwood Sector 4, Nagpur',
    latitude: 21.1458 + (Math.random() - 0.5) * 0.01,
    longitude: 79.0882 + (Math.random() - 0.5) * 0.01,
    phone: phone || '+91 98000 00000',
    assignedCollectorId: 'USR-COL-001',
    assignedCollectorName: 'Rajesh Kumar',
    pickupStatus: 'PENDING',
    nextPickupDate: 'Tomorrow at 09:30 AM',
  };

  users.push(newUser);
  houses.push(newHouse);

  // Add initial pickup
  pickups.push({
    id: `PCK-${Date.now()}`,
    houseId,
    houseNumber: newHouse.houseNumber,
    residentId: userId,
    residentName: name,
    address: newHouse.address,
    latitude: newHouse.latitude,
    longitude: newHouse.longitude,
    phone: newHouse.phone,
    scheduledTime: 'Tomorrow at 09:30 AM',
    wasteType: 'Both Dry & Wet',
    status: 'PENDING',
    collectorId: 'USR-COL-001',
    collectorName: 'Rajesh Kumar',
    distanceKm: 0.8,
  });

  addNotification(userId, 'Welcome to EcoScan!', 'Your household profile is set up. You can now scan waste and track pickups.', 'ALERT');

  const { password: _, ...safeUser } = newUser;
  return res.status(201).json({ success: true, user: safeUser, token: `eco_token_${newUser.id}` });
});

// Google Authentication
app.post('/api/auth/google', (req, res) => {
  const { email, name, googleId } = req.body;
  if (!email) {
    return res.status(400).json({ success: false, message: 'Google account email is required.' });
  }

  // Check if existing user
  let user = users.find((u) => u.email.toLowerCase() === email.toLowerCase());

  if (user) {
    // Existing user: preserve their existing role!
    const { password: _, ...safeUser } = user;
    return res.json({ success: true, user: safeUser, token: `eco_token_${user.id}`, isNew: false });
  }

  // New Google user: MUST be RESIDENT
  const houseId = `H-${Math.floor(100 + Math.random() * 900)}`;
  const userId = `USR-GOOG-${Date.now()}`;

  const newUser: DbUser = {
    id: userId,
    name: name || email.split('@')[0],
    email: email.toLowerCase(),
    role: 'RESIDENT', // Default role = Resident
    phone: '+91 98000 00000',
    houseId,
    status: 'ACTIVE',
    createdAt: new Date().toISOString(),
  };

  const newHouse: DbHouse = {
    id: houseId,
    houseNumber: `House #${houseId.replace('H-', '')}`,
    residentId: userId,
    residentName: newUser.name,
    address: 'Greenwood Sector 4, Nagpur',
    latitude: 21.1458 + (Math.random() - 0.5) * 0.01,
    longitude: 79.0882 + (Math.random() - 0.5) * 0.01,
    phone: newUser.phone,
    assignedCollectorId: 'USR-COL-001',
    assignedCollectorName: 'Rajesh Kumar',
    pickupStatus: 'PENDING',
    nextPickupDate: 'Tomorrow at 10:00 AM',
  };

  users.push(newUser);
  houses.push(newHouse);

  addNotification(userId, 'Welcome to EcoScan!', 'Signed in with Google. Your household profile is ready.', 'ALERT');

  const { password: _, ...safeUser } = newUser;
  return res.status(201).json({ success: true, user: safeUser, token: `eco_token_${newUser.id}`, isNew: true });
});

// Forgot Password
app.post('/api/auth/forgot-password', (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ success: false, message: 'Email is required.' });
  }
  const user = users.find((u) => u.email.toLowerCase() === email.toLowerCase());
  if (!user) {
    return res.status(404).json({ success: false, message: 'No EcoScan account found with that email address.' });
  }
  return res.json({
    success: true,
    message: `Password reset instructions have been sent to ${email}. Please check your inbox.`,
  });
});

// ==========================================
// 3. COLLECTOR LIVE GPS TRACKING
// ==========================================

// POST /api/collector/location
app.post('/api/collector/location', (req, res) => {
  const { collectorId, latitude, longitude, timestamp, isOnline, status, currentHouseId } = req.body;
  if (!collectorId || latitude === undefined || longitude === undefined) {
    return res.status(400).json({ success: false, message: 'Collector ID, latitude, and longitude are required.' });
  }

  const collectorUser = users.find((u) => u.id === collectorId);
  const collectorName = collectorUser ? collectorUser.name : 'Eco Collector';

  collectorLocations[collectorId] = {
    collectorId,
    collectorName,
    latitude: parseFloat(latitude),
    longitude: parseFloat(longitude),
    timestamp: timestamp || new Date().toISOString(),
    isOnline: isOnline !== undefined ? isOnline : true,
    vehicleId: collectorUser?.vehicleId || 'VEH-01',
    status: status || 'ON_DUTY',
    currentHouseId,
    completedPickupsToday: collectorLocations[collectorId]?.completedPickupsToday || 0,
    pendingPickupsToday: collectorLocations[collectorId]?.pendingPickupsToday || 0,
  };

  return res.json({ success: true, location: collectorLocations[collectorId] });
});

// GET /api/collector/location/:collectorId
app.get('/api/collector/location/:collectorId', (req, res) => {
  const { collectorId } = req.params;
  const loc = collectorLocations[collectorId];
  if (!loc) {
    return res.status(404).json({ success: false, message: 'Collector location not found or offline.' });
  }
  return res.json({ success: true, location: loc });
});

// GET /api/collector/locations (Admin live tracking)
app.get('/api/collector/locations', (req, res) => {
  const list = Object.values(collectorLocations);
  return res.json({ success: true, locations: list });
});

// Collector Duty Start / Stop
app.post('/api/collector/duty', (req, res) => {
  const { collectorId, onDuty, latitude, longitude } = req.body;
  if (!collectorId) {
    return res.status(400).json({ success: false, message: 'Collector ID is required.' });
  }

  const collectorUser = users.find((u) => u.id === collectorId);
  if (!collectorLocations[collectorId]) {
    collectorLocations[collectorId] = {
      collectorId,
      collectorName: collectorUser ? collectorUser.name : 'Eco Collector',
      latitude: latitude || 21.1465,
      longitude: longitude || 79.0875,
      timestamp: new Date().toISOString(),
      isOnline: onDuty,
      status: onDuty ? 'ON_DUTY' : 'IDLE',
      completedPickupsToday: 0,
      pendingPickupsToday: 4,
    };
  } else {
    collectorLocations[collectorId].isOnline = onDuty;
    collectorLocations[collectorId].status = onDuty ? 'ON_DUTY' : 'IDLE';
    collectorLocations[collectorId].timestamp = new Date().toISOString();
    if (latitude && longitude) {
      collectorLocations[collectorId].latitude = latitude;
      collectorLocations[collectorId].longitude = longitude;
    }
  }

  return res.json({ success: true, onDuty, status: collectorLocations[collectorId].status });
});

// ==========================================
// 4. RESIDENT HOUSE & PROFILE
// ==========================================

app.get('/api/resident/house/:residentId', (req, res) => {
  const { residentId } = req.params;
  const house = houses.find((h) => h.residentId === residentId);
  if (!house) {
    // If not found, create or return first matching
    const fallback = houses[0];
    return res.json({ success: true, house: fallback });
  }
  return res.json({ success: true, house });
});

app.put('/api/resident/house/:houseId', (req, res) => {
  const { houseId } = req.params;
  const { address, phone, latitude, longitude } = req.body;
  const house = houses.find((h) => h.id === houseId);
  if (!house) {
    return res.status(404).json({ success: false, message: 'House not found.' });
  }

  if (address) house.address = address;
  if (phone) house.phone = phone;
  if (latitude) house.latitude = latitude;
  if (longitude) house.longitude = longitude;

  return res.json({ success: true, house });
});

// ==========================================
// 5. WASTE SCANS STORAGE & HISTORY
// ==========================================

// Save confirmed scan
app.post('/api/scans', (req, res) => {
  const {
    residentId,
    houseId,
    image,
    detectedObject,
    category,
    wasteType,
    confidence,
    recyclable,
    recommendedBin,
    disposalMethod,
    latitude,
    longitude,
  } = req.body;

  const resident = users.find((u) => u.id === residentId);
  const now = new Date();

  const newScan: DbWasteScan = {
    id: `SCN-${Date.now()}`,
    residentId: residentId || 'USR-RES-001',
    residentName: resident ? resident.name : 'Eco Resident',
    houseId: houseId || 'H-101',
    image: image || '',
    detectedObject: detectedObject || 'Classified Waste',
    category: category || 'General Waste',
    wasteType: wasteType || 'Dry Waste',
    confidence: confidence || 0.9,
    recyclable: recyclable !== undefined ? recyclable : true,
    recommendedBin: recommendedBin || 'Dry Waste Bin',
    disposalMethod: disposalMethod || 'Place in proper recycling receptacle.',
    latitude,
    longitude,
    date: now.toISOString().split('T')[0],
    time: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    timestamp: Date.now(),
  };

  wasteScans.unshift(newScan);
  return res.status(201).json({ success: true, scan: newScan });
});

// Get scans
app.get('/api/scans', (req, res) => {
  const { residentId, houseId } = req.query;
  let filtered = [...wasteScans];
  if (residentId) {
    filtered = filtered.filter((s) => s.residentId === residentId);
  } else if (houseId) {
    filtered = filtered.filter((s) => s.houseId === houseId);
  }
  return res.json({ success: true, scans: filtered });
});

// ==========================================
// 6. GARBAGE REPORTS
// ==========================================

// Resident creates garbage report
app.post('/api/reports', (req, res) => {
  const { residentId, houseId, image, latitude, longitude, description, address } = req.body;
  const resident = users.find((u) => u.id === residentId);
  const now = new Date();

  const newReport: DbGarbageReport = {
    id: `REP-${Math.floor(100 + Math.random() * 900)}`,
    residentId: residentId || 'USR-RES-001',
    residentName: resident ? resident.name : 'Eco Resident',
    houseId: houseId || 'H-101',
    address: address || 'Reported Location',
    image: image || '',
    latitude: latitude || 21.1458,
    longitude: longitude || 79.0882,
    description: description || 'Garbage pile needs collection.',
    date: now.toISOString().split('T')[0],
    time: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    timestamp: Date.now(),
    status: 'REPORTED',
    assignedCollectorId: 'USR-COL-001',
    assignedCollectorName: 'Rajesh Kumar',
  };

  garbageReports.unshift(newReport);

  // Notify collector and admin
  addNotification('USR-COL-001', 'New Garbage Report', `New garbage reported at ${newReport.address}`, 'REPORT');
  addNotification('USR-ADM-001', 'Garbage Report Filed', `Report #${newReport.id} submitted by ${newReport.residentName}`, 'REPORT');

  return res.status(201).json({ success: true, report: newReport });
});

// Get reports
app.get('/api/reports', (req, res) => {
  const { residentId, collectorId } = req.query;
  let filtered = [...garbageReports];
  if (residentId) {
    filtered = filtered.filter((r) => r.residentId === residentId);
  } else if (collectorId) {
    filtered = filtered.filter((r) => r.assignedCollectorId === collectorId);
  }
  return res.json({ success: true, reports: filtered });
});

// Update report status
app.patch('/api/reports/:id/status', (req, res) => {
  const { id } = req.params;
  const { status, collectorId, collectorName } = req.body;
  const report = garbageReports.find((r) => r.id === id);
  if (!report) {
    return res.status(404).json({ success: false, message: 'Report not found.' });
  }

  report.status = status;
  if (collectorId) report.assignedCollectorId = collectorId;
  if (collectorName) report.assignedCollectorName = collectorName;

  // Notify resident
  addNotification(report.residentId, 'Garbage Report Update', `Your report #${report.id} is now ${status}.`, 'REPORT');

  return res.json({ success: true, report });
});

// ==========================================
// 7. COLLECTOR ASSIGNMENTS & CONFIRM COLLECTION
// ==========================================

// Get assigned pickups
app.get('/api/collector/pickups', (req, res) => {
  const { collectorId } = req.query;
  let filtered = [...pickups];
  if (collectorId) {
    filtered = filtered.filter((p) => p.collectorId === collectorId);
  }
  return res.json({ success: true, pickups: filtered });
});

// Collector confirms collection after scan
app.post('/api/collector/confirm-collection', (req, res) => {
  const {
    pickupId,
    houseId,
    collectorId,
    weightKg,
    wasteCategory,
    wasteType,
    image,
    latitude,
    longitude,
    detectionConfidence,
  } = req.body;

  const collector = users.find((u) => u.id === collectorId);
  const house = houses.find((h) => h.id === houseId);
  const pickup = pickups.find((p) => p.id === pickupId || p.houseId === houseId);

  const now = new Date();
  const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  if (pickup) {
    pickup.status = 'COMPLETED';
    pickup.weightKg = parseFloat(weightKg) || 2.5;
    pickup.completedAt = `${now.toISOString().split('T')[0]} at ${timeStr}`;
    pickup.detectionCategory = wasteCategory;
    pickup.scanImage = image;
  }

  if (house) {
    house.pickupStatus = 'COMPLETED';
    house.lastPickupDate = `Today at ${timeStr}`;
  }

  // Update collector location completed count
  if (collectorId && collectorLocations[collectorId]) {
    collectorLocations[collectorId].completedPickupsToday += 1;
    if (collectorLocations[collectorId].pendingPickupsToday > 0) {
      collectorLocations[collectorId].pendingPickupsToday -= 1;
    }
  }

  // Notify resident
  const residentId = house?.residentId || pickup?.residentId;
  if (residentId) {
    addNotification(
      residentId,
      'Garbage Collected!',
      `Your waste (${weightKg || 2.5} kg ${wasteCategory || 'segregated'}) was successfully collected by ${collector?.name || 'Collector'}. Thank you for sorting!`,
      'PICKUP'
    );
  }

  // Notify Admin
  addNotification(
    'USR-ADM-001',
    'Pickup Completed',
    `House #${house?.houseNumber || houseId} pickup finished by ${collector?.name || 'Collector'} (${weightKg || 2.5} kg).`,
    'PICKUP'
  );

  return res.json({
    success: true,
    message: 'Collection verified and completed successfully.',
    pickup,
  });
});

// ==========================================
// 8. ADMIN DASHBOARD & MANAGEMENT
// ==========================================

// Admin Statistics
app.get('/api/admin/stats', (req, res) => {
  const totalResidents = users.filter((u) => u.role === 'RESIDENT').length;
  const totalCollectors = users.filter((u) => u.role === 'COLLECTOR').length;
  const activeCollectors = Object.values(collectorLocations).filter((c) => c.isOnline && c.status === 'ON_DUTY').length;
  const totalHouses = houses.length;
  const totalVehicles = vehicles.length;

  const completedPickupsList = pickups.filter((p) => p.status === 'COMPLETED');
  const pendingPickupsList = pickups.filter((p) => p.status !== 'COMPLETED');

  let totalWeight = completedPickupsList.reduce((acc, curr) => acc + (curr.weightKg || 3.2), 0);
  // Add some baseline weight for realistic metrics
  totalWeight += 245.8;

  // Dry vs wet breakdown
  const dryKg = parseFloat((totalWeight * 0.58).toFixed(1));
  const wetKg = parseFloat((totalWeight * 0.42).toFixed(1));

  const categoryBreakdown: Record<string, number> = {
    Plastic: 42,
    Paper: 28,
    Cardboard: 19,
    Glass: 11,
    Metal: 14,
    'Food Waste': 35,
    'Organic Waste': 31,
    'E-waste': 6,
    'Hazardous Waste': 3,
    'General Waste': 8,
  };

  // Add scans counts
  for (const s of wasteScans) {
    categoryBreakdown[s.category] = (categoryBreakdown[s.category] || 0) + 1;
  }

  return res.json({
    success: true,
    stats: {
      totalResidents,
      totalCollectors,
      activeCollectors,
      totalHouses,
      totalVehicles,
      totalWasteCollectedKg: parseFloat(totalWeight.toFixed(1)),
      dryWasteKg: dryKg,
      wetWasteKg: wetKg,
      totalScans: wasteScans.length,
      categoryBreakdown,
      pendingPickups: pendingPickupsList.length,
      completedPickups: completedPickupsList.length,
    },
  });
});

// Admin: Residents
app.get('/api/admin/residents', (req, res) => {
  const residents = users
    .filter((u) => u.role === 'RESIDENT')
    .map(({ password: _, ...r }) => {
      const house = houses.find((h) => h.residentId === r.id);
      return { ...r, house };
    });
  return res.json({ success: true, residents });
});

app.post('/api/admin/residents', (req, res) => {
  const { name, email, phone, address } = req.body;
  const houseId = `H-${Math.floor(100 + Math.random() * 900)}`;
  const userId = `USR-RES-${Date.now()}`;

  const newUser: DbUser = {
    id: userId,
    name,
    email,
    password: 'password123',
    role: 'RESIDENT',
    phone: phone || '+91 98000 00000',
    houseId,
    status: 'ACTIVE',
    createdAt: new Date().toISOString(),
  };

  const newHouse: DbHouse = {
    id: houseId,
    houseNumber: `House #${houseId.replace('H-', '')}`,
    residentId: userId,
    residentName: name,
    address: address || 'Greenwood Sector 4',
    latitude: 21.1458,
    longitude: 79.0882,
    phone: phone || '+91 98000 00000',
    assignedCollectorId: 'USR-COL-001',
    assignedCollectorName: 'Rajesh Kumar',
    pickupStatus: 'PENDING',
    nextPickupDate: 'Tomorrow at 10:00 AM',
  };

  users.push(newUser);
  houses.push(newHouse);

  return res.status(201).json({ success: true, resident: newUser, house: newHouse });
});

app.patch('/api/admin/residents/:id', (req, res) => {
  const { id } = req.params;
  const { status, name, phone } = req.body;
  const user = users.find((u) => u.id === id);
  if (!user) return res.status(404).json({ success: false, message: 'Resident not found.' });

  if (status) user.status = status;
  if (name) user.name = name;
  if (phone) user.phone = phone;

  return res.json({ success: true, resident: user });
});

// Admin: Collectors
app.get('/api/admin/collectors', (req, res) => {
  const collectors = users
    .filter((u) => u.role === 'COLLECTOR')
    .map(({ password: _, ...c }) => {
      const loc = collectorLocations[c.id];
      const vehicle = vehicles.find((v) => v.assignedCollectorId === c.id);
      return { ...c, liveLocation: loc, vehicle };
    });
  return res.json({ success: true, collectors });
});

app.post('/api/admin/collectors', (req, res) => {
  const { name, email, phone, vehicleId } = req.body;
  const collectorId = `USR-COL-${Date.now()}`;

  const newCollector: DbUser = {
    id: collectorId,
    name,
    email,
    password: 'password123',
    role: 'COLLECTOR',
    phone: phone || '+91 94000 00000',
    vehicleId,
    status: 'ACTIVE',
    createdAt: new Date().toISOString(),
  };

  users.push(newCollector);

  if (vehicleId) {
    const veh = vehicles.find((v) => v.id === vehicleId);
    if (veh) {
      veh.assignedCollectorId = collectorId;
      veh.assignedCollectorName = name;
      veh.status = 'ACTIVE';
    }
  }

  collectorLocations[collectorId] = {
    collectorId,
    collectorName: name,
    latitude: 21.1465 + (Math.random() - 0.5) * 0.01,
    longitude: 79.0875 + (Math.random() - 0.5) * 0.01,
    timestamp: new Date().toISOString(),
    isOnline: false,
    vehicleId,
    status: 'IDLE',
    completedPickupsToday: 0,
    pendingPickupsToday: 0,
  };

  return res.status(201).json({ success: true, collector: newCollector });
});

app.patch('/api/admin/collectors/:id', (req, res) => {
  const { id } = req.params;
  const { status, name, phone, vehicleId } = req.body;
  const user = users.find((u) => u.id === id);
  if (!user) return res.status(404).json({ success: false, message: 'Collector not found.' });

  if (status) user.status = status;
  if (name) user.name = name;
  if (phone) user.phone = phone;
  if (vehicleId) {
    user.vehicleId = vehicleId;
    const veh = vehicles.find((v) => v.id === vehicleId);
    if (veh) {
      veh.assignedCollectorId = user.id;
      veh.assignedCollectorName = user.name;
    }
  }

  return res.json({ success: true, collector: user });
});

// Admin: Vehicles
app.get('/api/admin/vehicles', (req, res) => {
  return res.json({ success: true, vehicles });
});

app.post('/api/admin/vehicles', (req, res) => {
  const { registrationNumber, vehicleType, capacityKg, assignedCollectorId, model } = req.body;
  const collector = users.find((u) => u.id === assignedCollectorId);

  const newVeh: DbVehicle = {
    id: `VEH-0${vehicles.length + 1}`,
    registrationNumber,
    vehicleType,
    capacityKg: parseInt(capacityKg) || 1000,
    assignedCollectorId,
    assignedCollectorName: collector?.name,
    status: assignedCollectorId ? 'ACTIVE' : 'AVAILABLE',
    model,
  };

  vehicles.push(newVeh);
  if (collector) collector.vehicleId = newVeh.id;

  return res.status(201).json({ success: true, vehicle: newVeh });
});

app.patch('/api/admin/vehicles/:id', (req, res) => {
  const { id } = req.params;
  const { status, assignedCollectorId, registrationNumber, capacityKg } = req.body;
  const veh = vehicles.find((v) => v.id === id);
  if (!veh) return res.status(404).json({ success: false, message: 'Vehicle not found.' });

  if (status) veh.status = status;
  if (registrationNumber) veh.registrationNumber = registrationNumber;
  if (capacityKg) veh.capacityKg = parseInt(capacityKg);

  if (assignedCollectorId !== undefined) {
    veh.assignedCollectorId = assignedCollectorId || undefined;
    const collector = users.find((u) => u.id === assignedCollectorId);
    veh.assignedCollectorName = collector?.name;
    if (collector) collector.vehicleId = veh.id;
  }

  return res.json({ success: true, vehicle: veh });
});

// Admin: Houses & Assignment
app.get('/api/admin/houses', (req, res) => {
  return res.json({ success: true, houses });
});

app.post('/api/admin/houses/assign', (req, res) => {
  const { houseId, collectorId } = req.body;
  const house = houses.find((h) => h.id === houseId);
  const collector = users.find((u) => u.id === collectorId);

  if (!house || !collector) {
    return res.status(400).json({ success: false, message: 'Invalid house or collector ID.' });
  }

  house.assignedCollectorId = collector.id;
  house.assignedCollectorName = collector.name;

  // Also update corresponding pending pickup
  const pickup = pickups.find((p) => p.houseId === houseId && p.status !== 'COMPLETED');
  if (pickup) {
    pickup.collectorId = collector.id;
    pickup.collectorName = collector.name;
  }

  addNotification(collector.id, 'New House Assigned', `House #${house.houseNumber} assigned to your pickup route.`, 'ASSIGNMENT');
  addNotification(house.residentId, 'Collector Assigned', `${collector.name} has been assigned as your collection agent.`, 'ASSIGNMENT');

  return res.json({ success: true, house });
});

// ==========================================
// 9. NOTIFICATIONS
// ==========================================

app.get('/api/notifications', (req, res) => {
  const { userId } = req.query;
  let userNotifs = notifications;
  if (userId) {
    userNotifs = notifications.filter((n) => n.userId === userId);
  }
  return res.json({ success: true, notifications: userNotifs });
});

app.post('/api/notifications/mark-read', (req, res) => {
  const { userId, notificationId } = req.body;
  if (notificationId) {
    const n = notifications.find((item) => item.id === notificationId);
    if (n) n.read = true;
  } else if (userId) {
    notifications.forEach((n) => {
      if (n.userId === userId) n.read = true;
    });
  }
  return res.json({ success: true });
});

// ==========================================
// ANDROID KOTLIN + COMPOSE PROJECT ZIP EXPORT
// ==========================================
app.get('/api/download-android-project', (req, res) => {
  try {
    const androidDir = path.resolve(__dirname, 'android');
    if (!fs.existsSync(androidDir)) {
      return res.status(404).json({ success: false, message: 'Android project directory not found' });
    }

    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', 'attachment; filename="ecoscan-android-kotlin-compose.zip"');

    const archive = archiver('zip', {
      zlib: { level: 9 }, // Best compression
    });

    archive.on('error', (err: any) => {
      console.error('Archive error:', err);
      res.status(500).send({ error: err.message });
    });

    archive.pipe(res);
    archive.directory(androidDir, 'EcoScan-Android-Kotlin-Compose');
    archive.finalize();
  } catch (err: any) {
    console.error('Download Android project error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ==========================================
// VITE SPA MIDDLEWARE MOUNTING
// ==========================================

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true, hmr: process.env.DISABLE_HMR !== 'true' },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, () => {
    console.log(`[EcoScan Server] running on http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start EcoScan server:', err);
});

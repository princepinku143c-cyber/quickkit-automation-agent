
export enum NexusType {
  TRIGGER = 'TRIGGER',
  ACTION = 'ACTION',
  LOGIC = 'LOGIC'
}

export enum NexusSubtype {
  WEBHOOK = 'WEBHOOK',
  SCHEDULE = 'SCHEDULE',
  HTTP_REQUEST = 'HTTP_REQUEST',
  AI_GENERATE = 'AI_GENERATE',
  DELAY = 'DELAY',
  CONDITION = 'CONDITION',
  LOGGER = 'LOGGER',
  EMAIL = 'EMAIL',
  WHATSAPP = 'WHATSAPP',
  GMAIL = 'GMAIL',
  SHEETS_READ = 'SHEETS_READ',
  SHEETS_WRITE = 'SHEETS_WRITE',
  AGENT = 'AGENT',
  CHAT_TRIGGER = 'CHAT_TRIGGER',
  STATIC_DATA = 'STATIC_DATA',
  WEB_SEARCH = 'WEB_SEARCH',
  NOTION = 'NOTION',
  RAZORPAY = 'RAZORPAY',
  AIRTABLE = 'AIRTABLE',
  SHOPIFY = 'SHOPIFY',
  PAYMENT_VERIFY = 'PAYMENT_VERIFY',
  SUBSCRIPTION_CHECK = 'SUBSCRIPTION_CHECK',
  PLAN_UPDATE = 'PLAN_UPDATE'
}

export type PlanTier = 'FREE' | 'PRO' | 'BUSINESS';
export type Region = 'IN' | 'GLOBAL';
export type AppTheme = 'cyber' | 'nova' | 'matrix' | 'minimal';
export type ProjectStatus = 'DRAFT' | 'IN_PROGRESS' | 'COMPLETED';

export interface UserPlan {
  uid: string;
  email: string;
  tier: PlanTier;
  region: Region;
  status: 'active' | 'expired' | 'canceled';
  expiresAt: number; // Timestamp
  lastPaymentId?: string;
  updatedAt: number;
  // New Payment Fields
  autoRenew: boolean;
  appliedCoupon?: string;
  originalPrice?: number;
  finalPrice?: number;
}

export interface CouponData {
  code: string;
  discountPercent: number;
  validTiers: PlanTier[];
  requiredAutoPay: boolean;
}

export interface PaymentTransaction {
  id: string; // Internal ID
  userId: string;
  userEmail: string;
  externalPaymentId: string; // PayPal/Razorpay ID
  amount: number;
  currency: 'INR' | 'USD';
  gateway: 'razorpay' | 'paypal';
  tier: PlanTier;
  cycle: 'monthly' | 'yearly';
  status: 'success' | 'failed';
  couponUsed?: string;
  createdAt: number;
}

export interface DNSRecord {
  id: string;
  type: 'A' | 'CNAME' | 'TXT';
  host: string;
  value: string;
  ttl: string;
  status: 'active' | 'pending';
}

export interface DomainInfo {
  name: string;
  status: 'connected' | 'pending' | 'error';
  records: DNSRecord[];
}

export interface NexusConfig {
  url?: string;
  method?: string;
  headers?: string;
  body?: string;
  cron?: string;
  prompt?: string;
  delayMs?: number;
  condition?: string;
  content?: string;
  provider?: 'openai' | 'gemini';
  paymentProvider?: string;
  model?: string;
  apiKey?: string;
  systemMessage?: string;
  enabledTools?: string[];
  sheetId?: string;
  range?: string;
  [key: string]: any;
}

export interface Nexus {
  id: string;
  type: NexusType;
  subtype: NexusSubtype;
  label: string;
  position: { x: number; y: number };
  config: NexusConfig;
  status?: 'idle' | 'running' | 'success' | 'error';
  lastOutput?: any;
  outputs?: string[];
}

export interface Synapse {
  id: string;
  sourceId: string;
  targetId: string;
  sourceHandle?: string;
}

export interface ExecutionLog {
  id: string;
  timestamp: number;
  nexusId: string;
  status: 'success' | 'error';
  message: string;
  duration: number;
  inputData?: any;
  outputData?: any;
}

export interface Blueprint {
  id: string;
  name: string;
  description: string;
  category: string;
  nexuses: Nexus[];
  synapses: Synapse[];
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
}

// Updated Project Schema matching user request
export interface Project {
  id: string;
  userId: string;
  title: string;
  description: string;
  status: ProjectStatus;
  nexuses: Nexus[]; // Acts as formData/content
  synapses: Synapse[];
  tags: string[];
  createdAt: number;
  updatedAt: number;
  lastSavedAt?: number;
  completedAt?: number;
  thumbnail?: string;
}

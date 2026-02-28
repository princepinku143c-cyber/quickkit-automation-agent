
/**
 * ⚠️ CORE FILE – DO NOT MODIFY WITHOUT AUTHORIZATION
 * Changes here can break auth, billing, and core logic.
 */

export enum NexusType {
  TRIGGER = 'TRIGGER',
  ACTION = 'ACTION',
  LOGIC = 'LOGIC'
}

export enum NexusSubtype {
  // --- CORE & UNIVERSAL ---
  WEBHOOK = 'WEBHOOK',
  SCHEDULE = 'SCHEDULE',
  API_POLLER = 'API_POLLER',
  HTTP_REQUEST = 'HTTP_REQUEST',
  CODE_JS = 'CODE_JS',
  DELAY = 'DELAY',
  CONDITION = 'CONDITION',
  SWITCH = 'SWITCH',
  LOGGER = 'LOGGER',
  
  // --- LOGIC / FLOW CONTROL ---
  NO_OP = 'NO_OP',
  EXECUTE_WORKFLOW = 'EXECUTE_WORKFLOW',
  AI_ROUTER = 'AI_ROUTER', 
  
  // --- AI / ML / TEXT TOOLS ---
  AGENT = 'AGENT',             
  AI_CHAT = 'AI_CHAT',         
  AI_SUMMARIZE = 'AI_SUMMARIZE', 
  AI_CLASSIFY = 'AI_CLASSIFY',   
  AI_EXTRACT = 'AI_EXTRACT',     
  AI_SENTIMENT = 'AI_SENTIMENT', 
  AI_QA = 'AI_QA',               
  DOC_LOADER = 'DOC_LOADER',     
  VISION_ANALYSIS = 'VISION_ANALYSIS', 
  VECTOR_STORE = 'VECTOR_STORE', 
  
  // --- PROVIDER SPECIFIC AI ---
  OPENAI_CHAT = 'OPENAI_CHAT',
  ANTHROPIC_CHAT = 'ANTHROPIC_CHAT',
  GROQ_CHAT = 'GROQ_CHAT',

  // --- GENERATIVE MEDIA ---
  VEO_VIDEO_GEN = 'VEO_VIDEO_GEN',
  AI_VIDEO_EDIT = 'AI_VIDEO_EDIT',
  
  // --- ADVANCED FLOW ---
  ERROR_TRIGGER = 'ERROR_TRIGGER',
  WAIT_FOR_WEBHOOK = 'WAIT_FOR_WEBHOOK',
  
  // --- DATA PROCESSING ---
  MERGE = 'MERGE',
  SET_VARIABLE = 'SET_VARIABLE',
  SPLIT_BATCH = 'SPLIT_BATCH',
  ITEM_LIST = 'ITEM_LIST',
  
  // --- EMAIL / MESSAGING / CHAT ---
  EMAIL = 'EMAIL', 
  GMAIL = 'GMAIL',
  OUTLOOK = 'OUTLOOK',
  IMAP = 'IMAP',
  MAILGUN = 'MAILGUN',
  WHATSAPP = 'WHATSAPP',
  SLACK = 'SLACK',
  DISCORD = 'DISCORD',
  TELEGRAM = 'TELEGRAM',
  
  // --- FILES / STORAGE ---
  READ_BINARY_FILE = 'READ_BINARY_FILE',
  WRITE_BINARY_FILE = 'WRITE_BINARY_FILE',
  FTP = 'FTP',
  AWS_S3 = 'AWS_S3',
  GOOGLE_DRIVE = 'GOOGLE_DRIVE',
  DRIVE_UPLOAD = 'DRIVE_UPLOAD',
  
  // --- DATABASES ---
  MYSQL = 'MYSQL',
  POSTGRES = 'POSTGRES',
  SQLITE = 'SQLITE',
  SUPABASE = 'SUPABASE',
  
  // --- SHEETS / DOCS / CRMS ---
  SHEETS_READ = 'SHEETS_READ',
  SHEETS_WRITE = 'SHEETS_WRITE',
  NOTION = 'NOTION',
  AIRTABLE = 'AIRTABLE',
  HUBSPOT = 'HUBSPOT',
  SALESFORCE = 'SALESFORCE',
  ZENDESK = 'ZENDESK',
  GOOGLE_CALENDAR = 'GOOGLE_CALENDAR',
  
  // --- DEV / OPS ---
  GITHUB = 'GITHUB',
  GITLAB = 'GITLAB',
  JIRA = 'JIRA',
  DOCKER = 'DOCKER',
  SSH = 'SSH',
  
  // --- COMMERCE & PAYMENTS ---
  RAZORPAY = 'RAZORPAY',
  STRIPE = 'STRIPE',
  SHOPIFY = 'SHOPIFY',
  PAYMENT_VERIFY = 'PAYMENT_VERIFY',
  SUBSCRIPTION_CHECK = 'SUBSCRIPTION_CHECK',
  PLAN_UPDATE = 'PLAN_UPDATE',

  // --- SOCIAL MEDIA ---
  INSTAGRAM = 'INSTAGRAM',
  FACEBOOK = 'FACEBOOK',
  LINKEDIN = 'LINKEDIN',
  YOUTUBE = 'YOUTUBE',
  TIKTOK = 'TIKTOK',
  TWITTER = 'TWITTER',

  // --- FINANCE & CRYPTO ---
  BINANCE_TRADE = 'BINANCE_TRADE',
  CRYPTO_PRICE = 'CRYPTO_PRICE',
  
  // --- UTILS ---
  RECAPTCHA = 'RECAPTCHA',
  WEB_SEARCH = 'WEB_SEARCH',
  STATIC_DATA = 'STATIC_DATA',
  CHAT_TRIGGER = 'CHAT_TRIGGER',
  
  // --- DYNAMIC AI NODE ---
  CUSTOM_AI_NODE = 'CUSTOM_AI_NODE',

  // --- NEWLY ADDED FOR SIDEBAR ---
  AI_AGENT = 'AI_AGENT',
  ROUTER = 'ROUTER',
  DB_OPERATION = 'DB_OPERATION',
  CUSTOM_JS = 'CUSTOM_JS',
  LOOP = 'LOOP'
}

export type PlanTier = 'FREE' | 'PRO' | 'BUSINESS' | 'ELITE';
export type Region = 'IN' | 'GLOBAL';
export type AppTheme = 'cyber' | 'nova' | 'matrix' | 'minimal';
export type ProjectStatus = 'DRAFT' | 'IN_PROGRESS' | 'COMPLETED';

export type DealStage = 'NEW' | 'QUALIFIED' | 'PROPOSAL' | 'NEGOTIATION' | 'WON';

// --- TRUTHFUL NODE SETTINGS ---
export type NodeMode = 'design-only' | 'runtime-ready';

export interface NodeSettings {
  retryPolicy: 'none' | 'once' | 'twice';
  continueOnError: boolean;
  mode: NodeMode;
}

// --- NEW: TRUTHFUL CHANNEL CONNECTION STATES ---
export type ChannelType = 'telegram' | 'whatsapp' | 'discord' | 'slack';

export type ChannelStatus =
  | 'not_connected'
  | 'connected_design_only'
  | 'connected_messaging'
  | 'disconnected'
  | 'error';

// --- FLOW VALIDATION ---
export interface FlowWarning {
    level: 'INFO' | 'WARNING' | 'ERROR';
    message: string;
    nodeId?: string;
}

export interface Credential {
  id: string;
  name: string;
  type: 'API_KEY' | 'OAUTH2' | 'BASIC_AUTH' | 'GEMINI' | 'OPENAI' | 'OAUTH2_APP';
  data: Record<string, string>;
  createdAt: number;
}

export interface NodeRequirements {
    cost: 'FREE' | 'PAID_API' | 'SUBSCRIPTION';
    signup: 'NONE' | 'GOOGLE' | 'PLATFORM_ACCOUNT' | 'MICROSOFT';
    description: string;
}

export interface DynamicField {
    key: string;           
    label: string;         
    type: 'text' | 'number' | 'select' | 'toggle' | 'textarea' | 'json';
    placeholder?: string;
    options?: { label: string; value: string }[]; 
    defaultValue?: any;
    hint?: string;
}

export interface NexusDefinition {
  type: NexusType;
  subtype: NexusSubtype;
  label: string;
  icon: any;
  description: string;
  defaultConfig: NexusConfig;
  category: string;
  isPremium?: boolean;
  requirements?: NodeRequirements;
}

export interface NexusConfig {
  [key: string]: any;
  _connectionStatus?: ChannelStatus;
}

export interface NexusStyle {
    color?: string; 
    shape?: 'DEFAULT' | 'ROUNDED' | 'PILL' | 'DIAMOND';
    minimal?: boolean; 
    width?: number; 
}

export interface Nexus {
  id: string;
  type: NexusType;
  subtype: NexusSubtype;
  label: string;
  position: { x: number; y: number };
  config: NexusConfig;
  settings?: NodeSettings; // Added explicit settings object
  style?: NexusStyle; 
  status?: 'idle' | 'running' | 'success' | 'error' | 'retrying'; 
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
  status: 'success' | 'error' | 'retrying';
  message: string;
  duration: number;
  inputData?: any;
  outputData?: any;
  usage?: {
      tokens?: number; 
      creditsCost: number; 
  }
}

export interface ExecutionState {
  runId: string;
  userId: string;
  projectId: string;
  status: 'QUEUED' | 'RUNNING' | 'PAUSED' | 'COMPLETED' | 'FAILED';
  currentQueue: string[];
  completedNodeIds: string[];
  context: Record<string, any>;
  startTime: number;
  lastUpdateTime: number;
  nodeLimitCount: number;
}

export interface Blueprint {
  id: string;
  title: string;
  description: string;
  category: string;
  nexuses: Nexus[];
  synapses: Synapse[];
  isPremium?: boolean;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system' | 'thought'; 
  content: string;
  timestamp: number;
  metadata?: any; 
}

export interface ProjectSettings {
    errorWorkflowId?: string;
    timezone?: string;
    executionTimeout?: number;
    clientVariables?: Record<string, string>; 
}

export interface Project {
  id: string;
  userId: string;
  title: string;
  description: string;
  status: ProjectStatus;
  nexuses: Nexus[]; 
  synapses: Synapse[];
  settings?: ProjectSettings;
  tags: string[];
  createdAt: number;
  updatedAt: number;
  lastSavedAt?: number;
  completedAt?: number;
  thumbnail?: string;
  publicFormEnabled?: boolean;
  inputSchema?: DynamicField[]; 
}

export type UserRole = 'OWNER' | 'ADMIN' | 'USER';

export interface UserUsage {
    workflows: number;
    runs: number;
    apiCalls: number;
}

export interface UserPlan {
    uid: string;
    email: string;
    tier: PlanTier;
    region: Region;
    role: UserRole;
    status: 'active' | 'expired' | 'cancelled';
    expiresAt: number;
    updatedAt: number;
    autoRenew: boolean; // TRUE = Active, FALSE = Cancelled (Grace Period)
    lastPaymentId?: string;
    subscriptionId?: string; // Tracks Razorpay/PayPal Subscription ID
    provider?: 'RAZORPAY' | 'PAYPAL' | 'STRIPE';
    appliedCoupon?: string;
    finalPrice?: number;
    
    // Legacy counters
    credits: number;
    aiUsed: number;
    monthlyLimit: number;
    
    // New Usage Object
    usage?: UserUsage;
    warningSent?: boolean; // 🔥 NEW: Track if 80% usage warning has been sent
    lastUsageReset?: number; // 🔥 NEW: Monthly reset tracker

    referralCode?: string;
    createdAt?: number; 
    onboardingDone?: boolean; 

    // For backend structure compatibility
    plan?: {
        tier?: PlanTier;
        monthlyLimit?: number;
        credits?: number;
        status?: string;
        provider?: string;
        autoRenew?: boolean;
        expiresAt?: number;
    };
}

// --- ADMIN SYSTEM TYPES ---
export interface UserAccount { 
    uid: string;
    email: string;
    displayName: string;
    role: UserRole;
    tier: PlanTier;
    status: 'ACTIVE' | 'DISABLED';
    joinedAt: number;
    lastLoginAt: number;
    usage?: UserUsage; // 🔥 NEW: Added usage for Analytics
}

export interface AdminPayment {
    id: string;
    userId: string;
    userEmail: string;
    amount: number;
    currency: 'USD' | 'INR';
    status: 'SUCCESS' | 'FAILED' | 'REFUNDED';
    gateway: 'STRIPE' | 'RAZORPAY' | 'PAYPAL';
    date: number;
}

// --- NEW: ROBUST PAYMENT RECORD ---
export interface PaymentRecord {
    id: string;                // gateway payment / subscription id (razorpay_payment_id)
    orderId?: string;          // razorpay_order_id
    userId: string;
    gateway: "RAZORPAY" | "PAYPAL";
    type: 'SUBSCRIPTION' | 'ADDON'; // NEW
    plan?: "PRO" | "BUSINESS"; // Optional if addon
    packId?: string; // Optional if subscription
    amount: number;
    currency: "INR" | "USD";
    status: "created" | "pending" | "success" | "failed" | "refunded"; // Added refunded
    createdAt: number;
    updatedAt: number;
    metadata?: any;
}

export interface AddOnPack {
    id: string;
    name: string;
    credits: number;
    price: {
        IN: number;
        GLOBAL: number;
    };
}

// --- NEW: WEBHOOK EVENT LOG (IDEMPOTENCY) ---
export interface WebhookEventLog {
    eventId: string;        // Razorpay / PayPal event id from payload
    gateway: "RAZORPAY" | "PAYPAL";
    eventType: string;
    processed: boolean;
    createdAt: number;
    error?: string;
}

export interface AdminPromo {
    code: string;
    type: 'PERCENT' | 'FLAT';
    value: number;
    currency?: 'INR' | 'USD';
    maxUses: number;
    used: number;
    expiresAt?: number;
    validPlans: PlanTier[];
    active: boolean;
    createdAt: number;
}

export interface CouponData {
    code: string;
    discountType: 'PERCENT' | 'FLAT';
    discountValue: number;
    currency?: 'INR' | 'USD';
    validTiers: PlanTier[];
    requiredAutoPay: boolean;
}

export interface ReferralStats {
    userId: string;
    code: string;
    totalInvites: number;
    earnedCredits: number;
    pendingRewards: number;
}

export interface MarketplaceItem {
    id: string;
    name: string;
    description: string;
    author: string;
    downloads: number;
    rating: number;
    category: 'CONNECTOR' | 'AI_MODEL' | 'UTILITY' | 'ENTERPRISE';
    isVerified: boolean;
    isPro: boolean;
    icon: any;
    tags: string[];
}

export type PolicyType = 'TERMS' | 'PRIVACY' | 'REFUND';

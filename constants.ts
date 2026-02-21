
import { NexusSubtype, NexusType, NexusDefinition, NodeSettings, AddOnPack, NexusConfig } from "./types";
import { 
  Zap, Clock, Globe, Brain, 
  Pause, Split, Terminal, Mail,
  MessageCircle, FileSpreadsheet,
  MessageSquare, FileText, Database,
  ArrowDownToLine, ArrowUpFromLine,
  CreditCard, Layout, Table, ShoppingBag,
  ShieldCheck, CheckCircle, RefreshCcw, UserCheck, Shield,
  Code, Server, Lock, Bitcoin, DollarSign, Building, FileSignature, Cloud, Radio,
  Calendar, Instagram, Facebook, Linkedin, Megaphone, Star, Youtube, Video, Twitter,
  GitMerge, Layers, Repeat, Variable, AlertOctagon, Timer, Tag, FileJson, Eye, Archive,
  Scale, FileSearch, HelpCircle, Cpu, CloudLightning, HardDrive, FolderOpen, UploadCloud,
  MailOpen, Send, Disc, PlayCircle, GitCommit, GitPullRequest, Container, Command, Film, Scissors, Radar, Network
} from "lucide-react";

export const RECAPTCHA_SITE_KEY = "6Lc6SDcsAAAAAOsn_zVFCI2vzlIKLB9AdLCtF5cD";

// 🔥 PAYPAL PLAN IDS (From Developer Dashboard)
export const PAYPAL_PLAN_IDS = {
    PRO_MONTHLY: 'P-5ML4271244454362WXSMG7TQ', // Example Sandbox ID
    PRO_YEARLY: 'P-YEARLY_PLAN_ID_HERE'
};

// 🔥 AI MODEL STRATEGY (BUDGET OPTIMIZED)
export const AI_MODELS = {
  ARCHITECT: 'gemini-3-pro-preview',      // High Intelligence (Planning & Reasoning) - Higher Cost
  RUNTIME: 'gemini-3-flash-preview',      // High Speed (Execution & Agents) - Low Cost
  VISION: 'gemini-3-pro-image-preview',   // Visual Tasks
  VIDEO: 'veo-3.1-fast-generate-preview'  // Video Gen
};

// --- PLAN LIMITS (CONVERSION ENGINE) ---
export const PLAN_LIMITS = {
  FREE: {
    PROJECTS: 2,      // Workflows
    RUNS: 100,        // Executions per month
    API_CALLS: 5,     // 5 AI Prompts
    MAX_NODES: 10,
    CLOUD_SAVE: false,
    LABEL: 'Explorer',
    PRICE: '$0'
  },
  PRO: {
    PROJECTS: 20,
    RUNS: 5000,
    API_CALLS: 20000,
    MAX_NODES: 100,
    CLOUD_SAVE: true,
    LABEL: 'Pro',
    PRICE: '$49'
  },
  BUSINESS: {
    PROJECTS: 9999,   // Effectively Unlimited
    RUNS: 999999,     // Effectively Unlimited
    API_CALLS: 999999,// Effectively Unlimited
    MAX_NODES: 999,
    CLOUD_SAVE: true,
    LABEL: 'UltraPro',
    PRICE: '$99'
  },
  ELITE: {
    PROJECTS: 9999,
    RUNS: 999999,
    API_CALLS: 999999,
    MAX_NODES: 9999,
    CLOUD_SAVE: true,
    LABEL: 'Elite (Dev)',
    PRICE: 'FREE'
  }
};

export const ADDON_PACKS: AddOnPack[] = [
    {
        id: 'pack_50',
        name: 'Starter Fuel',
        credits: 50,
        price: { IN: 299, GLOBAL: 5 }
    },
    {
        id: 'pack_100',
        name: 'Pro Boost',
        credits: 100,
        price: { IN: 499, GLOBAL: 9 }
    },
    {
        id: 'pack_500',
        name: 'Power Pack',
        credits: 500,
        price: { IN: 1999, GLOBAL: 39 }
    }
];

// --- NODE SAFEGUARD DEFAULTS ---
export const DEFAULT_NODE_SETTINGS: NodeSettings = {
  retryPolicy: 'none',
  continueOnError: false,
  mode: 'design-only'
};


const CONNECTOR_SUBTYPES = new Set<NexusSubtype>([
  NexusSubtype.HTTP_REQUEST,
  NexusSubtype.API_POLLER,
  NexusSubtype.EMAIL,
  NexusSubtype.GMAIL,
  NexusSubtype.OUTLOOK,
  NexusSubtype.IMAP,
  NexusSubtype.MAILGUN,
  NexusSubtype.WHATSAPP,
  NexusSubtype.SLACK,
  NexusSubtype.DISCORD,
  NexusSubtype.TELEGRAM,
  NexusSubtype.AWS_S3,
  NexusSubtype.GOOGLE_DRIVE,
  NexusSubtype.DRIVE_UPLOAD,
  NexusSubtype.FTP,
  NexusSubtype.MYSQL,
  NexusSubtype.POSTGRES,
  NexusSubtype.SQLITE,
  NexusSubtype.SUPABASE,
  NexusSubtype.AIRTABLE,
  NexusSubtype.NOTION,
  NexusSubtype.HUBSPOT,
  NexusSubtype.SALESFORCE,
  NexusSubtype.ZENDESK,
  NexusSubtype.GITHUB,
  NexusSubtype.GITLAB,
  NexusSubtype.JIRA,
  NexusSubtype.DOCKER,
  NexusSubtype.SSH,
  NexusSubtype.RAZORPAY,
  NexusSubtype.STRIPE,
  NexusSubtype.SHOPIFY,
]);

export const getDefaultNodeSettings = (subtype: NexusSubtype): NodeSettings => {
  if (CONNECTOR_SUBTYPES.has(subtype)) {
    return { retryPolicy: 'once', continueOnError: false, mode: 'runtime-ready' };
  }
  return { ...DEFAULT_NODE_SETTINGS };
};

export const getConnectorValidationErrors = (subtype: NexusSubtype, config: NexusConfig): string[] => {
  const errors: string[] = [];
  if (!CONNECTOR_SUBTYPES.has(subtype)) return errors;

  if (subtype === NexusSubtype.HTTP_REQUEST || subtype === NexusSubtype.API_POLLER) {
    const url = typeof config?.url === 'string' ? config.url.trim() : '';
    if (!url) errors.push('URL is required for HTTP/API Poller connector.');
  }

  if (subtype === NexusSubtype.EMAIL || subtype === NexusSubtype.MAILGUN || subtype === NexusSubtype.GMAIL) {
    const to = typeof config?.to === 'string' ? config.to.trim() : '';
    if (!to) errors.push('Recipient (to) is required for email connector.');
  }

  if ((subtype === NexusSubtype.STRIPE || subtype === NexusSubtype.RAZORPAY) && !config?.action) {
    errors.push('Payment connector requires an action (charge/verify/subscription).');
  }

  return errors;
};

// --- TRUTHFUL CHANNEL COPY ---
export const CHANNEL_STATUS_TEXT: Record<string, string> = {
  not_connected: "Not connected",
  connected_design_only: "Connected (design-only)",
  connected_messaging: "Messaging enabled",
  disconnected: "Disconnected",
  error: "Connection error"
};

export const MOCK_CONTACTS = [
    { id: 'c1', name: 'Alice Freeman', email: 'alice@techcorp.com', company: 'TechCorp', tags: ['VIP', 'Decision Maker'], lastActivity: Date.now() - 100000, sentiment: 'positive' },
    { id: 'c2', name: 'Bob Smith', email: 'bob@gmail.com', company: 'Freelance', tags: ['New'], lastActivity: Date.now() - 5000000, sentiment: 'neutral' },
    { id: 'c3', name: 'Charlie Davis', email: 'charlie@startup.io', company: 'Startup.io', tags: ['Warm Lead'], lastActivity: Date.now() - 200000, sentiment: 'positive' }
]; 

export const MOCK_DEALS = [
    { id: 'd1', contactId: 'c1', title: 'Enterprise License', value: 25000, stage: 'NEGOTIATION', probability: 80, createdAt: Date.now() },
    { id: 'd2', contactId: 'c3', title: 'Pro Plan Subscription', value: 799, stage: 'PROPOSAL', probability: 50, createdAt: Date.now() }
];

export const INITIAL_STREAM = {
  id: 'stream-1',
  name: 'Untitled Stream',
  description: 'A new automation flow',
  nexuses: [],
  synapses: [],
  createdAt: Date.now()
};

export const NEXUS_DEFINITIONS: NexusDefinition[] = [
  // --- INPUT / TRIGGER (TOP 5 SUPERCHARGED) ---
  {
    type: NexusType.TRIGGER,
    subtype: NexusSubtype.WEBHOOK,
    label: 'Webhook / Form',
    icon: Zap,
    description: 'Secure, validatable HTTP trigger.',
    category: 'Input / Trigger',
    defaultConfig: { webhookMethod: 'POST', webhookResponseMode: 'IMMEDIATE', webhookAuthSecret: '', validationSchema: '{}' },
    requirements: { cost: 'FREE', signup: 'NONE', description: 'Supports Header Auth & Schema Validation.' }
  },
  {
    type: NexusType.TRIGGER,
    subtype: NexusSubtype.SCHEDULE,
    label: 'Schedule (Cron)',
    icon: Clock,
    description: 'Precision timing with Timezones.',
    category: 'Input / Trigger',
    defaultConfig: { cron: '0 9 * * *', timezone: 'UTC', naturalLanguageSchedule: 'Every day at 9am' },
    requirements: { cost: 'FREE', signup: 'NONE', description: 'Internal Scheduler.' }
  },
  {
    type: NexusType.TRIGGER,
    subtype: NexusSubtype.API_POLLER, // NEW: THE N8N KILLER
    label: 'Universal Poller',
    icon: Radar,
    description: 'Watch ANY API for changes (New Rows, Emails, etc).',
    category: 'Input / Trigger',
    defaultConfig: { pollingInterval: 60, url: 'https://api.example.com/v1/items', method: 'GET', pollingDedupeKey: 'id' },
    requirements: { cost: 'FREE', signup: 'NONE', description: 'Uses your API Key to check for updates.' }
  },
  {
    type: NexusType.TRIGGER,
    subtype: NexusSubtype.CHAT_TRIGGER,
    label: 'Chat / Interactive',
    icon: MessageSquare,
    description: 'Starts from user chat input.',
    category: 'Input / Trigger',
    defaultConfig: { systemMessage: 'You are a helpful assistant.' },
    requirements: { cost: 'FREE', signup: 'NONE', description: 'Interactive Chat Flow.' }
  },
  {
    type: NexusType.TRIGGER,
    subtype: NexusSubtype.ERROR_TRIGGER,
    label: 'Error Handler',
    icon: AlertOctagon,
    description: 'Catches workflow failures.',
    category: 'Input / Trigger',
    defaultConfig: { retryErrorFilters: ['500', '503'] },
    requirements: { cost: 'FREE', signup: 'NONE', description: 'Runs on failure.' }
  },

  // --- LOGIC / FLOW CONTROL ---
  {
    type: NexusType.LOGIC,
    subtype: NexusSubtype.AI_ROUTER, // NEW: DeepAgent Router
    label: 'AI Router',
    icon: Network,
    description: 'Intelligent decision branching based on content.',
    category: 'Logic / Flow control',
    defaultConfig: { routes: [{ id: 'r1', label: 'Route A', description: 'If input is positive' }] },
    requirements: { cost: 'FREE', signup: 'GOOGLE', description: 'Uses Gemini to classify input.' }
  },
  {
    type: NexusType.LOGIC,
    subtype: NexusSubtype.CONDITION,
    label: 'If',
    icon: Split,
    description: 'Split flow based on conditions.',
    category: 'Logic / Flow control',
    defaultConfig: { condition: 'input.status === "success"' },
    requirements: { cost: 'FREE', signup: 'NONE', description: 'Internal Logic Engine.' }
  },
  {
    type: NexusType.LOGIC,
    subtype: NexusSubtype.SWITCH,
    label: 'Switch',
    icon: Layers,
    description: 'Route to different paths.',
    category: 'Logic / Flow control',
    defaultConfig: { conditions: [], switchValue: '{{input.category}}' },
    requirements: { cost: 'FREE', signup: 'NONE', description: 'Internal Logic Engine.' }
  },
  {
    type: NexusType.ACTION,
    subtype: NexusSubtype.NO_OP,
    label: 'No Operation',
    icon: Disc,
    description: 'Do nothing (placeholder).',
    category: 'Logic / Flow control',
    defaultConfig: {},
    requirements: { cost: 'FREE', signup: 'NONE', description: 'Pass-through node.' }
  },
  {
    type: NexusType.ACTION,
    subtype: NexusSubtype.EXECUTE_WORKFLOW,
    label: 'Execute Workflow',
    icon: PlayCircle,
    description: 'Run another sub-workflow.',
    category: 'Logic / Flow control',
    defaultConfig: {},
    requirements: { cost: 'FREE', signup: 'NONE', description: 'Runs another flow.' }
  },

  // --- HTTP / API ---
  {
    type: NexusType.ACTION,
    subtype: NexusSubtype.HTTP_REQUEST,
    label: 'HTTP Request',
    icon: Globe,
    description: 'Call any external API.',
    category: 'HTTP / API',
    defaultConfig: { method: 'GET', url: 'https://api.example.com', authType: 'NONE', responseFormat: 'JSON', errorHandling: 'STOP' },
    requirements: { cost: 'FREE', signup: 'NONE', description: 'Requires an API to connect to.' }
  },
  {
    type: NexusType.ACTION,
    subtype: NexusSubtype.CODE_JS,
    label: 'Code',
    icon: Code,
    description: 'Execute custom JavaScript.',
    category: 'HTTP / API',
    defaultConfig: { code: 'return { ...input, processed: true };' },
    requirements: { cost: 'FREE', signup: 'NONE', description: 'Runs in your browser. 100% Free.' }
  },

  // --- DATA PROCESSING / UTILITY ---
  {
    type: NexusType.LOGIC,
    subtype: NexusSubtype.MERGE,
    label: 'Merge',
    icon: GitMerge,
    description: 'Combine data from multiple branches.',
    category: 'Data Processing',
    defaultConfig: { mergeMode: 'APPEND' },
    requirements: { cost: 'FREE', signup: 'NONE', description: 'Internal Data Utility.' }
  },
  {
    type: NexusType.LOGIC,
    subtype: NexusSubtype.SPLIT_BATCH,
    label: 'Split In Batches',
    icon: Repeat,
    description: 'Loop over items/arrays.',
    category: 'Data Processing',
    defaultConfig: { batchSize: 10 },
    requirements: { cost: 'FREE', signup: 'NONE', description: 'Internal Iterator.' }
  },
  {
    type: NexusType.ACTION,
    subtype: NexusSubtype.SET_VARIABLE,
    label: 'Set / Edit Fields',
    icon: Variable,
    description: 'Create or modify data fields.',
    category: 'Data Processing',
    defaultConfig: { fieldMappings: [{ key: 'newField', value: '{{input.data}}', type: 'STRING' }] },
    requirements: { cost: 'FREE', signup: 'NONE', description: 'Internal Data Utility.' }
  },
  {
    type: NexusType.ACTION,
    subtype: NexusSubtype.DELAY,
    label: 'Wait',
    icon: Pause,
    description: 'Pause execution.',
    category: 'Data Processing',
    defaultConfig: { delayMs: 1000 },
    requirements: { cost: 'FREE', signup: 'NONE', description: 'Internal Timer.' }
  },

  // --- FILES / STORAGE ---
  {
    type: NexusType.ACTION,
    subtype: NexusSubtype.READ_BINARY_FILE,
    label: 'Read File',
    icon: FileText,
    description: 'Read file from system.',
    category: 'Files / Storage',
    defaultConfig: { filePath: '/data/file.json' },
    requirements: { cost: 'FREE', signup: 'NONE', description: 'Simulated File System.' }
  },
  {
    type: NexusType.ACTION,
    subtype: NexusSubtype.WRITE_BINARY_FILE,
    label: 'Write File',
    icon: FileSignature,
    description: 'Save content to file.',
    category: 'Files / Storage',
    defaultConfig: { filePath: '/output/data.json' },
    requirements: { cost: 'FREE', signup: 'NONE', description: 'Simulated File System.' }
  },
  {
    type: NexusType.ACTION,
    subtype: NexusSubtype.FTP,
    label: 'FTP / SFTP',
    icon: Server,
    description: 'Transfer files via FTP.',
    category: 'Files / Storage',
    defaultConfig: { host: 'ftp.example.com' },
    requirements: { cost: 'FREE', signup: 'NONE', description: 'Simulated FTP Client.' }
  },
  {
    type: NexusType.ACTION,
    subtype: NexusSubtype.AWS_S3,
    label: 'AWS S3',
    icon: UploadCloud,
    description: 'Upload/Download from S3.',
    category: 'Files / Storage',
    defaultConfig: { bucket: 'my-bucket' },
    requirements: { cost: 'FREE', signup: 'PLATFORM_ACCOUNT', description: 'Requires AWS Creds.' }
  },
  {
    type: NexusType.ACTION,
    subtype: NexusSubtype.GOOGLE_DRIVE,
    label: 'Google Drive',
    icon: HardDrive,
    description: 'Manage Drive files.',
    category: 'Files / Storage',
    defaultConfig: { operation: 'upload' },
    requirements: { cost: 'FREE', signup: 'GOOGLE', description: 'Requires Google Auth.' }
  },

  // --- DATABASES ---
  {
    type: NexusType.ACTION,
    subtype: NexusSubtype.MYSQL,
    label: 'MySQL',
    icon: Database,
    description: 'Execute SQL queries.',
    category: 'Databases',
    defaultConfig: { dbQuery: 'SELECT * FROM users LIMIT 10;' },
    requirements: { cost: 'FREE', signup: 'NONE', description: 'Connects to your DB.' }
  },
  {
    type: NexusType.ACTION,
    subtype: NexusSubtype.POSTGRES,
    label: 'PostgreSQL',
    icon: Database,
    description: 'Postgres SQL queries.',
    category: 'Databases',
    defaultConfig: { dbQuery: 'SELECT * FROM users;' },
    requirements: { cost: 'FREE', signup: 'NONE', description: 'Connects to your DB.' }
  },

  // --- SHEETS / DOCS / CRMS ---
  {
    type: NexusType.ACTION,
    subtype: NexusSubtype.SHEETS_READ,
    label: 'Google Sheets',
    icon: FileSpreadsheet,
    description: 'Read/Write Rows.',
    category: 'Business Ops & CRM',
    defaultConfig: { operation: 'read', sheetId: '', range: 'A1:Z' },
    requirements: { cost: 'FREE', signup: 'GOOGLE', description: 'Google Auth.' }
  },
  {
    type: NexusType.ACTION,
    subtype: NexusSubtype.AIRTABLE,
    label: 'Airtable',
    icon: Database,
    description: 'Manage Airtable records.',
    category: 'Business Ops & CRM',
    defaultConfig: { operation: 'list', resource: 'records' },
    requirements: { cost: 'FREE', signup: 'PLATFORM_ACCOUNT', description: 'Airtable API Key.' }
  },
  {
    type: NexusType.ACTION,
    subtype: NexusSubtype.NOTION,
    label: 'Notion',
    icon: FileText,
    description: 'Manage Notion pages/DBs.',
    category: 'Business Ops & CRM',
    defaultConfig: { operation: 'get', resource: 'database' },
    requirements: { cost: 'FREE', signup: 'PLATFORM_ACCOUNT', description: 'Notion Integration.' }
  },
  {
    type: NexusType.ACTION,
    subtype: NexusSubtype.HUBSPOT,
    label: 'HubSpot',
    icon: Building,
    description: 'CRM Contacts & Deals.',
    category: 'Business Ops & CRM',
    defaultConfig: { resource: 'contact', operation: 'get' },
    requirements: { cost: 'FREE', signup: 'PLATFORM_ACCOUNT', description: 'HubSpot API.' }
  },
  {
    type: NexusType.ACTION,
    subtype: NexusSubtype.SALESFORCE,
    label: 'Salesforce',
    icon: Cloud,
    description: 'Enterprise CRM Ops.',
    category: 'Business Ops & CRM',
    defaultConfig: { resource: 'lead', operation: 'create' },
    requirements: { cost: 'FREE', signup: 'PLATFORM_ACCOUNT', description: 'Salesforce Auth.' }
  },

  // --- DEV / OPS ---
  {
    type: NexusType.ACTION,
    subtype: NexusSubtype.GITHUB,
    label: 'GitHub',
    icon: GitCommit,
    description: 'Commits, Issues, PRs.',
    category: 'Dev / Ops',
    defaultConfig: { resource: 'issue', operation: 'create' },
    requirements: { cost: 'FREE', signup: 'PLATFORM_ACCOUNT', description: 'GitHub Token.' }
  },
  {
    type: NexusType.ACTION,
    subtype: NexusSubtype.GITLAB,
    label: 'GitLab',
    icon: GitPullRequest,
    description: 'CI/CD & Repos.',
    category: 'Dev / Ops',
    defaultConfig: { resource: 'pipeline', operation: 'trigger' },
    requirements: { cost: 'FREE', signup: 'PLATFORM_ACCOUNT', description: 'GitLab Token.' }
  },
  {
    type: NexusType.ACTION,
    subtype: NexusSubtype.JIRA,
    label: 'Jira Software',
    icon: Table,
    description: 'Manage Issues/Sprints.',
    category: 'Dev / Ops',
    defaultConfig: { resource: 'issue', operation: 'create' },
    requirements: { cost: 'FREE', signup: 'PLATFORM_ACCOUNT', description: 'Atlassian Token.' }
  },
  {
    type: NexusType.ACTION,
    subtype: NexusSubtype.DOCKER,
    label: 'Docker',
    icon: Container,
    description: 'Manage containers.',
    category: 'Dev / Ops',
    defaultConfig: { command: 'ps', operation: 'execute' },
    requirements: { cost: 'FREE', signup: 'NONE', description: 'Docker Socket/SSH.' }
  },
  {
    type: NexusType.ACTION,
    subtype: NexusSubtype.SSH,
    label: 'SSH / CLI',
    icon: Terminal,
    description: 'Execute shell commands.',
    category: 'Dev / Ops',
    defaultConfig: { command: 'ls -la' },
    requirements: { cost: 'FREE', signup: 'NONE', description: 'Remote Host Access.' }
  },

  // --- EMAIL / MESSAGING / CHAT ---
  {
    type: NexusType.ACTION,
    subtype: NexusSubtype.EMAIL, // SMTP
    label: 'SMTP Email',
    icon: Mail,
    description: 'Send via SMTP.',
    category: 'Email / Chat',
    defaultConfig: {},
    requirements: { cost: 'FREE', signup: 'NONE', description: 'Requires SMTP Creds.' }
  },
  {
    type: NexusType.ACTION,
    subtype: NexusSubtype.GMAIL,
    label: 'Gmail',
    icon: Mail,
    description: 'Send/Read via Gmail API.',
    category: 'Email / Chat',
    defaultConfig: {},
    requirements: { cost: 'FREE', signup: 'GOOGLE', description: 'Requires Google Auth.' }
  },
  {
    type: NexusType.ACTION,
    subtype: NexusSubtype.OUTLOOK,
    label: 'Outlook',
    icon: MailOpen,
    description: 'Office 365 Email.',
    category: 'Email / Chat',
    defaultConfig: {},
    requirements: { cost: 'FREE', signup: 'MICROSOFT', description: 'Requires MS Auth.' }
  },
  {
    type: NexusType.ACTION,
    subtype: NexusSubtype.MAILGUN,
    label: 'Mailgun',
    icon: Send,
    description: 'Send Transactional Email.',
    category: 'Email / Chat',
    defaultConfig: { region: 'US' },
    requirements: { cost: 'PAID_API', signup: 'PLATFORM_ACCOUNT', description: 'Requires Mailgun API Key.' }
  },
  {
    type: NexusType.ACTION,
    subtype: NexusSubtype.SLACK,
    label: 'Slack',
    icon: MessageSquare,
    description: 'Post to Slack channels.',
    category: 'Email / Chat',
    defaultConfig: {},
    requirements: { cost: 'FREE', signup: 'PLATFORM_ACCOUNT', description: 'Requires Slack Webhook.' }
  },
  {
    type: NexusType.ACTION,
    subtype: NexusSubtype.DISCORD,
    label: 'Discord',
    icon: MessageCircle,
    description: 'Post to Discord.',
    category: 'Email / Chat',
    defaultConfig: {},
    requirements: { cost: 'FREE', signup: 'PLATFORM_ACCOUNT', description: 'Requires Discord Webhook.' }
  },
  {
    type: NexusType.ACTION,
    subtype: NexusSubtype.TELEGRAM,
    label: 'Telegram',
    icon: Send,
    description: 'Send Telegram messages.',
    category: 'Email / Chat',
    defaultConfig: {},
    requirements: { cost: 'FREE', signup: 'PLATFORM_ACCOUNT', description: 'Requires Bot Token.' }
  },

  // --- AI & AGENTS ---
  {
    type: NexusType.ACTION, 
    subtype: NexusSubtype.AGENT,
    label: 'AI Agent',
    icon: Brain,
    description: 'Autonomous agent using Tools.',
    category: 'AI & Intelligence',
    defaultConfig: { 
      provider: 'gemini', 
      model: AI_MODELS.RUNTIME, // 🔥 BUDGET LOCK
      systemMessage: 'You are a helpful assistant.',
      enabledTools: [] 
    },
    requirements: { cost: 'FREE', signup: 'GOOGLE', description: 'Needs Gemini API Key.' }
  },
  {
    type: NexusType.ACTION,
    subtype: NexusSubtype.VEO_VIDEO_GEN,
    label: 'Veo Video Gen',
    icon: Film,
    description: 'Generate video with Veo (BYO Key).',
    category: 'AI & Intelligence',
    defaultConfig: { 
      prompt: '{{input.text}}', 
      model: AI_MODELS.VIDEO,
      videoResolution: '720p',
      videoAspectRatio: '16:9'
    },
    requirements: { cost: 'PAID_API', signup: 'GOOGLE', description: 'Requires Personal Gemini Key with Veo Access.' }
  },
  {
    type: NexusType.ACTION,
    subtype: NexusSubtype.AI_VIDEO_EDIT,
    label: 'AI Video Editor',
    icon: Scissors,
    description: 'Edit/Analyze Video using Gemini.',
    category: 'AI & Intelligence',
    defaultConfig: { 
      prompt: 'Describe what is happening in this video.',
      provider: 'gemini',
      model: 'gemini-2.5-flash-image'
    },
    requirements: { cost: 'FREE', signup: 'GOOGLE', description: 'Uses User Gemini Key.' }
  },
  {
    type: NexusType.ACTION,
    subtype: NexusSubtype.OPENAI_CHAT,
    label: 'OpenAI Chat',
    icon: Brain,
    description: 'GPT-4o / GPT-3.5.',
    category: 'AI & Intelligence',
    defaultConfig: { model: 'gpt-4o', systemMessage: 'You are a helpful assistant.' },
    requirements: { cost: 'PAID_API', signup: 'PLATFORM_ACCOUNT', description: 'OpenAI Key.' }
  },
  {
    type: NexusType.ACTION,
    subtype: NexusSubtype.AI_EXTRACT,
    label: 'AI Extract',
    icon: FileJson,
    description: 'Extract structured JSON from text.',
    category: 'AI & Intelligence',
    defaultConfig: { 
        model: AI_MODELS.RUNTIME, // 🔥 BUDGET LOCK
        extractionSchema: '{ "name": "string", "age": "number" }' 
    },
    requirements: { cost: 'FREE', signup: 'GOOGLE', description: 'Uses Gemini.' }
  },
];

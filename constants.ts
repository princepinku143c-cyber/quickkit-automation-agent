
import { NexusSubtype, NexusType, Blueprint, NexusConfig } from "./types";
import { 
  Zap, Clock, Globe, Brain, 
  Pause, Split, Terminal, Mail,
  MessageCircle, FileSpreadsheet,
  MessageSquare, FileText, Database,
  Search, ArrowDownToLine, ArrowUpFromLine,
  CreditCard, Layout, Table, ShoppingBag,
  ShieldCheck, CheckCircle, RefreshCcw, UserCheck
} from "lucide-react";

export const INITIAL_STREAM = {
  id: 'stream-1',
  name: 'Untitled Stream',
  description: 'A new automation flow',
  nexuses: [],
  synapses: [],
  createdAt: Date.now()
};

interface NexusDefinition {
  type: NexusType;
  subtype: NexusSubtype;
  label: string;
  icon: any;
  description: string;
  defaultConfig: NexusConfig;
  isPremium?: boolean;
}

export const NEXUS_DEFINITIONS: NexusDefinition[] = [
  // --- AGENTS ---
  {
    type: NexusType.ACTION, 
    subtype: NexusSubtype.AGENT,
    label: 'AI Agent (Nexus-Flash)',
    icon: Brain,
    description: 'Smart agent that can use tools autonomously.',
    defaultConfig: { 
      provider: 'gemini', 
      model: 'gemini-3-flash-preview', 
      systemMessage: 'You are a professional automation architect.',
      enabledTools: ['web_search', 'sheets_read'] 
    }
  },

  // --- GOOGLE SHEETS ---
  {
    type: NexusType.ACTION,
    subtype: NexusSubtype.SHEETS_READ,
    label: 'Sheets Reader',
    icon: ArrowDownToLine,
    description: 'Read data from a Google Sheet range.',
    defaultConfig: { sheetId: '', range: 'Sheet1!A1:Z100' }
  },

  // --- PAYMENT & SUBSCRIPTION ---
  {
    type: NexusType.LOGIC,
    subtype: NexusSubtype.SUBSCRIPTION_CHECK,
    label: 'Check Subscription',
    icon: ShieldCheck,
    description: 'Verify if the current user is PRO.',
    defaultConfig: {}
  },
  {
    type: NexusType.ACTION,
    subtype: NexusSubtype.PAYMENT_VERIFY,
    label: 'PayPal Verify',
    icon: RefreshCcw,
    description: 'Verify incoming payment signatures.',
    // Fixed: changed provider to paymentProvider to fix type error as 'paypal' is not an AIProvider
    defaultConfig: { paymentProvider: 'paypal' }
  },
  {
    type: NexusType.ACTION,
    subtype: NexusSubtype.PLAN_UPDATE,
    label: 'Update User Plan',
    icon: UserCheck,
    description: 'Update user tier in Firestore.',
    defaultConfig: { tier: 'PRO', durationDays: 30 }
  },

  // --- PREMIUM CONNECTORS ---
  {
    type: NexusType.ACTION,
    subtype: NexusSubtype.RAZORPAY,
    label: 'Razorpay Pay',
    icon: CreditCard,
    description: 'Process payments and verify status.',
    defaultConfig: {},
    isPremium: true
  },
  {
    type: NexusType.ACTION,
    subtype: NexusSubtype.NOTION,
    label: 'Notion Sync',
    icon: Layout,
    description: 'Create pages and update databases.',
    defaultConfig: {},
    isPremium: true
  },

  // --- TRIGGERS ---
  {
    type: NexusType.TRIGGER,
    subtype: NexusSubtype.WEBHOOK,
    label: 'Webhook',
    icon: Zap,
    description: 'Triggers on external URL call.',
    defaultConfig: {}
  },
  {
    type: NexusType.TRIGGER,
    subtype: NexusSubtype.CHAT_TRIGGER,
    label: 'Chat Command',
    icon: MessageSquare,
    description: 'Starts workflow on chat message.',
    defaultConfig: {}
  },

  // --- LOGIC ---
  {
    type: NexusType.LOGIC,
    subtype: NexusSubtype.CONDITION,
    label: 'Condition (IF)',
    icon: Split,
    description: 'Branch based on data.',
    defaultConfig: { condition: 'input.status === "ok"' }
  },
  {
    type: NexusType.ACTION,
    subtype: NexusSubtype.LOGGER,
    label: 'Debugger',
    icon: Terminal,
    description: 'View output data in logs.',
    defaultConfig: {}
  }
];

export const BLUEPRINTS: Blueprint[] = [
  {
    id: 'bp-sheets-agent',
    name: 'Sheets-Powered AI Agent',
    description: 'AI that reads from a sheet and writes analysis back.',
    category: 'Agentic',
    nexuses: [
      { id: 'n1', type: NexusType.TRIGGER, subtype: NexusSubtype.CHAT_TRIGGER, label: 'Chat Command', position: { x: 50, y: 150 }, config: {}, outputs: ['default'] },
      { id: 'n2', type: NexusType.ACTION, subtype: NexusSubtype.SHEETS_READ, label: 'Fetch Leads', position: { x: 350, y: 50 }, config: { sheetId: 'MY_SHEET_ID', range: 'A1:C10' }, outputs: ['default'] },
      { id: 'n3', type: NexusType.ACTION, subtype: NexusSubtype.AGENT, label: 'Decision Brain', position: { x: 650, y: 150 }, config: { systemMessage: 'Analyse data.' }, outputs: ['default'] }
    ],
    synapses: [
      { id: 's1', sourceId: 'n1', targetId: 'n3', sourceHandle: 'default' },
      { id: 's2', sourceId: 'n2', targetId: 'n3', sourceHandle: 'default' }
    ]
  }
];


import React, { useState } from 'react';
import { Nexus, NexusSubtype, Credential } from '../types';
import { 
  X, Trash2, Settings, Play, Sliders, Key, Loader2, ShieldAlert, RotateCcw, Clock, Zap
} from 'lucide-react';
import { SectionHeader, InputField, SelectField, ToggleField, TextAreaField } from './ConfigInputs';

import BusinessConfig from './nodes/BusinessConfig';
import DevOpsConfig from './nodes/DevOpsConfig';
import HttpConfig from './nodes/HttpConfig';
import AiConfig from './nodes/AiConfig';
import SocialConfig from './nodes/SocialConfig'; 
import LogicConfig from './nodes/LogicConfig';   
import StorageConfig from './nodes/StorageConfig'; 
import DynamicConfig from './nodes/DynamicConfig';
import TriggerConfig from './nodes/TriggerConfig'; 

interface PropertiesPanelProps {
  nexus: Nexus | null;
  onClose: () => void;
  onUpdate: (id: string, updates: Partial<Nexus>) => void;
  onDelete: (id: string) => void;
  credentials?: Credential[];
  previousNodes?: Nexus[]; 
  onTest?: (id: string) => void; 
  projectId?: string; 
  onPreview?: (projectId: string) => void;
}

const PropertiesPanel: React.FC<PropertiesPanelProps> = ({ nexus, onClose, onUpdate, onDelete, credentials = [], onTest, projectId }) => {
  const [activeTab, setActiveTab] = useState<'config' | 'settings'>('config');
  
  if (!nexus) return null;
  
  const safeSubtype = nexus.subtype || NexusSubtype.HTTP_REQUEST;
  const safeLabel = nexus.label || 'Untitled Node';
  const safeConfig = nexus.config || {};

  const handleChange = (key: string, value: any) => {
    onUpdate(nexus.id, { config: { ...safeConfig, [key]: value } });
  };

  const renderConfig = () => {
      if (safeConfig.uiSchema && safeConfig.uiSchema.length > 0) {
          return <DynamicConfig schema={safeConfig.uiSchema} config={safeConfig} onChange={handleChange} />;
      }
      if ([NexusSubtype.CHAT_TRIGGER, NexusSubtype.ERROR_TRIGGER].includes(safeSubtype)) {
          return <TriggerConfig subtype={safeSubtype} config={safeConfig} onChange={handleChange} />;
      }
      if ([
          NexusSubtype.SHEETS_READ, NexusSubtype.SHEETS_WRITE, NexusSubtype.AIRTABLE, 
          NexusSubtype.HUBSPOT, NexusSubtype.SALESFORCE, NexusSubtype.ZENDESK, 
          NexusSubtype.NOTION, NexusSubtype.GOOGLE_CALENDAR, NexusSubtype.MERGE,
          NexusSubtype.SHOPIFY, NexusSubtype.STRIPE, NexusSubtype.RAZORPAY,
          NexusSubtype.CRYPTO_PRICE, NexusSubtype.BINANCE_TRADE
      ].includes(safeSubtype)) {
          return <BusinessConfig subtype={safeSubtype} config={safeConfig} onChange={handleChange} />;
      }
      if ([NexusSubtype.GITHUB, NexusSubtype.GITLAB, NexusSubtype.JIRA, NexusSubtype.DOCKER, NexusSubtype.SSH].includes(safeSubtype)) {
          return <DevOpsConfig subtype={safeSubtype} config={safeConfig} onChange={handleChange} />;
      }
      if ([NexusSubtype.HTTP_REQUEST, NexusSubtype.WEBHOOK, NexusSubtype.API_POLLER].includes(safeSubtype)) {
          return <HttpConfig subtype={safeSubtype} config={safeConfig} nexusId={nexus.id} onChange={handleChange} projectId={projectId} />;
      }
      if ([
          NexusSubtype.AGENT, NexusSubtype.AI_CHAT, NexusSubtype.OPENAI_CHAT, 
          NexusSubtype.ANTHROPIC_CHAT, NexusSubtype.GROQ_CHAT,
          NexusSubtype.VEO_VIDEO_GEN, NexusSubtype.AI_VIDEO_EDIT, 
          NexusSubtype.AI_EXTRACT, NexusSubtype.AI_CLASSIFY, NexusSubtype.AI_SENTIMENT,
          NexusSubtype.VISION_ANALYSIS, NexusSubtype.DOC_LOADER
      ].includes(safeSubtype)) {
          return <AiConfig subtype={safeSubtype} config={safeConfig} onChange={handleChange} />;
      }
      if ([
          NexusSubtype.EMAIL, NexusSubtype.GMAIL, NexusSubtype.OUTLOOK, NexusSubtype.MAILGUN, NexusSubtype.IMAP,
          NexusSubtype.SLACK, NexusSubtype.DISCORD, NexusSubtype.TELEGRAM, NexusSubtype.WHATSAPP,
          NexusSubtype.LINKEDIN, NexusSubtype.TWITTER, NexusSubtype.INSTAGRAM, NexusSubtype.FACEBOOK, NexusSubtype.YOUTUBE, NexusSubtype.TIKTOK
      ].includes(safeSubtype)) {
          return <SocialConfig subtype={safeSubtype} config={safeConfig} onChange={handleChange} />;
      }
      if ([
          NexusSubtype.SCHEDULE, NexusSubtype.DELAY, NexusSubtype.CONDITION, NexusSubtype.SWITCH, NexusSubtype.CODE_JS,
          NexusSubtype.SET_VARIABLE, NexusSubtype.SPLIT_BATCH, NexusSubtype.ITEM_LIST,
          NexusSubtype.NO_OP, NexusSubtype.EXECUTE_WORKFLOW, NexusSubtype.LOGGER
      ].includes(safeSubtype)) {
          return <LogicConfig subtype={safeSubtype} config={safeConfig} onChange={handleChange} />;
      }
      if ([NexusSubtype.AWS_S3, NexusSubtype.GOOGLE_DRIVE, NexusSubtype.FTP, NexusSubtype.READ_BINARY_FILE, NexusSubtype.WRITE_BINARY_FILE, NexusSubtype.MYSQL, NexusSubtype.POSTGRES, NexusSubtype.MONGODB, NexusSubtype.SQLITE, NexusSubtype.SUPABASE].includes(safeSubtype)) {
          return <StorageConfig subtype={safeSubtype} config={safeConfig} onChange={handleChange} />;
      }
      return (
          <div className="space-y-4">
              <SectionHeader icon={Settings} title="Configuration" />
              {Object.entries(safeConfig).map(([key, value]) => {
                  if (typeof value === 'object' || ['credentialId', 'uiSchema'].includes(key)) return null;
                  return <InputField key={key} label={key} value={value} onChange={(v: string) => handleChange(key, v)} />;
              })}
          </div>
      );
  };

  const renderSettings = () => (
    <div className="space-y-5">
        <SectionHeader icon={Sliders} title="Advanced Settings" />
        <div className="bg-nexus-900/50 p-4 rounded-xl border border-nexus-800 space-y-4">
            <div className="flex items-center gap-2 text-nexus-accent text-xs font-bold uppercase tracking-wider">
                <ShieldAlert size={14}/> Node Resilience
            </div>
            <SelectField 
                label="Retry Policy"
                value={safeConfig.retryStrategy || 'NONE'}
                onChange={(v: string) => handleChange('retryStrategy', v)}
                options={[
                    { label: 'No Retry', value: 'NONE' },
                    { label: 'Fixed Interval', value: 'FIXED' },
                    { label: 'Exponential Backoff', value: 'EXPONENTIAL' }
                ]}
            />
            <ToggleField 
                label="Continue on Error" 
                value={safeConfig.continueOnError} 
                onChange={(v: boolean) => handleChange('continueOnError', v)} 
                description="Keep workflow running if this node fails."
                activeColor="bg-yellow-500"
            />
        </div>
    </div>
  );

  return (
    <div className="w-full md:w-96 bg-nexus-900 border-l border-nexus-800 flex flex-col h-full z-20 shadow-2xl absolute right-0 top-0 bottom-0 animate-in slide-in-from-right duration-300">
      <div className="p-4 border-b border-nexus-800 flex items-center justify-between bg-nexus-950">
        <div className="flex items-center gap-3 overflow-hidden">
            <div className={`p-2 rounded-xl bg-nexus-800 text-nexus-accent border border-nexus-700`}>
               <Settings size={18} />
            </div>
            <div>
                <h2 className="font-bold text-sm text-white truncate w-32">{safeLabel}</h2>
                <p className="text-[9px] text-gray-500 font-mono uppercase tracking-widest">{safeSubtype.replace('_', ' ')}</p>
            </div>
        </div>
        <button onClick={onClose} className="p-2 text-gray-400 hover:text-white hover:bg-nexus-800 rounded-lg transition-colors"><X size={18} /></button>
      </div>
      
      <div className="flex border-b border-nexus-800 bg-nexus-950 px-2 shrink-0">
          <button onClick={() => setActiveTab('config')} className={`flex-1 py-3 text-[10px] font-bold uppercase tracking-wider transition-all ${activeTab === 'config' ? 'text-nexus-accent border-b-2 border-nexus-accent' : 'text-gray-500 hover:text-gray-300'}`}>Configuration</button>
          <button onClick={() => setActiveTab('settings')} className={`flex-1 py-3 text-[10px] font-bold uppercase tracking-wider transition-all ${activeTab === 'settings' ? 'text-nexus-accent border-b-2 border-nexus-accent' : 'text-gray-500 hover:text-gray-300'}`}>Settings</button>
      </div>

      <div className="p-5 flex-1 overflow-y-auto space-y-6 bg-[#0a0a0a] custom-scrollbar">
          <InputField label="Block Label" value={safeLabel} onChange={(v: string) => onUpdate(nexus.id, { label: v })} />
          {activeTab === 'config' ? renderConfig() : renderSettings()}
      </div>

      <div className="p-4 border-t border-nexus-800 bg-nexus-950 flex gap-3 shrink-0">
         <button 
            onClick={() => onTest && onTest(nexus.id)} 
            disabled={nexus.status === 'running'} 
            className="flex-1 py-4 bg-nexus-800 hover:bg-nexus-accent hover:text-black text-white text-[10px] font-black rounded-[14px] transition-all uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg disabled:opacity-50 relative overflow-hidden group"
         >
             {nexus.status === 'running' && <div className="absolute inset-0 bg-white/10 animate-progress-indefinite"></div>}
             {nexus.status === 'running' ? <Loader2 size={12} className="animate-spin"/> : <Zap size={12} className="group-hover:fill-current"/>}
             {nexus.status === 'running' ? 'Testing Node...' : 'Test Node Logic'}
         </button>
         <button onClick={() => onDelete(nexus.id)} className="px-5 py-4 bg-red-950/20 text-red-500 hover:bg-red-500 hover:text-white border border-red-900/50 rounded-[14px] transition-all"><Trash2 size={16} /></button>
      </div>
    </div>
  );
};

export default PropertiesPanel;

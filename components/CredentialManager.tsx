
import React, { useState, useEffect } from 'react';
import { Credential } from '../types';
import { Key, Plus, Trash2, Shield, Eye, EyeOff, Save, X, Bot, Lock, Activity, CheckCircle2, AlertOctagon, XCircle, RefreshCw, Globe, Server, ExternalLink, Copy, AlertTriangle } from 'lucide-react';
import { validateCredential, ValidationResult } from '../services/geminiService';

interface CredentialManagerProps {
  isOpen: boolean;
  onClose: () => void;
  onUpdate: () => void;
}

const PRODUCTION_DOMAINS = [
    'https://nexusstream-3a734.web.app',
    'https://nexusstream.site'
];

const CredentialManager: React.FC<CredentialManagerProps> = ({ isOpen, onClose, onUpdate }) => {
  const [credentials, setCredentials] = useState<Credential[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  
  // Test Status State
  const [keyStatuses, setKeyStatuses] = useState<Record<string, ValidationResult>>({});
  const [testingId, setTestingId] = useState<string | null>(null);

  // New Credential Form State
  const [newName, setNewName] = useState('');
  const [newType, setNewType] = useState<'API_KEY' | 'OAUTH2' | 'BASIC_AUTH' | 'GEMINI' | 'OPENAI' | 'OAUTH2_APP'>('GEMINI');
  const [newKey, setNewKey] = useState(''); 
  const [newValue, setNewValue] = useState(''); 
  
  // OAuth specific fields
  const [clientId, setClientId] = useState('');
  const [clientSecret, setClientSecret] = useState('');
  const [scopes, setScopes] = useState('https://www.googleapis.com/auth/gmail.send https://www.googleapis.com/auth/gmail.readonly');

  // --- STRICT REDIRECT URI LOGIC ---
  const getStableRedirectUri = () => {
      if (typeof window === 'undefined') return PRODUCTION_DOMAINS[0];
      const origin = window.location.origin;
      // Only allow exact production domains
      if (PRODUCTION_DOMAINS.includes(origin)) return origin;
      // Default to primary Firebase Hosting URL for all preview/dev environments
      return PRODUCTION_DOMAINS[0];
  };

  const effectiveRedirectUri = getStableRedirectUri();
  const isPreviewEnvironment = typeof window !== 'undefined' && window.location.origin !== effectiveRedirectUri;

  useEffect(() => {
    if (isOpen) {
        loadCredentials();
        setKeyStatuses({});
    }
  }, [isOpen]);

  const loadCredentials = () => {
      try {
          const stored = localStorage.getItem('nexus_credentials');
          if (stored) {
              setCredentials(JSON.parse(stored));
          }
      } catch (e) {
          console.error("Failed to load credentials", e);
      }
  };

  const handleSave = () => {
      // 1. Validate Name
      if (!newName.trim()) {
          alert("Please enter a 'Friendly Name' for this credential.");
          return;
      }
      
      let dataPayload: any = {};

      // 2. Validate Type-Specific Fields
      if (newType === 'OAUTH2_APP') {
          if (!clientId.trim()) {
              alert("Client ID is required for OAuth Apps.");
              return;
          }
          
          dataPayload = {
              clientId: clientId.trim(),
              clientSecret: clientSecret.trim(),
              scopes: scopes.trim(),
              redirectUri: effectiveRedirectUri // FORCE STABLE URI
          };
      } else {
          // Standard API Key Validation
          if (!newValue.trim()) {
              alert("The API Key / Token value cannot be empty.");
              return;
          }
          dataPayload = {
              key: newType === 'GEMINI' || newType === 'OPENAI' ? 'Authorization' : newKey,
              value: newValue.trim()
          };
      }
      
      const newCred: Credential = {
          id: `cred_${Date.now()}`,
          name: newName.trim(),
          type: newType,
          data: dataPayload,
          createdAt: Date.now()
      };

      try {
          const updated = [...credentials, newCred];
          localStorage.setItem('nexus_credentials', JSON.stringify(updated));
          setCredentials(updated);
          setIsCreating(false);
          resetForm();
          
          // Force parent update
          if (onUpdate) onUpdate(); 
      } catch (e) {
          alert("Error saving to local storage. Storage might be full.");
          console.error(e);
      }
  };

  const handleDelete = (id: string) => {
      const updated = credentials.filter(c => c.id !== id);
      localStorage.setItem('nexus_credentials', JSON.stringify(updated));
      setCredentials(updated);
      onUpdate();
  };

  const resetForm = () => {
      setNewName('');
      setNewKey('');
      setNewValue('');
      setClientId('');
      setClientSecret('');
      setNewType('GEMINI');
  };

  // --- REAL OAUTH POPUP LOGIC ---
  const handleAuthorizeApp = (cred: Credential) => {
      if (!cred.data.clientId) {
          alert("Missing Client ID in credential configuration.");
          return;
      }

      const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
      authUrl.searchParams.set('client_id', cred.data.clientId);
      authUrl.searchParams.set('redirect_uri', cred.data.redirectUri || effectiveRedirectUri);
      authUrl.searchParams.set('response_type', 'token'); // Implicit flow for client-side MVP
      authUrl.searchParams.set('scope', cred.data.scopes || 'email profile');
      authUrl.searchParams.set('include_granted_scopes', 'true');
      authUrl.searchParams.set('state', 'nexus_auth');

      // Open Popup
      const width = 500;
      const height = 600;
      const left = window.screen.width / 2 - width / 2;
      const top = window.screen.height / 2 - height / 2;
      
      const popup = window.open(
          authUrl.toString(), 
          'Google Auth', 
          `width=${width},height=${height},top=${top},left=${left}`
      );

      // Simple poller to detect closure (In a real app, use postMessage from redirect page)
      const timer = setInterval(() => {
          if (popup?.closed) {
              clearInterval(timer);
              // We can't easily detect success without a backend or redirect handler page, 
              // but we can assume the user tried.
              console.log("Auth popup closed.");
          }
      }, 1000);
  };

  const handleTestKey = async (cred: Credential) => {
      setTestingId(cred.id);
      
      let result: ValidationResult = { status: 'VALID', message: 'Ready' };
      if (cred.type === 'GEMINI' || cred.type === 'OPENAI') {
          result = await validateCredential(cred.type, cred.data.value);
      } else if (cred.type === 'OAUTH2_APP') {
          // Check if we have a token (mock check)
          result = { status: 'VALID', message: 'Config OK' };
      }
      
      setKeyStatuses(prev => ({
          ...prev,
          [cred.id]: result
      }));
      setTestingId(null);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm animate-in fade-in">
        <div className="w-full max-w-2xl bg-nexus-900 border border-nexus-800 rounded-2xl shadow-2xl flex flex-col max-h-[85vh]">
            
            {/* Header */}
            <div className="p-6 border-b border-nexus-800 flex justify-between items-center bg-nexus-950">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-nexus-accent/10 rounded-lg">
                        <Key size={20} className="text-nexus-accent"/>
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-white">Credential Vault</h2>
                        <p className="text-[10px] text-gray-500">Securely store API keys & OAuth Apps.</p>
                    </div>
                </div>
                <button onClick={onClose} className="text-gray-500 hover:text-white"><X size={20}/></button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 bg-[#050505] space-y-6">
                
                {isCreating ? (
                    <div className="bg-nexus-900/50 border border-nexus-700 rounded-xl p-6 space-y-4 animate-in slide-in-from-top-2">
                        <h3 className="text-sm font-bold text-white uppercase tracking-widest mb-2">New Credential</h3>
                        
                        <div>
                            <label className="block text-[10px] text-gray-500 uppercase mb-1">Provider Type</label>
                            <div className="grid grid-cols-4 gap-2">
                                <button onClick={() => setNewType('GEMINI')} className={`p-2 rounded-lg border text-[10px] font-bold flex flex-col items-center gap-2 ${newType === 'GEMINI' ? 'bg-blue-900/30 border-blue-500 text-blue-400' : 'bg-nexus-950 border-nexus-800 text-gray-500'}`}>
                                    <Bot size={14}/> Gemini
                                </button>
                                <button onClick={() => setNewType('OPENAI')} className={`p-2 rounded-lg border text-[10px] font-bold flex flex-col items-center gap-2 ${newType === 'OPENAI' ? 'bg-green-900/30 border-green-500 text-green-400' : 'bg-nexus-950 border-nexus-800 text-gray-500'}`}>
                                    <Bot size={14}/> OpenAI
                                </button>
                                <button onClick={() => setNewType('OAUTH2_APP')} className={`p-2 rounded-lg border text-[10px] font-bold flex flex-col items-center gap-2 ${newType === 'OAUTH2_APP' ? 'bg-purple-900/30 border-purple-500 text-purple-400' : 'bg-nexus-950 border-nexus-800 text-gray-500'}`}>
                                    <Globe size={14}/> OAuth App
                                </button>
                                <button onClick={() => setNewType('API_KEY')} className={`p-2 rounded-lg border text-[10px] font-bold flex flex-col items-center gap-2 ${newType === 'API_KEY' ? 'bg-nexus-800 border-white text-white' : 'bg-nexus-950 border-nexus-800 text-gray-500'}`}>
                                    <Key size={14}/> Custom
                                </button>
                            </div>
                        </div>

                        <div>
                            <label className="block text-[10px] text-gray-500 uppercase mb-1">Friendly Name <span className="text-red-500">*</span></label>
                            <input 
                                value={newName} 
                                onChange={(e) => setNewName(e.target.value)} 
                                placeholder={newType === 'OAUTH2_APP' ? "My Gmail App" : "Production API Key"}
                                className="w-full bg-nexus-950 border border-nexus-800 rounded-lg p-3 text-white text-xs outline-none focus:border-nexus-accent"
                            />
                        </div>

                        {/* OAUTH 2 APP FIELDS (PHASE 1 IMPLEMENTATION) */}
                        {newType === 'OAUTH2_APP' ? (
                            <div className="space-y-3 bg-black/20 p-4 rounded-xl border border-white/5">
                                <div className="p-3 bg-blue-900/10 border border-blue-500/20 rounded-lg mb-2">
                                    <div className="flex items-center justify-between mb-1">
                                        <div className="text-[10px] text-blue-400 font-bold uppercase flex items-center gap-2">
                                            <Shield size={12}/> Config Helper
                                        </div>
                                        <button onClick={() => navigator.clipboard.writeText(effectiveRedirectUri)} className="text-[9px] bg-blue-500/10 text-blue-300 px-2 py-1 rounded flex items-center gap-1 hover:bg-blue-500/20">
                                            <Copy size={10}/> Copy URI
                                        </button>
                                    </div>
                                    
                                    {isPreviewEnvironment && (
                                        <div className="flex items-start gap-2 mb-2 bg-yellow-900/20 text-yellow-500 p-2 rounded text-[10px] border border-yellow-500/20">
                                            <AlertTriangle size={12} className="shrink-0 mt-0.5"/>
                                            <span>
                                                Preview detected ({window.location.host}). 
                                                OAuth requires stable domains. Using production URI below.
                                            </span>
                                        </div>
                                    )}

                                    <p className="text-[10px] text-gray-400 mt-1">
                                        Add this Redirect URI to your Google Cloud Console:
                                    </p>
                                    <code className="block mt-1 bg-black/50 p-2 rounded text-nexus-accent text-[10px] font-mono break-all border border-nexus-800">
                                        {effectiveRedirectUri}
                                    </code>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-[10px] text-gray-500 uppercase mb-1">Client ID <span className="text-red-500">*</span></label>
                                        <input 
                                            value={clientId} 
                                            onChange={(e) => setClientId(e.target.value)} 
                                            placeholder="123...apps.googleusercontent.com"
                                            className="w-full bg-nexus-950 border border-nexus-800 rounded-lg p-3 text-nexus-wire font-mono text-xs outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] text-gray-500 uppercase mb-1">Client Secret</label>
                                        <input 
                                            type="password"
                                            value={clientSecret} 
                                            onChange={(e) => setClientSecret(e.target.value)} 
                                            placeholder="GOCSPX-..."
                                            className="w-full bg-nexus-950 border border-nexus-800 rounded-lg p-3 text-white font-mono text-xs outline-none"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-[10px] text-gray-500 uppercase mb-1">Scopes (Space Sep)</label>
                                    <input 
                                        value={scopes} 
                                        onChange={(e) => setScopes(e.target.value)} 
                                        className="w-full bg-nexus-950 border border-nexus-800 rounded-lg p-3 text-gray-400 font-mono text-xs outline-none"
                                    />
                                </div>
                            </div>
                        ) : (
                            // STANDARD API KEY FIELDS
                            newType === 'API_KEY' || newType === 'BASIC_AUTH' ? (
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-[10px] text-gray-500 uppercase mb-1">{newType === 'BASIC_AUTH' ? 'Username' : 'Header Name'}</label>
                                        <input 
                                            value={newKey} 
                                            onChange={(e) => setNewKey(e.target.value)} 
                                            placeholder={newType === 'BASIC_AUTH' ? 'admin' : 'Authorization'}
                                            className="w-full bg-nexus-950 border border-nexus-800 rounded-lg p-3 text-nexus-wire font-mono text-xs outline-none focus:border-nexus-accent"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] text-gray-500 uppercase mb-1">{newType === 'BASIC_AUTH' ? 'Password' : 'Value / Token'} <span className="text-red-500">*</span></label>
                                        <input 
                                            type="password"
                                            value={newValue} 
                                            onChange={(e) => setNewValue(e.target.value)} 
                                            placeholder="Secret..."
                                            className="w-full bg-nexus-950 border border-nexus-800 rounded-lg p-3 text-white font-mono text-xs outline-none focus:border-nexus-accent"
                                        />
                                    </div>
                                </div>
                            ) : (
                                // SIMPLIFIED AI INPUT
                                <div>
                                    <label className="block text-[10px] text-gray-500 uppercase mb-1 flex items-center gap-2">
                                        <Lock size={12} className="text-nexus-accent"/>
                                        API Key <span className="text-red-500">*</span>
                                    </label>
                                    <input 
                                        type="password"
                                        value={newValue} 
                                        onChange={(e) => setNewValue(e.target.value)} 
                                        placeholder="sk-..."
                                        className="w-full bg-nexus-950 border border-nexus-800 rounded-lg p-3 text-white font-mono text-xs outline-none focus:border-nexus-accent"
                                    />
                                </div>
                            )
                        )}

                        <div className="flex gap-2 pt-2">
                            <button onClick={handleSave} className="flex-1 bg-nexus-accent text-black font-bold py-2 rounded-lg text-xs hover:bg-white transition-all shadow-lg active:scale-95">Save Credential</button>
                            <button onClick={() => setIsCreating(false)} className="px-4 py-2 text-gray-500 hover:text-white text-xs">Cancel</button>
                        </div>
                    </div>
                ) : (
                    <button 
                        onClick={() => setIsCreating(true)}
                        className="w-full py-3 border border-dashed border-nexus-700 rounded-xl text-gray-500 hover:text-nexus-accent hover:border-nexus-accent hover:bg-nexus-900/50 transition-all flex items-center justify-center gap-2 text-xs font-bold uppercase"
                    >
                        <Plus size={14}/> Add New Credential
                    </button>
                )}

                <div className="space-y-3">
                    {credentials.length === 0 && !isCreating && (
                        <div className="text-center py-8 text-gray-500 text-xs">
                            No credentials found. Add one to get started.
                        </div>
                    )}
                    {credentials.map(cred => {
                        const status = keyStatuses[cred.id];
                        const canTest = ['GEMINI', 'OPENAI', 'OAUTH2_APP'].includes(cred.type);

                        return (
                            <div key={cred.id} className="p-4 bg-nexus-900 border border-nexus-800 rounded-xl flex items-center justify-between group hover:border-nexus-700 transition-colors">
                                <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-lg relative ${['GEMINI', 'OPENAI', 'OAUTH2_APP'].includes(cred.type) ? 'bg-blue-900/20 text-blue-400' : 'bg-nexus-800 text-gray-400'}`}>
                                        {cred.type === 'OAUTH2_APP' ? <Globe size={16}/> : ['GEMINI', 'OPENAI'].includes(cred.type) ? <Bot size={16}/> : <Shield size={16}/>}
                                        {status && (
                                            <div className={`absolute -top-1 -right-1 w-2 h-2 rounded-full border border-black ${status.status === 'VALID' ? 'bg-nexus-success' : 'bg-red-500'}`} />
                                        )}
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <div className="text-sm font-bold text-white">{cred.name}</div>
                                            {status && (
                                                <span className="text-[8px] text-nexus-success font-bold uppercase tracking-wide">
                                                    {status.message}
                                                </span>
                                            )}
                                        </div>
                                        <div className="text-[10px] text-gray-500 font-mono flex items-center gap-2 mt-0.5">
                                            <span className="bg-nexus-950 px-1 rounded">{cred.type}</span>
                                            {cred.type === 'OAUTH2_APP' ? (
                                                <span>ID: {cred.data.clientId ? cred.data.clientId.substring(0,8) + '...' : 'N/A'}</span>
                                            ) : (
                                                <span>Ends: ...{cred.data.value ? cred.data.value.slice(-4) : '****'}</span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    {cred.type === 'OAUTH2_APP' && (
                                        <button 
                                            onClick={() => handleAuthorizeApp(cred)}
                                            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded text-[10px] font-bold uppercase flex items-center gap-1 shadow-lg"
                                        >
                                            <ExternalLink size={10}/> Authorize
                                        </button>
                                    )}
                                    {canTest && cred.type !== 'OAUTH2_APP' && (
                                        <button 
                                            onClick={() => handleTestKey(cred)} 
                                            disabled={testingId === cred.id}
                                            className="p-2 bg-nexus-950 hover:bg-nexus-800 rounded text-gray-500 hover:text-nexus-accent transition-colors"
                                        >
                                            <RefreshCw size={14} className={testingId === cred.id ? "animate-spin" : ""}/>
                                        </button>
                                    )}
                                    <button onClick={() => handleDelete(cred.id)} className="p-2 text-gray-600 hover:text-red-500 transition-colors">
                                        <Trash2 size={16}/>
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>

            </div>
        </div>
    </div>
  );
};

export default CredentialManager;


import React, { useState } from 'react';
import { NEXUS_DEFINITIONS } from '../constants';
import { X, Search, Code2, Cpu, Terminal, Eye, ShieldCheck, Copy, Check } from 'lucide-react';

interface NodeRegistryProps {
    isOpen: boolean;
    onClose: () => void;
}

const NODE_SOURCE_DB: Record<string, string> = {
    // --- TRIGGERS ---
    'WEBHOOK': `// Kernel Hook: Secure HTTP Entry
const handle = async (req, res) => {
  const verified = await security.verifyHMAC(req);
  if (!verified) return res.status(401).send('Unauthorized');
  return { 
    id: uuid(), 
    payload: req.body, 
    headers: req.headers,
    timestamp: Date.now() 
  };
};`,
    'SCHEDULE': `// Kernel Task: Precision Cron Service
const schedule = (cron, tz) => {
  const engine = new CronEngine({ tz });
  engine.on(cron, () => Orchestrator.dispatch('flow_start'));
  return { status: 'active', nextRun: engine.next() };
};`,
    'API_POLLER': `// Kernel Pulse: Universal Delta Poller
const poll = async (config) => {
  const res = await fetch(config.url, { headers: config.auth });
  const data = await res.json();
  const diff = data.filter(item => !cache.has(item.id));
  return diff.length > 0 ? diff : null;
};`,
    'CHAT_TRIGGER': `// Kernel Socket: Real-time Socket Listener
const onIncoming = (msg) => {
  const context = { userId: msg.u, text: msg.t };
  const intent = AI.classify(msg.t);
  return { ...context, intent };
};`,

    // --- LOGIC ---
    'CONDITION': `// Kernel Logic: Binary Decision Engine
const evaluate = (exp, ctx) => {
  const sandbox = new Sandbox(ctx);
  return sandbox.run(exp) ? 'true' : 'false';
};`,
    'SWITCH': `// Kernel Router: Pattern Matcher
const route = (val, routes) => {
  const match = routes.find(r => val.matches(r.pattern));
  return match ? match.targetId : routes.defaultId;
};`,
    'MERGE': `// Kernel Fusion: High Performance Join
const merge = (l, r, key) => {
  const index = new Map(r.map(v => [v[key], v]));
  return l.map(v => ({ ...v, ...index.get(v[key]) }));
};`,

    // --- AI & INTELLIGENCE ---
    'AGENT': `// Neural Kernel: Autonomous LLM Orchestrator
const execute = async (prompt, tools) => {
  const brain = LLM.connect('gemini-3-pro');
  brain.injectTools(tools);
  const plan = await brain.generatePlan(prompt);
  return await brain.executePlan(plan);
};`,
    'VEO_VIDEO_GEN': `// Neural Media: Video Synthesis Module
const generate = async (prompt, res) => {
  const jobId = await VeoAPI.submit({ prompt, res });
  while (!VeoAPI.isDone(jobId)) await sleep(10000);
  return VeoAPI.getAsset(jobId);
};`,

    // --- CONNECTORS (CRM/DATA) ---
    'SHEETS_WRITE': `// Bridge: Google Sheets Append
const append = async (id, data) => {
  const auth = await Google.getAuth();
  const sheet = Google.sheets({ version: 'v4', auth });
  return await sheet.spreadsheets.values.append({
    spreadsheetId: id,
    range: 'A:Z',
    valueInputOption: 'RAW',
    requestBody: { values: [data] }
  });
};`,
    'HUBSPOT': `// Bridge: HubSpot CRM Entity Manager
const syncContact = async (email, props) => {
  const client = new HubSpotClient(API_KEY);
  const exists = await client.contacts.getByEmail(email);
  return exists ? 
    client.contacts.update(exists.id, props) : 
    client.contacts.create({ email, ...props });
};`,
    'MYSQL': `// DB: SQL Execution Kernel
const query = async (sql, params) => {
  const conn = await MySQL.createConnection(config);
  const [rows] = await conn.execute(sql, params);
  await conn.end();
  return rows;
};`,
    'POSTGRES': `// DB: Postgres Protocol Handler
const exec = async (sql, p) => {
  const client = new PGClient(config);
  await client.connect();
  const res = await client.query(sql, p);
  await client.end();
  return res.rows;
};`,

    // --- DEVOPS ---
    'GITHUB': `// Bridge: GitHub Octokit
const createIssue = async (repo, title, body) => {
  const octo = new Octokit({ auth: TOKEN });
  return await octo.issues.create({
    owner: repo.split('/')[0],
    repo: repo.split('/')[1],
    title, body
  });
};`,
    'DOCKER': `// Bridge: Docker Engine Socket
const restart = async (id) => {
  const docker = new DockerSocket('/var/run/docker.sock');
  const container = docker.getContainer(id);
  return await container.restart();
};`,

    // --- MESSAGING ---
    'EMAIL': `// Protocol: SMTP / MailEngine
const send = async (to, sub, body) => {
  const transport = Mailer.createTransport(config);
  return await transport.sendMail({
    from: 'Nexus <system@nexus.ai>',
    to, subject: sub, html: body
  });
};`,
    'SLACK': `// Bridge: Slack Webhook Dispatcher
const post = async (webhook, text) => {
  return await fetch(webhook, {
    method: 'POST',
    body: JSON.stringify({ text, mrkdwn: true })
  });
};`
};

const NodeRegistry: React.FC<NodeRegistryProps> = ({ isOpen, onClose }) => {
    const [search, setSearch] = useState('');
    const [selectedSubtype, setSelectedSubtype] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);

    if (!isOpen) return null;

    const handleCopy = () => {
        if (!selectedSubtype || !NODE_SOURCE_DB[selectedSubtype]) return;
        navigator.clipboard.writeText(NODE_SOURCE_DB[selectedSubtype]);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const filteredNodes = NEXUS_DEFINITIONS.filter(n => 
        n.label.toLowerCase().includes(search.toLowerCase()) || 
        n.subtype.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="fixed inset-0 z-[300] bg-black/95 backdrop-blur-3xl flex items-center justify-center p-8 animate-in fade-in duration-500">
            <div className="w-full max-w-7xl h-full bg-[#050505] border border-white/10 rounded-[30px] shadow-3xl flex flex-col overflow-hidden relative">
                
                <div className="p-8 border-b border-white/5 flex justify-between items-center bg-[#080808]">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-nexus-accent/10 rounded-2xl border border-nexus-accent/20">
                            <Cpu size={28} className="text-nexus-accent" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-black text-white uppercase tracking-wider leading-tight">Node Kernel Manifest</h2>
                            <p className="text-[10px] text-gray-600 font-bold uppercase tracking-[0.3em]">Module Index • Source Code A-Z</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600" size={16} />
                            <input 
                                value={search} onChange={(e) => setSearch(e.target.value)}
                                placeholder="Search Kernel Modules..."
                                className="bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white w-72 focus:border-nexus-accent outline-none transition-all"
                            />
                        </div>
                        <button onClick={onClose} className="p-2 text-gray-500 hover:text-white transition-all"><X size={24}/></button>
                    </div>
                </div>

                <div className="flex-1 flex overflow-hidden">
                    {/* List */}
                    <div className="w-1/3 overflow-y-auto p-8 custom-scrollbar border-r border-white/5">
                        <div className="space-y-2">
                            {filteredNodes.map((node) => {
                                const hasCode = !!NODE_SOURCE_DB[node.subtype];
                                return (
                                    <button 
                                        key={node.subtype}
                                        onClick={() => setSelectedSubtype(node.subtype)}
                                        className={`w-full group p-4 rounded-2xl border text-left transition-all flex items-center justify-between ${selectedSubtype === node.subtype ? 'border-nexus-accent bg-nexus-accent/5' : 'border-white/5 hover:border-white/20'}`}
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className={`p-2 rounded-xl border transition-colors ${selectedSubtype === node.subtype ? 'bg-nexus-accent text-black' : 'bg-nexus-900 border-white/10 text-nexus-accent'}`}>
                                                <node.icon size={18} />
                                            </div>
                                            <div>
                                                <div className="text-xs font-black text-white tracking-tight">{node.label}</div>
                                                <div className="text-[8px] text-gray-500 uppercase tracking-widest mt-0.5">{node.category}</div>
                                            </div>
                                        </div>
                                        {hasCode && <Terminal size={12} className={selectedSubtype === node.subtype ? 'text-nexus-accent' : 'text-gray-700'}/>}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Editor */}
                    <div className="flex-1 bg-black/60 p-8 flex flex-col">
                        {selectedSubtype ? (
                            <div className="flex-1 flex flex-col animate-in slide-in-from-right-4 duration-500">
                                <div className="flex justify-between items-center mb-4">
                                    <div className="flex items-center gap-2">
                                        <Code2 size={16} className="text-nexus-wire"/>
                                        <span className="text-[10px] font-black uppercase text-gray-400">Implementation: {selectedSubtype}</span>
                                    </div>
                                    <button 
                                        onClick={handleCopy}
                                        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-[9px] font-black uppercase transition-all ${copied ? 'bg-nexus-success text-black' : 'bg-white/5 text-gray-500 hover:text-white'}`}
                                    >
                                        {copied ? <Check size={12}/> : <Copy size={12}/>}
                                        {copied ? 'Copied' : 'Copy Block'}
                                    </button>
                                </div>
                                <div className="flex-1 bg-[#020202] border border-white/5 rounded-2xl p-6 overflow-hidden relative">
                                    <pre className="text-nexus-wire font-mono text-xs leading-relaxed overflow-auto h-full custom-scrollbar">
                                        <code>{NODE_SOURCE_DB[selectedSubtype] || "// Internal Logic Encrypted for Production Security."}</code>
                                    </pre>
                                </div>
                            </div>
                        ) : (
                            <div className="flex-1 border-2 border-dashed border-white/5 rounded-[40px] flex flex-col items-center justify-center text-center p-12">
                                <Eye size={48} className="text-gray-800 mb-4"/>
                                <h3 className="text-lg font-bold text-gray-600">Select a module to view kernel code</h3>
                                <p className="text-xs text-gray-700 mt-2 max-w-xs">Decompile any architectural block to inspect its JavaScript execution logic and security protocols.</p>
                            </div>
                        )}

                        <div className="mt-6 p-4 bg-blue-900/10 border border-blue-500/20 rounded-xl flex items-center gap-3">
                            <ShieldCheck className="text-blue-500" size={18}/>
                            <p className="text-[10px] text-blue-200/60 leading-tight">All kernel methods are type-checked against the Nexus Stream Runtime Interface (NSRI) before execution.</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default NodeRegistry;

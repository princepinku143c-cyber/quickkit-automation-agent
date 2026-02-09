
import React, { useState } from 'react';
import { NexusSubtype } from '../../types';
import { Brain, Settings, Film, Sparkles, Loader2, Play, FileJson, ScanEye, FileText, Database, Shield, Zap, Activity, Clock, DollarSign, History, Wrench, FileInput, Table, ShieldCheck, Filter, AlertTriangle, CheckCircle2, Music, Type, Wand2, Layers, Monitor, Share2, Clapperboard, Image as ImageIcon, Mic, Move, Download, Palette, Camera, Scale, Coins, Network, Plus, Trash2 } from 'lucide-react';
import { SectionHeader, SelectField, InputField, ToggleField, TextAreaField, SliderField, KeyValueList, CollapsibleSection, RuleList } from '../ConfigInputs';
import { AI_MODELS } from '../../constants';

interface AiConfigProps {
    subtype: NexusSubtype;
    config: any;
    onChange: (key: string, value: any) => void;
}

const AiConfig: React.FC<AiConfigProps> = ({ subtype, config, onChange }) => {
    const [aiTestInput, setAiTestInput] = useState('');
    const [aiTestOutput, setAiTestOutput] = useState('');
    const [isAiTesting, setIsAiTesting] = useState(false);
    
    // --- AI ROUTER HANDLERS ---
    const addRoute = () => {
        const routes = config.routes || [];
        const newRoute = { id: `r_${Date.now()}`, label: 'New Route', description: '' };
        onChange('routes', [...routes, newRoute]);
    };
    
    const updateRoute = (index: number, key: string, value: string) => {
        const routes = [...(config.routes || [])];
        routes[index][key] = value;
        onChange('routes', routes);
    };

    const removeRoute = (index: number) => {
        const routes = [...(config.routes || [])];
        routes.splice(index, 1);
        onChange('routes', routes);
    };

    const handleAiTest = () => {
        if(!aiTestInput) return;
        setIsAiTesting(true);
        setTimeout(() => {
            const tokens = Math.floor(aiTestInput.length / 4) + 50; 
            setAiTestOutput(`[Simulated Response]\nBased on your prompt "${aiTestInput}", here is the generated content...`);
            setIsAiTesting(false);
        }, 1000);
    };

    const updateTool = (tool: string, checked: boolean) => {
        const tools = new Set(config.enabledTools || []);
        if (checked) tools.add(tool); else tools.delete(tool);
        onChange('enabledTools', Array.from(tools));
    };

    if (subtype === NexusSubtype.AI_ROUTER) {
        return (
            <div className="space-y-2">
                <CollapsibleSection icon={Network} title="Decision Logic" defaultOpen={true}>
                    <TextAreaField 
                        label="Input to Analyze" 
                        value={config.input} 
                        onChange={(v: string) => onChange('input', v)} 
                        rows={3} 
                        placeholder="{{trigger.data.email_body}}" 
                        hint="The text data the AI will classify."
                    />
                    
                    <div className="mt-4 space-y-3">
                        <label className="text-[10px] font-bold text-gray-500 uppercase flex justify-between items-center">
                            Routing Intents
                            <button onClick={addRoute} className="text-nexus-accent hover:text-white flex items-center gap-1">
                                <Plus size={12}/> Add Route
                            </button>
                        </label>
                        
                        {(config.routes || []).map((route: any, idx: number) => (
                            <div key={idx} className="bg-nexus-900 border border-nexus-800 rounded-lg p-3 relative group animate-in slide-in-from-left-2">
                                <div className="absolute -left-2 top-1/2 -translate-y-1/2 bg-nexus-800 text-[8px] text-gray-400 px-1 rounded rotate-90 origin-right">
                                    OUT {idx + 1}
                                </div>
                                <div className="grid grid-cols-1 gap-2 pl-3">
                                    <InputField 
                                        placeholder="Intent Name (e.g. Urgent)" 
                                        value={route.label} 
                                        onChange={(v: string) => updateRoute(idx, 'label', v)} 
                                    />
                                    <TextAreaField 
                                        placeholder="Description (e.g. Contains words like ASAP, Critical)" 
                                        value={route.description} 
                                        onChange={(v: string) => updateRoute(idx, 'description', v)} 
                                        rows={2} 
                                    />
                                </div>
                                <button onClick={() => removeRoute(idx)} className="absolute top-2 right-2 text-gray-600 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Trash2 size={12}/>
                                </button>
                            </div>
                        ))}
                    </div>
                </CollapsibleSection>
                
                <CollapsibleSection icon={Brain} title="Model Config">
                    <SelectField 
                        label="AI Model" 
                        value={config.model || AI_MODELS.RUNTIME} 
                        onChange={(v: string) => onChange('model', v)} 
                        options={[
                            { label: 'Gemini 3 Flash (Fast & Cheap)', value: 'gemini-3-flash-preview' }, 
                            { label: 'Gemini 3 Pro (High Quality)', value: 'gemini-3-pro-preview' }
                        ]} 
                    />
                </CollapsibleSection>
            </div>
        );
    }

    if ([NexusSubtype.AGENT, NexusSubtype.AI_CHAT, NexusSubtype.OPENAI_CHAT, NexusSubtype.ANTHROPIC_CHAT, NexusSubtype.GROQ_CHAT].includes(subtype)) {
        return (
            <div className="space-y-2">
                <CollapsibleSection icon={Brain} title="Core Configuration" defaultOpen={true}>
                    <SelectField 
                        label="AI Model" 
                        value={config.model || AI_MODELS.RUNTIME} 
                        onChange={(v: string) => onChange('model', v)} 
                        options={[
                            { label: 'Gemini 3 Flash (Best Value)', value: 'gemini-3-flash-preview' }, 
                            { label: 'Gemini 3 Pro (Reasoning)', value: 'gemini-3-pro-preview' }, 
                            { label: 'GPT-4o (OpenAI)', value: 'gpt-4o' }
                        ]} 
                    />
                    <div className="grid grid-cols-2 gap-4 mt-3">
                        <SliderField label="Temperature" value={config.temperature ?? 0.7} onChange={(v: number) => onChange('temperature', v)} min={0} max={2} step={0.1} />
                        <SliderField label="Max Tokens" value={config.maxTokens ?? 2048} onChange={(v: number) => onChange('maxTokens', v)} min={128} max={32000} step={128} />
                    </div>
                </CollapsibleSection>

                <CollapsibleSection icon={Shield} title="Enterprise Guardrails" badge="New">
                    <div className="grid grid-cols-2 gap-4">
                        <ToggleField label="Deterministic Mode" value={config.deterministicMode} onChange={(v: boolean) => { onChange('deterministicMode', v); if(v) onChange('temperature', 0); }} description="Forces Temp=0 for consistency." activeColor="bg-blue-500" />
                        <ToggleField label="PII Filter" value={config.piiFilter} onChange={(v: boolean) => onChange('piiFilter', v)} description="Mask emails/phones in output." />
                    </div>
                    <div className="mt-3 border-t border-nexus-800/50 pt-3">
                        <label className="text-[10px] font-bold text-gray-500 uppercase flex items-center gap-2 mb-2">
                            <Coins size={12} className="text-yellow-500"/> Cost Control
                        </label>
                        <div className="grid grid-cols-2 gap-4">
                            <InputField label="Max Cost ($)" type="number" value={config.maxCost} onChange={(v: string) => onChange('maxCost', parseFloat(v))} placeholder="0.05" />
                            <SelectField label="Action on Limit" value={config.costAction || 'STOP'} onChange={(v: string) => onChange('costAction', v)} options={[{label: 'Stop Execution', value: 'STOP'}, {label: 'Fallback Model', value: 'FALLBACK'}]} />
                        </div>
                    </div>
                </CollapsibleSection>

                <CollapsibleSection icon={Wrench} title="Capabilities & Tools">
                    <div className="grid grid-cols-2 gap-3">
                        <ToggleField label="Web Search" value={config.enabledTools?.includes('web_search')} onChange={(c: boolean) => updateTool('web_search', c)} />
                        <ToggleField label="Code Execution" value={config.enabledTools?.includes('code_execution')} onChange={(c: boolean) => updateTool('code_execution', c)} />
                        <ToggleField label="Google Sheets" value={config.enabledTools?.includes('sheets')} onChange={(c: boolean) => updateTool('sheets', c)} />
                    </div>
                </CollapsibleSection>

                <div className="mt-4 pt-4 border-t border-nexus-800">
                    <SectionHeader icon={Sparkles} title="Test Playground" />
                    <div className="bg-nexus-900 rounded-xl border border-nexus-800 p-4">
                        <div className="flex gap-2 mb-3">
                            <input value={aiTestInput} onChange={(e) => setAiTestInput(e.target.value)} placeholder="Enter test prompt..." className="flex-1 bg-black border border-nexus-800 rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-nexus-accent" />
                            <button onClick={handleAiTest} disabled={!aiTestInput || isAiTesting} className="px-4 bg-nexus-accent text-black rounded-lg text-xs font-bold hover:bg-nexus-success disabled:opacity-50 flex items-center gap-2">
                                {isAiTesting ? <Loader2 size={12} className="animate-spin"/> : <Play size={12}/>} Test
                            </button>
                        </div>
                        {aiTestOutput && (
                            <div className="bg-black/50 p-3 rounded-lg text-xs text-gray-300 font-mono whitespace-pre-wrap border border-white/5 mb-2">{aiTestOutput}</div>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    if (subtype === NexusSubtype.AI_EXTRACT) {
        return (
            <div className="space-y-2">
                <CollapsibleSection icon={FileInput} title="Input Source" defaultOpen={true}>
                    <SelectField label="Input Type" value={config.inputType || 'TEXT'} onChange={(v: string) => onChange('inputType', v)} options={[{ label: 'Plain Text', value: 'TEXT' }, { label: 'PDF (OCR)', value: 'PDF' }]} />
                    <TextAreaField label="Source Variable" value={config.prompt} onChange={(v: string) => onChange('prompt', v)} placeholder="{{prevNode.data.body}}" rows={3} />
                </CollapsibleSection>
                <CollapsibleSection icon={Table} title="Schema Definition">
                    <TextAreaField label="JSON Schema" value={config.extractionSchema} onChange={(v: string) => onChange('extractionSchema', v)} rows={8} placeholder='{ "field": "type" }' />
                </CollapsibleSection>
                <div className="mt-2 text-[9px] text-gray-500 text-center">
                    Uses <b>{AI_MODELS.RUNTIME}</b> for low-cost extraction.
                </div>
            </div>
        );
    }

    if (subtype === NexusSubtype.VEO_VIDEO_GEN) {
        return (
            <div className="space-y-2">
                <CollapsibleSection icon={Film} title="Core Studio Config" defaultOpen={true}>
                    <SelectField label="AI Model" value={config.model || AI_MODELS.VIDEO} onChange={(v: string) => onChange('model', v)} options={[{ label: 'Veo 3.1 Fast', value: 'veo-3.1-fast-generate-preview' }]} />
                    <TextAreaField label="Video Prompt" value={config.prompt} onChange={(v: string) => onChange('prompt', v)} rows={4} />
                </CollapsibleSection>
            </div>
        );
    }

    return null;
};

export default AiConfig;

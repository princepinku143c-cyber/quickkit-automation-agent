
import React, { useState } from 'react';
import { ChevronDown, ChevronRight, Plus, Trash2, List, Settings } from 'lucide-react';

export const CollapsibleSection = ({ icon: Icon, title, badge, children, defaultOpen = false }: any) => {
    const [isOpen, setIsOpen] = useState(defaultOpen);

    return (
        <div className="border border-white/5 bg-white/[0.02] rounded-xl overflow-hidden mb-2 transition-all">
            <button 
                onClick={() => setIsOpen(!isOpen)}
                className={`w-full flex items-center gap-2 p-3 text-left transition-colors ${isOpen ? 'bg-white/5' : 'hover:bg-white/[0.04]'}`}
            >
                {Icon && <Icon size={14} className={isOpen ? 'text-nexus-accent' : 'text-gray-600'} />}
                <span className={`text-[10px] font-black uppercase tracking-[0.1em] flex-1 ${isOpen ? 'text-white' : 'text-gray-500'}`}>{title}</span>
                {badge && <span className="text-[8px] bg-nexus-accent/10 text-nexus-accent px-1.5 py-0.5 rounded font-black">{badge}</span>}
                {isOpen ? <ChevronDown size={12} className="text-gray-700"/> : <ChevronRight size={12} className="text-gray-700"/>}
            </button>
            {isOpen && <div className="p-3 border-t border-white/5 space-y-3 animate-in slide-in-from-top-1">{children}</div>}
        </div>
    );
};

export const InputField = ({ label, value, onChange, placeholder, type = 'text', className = '' }: any) => (
    <div className={`space-y-1 ${className}`}>
        <label className="block text-[8px] font-black text-gray-600 uppercase tracking-widest ml-1">{label}</label>
        <input 
            type={type} value={value || ''} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
            className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:border-nexus-accent outline-none font-mono transition-all" 
        />
    </div>
);

// Fix: Added missing TextAreaField component
export const TextAreaField = ({ label, value, onChange, placeholder, rows = 4, hint }: any) => (
    <div className="space-y-1">
        <label className="block text-[8px] font-black text-gray-600 uppercase tracking-widest ml-1">{label}</label>
        <textarea 
            value={value || ''} 
            onChange={(e) => onChange(e.target.value)} 
            placeholder={placeholder}
            rows={rows}
            className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:border-nexus-accent outline-none font-mono transition-all resize-none custom-scrollbar" 
        />
        {hint && <p className="text-[9px] text-gray-500 mt-1">{hint}</p>}
    </div>
);

export const SelectField = ({ label, value, onChange, options = [] }: any) => (
    <div className="space-y-1">
        <label className="block text-[8px] font-black text-gray-600 uppercase tracking-widest ml-1">{label}</label>
        <div className="relative">
            <select 
                value={value} onChange={(e) => onChange(e.target.value)} 
                className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:border-nexus-accent outline-none appearance-none cursor-pointer"
            >
                {options.map((opt: any) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
            </select>
            <ChevronDown size={12} className="absolute right-3 top-2.5 text-gray-600 pointer-events-none"/>
        </div>
    </div>
);

export const ToggleField = ({ label, value, onChange, description }: any) => (
    <div className="flex items-center justify-between p-2.5 bg-black/20 border border-white/5 rounded-xl hover:bg-black/40 transition-all cursor-pointer group" onClick={() => onChange(!value)}>
        <div className="flex-1">
            <div className="text-[10px] font-bold text-gray-400 group-hover:text-white transition-colors">{label}</div>
            {description && <div className="text-[8px] text-gray-600 tracking-tight">{description}</div>}
        </div>
        <div className={`w-7 h-4 rounded-full relative transition-colors ${value ? 'bg-nexus-accent' : 'bg-gray-800'}`}>
            <div className={`absolute top-0.5 w-3 h-3 bg-black rounded-full transition-transform ${value ? 'left-3.5' : 'left-0.5'}`} />
        </div>
    </div>
);

// Fix: Added missing SliderField component
export const SliderField = ({ label, value, onChange, min = 0, max = 100, step = 1, unit = '' }: any) => (
    <div className="space-y-1">
        <div className="flex justify-between items-center mb-1">
            <label className="block text-[8px] font-black text-gray-600 uppercase tracking-widest ml-1">{label}</label>
            <span className="text-[10px] font-mono text-nexus-accent">{value}{unit}</span>
        </div>
        <input 
            type="range" 
            min={min} 
            max={max} 
            step={step} 
            value={value} 
            onChange={(e) => onChange(parseFloat(e.target.value))}
            className="w-full h-1 bg-nexus-800 rounded-lg appearance-none cursor-pointer accent-nexus-accent"
        />
    </div>
);

export const SectionHeader = ({ icon: Icon, title }: any) => (
    <div className="flex items-center gap-2 mb-4 pb-2 border-b border-white/5">
        <Icon size={14} className="text-nexus-accent" />
        <h3 className="text-[10px] font-black text-white uppercase tracking-[0.2em]">{title}</h3>
    </div>
);

export const KeyValueList = ({ items, onChange, title }: any) => {
    const safeItems = Array.isArray(items) ? items : [];
    return (
        <div className="space-y-2">
            <div className="flex justify-between items-center mb-1">
                <label className="text-[8px] font-black text-gray-600 uppercase tracking-widest">{title}</label>
                <button onClick={() => onChange([...safeItems, { key: '', value: '' }])} className="text-[8px] text-nexus-accent font-black uppercase hover:text-white">+ Add</button>
            </div>
            {safeItems.map((item: any, idx: number) => (
                <div key={idx} className="flex gap-1 animate-in slide-in-from-left-1">
                    <input value={item.key} onChange={(e) => { const n = [...safeItems]; n[idx].key = e.target.value; onChange(n); }} placeholder="Key" className="w-1/3 bg-black/50 border border-white/5 rounded px-2 py-1 text-[10px] text-nexus-wire font-mono" />
                    <input value={item.value} onChange={(e) => { const n = [...safeItems]; n[idx].value = e.target.value; onChange(n); }} placeholder="Value" className="flex-1 bg-black/50 border border-white/5 rounded px-2 py-1 text-[10px] text-white font-mono" />
                    <button onClick={() => onChange(safeItems.filter((_, i) => i !== idx))} className="text-gray-600 hover:text-red-500"><Trash2 size={10}/></button>
                </div>
            ))}
        </div>
    );
};

// Fix: Added missing RuleList component
export const RuleList = ({ title, rules = [], onChange }: any) => {
    const addRule = () => onChange([...(Array.isArray(rules) ? rules : []), { field: '', operator: 'EQUALS', value: '' }]);
    const removeRule = (idx: number) => onChange(rules.filter((_: any, i: number) => i !== idx));
    const updateRule = (idx: number, key: string, val: string) => {
        const newRules = [...rules];
        newRules[idx][key] = val;
        onChange(newRules);
    };

    const safeRules = Array.isArray(rules) ? rules : [];

    return (
        <div className="space-y-2">
            <div className="flex justify-between items-center mb-1">
                <label className="text-[8px] font-black text-gray-600 uppercase tracking-widest">{title || 'Rules'}</label>
                <button onClick={addRule} className="text-[8px] text-nexus-accent font-black uppercase hover:text-white">+ Add Rule</button>
            </div>
            {safeRules.map((rule: any, idx: number) => (
                <div key={idx} className="flex gap-1 items-center bg-black/20 p-2 rounded-lg border border-white/5 animate-in slide-in-from-left-1">
                    <input value={rule.field} onChange={(e) => updateRule(idx, 'field', e.target.value)} placeholder="Field" className="w-1/3 bg-black/50 border border-white/5 rounded px-2 py-1 text-[10px] text-nexus-wire font-mono" />
                    <select 
                        value={rule.operator} 
                        onChange={(e) => updateRule(idx, 'operator', e.target.value)}
                        className="w-20 bg-black/50 border border-white/5 rounded px-1 py-1 text-[9px] text-nexus-accent outline-none"
                    >
                        <option value="EQUALS">==</option>
                        <option value="NOT_EQUALS">!=</option>
                        <option value="CONTAINS">Contains</option>
                        <option value="GT">&gt;</option>
                        <option value="LT">&lt;</option>
                    </select>
                    <input value={rule.value} onChange={(e) => updateRule(idx, 'value', e.target.value)} placeholder="Value" className="flex-1 bg-black/50 border border-white/5 rounded px-2 py-1 text-[10px] text-white font-mono" />
                    <button onClick={() => removeRule(idx)} className="text-gray-600 hover:text-red-500"><Trash2 size={10}/></button>
                </div>
            ))}
        </div>
    );
};

// Fix: Added missing FormBuilder component
export const FormBuilder = ({ fields = [], onChange }: any) => {
    const addField = () => onChange([...(Array.isArray(fields) ? fields : []), { label: '', type: 'text', placeholder: '' }]);
    const removeField = (idx: number) => onChange(fields.filter((_: any, i: number) => i !== idx));
    const updateField = (idx: number, key: string, val: string) => {
        const newFields = [...fields];
        newFields[idx][key] = val;
        onChange(newFields);
    };

    const safeFields = Array.isArray(fields) ? fields : [];

    return (
        <div className="space-y-3">
            <div className="flex justify-between items-center">
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Form Fields</label>
                <button onClick={addField} className="text-[10px] text-nexus-accent font-black uppercase hover:text-white flex items-center gap-1">
                    <Plus size={12}/> Add Field
                </button>
            </div>
            {safeFields.map((field: any, idx: number) => (
                <div key={idx} className="bg-black/30 border border-white/5 rounded-xl p-3 space-y-2 relative group">
                    <button onClick={() => removeField(idx)} className="absolute top-2 right-2 text-gray-600 hover:text-red-500">
                        <Trash2 size={12}/>
                    </button>
                    <div className="grid grid-cols-2 gap-2">
                        <InputField label="Label" value={field.label} onChange={(v: string) => updateField(idx, 'label', v)} placeholder="Full Name" />
                        <SelectField 
                            label="Type" 
                            value={field.type} 
                            onChange={(v: string) => updateField(idx, 'type', v)} 
                            options={[
                                {label: 'Text', value: 'text'},
                                {label: 'Number', value: 'number'},
                                {label: 'Email', value: 'email'},
                                {label: 'Password', value: 'password'},
                                {label: 'Textarea', value: 'textarea'}
                            ]} 
                        />
                    </div>
                    <InputField label="Placeholder" value={field.placeholder} onChange={(v: string) => updateField(idx, 'placeholder', v)} placeholder="Enter your name..." />
                </div>
            ))}
        </div>
    );
};

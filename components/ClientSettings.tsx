
import React, { useState, useEffect } from 'react';
import { Project, DynamicField } from '../types';
import { Save, Lock, Globe, Key, Check, AlertCircle, Eye, EyeOff } from 'lucide-react';

interface ClientSettingsProps {
    project: Project;
    onSave: (variables: Record<string, any>) => void;
}

const ClientSettings: React.FC<ClientSettingsProps> = ({ project, onSave }) => {
    const [values, setValues] = useState<Record<string, any>>({});
    const [saved, setSaved] = useState(false);
    const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});

    useEffect(() => {
        if (project.settings?.clientVariables) setValues(project.settings.clientVariables);
    }, [project]);

    const handleChange = (key: string, val: any) => {
        setValues(prev => ({ ...prev, [key]: val }));
        setSaved(false);
    };

    const handleSave = () => {
        onSave(values);
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
    };

    const toggleKey = (key: string) => setShowKeys(prev => ({ ...prev, [key]: !prev[key] }));

    const schema = project.inputSchema || [];
    if (schema.length === 0) return (
        <div className="text-center py-16 bg-white/5 rounded-[32px] border-2 border-dashed border-white/5">
            <Globe size={32} className="mx-auto mb-3 text-gray-800"/>
            <p className="text-sm font-bold text-gray-500 uppercase tracking-widest">Security Vault Empty</p>
            <p className="text-[10px] text-gray-700 mt-2">This stack does not require external sensitive variables.</p>
        </div>
    );

    return (
        <div className="space-y-6">
            <div className="bg-[#0a0a0a] rounded-[32px] border border-white/5 overflow-hidden">
                <div className="p-8 space-y-8">
                    {schema.map((field: DynamicField, idx) => {
                        const val = values[field.key] ?? field.defaultValue;
                        const isSecret = field.key.toLowerCase().includes('key') || 
                                        field.key.toLowerCase().includes('token') || 
                                        field.key.toLowerCase().includes('secret');
                        
                        return (
                            <div key={idx} className="space-y-3">
                                <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">{field.label}</label>
                                <div className="relative">
                                    <input 
                                        type={isSecret && !showKeys[field.key] ? 'password' : 'text'}
                                        value={val || ''} 
                                        onChange={(e) => handleChange(field.key, e.target.value)}
                                        className="w-full bg-black border border-white/5 rounded-2xl p-5 text-sm text-white focus:border-blue-500 outline-none font-mono transition-all"
                                        placeholder={isSecret ? "••••••••••••••••" : field.placeholder}
                                    />
                                    {isSecret && (
                                        <button onClick={() => toggleKey(field.key)} className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-600 hover:text-white transition-colors">
                                            {showKeys[field.key] ? <EyeOff size={18}/> : <Eye size={18}/>}
                                        </button>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>

                <div className="p-6 bg-white/5 border-t border-white/5 flex justify-end">
                    <button onClick={handleSave} className={`px-10 py-4 rounded-2xl text-[11px] font-black uppercase flex items-center gap-3 transition-all ${saved ? 'bg-green-600 text-white' : 'bg-white text-black hover:bg-gray-200 shadow-xl'}`}>
                        {saved ? <Check size={16}/> : <Save size={16}/>} {saved ? 'Encrypted & Saved' : 'Update Security Vault'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ClientSettings;

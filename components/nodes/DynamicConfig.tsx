
import React from 'react';
import { Sparkles, Edit, Globe, Activity } from 'lucide-react';
import { SectionHeader, InputField, SelectField, ToggleField, TextAreaField } from '../ConfigInputs';
import { DynamicField } from '../../types';

interface DynamicConfigProps {
    schema: DynamicField[];
    config: any;
    onChange: (key: string, value: any) => void;
}

const DynamicConfig: React.FC<DynamicConfigProps> = ({ schema, config, onChange }) => {
    
    if (!schema || schema.length === 0) return null;

    return (
        <div className="space-y-5 animate-in slide-in-from-right duration-300">
            {/* Status Banner for AI Nodes */}
            <div className="bg-gradient-to-r from-nexus-accent/10 to-transparent border-l-2 border-nexus-accent p-3 mb-4 rounded-r-lg">
                <div className="flex items-center gap-2 mb-1">
                    <Sparkles size={14} className="text-nexus-accent" />
                    <span className="text-xs font-bold text-white uppercase tracking-wide">AI-Generated Node</span>
                </div>
                <p className="text-[10px] text-gray-400">
                    This node was custom-built by the Architect. It includes both a custom UI and execution logic.
                </p>
                {config.apiUrl && (
                    <div className="flex items-center gap-1.5 mt-2 text-[9px] font-mono text-gray-500 bg-black/20 p-1.5 rounded w-fit">
                        <Globe size={10} /> 
                        <span className="uppercase font-bold text-nexus-wire">{config.apiMethod || 'POST'}</span> 
                        <span className="truncate max-w-[200px]">{config.apiUrl}</span>
                    </div>
                )}
            </div>

            <SectionHeader 
                icon={Activity} 
                title="Input Parameters" 
            />
            
            {schema.map((field, idx) => {
                const value = config[field.key] !== undefined ? config[field.key] : field.defaultValue;

                switch (field.type) {
                    case 'text':
                    case 'number':
                        return (
                            <InputField 
                                key={idx}
                                label={field.label}
                                type={field.type}
                                value={value}
                                onChange={(v: string) => onChange(field.key, field.type === 'number' ? parseFloat(v) : v)}
                                placeholder={field.placeholder}
                                hint={field.hint}
                            />
                        );
                    case 'textarea':
                    case 'json':
                        return (
                            <TextAreaField 
                                key={idx}
                                label={field.label}
                                value={value}
                                onChange={(v: string) => onChange(field.key, v)}
                                placeholder={field.placeholder}
                                rows={field.type === 'json' ? 6 : 3}
                            />
                        );
                    case 'select':
                        return (
                            <SelectField 
                                key={idx}
                                label={field.label}
                                value={value}
                                onChange={(v: string) => onChange(field.key, v)}
                                options={field.options || []}
                            />
                        );
                    case 'toggle':
                        return (
                            <ToggleField 
                                key={idx}
                                label={field.label}
                                value={!!value}
                                onChange={(v: boolean) => onChange(field.key, v)}
                                description={field.hint}
                            />
                        );
                    default:
                        return null;
                }
            })}
            
            <div className="p-3 bg-nexus-900/30 border border-nexus-800 border-dashed rounded text-[10px] text-gray-500 text-center">
                <Edit size={10} className="inline mr-1"/>
                Values entered here will be sent to the API during execution.
            </div>
        </div>
    );
};

export default DynamicConfig;

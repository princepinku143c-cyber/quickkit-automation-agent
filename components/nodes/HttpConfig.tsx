
import React, { useState } from 'react';
import { NexusSubtype } from '../../types';
import { Globe, Zap, Radar, Lock, Copy, Settings, Shield, Activity, FormInput, AlertTriangle, CloudLightning, MousePointerClick, Filter, ArrowRightLeft, Database, Key } from 'lucide-react';
import { SectionHeader, SelectField, InputField, ToggleField, TextAreaField, KeyValueList, FormBuilder, CollapsibleSection, SliderField } from '../ConfigInputs';

interface HttpConfigProps {
    subtype: NexusSubtype;
    config: any;
    nexusId: string;
    onChange: (key: string, value: any) => void;
    projectId?: string;
}

const HttpConfig: React.FC<HttpConfigProps> = ({ subtype, config, nexusId, onChange, projectId }) => {
    
    // --- 1. WEBHOOK CONFIGURATION ---
    if (subtype === NexusSubtype.WEBHOOK) {
        const baseUrl = typeof window !== 'undefined' ? window.location.href.split('?')[0] : 'https://nexus.ai';
        const cleanBase = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
        const testUrl = `${cleanBase}/hooks/${nexusId}/test`;
        const prodUrl = `${cleanBase}/hooks/${nexusId}`;

        return (
            <div className="space-y-2">
                {/* --- BASIC SETTINGS --- */}
                <CollapsibleSection icon={Zap} title="Basic Settings" defaultOpen={true}>
                    <div className="grid grid-cols-3 gap-2 mb-2">
                        <div className="col-span-1">
                            <SelectField 
                                label="Method" 
                                value={config.webhookMethod || 'POST'} 
                                onChange={(v: string) => onChange('webhookMethod', v)} 
                                options={[{label: 'POST', value: 'POST'}, {label: 'GET', value: 'GET'}, {label: 'PUT', value: 'PUT'}, {label: 'PATCH', value: 'PATCH'}, {label: 'DELETE', value: 'DELETE'}]} 
                            />
                        </div>
                        <div className="col-span-2">
                            <SelectField 
                                label="Response Mode" 
                                value={config.webhookResponseMode || 'IMMEDIATE'} 
                                onChange={(v: string) => onChange('webhookResponseMode', v)} 
                                options={[
                                    {label: 'Immediate (200 OK)', value: 'IMMEDIATE'}, 
                                    {label: 'Wait for Completion', value: 'WAIT_FOR_COMPLETION'},
                                    {label: 'Custom Response', value: 'CUSTOM'}
                                ]} 
                            />
                        </div>
                    </div>
                    
                    <div className="bg-nexus-900 border border-nexus-800 rounded-lg p-3">
                        <label className="text-[10px] font-bold text-gray-500 uppercase flex justify-between mb-1">
                            Webhook URL
                            <div className="flex gap-2">
                                <span className="text-nexus-wire text-[9px] bg-nexus-900 px-1 rounded border border-nexus-800">TEST</span>
                                <span className="text-nexus-success text-[9px] bg-nexus-900 px-1 rounded border border-nexus-800">PROD</span>
                            </div>
                        </label>
                        <div className="flex gap-2">
                            <input readOnly value={testUrl} className="flex-1 bg-black border border-nexus-800 rounded px-2 py-1.5 text-[10px] text-gray-300 font-mono truncate" />
                            <button onClick={() => navigator.clipboard.writeText(testUrl)} className="p-1.5 bg-nexus-800 rounded text-gray-400 hover:text-white border border-nexus-700"><Copy size={12}/></button>
                        </div>
                    </div>
                </CollapsibleSection>

                {/* --- ENTERPRISE SECURITY --- */}
                <CollapsibleSection icon={Shield} title="Enterprise Security" badge="Critical">
                    <SelectField 
                        label="Authentication Mode" 
                        value={config.authType || 'NONE'} 
                        onChange={(v: string) => onChange('authType', v)} 
                        options={[
                            {label: 'Public (None)', value: 'NONE'}, 
                            {label: 'Bearer Token', value: 'BEARER'}, 
                            {label: 'Basic Auth', value: 'BASIC'}, 
                            {label: 'Header Secret', value: 'HEADER'},
                            {label: 'HMAC Signature', value: 'HMAC'}
                        ]} 
                    />
                    
                    {config.authType === 'HMAC' && (
                        <div className="animate-in slide-in-from-top-2 mt-3 space-y-3 bg-nexus-900/30 p-3 rounded border border-nexus-800/50">
                            <div className="flex items-center gap-2 text-nexus-accent text-[10px] font-bold mb-1">
                                <Key size={12}/> Signature Verification
                            </div>
                            <InputField label="Header Name" value={config.signatureHeader} onChange={(v: string) => onChange('signatureHeader', v)} placeholder="X-Hub-Signature-256" />
                            <InputField label="Secret Key" type="password" value={config.webhookAuthSecret} onChange={(v: string) => onChange('webhookAuthSecret', v)} />
                            <SelectField label="Algorithm" value={config.algo || 'sha256'} onChange={(v: string) => onChange('algo', v)} options={[{label: 'SHA-256', value: 'sha256'}, {label: 'SHA-1', value: 'sha1'}]} />
                        </div>
                    )}

                    {config.authType !== 'NONE' && config.authType !== 'HMAC' && (
                        <div className="animate-in slide-in-from-top-2 mt-3">
                            <InputField 
                                label="Secret / Token" 
                                type="password" 
                                value={config.webhookAuthSecret} 
                                onChange={(v: string) => onChange('webhookAuthSecret', v)} 
                                placeholder="Enter secret key..." 
                            />
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-4 mt-3">
                        <InputField 
                            label="IP Whitelist" 
                            value={config.ipWhitelist} 
                            onChange={(v: string) => onChange('ipWhitelist', v)} 
                            placeholder="192.168.1.1" 
                            hint="Comma separated allowed IPs"
                        />
                        <SelectField 
                            label="CORS Policy" 
                            value={config.corsPolicy || 'ALLOW_ALL'} 
                            onChange={(v: string) => onChange('corsPolicy', v)} 
                            options={[{label: 'Allow All (*)', value: 'ALLOW_ALL'}, {label: 'Restrict Origin', value: 'RESTRICT'}]} 
                        />
                    </div>
                </CollapsibleSection>

                {/* --- RELIABILITY & DEDUPLICATION --- */}
                <CollapsibleSection icon={CloudLightning} title="Reliability & Deduplication">
                    <div className="grid grid-cols-2 gap-4 mb-3">
                        <ToggleField label="Rate Limiting" value={config.enableRateLimit} onChange={(v: boolean) => onChange('enableRateLimit', v)} />
                        <ToggleField label="Deduplication" value={config.enableIdempotency} onChange={(v: boolean) => onChange('enableIdempotency', v)} description="Drop duplicate events." />
                    </div>

                    {config.enableRateLimit && (
                        <div className="grid grid-cols-2 gap-2 mt-2 bg-nexus-900/30 p-2 rounded border border-nexus-800">
                            <InputField label="Max Requests" type="number" value={config.rateLimitMax} onChange={(v: string) => onChange('rateLimitMax', parseInt(v))} placeholder="100" />
                            <InputField label="Window (Sec)" type="number" value={config.rateLimitWindow} onChange={(v: string) => onChange('rateLimitWindow', parseInt(v))} placeholder="60" />
                        </div>
                    )}

                    {config.enableIdempotency && (
                        <div className="mt-2 bg-nexus-900/30 p-2 rounded border border-nexus-800 space-y-2">
                            <InputField label="Dedupe Key (JSON Path)" value={config.dedupeKey} onChange={(v: string) => onChange('dedupeKey', v)} placeholder="body.transaction_id" />
                            <InputField label="Window (Seconds)" type="number" value={config.dedupeWindow} onChange={(v: string) => onChange('dedupeWindow', parseInt(v))} placeholder="3600" />
                        </div>
                    )}
                </CollapsibleSection>

                {/* --- ADVANCED REQUEST SETTINGS --- */}
                <CollapsibleSection icon={Settings} title="Request Parsing">
                    <div className="grid grid-cols-2 gap-4">
                        <SelectField 
                            label="Max Body Size" 
                            value={config.maxRequestSize || '1MB'} 
                            onChange={(v: string) => onChange('maxRequestSize', v)} 
                            options={[{label: '1 MB', value: '1MB'}, {label: '10 MB', value: '10MB'}, {label: '50 MB', value: '50MB'}]} 
                        />
                        <SelectField 
                            label="Content-Type" 
                            value={config.allowedContentType || 'ANY'} 
                            onChange={(v: string) => onChange('allowedContentType', v)} 
                            options={[{label: 'Any', value: 'ANY'}, {label: 'application/json', value: 'JSON'}, {label: 'multipart/form-data', value: 'FORM'}]} 
                        />
                    </div>
                    <div className="mt-3">
                        <TextAreaField 
                            label="JSON Schema Validation" 
                            value={config.validationSchema} 
                            onChange={(v: string) => onChange('validationSchema', v)} 
                            placeholder='{ "type": "object", "required": ["email"] }' 
                            rows={3} 
                        />
                    </div>
                </CollapsibleSection>

                {/* --- PUBLIC FORM BUILDER --- */}
                <CollapsibleSection icon={FormInput} title="Public Form" badge="No-Code">
                    <ToggleField label="Enable Public Form" value={config.enableForm} onChange={(v: boolean) => onChange('enableForm', v)} />
                    {config.enableForm && (
                        <div className="space-y-4 pt-2 animate-in slide-in-from-top-2">
                            <InputField label="Form Title" value={config.formTitle} onChange={(v: string) => onChange('formTitle', v)} placeholder="Contact Us" />
                            <TextAreaField label="Description" value={config.formDescription} onChange={(v: string) => onChange('formDescription', v)} rows={2} />
                            <FormBuilder fields={config.formFields || []} onChange={(f: any[]) => onChange('formFields', f)} />
                            <div className="grid grid-cols-2 gap-4">
                                <InputField label="Success Message" value={config.successMessage} onChange={(v: string) => onChange('successMessage', v)} placeholder="Thanks!" />
                                <InputField label="Button Text" value={config.buttonText} onChange={(v: string) => onChange('buttonText', v)} placeholder="Submit" />
                            </div>
                        </div>
                    )}
                </CollapsibleSection>
            </div>
        );
    }

    // --- 2. UNIVERSAL POLLER CONFIGURATION ---
    if (subtype === NexusSubtype.API_POLLER) {
        return (
            <div className="space-y-2">
                {/* --- POLLING BASICS --- */}
                <CollapsibleSection icon={Zap} title="Polling Target" defaultOpen={true}>
                    <div className="flex gap-2 mb-3">
                        <div className="w-1/3">
                            <SelectField label="Method" value={config.method || 'GET'} onChange={(v: string) => onChange('method', v)} options={[{ label: 'GET', value: 'GET' }, { label: 'POST', value: 'POST' }]} />
                        </div>
                        <div className="flex-1">
                            <InputField label="URL" value={config.url} onChange={(v: string) => onChange('url', v)} placeholder="https://api.example.com/events" />
                        </div>
                    </div>
                    <SliderField label="Interval" value={config.pollingInterval || 60} onChange={(v: number) => onChange('pollingInterval', v)} min={5} max={3600} step={5} unit="s" />
                </CollapsibleSection>

                {/* --- DATA EXTRACTION & FORMATTING --- */}
                <CollapsibleSection icon={ArrowRightLeft} title="Data Extraction">
                    <div className="grid grid-cols-2 gap-4 mb-3">
                        <SelectField 
                            label="Response Format" 
                            value={config.responseFormat || 'JSON'} 
                            onChange={(v: string) => onChange('responseFormat', v)} 
                            options={[{label: 'JSON', value: 'JSON'}, {label: 'XML', value: 'XML'}, {label: 'CSV', value: 'CSV'}]} 
                        />
                        <InputField label="Items Field (JSON Path)" value={config.itemsField} onChange={(v: string) => onChange('itemsField', v)} placeholder="data.results" hint="Path to array in response" />
                    </div>
                    <TextAreaField label="JSON Path Filter" value={config.filterPath} onChange={(v: string) => onChange('filterPath', v)} rows={2} placeholder="$[?(@.status == 'active')]" hint="Filter items before processing" />
                </CollapsibleSection>

                {/* --- PAGINATION & DEDUP --- */}
                <CollapsibleSection icon={Radar} title="Pagination & Deduplication">
                    <ToggleField label="Enable Deduplication" value={config.enableDedup || true} onChange={(v: boolean) => onChange('enableDedup', v)} />
                    {config.enableDedup && (
                        <InputField label="Unique Key Field" value={config.pollingDedupeKey} onChange={(v: string) => onChange('pollingDedupeKey', v)} placeholder="id" className="mt-2" />
                    )}
                    
                    <div className="mt-4 border-t border-nexus-800/50 pt-4">
                        <ToggleField label="Pagination Support" value={config.pagination} onChange={(v: boolean) => onChange('pagination', v)} />
                        {config.pagination && (
                            <div className="grid grid-cols-2 gap-4 mt-2">
                                <SelectField label="Type" value={config.paginationType || 'OFFSET'} onChange={(v: string) => onChange('paginationType', v)} options={[{label: 'Offset/Limit', value: 'OFFSET'}, {label: 'Cursor', value: 'CURSOR'}, {label: 'Link Header', value: 'LINK'}]} />
                                <InputField label="Next Page Key" value={config.nextPageKey} onChange={(v: string) => onChange('nextPageKey', v)} placeholder="next_page_token" />
                            </div>
                        )}
                    </div>
                </CollapsibleSection>

                {/* --- AUTHENTICATION --- */}
                <CollapsibleSection icon={Lock} title="Authentication">
                    <SelectField 
                        label="Auth Type" 
                        value={config.authType || 'NONE'} 
                        onChange={(v: string) => onChange('authType', v)} 
                        options={[{label: 'None', value: 'NONE'}, {label: 'Bearer Token', value: 'BEARER'}, {label: 'Header API Key', value: 'HEADER'}, {label: 'Basic Auth', value: 'BASIC'}]} 
                    />
                    {config.authType !== 'NONE' && (
                        <div className="mt-2 space-y-2">
                            {config.authType === 'BASIC' ? (
                                <div className="grid grid-cols-2 gap-2">
                                    <InputField label="Username" value={config.authUser} onChange={(v: string) => onChange('authUser', v)} />
                                    <InputField label="Password" type="password" value={config.authPass} onChange={(v: string) => onChange('authPass', v)} />
                                </div>
                            ) : (
                                <>
                                    <InputField label="Token / Key" type="password" value={config.authToken} onChange={(v: string) => onChange('authToken', v)} />
                                    {config.authType === 'HEADER' && <InputField label="Header Name" value={config.headerName} onChange={(v: string) => onChange('headerName', v)} placeholder="X-API-KEY" />}
                                </>
                            )}
                        </div>
                    )}
                </CollapsibleSection>
            </div>
        );
    }

    // --- GENERIC HTTP ---
    if (subtype === NexusSubtype.HTTP_REQUEST) {
        return (
            <div className="space-y-2">
                <CollapsibleSection icon={Globe} title="Request Details" defaultOpen={true}>
                    <div className="flex gap-2 mb-2">
                        <div className="w-1/3">
                            <SelectField label="Method" value={config.method || 'GET'} onChange={(v: string) => onChange('method', v)} options={[{ label: 'GET', value: 'GET' }, { label: 'POST', value: 'POST' }, { label: 'PUT', value: 'PUT' }, { label: 'DELETE', value: 'DELETE' }]} />
                        </div>
                        <div className="flex-1">
                            <InputField label="URL" value={config.url} onChange={(v: string) => onChange('url', v)} placeholder="https://api.example.com" />
                        </div>
                    </div>
                    <KeyValueList title="Params" items={config.queryParams || []} onChange={(items: any[]) => onChange('queryParams', items)} />
                </CollapsibleSection>

                <CollapsibleSection icon={Lock} title="Authentication">
                     <SelectField 
                        label="Type" 
                        value={config.authType || 'NONE'} 
                        onChange={(v: string) => onChange('authType', v)} 
                        options={[{label: 'None', value: 'NONE'}, {label: 'Bearer', value: 'BEARER'}, {label: 'Basic', value: 'BASIC'}, {label: 'Credential', value: 'CREDENTIAL'}]} 
                    />
                    {config.authType === 'BEARER' && <InputField label="Token" type="password" value={config.authToken} onChange={(v: string) => onChange('authToken', v)} />}
                    {config.authType === 'BASIC' && (
                        <div className="grid grid-cols-2 gap-2 mt-2">
                            <InputField label="User" value={config.authUser} onChange={(v: string) => onChange('authUser', v)} />
                            <InputField label="Pass" type="password" value={config.authPass} onChange={(v: string) => onChange('authPass', v)} />
                        </div>
                    )}
                </CollapsibleSection>

                <CollapsibleSection icon={MousePointerClick} title="Headers & Body">
                    <KeyValueList title="Headers" items={config.headers || []} onChange={(items: any[]) => onChange('headers', items)} />
                    <div className="mt-4">
                        <SelectField label="Body Type" value={config.bodyType || 'JSON'} onChange={(v: string) => onChange('bodyType', v)} options={[{label: 'JSON', value: 'JSON'}, {label: 'Form Data', value: 'FORM'}, {label: 'Raw', value: 'RAW'}]} />
                        {config.bodyType === 'JSON' ? (
                            <TextAreaField label="JSON Body" value={config.body} onChange={(v: string) => onChange('body', v)} rows={5} placeholder='{"key": "value"}' />
                        ) : config.bodyType === 'FORM' ? (
                            <KeyValueList title="Form Fields" items={config.formBody || []} onChange={(items: any[]) => onChange('formBody', items)} />
                        ) : (
                            <TextAreaField label="Raw Body" value={config.body} onChange={(v: string) => onChange('body', v)} rows={5} />
                        )}
                    </div>
                </CollapsibleSection>
            </div>
        );
    }

    return null;
};

export default HttpConfig;

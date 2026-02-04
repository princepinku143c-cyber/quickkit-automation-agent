
import React, { useState } from 'react';
import { NexusSubtype, ChannelStatus } from '../../types';
import { CHANNEL_STATUS_TEXT } from '../../constants';
import { MessageSquare, AlertOctagon, Settings, Shield, Activity, RefreshCw, Zap, CheckCircle, AlertTriangle } from 'lucide-react';
import { SectionHeader, SelectField, InputField, ToggleField, TextAreaField, CollapsibleSection, SliderField } from '../ConfigInputs';

interface TriggerConfigProps {
    subtype: NexusSubtype;
    config: any;
    onChange: (key: string, value: any) => void;
}

const TriggerConfig: React.FC<TriggerConfigProps> = ({ subtype, config, onChange }) => {
    const [isVerifying, setIsVerifying] = useState(false);

    const connectionStatus: ChannelStatus = config._connectionStatus || 'not_connected';

    const getStatusColor = (s: ChannelStatus) => {
        switch(s) {
            case 'connected_messaging': return 'text-nexus-success bg-nexus-success/10 border-nexus-success/20';
            case 'connected_design_only': return 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20';
            case 'error': return 'text-red-500 bg-red-500/10 border-red-500/20';
            default: return 'text-gray-500 bg-gray-500/10 border-gray-500/20';
        }
    };

    const handleInput = (key: string, val: any) => {
        onChange(key, val);
        // Reset status on config change to force re-verification
        if (connectionStatus !== 'not_connected') {
            onChange('_connectionStatus', 'connected_design_only');
        } else if (val) {
            onChange('_connectionStatus', 'connected_design_only');
        }
    };

    const handleVerify = () => {
        setIsVerifying(true);
        setTimeout(() => {
            const isSuccess = Math.random() > 0.1; // 90% success rate
            onChange('_connectionStatus', isSuccess ? 'connected_messaging' : 'error');
            setIsVerifying(false);
        }, 1500);
    };

    // --- CHAT / INTERACTIVE TRIGGER ---
    if (subtype === NexusSubtype.CHAT_TRIGGER) {
        return (
            <div className="space-y-2">
                <CollapsibleSection icon={MessageSquare} title="Channel & Connection" defaultOpen={true}>
                    {/* STATUS HEADER */}
                    <div className={`mb-4 px-3 py-2 rounded-lg border flex items-center justify-between ${getStatusColor(connectionStatus)}`}>
                        <div className="flex items-center gap-2">
                            {connectionStatus === 'connected_messaging' ? <CheckCircle size={14}/> : connectionStatus === 'error' ? <AlertTriangle size={14}/> : <Shield size={14}/>}
                            <span className="text-[10px] font-bold uppercase tracking-wide">{CHANNEL_STATUS_TEXT[connectionStatus]}</span>
                        </div>
                        {(connectionStatus === 'connected_design_only' || connectionStatus === 'error') && (
                            <button onClick={handleVerify} disabled={isVerifying} className="text-[9px] underline hover:text-white disabled:opacity-50">
                                {isVerifying ? 'Verifying...' : 'Verify'}
                            </button>
                        )}
                    </div>

                    <SelectField 
                        label="Channel Type" 
                        value={config.channelType || 'SLACK'} 
                        onChange={(v: string) => handleInput('channelType', v)} 
                        options={[
                            {label: 'Slack', value: 'SLACK'}, 
                            {label: 'Discord', value: 'DISCORD'}, 
                            {label: 'Microsoft Teams', value: 'TEAMS'}, 
                            {label: 'Custom / Web', value: 'CUSTOM'}
                        ]} 
                    />
                    
                    {config.channelType !== 'CUSTOM' && (
                        <div className="mt-3 space-y-3">
                            <InputField label="Bot Token / Webhook" type="password" value={config.token} onChange={(v: string) => handleInput('token', v)} placeholder="xoxb-..." />
                            <InputField label="Channel ID / Name" value={config.channelId} onChange={(v: string) => handleInput('channelId', v)} placeholder="#general" />
                        </div>
                    )}
                </CollapsibleSection>

                <CollapsibleSection icon={Zap} title="Trigger Conditions">
                    <div className="space-y-3">
                        <InputField label="Trigger Keywords" value={config.keywords} onChange={(v: string) => handleInput('keywords', v)} placeholder="help, support, start" hint="Comma separated. Leave empty for all messages." />
                        
                        <div className="grid grid-cols-2 gap-4">
                            <ToggleField label="On Mention Only" value={config.mentionOnly} onChange={(v: boolean) => handleInput('mentionOnly', v)} />
                            <ToggleField label="Ignore Bots" value={config.ignoreBots ?? true} onChange={(v: boolean) => handleInput('ignoreBots', v)} />
                        </div>
                        
                        <InputField label="Trigger on Reaction" value={config.reaction} onChange={(v: string) => handleInput('reaction', v)} placeholder=":rocket:" hint="Only trigger if this emoji is added." />
                    </div>
                </CollapsibleSection>

                <CollapsibleSection icon={Settings} title="Message Context & Response">
                    <div className="grid grid-cols-2 gap-4 mb-3">
                        <SelectField label="Response Type" value={config.responseType || 'THREAD'} onChange={(v: string) => handleInput('responseType', v)} options={[{label: 'Reply in Thread', value: 'THREAD'}, {label: 'New Message', value: 'CHANNEL'}, {label: 'Ephemeral (Private)', value: 'EPHEMERAL'}]} />
                        <SliderField label="Context History" value={config.historyDepth || 0} onChange={(v: number) => handleInput('historyDepth', v)} min={0} max={20} step={1} unit=" msgs" />
                    </div>
                    <ToggleField label="Show Typing Indicator" value={config.typing} onChange={(v: boolean) => handleInput('typing', v)} />
                </CollapsibleSection>
            </div>
        );
    }

    // --- ERROR HANDLER TRIGGER ---
    if (subtype === NexusSubtype.ERROR_TRIGGER) {
        return (
            <div className="space-y-2">
                <CollapsibleSection icon={AlertOctagon} title="Error Scope" defaultOpen={true}>
                    <SelectField 
                        label="Capture From" 
                        value={config.captureScope || 'ALL'} 
                        onChange={(v: string) => onChange('captureScope', v)} 
                        options={[{label: 'All Nodes', value: 'ALL'}, {label: 'Specific Nodes', value: 'SPECIFIC'}, {label: 'Critical Only', value: 'CRITICAL'}]} 
                    />
                    {config.captureScope === 'SPECIFIC' && (
                        <InputField label="Node IDs (Comma Sep)" value={config.targetNodes} onChange={(v: string) => onChange('targetNodes', v)} placeholder="node-1, node-5" />
                    )}
                    <TextAreaField label="Error Pattern (Regex)" value={config.errorPattern} onChange={(v: string) => onChange('errorPattern', v)} placeholder="timeout|503|rate limit" rows={2} />
                </CollapsibleSection>

                <CollapsibleSection icon={RefreshCw} title="Recovery Actions">
                    <ToggleField label="Auto-Retry Failed Node" value={config.autoRetry} onChange={(v: boolean) => onChange('autoRetry', v)} />
                    {config.autoRetry && (
                        <div className="grid grid-cols-2 gap-4 mt-2">
                            <InputField label="Max Retries" type="number" value={config.maxRetries || 3} onChange={(v: string) => onChange('maxRetries', parseInt(v))} />
                            <SelectField label="Backoff" value={config.backoff || 'EXP'} onChange={(v: string) => onChange('backoff', v)} options={[{label: 'Exponential', value: 'EXP'}, {label: 'Linear', value: 'LIN'}]} />
                        </div>
                    )}
                    <div className="mt-4">
                        <SelectField label="Fallback Strategy" value={config.fallback || 'STOP'} onChange={(v: string) => onChange('fallback', v)} options={[{label: 'Stop Workflow', value: 'STOP'}, {label: 'Continue Next Node', value: 'CONTINUE'}, {label: 'Run Fallback Flow', value: 'FLOW'}]} />
                    </div>
                </CollapsibleSection>

                <CollapsibleSection icon={Activity} title="Alerting">
                    <ToggleField label="Send Email Alert" value={config.alertEmail} onChange={(v: boolean) => onChange('alertEmail', v)} />
                    <ToggleField label="Send Slack Alert" value={config.alertSlack} onChange={(v: boolean) => onChange('alertSlack', v)} />
                    {config.alertSlack && (
                        <InputField label="Slack Webhook URL" value={config.slackUrl} onChange={(v: string) => onChange('slackUrl', v)} className="mt-2" />
                    )}
                </CollapsibleSection>
            </div>
        );
    }

    return null;
};

export default TriggerConfig;

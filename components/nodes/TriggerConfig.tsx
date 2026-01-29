
import React from 'react';
import { NexusSubtype } from '../../types';
import { MessageSquare, AlertOctagon, Settings, Shield, Activity, RefreshCw, Zap } from 'lucide-react';
import { SectionHeader, SelectField, InputField, ToggleField, TextAreaField, CollapsibleSection, SliderField } from '../ConfigInputs';

interface TriggerConfigProps {
    subtype: NexusSubtype;
    config: any;
    onChange: (key: string, value: any) => void;
}

const TriggerConfig: React.FC<TriggerConfigProps> = ({ subtype, config, onChange }) => {

    // --- CHAT / INTERACTIVE TRIGGER ---
    if (subtype === NexusSubtype.CHAT_TRIGGER) {
        return (
            <div className="space-y-2">
                <CollapsibleSection icon={MessageSquare} title="Channel & Connection" defaultOpen={true}>
                    <SelectField 
                        label="Channel Type" 
                        value={config.channelType || 'SLACK'} 
                        onChange={(v: string) => onChange('channelType', v)} 
                        options={[
                            {label: 'Slack', value: 'SLACK'}, 
                            {label: 'Discord', value: 'DISCORD'}, 
                            {label: 'Microsoft Teams', value: 'TEAMS'}, 
                            {label: 'Custom / Web', value: 'CUSTOM'}
                        ]} 
                    />
                    
                    {config.channelType !== 'CUSTOM' && (
                        <div className="mt-3 space-y-3">
                            <InputField label="Bot Token / Webhook" type="password" value={config.token} onChange={(v: string) => onChange('token', v)} placeholder="xoxb-..." />
                            <InputField label="Channel ID / Name" value={config.channelId} onChange={(v: string) => onChange('channelId', v)} placeholder="#general" />
                        </div>
                    )}
                </CollapsibleSection>

                <CollapsibleSection icon={Zap} title="Trigger Conditions">
                    <div className="space-y-3">
                        <InputField label="Trigger Keywords" value={config.keywords} onChange={(v: string) => onChange('keywords', v)} placeholder="help, support, start" hint="Comma separated. Leave empty for all messages." />
                        
                        <div className="grid grid-cols-2 gap-4">
                            <ToggleField label="On Mention Only" value={config.mentionOnly} onChange={(v: boolean) => onChange('mentionOnly', v)} />
                            <ToggleField label="Ignore Bots" value={config.ignoreBots ?? true} onChange={(v: boolean) => onChange('ignoreBots', v)} />
                        </div>
                        
                        <InputField label="Trigger on Reaction" value={config.reaction} onChange={(v: string) => onChange('reaction', v)} placeholder=":rocket:" hint="Only trigger if this emoji is added." />
                    </div>
                </CollapsibleSection>

                <CollapsibleSection icon={Settings} title="Message Context & Response">
                    <div className="grid grid-cols-2 gap-4 mb-3">
                        <SelectField label="Response Type" value={config.responseType || 'THREAD'} onChange={(v: string) => onChange('responseType', v)} options={[{label: 'Reply in Thread', value: 'THREAD'}, {label: 'New Message', value: 'CHANNEL'}, {label: 'Ephemeral (Private)', value: 'EPHEMERAL'}]} />
                        <SliderField label="Context History" value={config.historyDepth || 0} onChange={(v: number) => onChange('historyDepth', v)} min={0} max={20} step={1} unit=" msgs" />
                    </div>
                    <ToggleField label="Show Typing Indicator" value={config.typing} onChange={(v: boolean) => onChange('typing', v)} />
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

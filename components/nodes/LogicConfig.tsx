
import React, { useState } from 'react';
import { NexusSubtype } from '../../types';
import { Clock, PauseCircle, Split, Layers, Code, Variable, Repeat, List, Calendar, AlertTriangle, CloudLightning, Shield, X, Plus, Bell, Play, FileJson, Gauge, Disc, ArrowRightLeft, GitBranch, Terminal, Eye, Brain, Settings, Filter, Route, CheckCircle, Activity, BoxSelect } from 'lucide-react';
import { SectionHeader, SelectField, InputField, TextAreaField, ToggleField, SliderField, KeyValueList, CollapsibleSection, RuleList } from '../ConfigInputs';

interface LogicConfigProps {
    subtype: NexusSubtype;
    config: any;
    onChange: (key: string, value: any) => void;
}

const LogicConfig: React.FC<LogicConfigProps> = ({ subtype, config, onChange }) => {

    // --- CONDITION (IF/ELSE) ---
    if (subtype === NexusSubtype.CONDITION) {
        return (
            <div className="space-y-2">
                <CollapsibleSection icon={Split} title="Visual Builder" defaultOpen={true}>
                    <div className="flex gap-2 mb-3 bg-nexus-950 p-1 rounded-lg border border-nexus-800">
                        <button onClick={() => onChange('mode', 'VISUAL')} className={`flex-1 py-1.5 text-[10px] font-bold rounded transition-all ${config.mode !== 'CODE' ? 'bg-nexus-800 text-white shadow' : 'text-gray-500'}`}>Visual Rule</button>
                        <button onClick={() => onChange('mode', 'CODE')} className={`flex-1 py-1.5 text-[10px] font-bold rounded transition-all ${config.mode === 'CODE' ? 'bg-nexus-800 text-white shadow' : 'text-gray-500'}`}>JavaScript</button>
                    </div>

                    {config.mode === 'CODE' ? (
                        <div className="animate-in slide-in-from-right">
                            <TextAreaField label="Expression" value={config.condition} onChange={(v: string) => onChange('condition', v)} rows={4} placeholder="input.status === 'success'" />
                            <p className="text-[9px] text-gray-500 mt-1">Return <code>true</code> or <code>false</code>.</p>
                        </div>
                    ) : (
                        <div className="animate-in slide-in-from-left">
                            <SelectField 
                                label="Logic Operator" 
                                value={config.logicOperator || 'AND'} 
                                onChange={(v: string) => onChange('logicOperator', v)} 
                                options={[{label: 'AND (All Match)', value: 'AND'}, {label: 'OR (Any Match)', value: 'OR'}]} 
                            />
                            <div className="mt-3">
                                <RuleList rules={config.rules} onChange={(rules: any) => onChange('rules', rules)} />
                            </div>
                        </div>
                    )}
                </CollapsibleSection>

                <CollapsibleSection icon={GitBranch} title="Result Paths">
                    <div className="p-3 bg-nexus-900/30 border border-nexus-800 rounded-xl text-center">
                        <span className="text-[10px] text-gray-500 font-bold uppercase">Flow Direction</span>
                        <div className="flex gap-4 mt-2 justify-center items-center">
                            <div className="px-3 py-1 bg-nexus-success/10 border border-nexus-success/30 rounded text-nexus-success text-[10px] font-bold">TRUE</div>
                            <ArrowRightLeft size={12} className="text-gray-600"/>
                            <div className="px-3 py-1 bg-red-500/10 border border-red-500/30 rounded text-red-400 text-[10px] font-bold">FALSE</div>
                        </div>
                    </div>
                </CollapsibleSection>
            </div>
        );
    }

    // --- SWITCH (MULTI-ROUTE) ---
    if (subtype === NexusSubtype.SWITCH) {
        const conditions = config.conditions || [];
        const addCondition = () => onChange('conditions', [...conditions, { id: `route_${conditions.length + 1}`, field: '', operator: 'EQUALS', value: '' }]);
        const removeCondition = (idx: number) => onChange('conditions', conditions.filter((_: any, i: number) => i !== idx));
        const updateCondition = (idx: number, key: string, val: string) => {
            const newConds = [...conditions];
            newConds[idx][key] = val;
            onChange('conditions', newConds);
        };

        return (
            <div className="space-y-2">
                <CollapsibleSection icon={Layers} title="Switch Routes" defaultOpen={true}>
                    <div className="space-y-3">
                        {conditions.map((cond: any, idx: number) => (
                            <div key={idx} className="bg-nexus-950 p-2 rounded-xl border border-nexus-800 relative group animate-in slide-in-from-left-2">
                                <div className="absolute -left-2 top-1/2 -translate-y-1/2 bg-nexus-800 text-[8px] text-gray-400 px-1 rounded rotate-90 origin-right">OUT {idx + 1}</div>
                                <div className="flex gap-2 mb-2 pl-3">
                                    <InputField className="flex-1" placeholder="{{input.category}}" value={cond.field} onChange={(v: string) => updateCondition(idx, 'field', v)} />
                                    <select 
                                        value={cond.operator} 
                                        onChange={(e) => updateCondition(idx, 'operator', e.target.value)}
                                        className="w-20 bg-nexus-900 border border-nexus-700 rounded-lg px-2 text-[9px] text-nexus-accent outline-none cursor-pointer"
                                    >
                                        <option value="EQUALS">==</option>
                                        <option value="NOT_EQUALS">!=</option>
                                        <option value="CONTAINS">In</option>
                                        <option value="REGEX">Re</option>
                                        <option value="GT">&gt;</option>
                                    </select>
                                </div>
                                <div className="pl-3">
                                    <InputField placeholder="Value to match..." value={cond.value} onChange={(v: string) => updateCondition(idx, 'value', v)} />
                                </div>
                                <button onClick={() => removeCondition(idx)} className="absolute top-2 right-2 text-gray-600 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <X size={12}/>
                                </button>
                            </div>
                        ))}
                        <button onClick={addCondition} className="w-full py-2 border border-dashed border-nexus-700 rounded-xl text-[10px] font-bold text-gray-400 hover:text-nexus-accent hover:border-nexus-accent transition-colors flex items-center justify-center gap-2">
                            <Plus size={12}/> Add Route
                        </button>
                    </div>
                </CollapsibleSection>

                <CollapsibleSection icon={Brain} title="Smart Routing" badge="AI">
                    <ToggleField label="AI Route Suggestion" value={config.aiRouting} onChange={(v: boolean) => onChange('aiRouting', v)} description="Let AI pick the best route based on context." />
                    <div className="mt-3">
                        <SelectField label="Execution Strategy" value={config.executionMode || 'FIRST'} onChange={(v: string) => onChange('executionMode', v)} options={[{label: 'First Match Wins (Fast)', value: 'FIRST'}, {label: 'Execute All Matches', value: 'ALL'}]} />
                    </div>
                </CollapsibleSection>

                <CollapsibleSection icon={Settings} title="Advanced Matching">
                    <SelectField label="Match Type" value={config.matchType || 'STRICT'} onChange={(v: string) => onChange('matchType', v)} options={[{label: 'Strict (Case Sensitive)', value: 'STRICT'}, {label: 'Loose (Fuzzy)', value: 'FUZZY'}, {label: 'Regex Pattern', value: 'REGEX'}]} />
                </CollapsibleSection>
            </div>
        );
    }

    // --- NO OP (Smart Pass-Through) ---
    if (subtype === NexusSubtype.NO_OP || subtype === NexusSubtype.LOGGER) {
        return (
            <div className="space-y-2">
                <CollapsibleSection icon={FileJson} title="Logging & Observability" defaultOpen={true}>
                    <InputField label="Log Message" value={config.logMessage} onChange={(v: string) => onChange('logMessage', v)} placeholder="Processed Item {{input.id}}" />
                    <SelectField label="Log Level" value={config.logLevel || 'INFO'} onChange={(v: string) => onChange('logLevel', v)} options={[{label: 'Info', value: 'INFO'}, {label: 'Debug', value: 'DEBUG'}, {label: 'Warning', value: 'WARN'}, {label: 'Error', value: 'ERROR'}]} />
                    <ToggleField label="Record Performance Metrics" value={config.metrics} onChange={(v: boolean) => onChange('metrics', v)} />
                </CollapsibleSection>

                <CollapsibleSection icon={Gauge} title="Flow Control">
                    <ToggleField label="Enable Rate Limit" value={config.rateLimit} onChange={(v: boolean) => onChange('rateLimit', v)} />
                    {config.rateLimit && (
                        <div className="grid grid-cols-2 gap-4 mt-2">
                            <InputField label="Max Items" type="number" value={config.maxItems} onChange={(v: string) => onChange('maxItems', parseInt(v))} placeholder="100" />
                            <InputField label="Per Window (ms)" type="number" value={config.windowMs} onChange={(v: string) => onChange('windowMs', parseInt(v))} placeholder="60000" />
                        </div>
                    )}
                </CollapsibleSection>

                <CollapsibleSection icon={Eye} title="Debugging">
                    <ToggleField label="Breakpoint (Pause Here)" value={config.breakpoint} onChange={(v: boolean) => onChange('breakpoint', v)} activeColor="bg-red-500" />
                    <ToggleField label="Inspect Input Data" value={config.inspect} onChange={(v: boolean) => onChange('inspect', v)} />
                </CollapsibleSection>
            </div>
        );
    }

    // --- EXECUTE WORKFLOW (Orchestration) ---
    if (subtype === NexusSubtype.EXECUTE_WORKFLOW) {
        return (
            <div className="space-y-2">
                <CollapsibleSection icon={Play} title="Target Workflow" defaultOpen={true}>
                    <SelectField 
                        label="Workflow Source" 
                        value={config.source || 'ID'} 
                        onChange={(v: string) => onChange('source', v)} 
                        options={[{label: 'Select by ID', value: 'ID'}, {label: 'Select by Name', value: 'NAME'}]} 
                    />
                    <InputField label="Workflow ID / Name" value={config.workflowId} onChange={(v: string) => onChange('workflowId', v)} placeholder="wf_123456789" />
                    <SelectField 
                        label="Execution Mode" 
                        value={config.mode || 'SYNC'} 
                        onChange={(v: string) => onChange('mode', v)} 
                        options={[
                            {label: 'Synchronous (Wait for Result)', value: 'SYNC'}, 
                            {label: 'Asynchronous (Fire & Forget)', value: 'ASYNC'}, 
                            {label: 'Parallel (Batch)', value: 'PARALLEL'}
                        ]} 
                    />
                </CollapsibleSection>

                <CollapsibleSection icon={ArrowRightLeft} title="Context & Data">
                    <ToggleField label="Pass All Input Data" value={config.passAll} onChange={(v: boolean) => onChange('passAll', v)} />
                    {!config.passAll && (
                        <KeyValueList title="Custom Inputs" items={config.customInputs || []} onChange={(items: any[]) => onChange('customInputs', items)} keyPlaceholder="Variable" valPlaceholder="Value" />
                    )}
                </CollapsibleSection>

                <CollapsibleSection icon={Shield} title="Error Handling">
                    <ToggleField label="Continue Parent on Failure" value={config.continueOnFail} onChange={(v: boolean) => onChange('continueOnFail', v)} />
                    <InputField label="Fallback Workflow ID" value={config.fallbackWorkflow} onChange={(v: string) => onChange('fallbackWorkflow', v)} placeholder="Optional backup flow" />
                </CollapsibleSection>
            </div>
        );
    }

    // --- SCHEDULE (CRON) ---
    if (subtype === NexusSubtype.SCHEDULE) {
        return (
            <div className="space-y-2">
                <CollapsibleSection icon={Clock} title="Schedule Configuration" defaultOpen={true}>
                    <InputField 
                        label="Natural Language" 
                        value={config.naturalLanguageSchedule} 
                        onChange={(v: string) => onChange('naturalLanguageSchedule', v)} 
                        placeholder="Every Monday at 9am" 
                        hint="AI will generate the cron expression from this text."
                    />
                    <div className="flex gap-2 mt-2">
                        <div className="flex-1">
                            <InputField 
                                label="Cron Expression" 
                                value={config.cron} 
                                onChange={(v: string) => onChange('cron', v)} 
                                placeholder="0 9 * * 1" 
                                className="font-mono"
                            />
                        </div>
                        <div className="w-1/3">
                            <SelectField 
                                label="Timezone" 
                                value={config.timezone || 'UTC'} 
                                onChange={(v: string) => onChange('timezone', v)} 
                                options={[
                                    {label: 'UTC', value: 'UTC'},
                                    {label: 'New York (EST)', value: 'America/New_York'},
                                    {label: 'London (GMT)', value: 'Europe/London'},
                                    {label: 'India (IST)', value: 'Asia/Kolkata'},
                                    {label: 'Tokyo (JST)', value: 'Asia/Tokyo'}
                                ]} 
                            />
                        </div>
                    </div>
                    <div className="mt-2 text-[10px] text-gray-500 font-mono bg-nexus-950 p-2 rounded border border-nexus-800">
                        Next Run: {new Date(Date.now() + 86400000).toLocaleString()} (Estimated)
                    </div>
                </CollapsibleSection>

                <CollapsibleSection icon={Calendar} title="Advanced Restrictions">
                    <ToggleField label="Skip Weekends" value={config.skipWeekends} onChange={(v: boolean) => onChange('skipWeekends', v)} />
                    <ToggleField label="Skip Holidays" value={config.skipHolidays} onChange={(v: boolean) => onChange('skipHolidays', v)} />
                    <ToggleField label="Maximum Concurrent Runs" value={config.preventOverlap || true} onChange={(v: boolean) => onChange('preventOverlap', v)} description="Prevents new run if previous hasn't finished." />
                </CollapsibleSection>

                <CollapsibleSection icon={CloudLightning} title="Reliability">
                    <ToggleField label="Backfill Missing Runs" value={config.backfill} onChange={(v: boolean) => onChange('backfill', v)} description="Run past schedules if system was down." />
                    <SelectField 
                        label="On Error" 
                        value={config.errorStrategy || 'SKIP'} 
                        onChange={(v: string) => onChange('errorStrategy', v)} 
                        options={[{label: 'Skip Next Run', value: 'SKIP'}, {label: 'Retry Immediately', value: 'RETRY'}]} 
                    />
                </CollapsibleSection>

                <CollapsibleSection icon={Bell} title="Notifications">
                    <ToggleField label="Notify on Failure" value={config.notifyFailure} onChange={(v: boolean) => onChange('notifyFailure', v)} activeColor="bg-red-500" />
                    <ToggleField label="Notify on Success" value={config.notifySuccess} onChange={(v: boolean) => onChange('notifySuccess', v)} />
                </CollapsibleSection>
            </div>
        );
    }

    // --- DELAY ---
    if (subtype === NexusSubtype.DELAY) {
        return (
            <div className="space-y-5">
                <SectionHeader icon={PauseCircle} title="Delay Workflow" />
                <div className="bg-nexus-900/50 p-6 rounded-xl border border-nexus-800 flex flex-col items-center">
                    <div className="text-4xl font-mono font-bold text-white mb-2">{config.delayMs || 1000} <span className="text-sm text-gray-500">ms</span></div>
                    <SliderField label="" value={config.delayMs || 1000} onChange={(v: number) => onChange('delayMs', v)} min={0} max={60000} step={100} />
                </div>
                <ToggleField label="Resume on App Restart" value={config.persistent} onChange={(v: boolean) => onChange('persistent', v)} description="Save state to DB to survive crashes." />
            </div>
        );
    }

    // --- SET VARIABLE ---
    if (subtype === NexusSubtype.SET_VARIABLE) {
        return (
            <div className="space-y-5">
                <SectionHeader icon={Variable} title="Set Variables" />
                <KeyValueList 
                    title="Define Variables" 
                    items={config.fieldMappings || []} 
                    onChange={(items: any[]) => onChange('fieldMappings', items)} 
                    keyPlaceholder="Variable Name" 
                    valPlaceholder="Value (or {{input.data}})" 
                />
                <p className="text-[9px] text-gray-500">These variables will be available in all downstream nodes.</p>
            </div>
        );
    }

    // --- SPLIT BATCH - THE BATCH ORCHESTRATION MASTER (ULTRA PRO MAXX) ---
    if (subtype === NexusSubtype.SPLIT_BATCH) {
        return (
            <div className="space-y-2">
                {/* TIER 1: QUICK SPLIT */}
                <CollapsibleSection icon={Repeat} title="Quick Split" defaultOpen={true}>
                    <InputField label="Input Array" value={config.inputField} onChange={(v: string) => onChange('inputField', v)} placeholder="items" hint="Key in input containing the array" />
                    <div className="grid grid-cols-2 gap-4 mt-2">
                        <InputField label="Batch Size" type="number" value={config.batchSize || 10} onChange={(v: string) => onChange('batchSize', parseInt(v))} />
                        <button className="flex items-center justify-center gap-2 bg-nexus-900 border border-nexus-700 rounded-lg text-nexus-accent text-[10px] font-bold uppercase hover:bg-nexus-800">
                            <Play size={10} /> Test Split
                        </button>
                    </div>
                </CollapsibleSection>

                {/* TIER 2: INTELLIGENT BATCHING */}
                <CollapsibleSection icon={Brain} title="Intelligent Strategies" badge="AI">
                    <SelectField 
                        label="Batching Mode" 
                        value={config.batchMode || 'FIXED'} 
                        onChange={(v: string) => onChange('batchMode', v)} 
                        options={[
                            {label: 'Fixed Size (Default)', value: 'FIXED'},
                            {label: 'Dynamic (AI Optimized)', value: 'DYNAMIC'},
                            {label: 'Memory Limit Based', value: 'MEMORY'},
                            {label: 'CPU Load Based', value: 'CPU'}
                        ]} 
                    />
                    
                    {config.batchMode === 'DYNAMIC' && (
                        <div className="mt-3 bg-nexus-900/50 p-3 rounded-lg border border-nexus-800 border-dashed">
                            <div className="flex items-center gap-2 text-nexus-accent text-[10px] font-bold mb-1">
                                <Brain size={12}/> AI Optimization Active
                            </div>
                            <p className="text-[9px] text-gray-500">
                                AI will adjust batch size in real-time based on downstream node latency and error rates.
                            </p>
                        </div>
                    )}

                    <div className="mt-3">
                        <SelectField label="Ordering" value={config.order || 'ORIGINAL'} onChange={(v: string) => onChange('order', v)} options={[{label: 'Keep Original', value: 'ORIGINAL'}, {label: 'Randomize', value: 'RANDOM'}, {label: 'Sort by Field', value: 'SORT'}]} />
                    </div>
                </CollapsibleSection>

                {/* TIER 3: ADVANCED CONFIG */}
                <CollapsibleSection icon={BoxSelect} title="Advanced Config">
                    <div className="space-y-3">
                        <InputField label="Group By Field" value={config.groupBy} onChange={(v: string) => onChange('groupBy', v)} placeholder="category" hint="Keep items with same value in same batch" />
                        
                        <div className="border-t border-nexus-800/50 pt-3">
                            <RuleList title="Pre-Split Filters" rules={config.filters || []} onChange={(r: any) => onChange('filters', r)} />
                        </div>

                        <ToggleField label="Remove Duplicates" value={config.dedup} onChange={(v: boolean) => onChange('dedup', v)} />
                    </div>
                </CollapsibleSection>

                {/* TIER 4: PERFORMANCE */}
                <CollapsibleSection icon={Gauge} title="Performance Tuning">
                    <SelectField label="Execution Mode" value={config.execMode || 'SEQUENTIAL'} onChange={(v: string) => onChange('execMode', v)} options={[{label: 'Sequential (Safe)', value: 'SEQUENTIAL'}, {label: 'Parallel (Fast)', value: 'PARALLEL'}]} />
                    {config.execMode === 'PARALLEL' && (
                        <SliderField label="Max Threads" value={config.threads || 4} onChange={(v: number) => onChange('threads', v)} min={2} max={20} />
                    )}
                    <ToggleField label="Streaming Mode" value={config.streaming} onChange={(v: boolean) => onChange('streaming', v)} description="Process items without loading full array into memory." />
                </CollapsibleSection>

                {/* TIER 5: ROUTING */}
                <CollapsibleSection icon={Route} title="Batch Routing">
                    <SelectField 
                        label="Distribution" 
                        value={config.distribution || 'SINGLE'} 
                        onChange={(v: string) => onChange('distribution', v)} 
                        options={[
                            {label: 'Single Output (Standard)', value: 'SINGLE'},
                            {label: 'Round Robin (Load Balance)', value: 'ROUND_ROBIN'},
                            {label: 'Conditional Routing', value: 'CONDITIONAL'}
                        ]} 
                    />
                    <ToggleField label="Tag Priority Batches" value={config.priorityTags} onChange={(v: boolean) => onChange('priorityTags', v)} activeColor="bg-purple-500" />
                </CollapsibleSection>

                {/* TIER 6: QUALITY */}
                <CollapsibleSection icon={CheckCircle} title="Quality & Validation">
                    <div className="grid grid-cols-2 gap-4">
                        <ToggleField label="Verify Counts" value={config.verifyCounts} onChange={(v: boolean) => onChange('verifyCounts', v)} />
                        <ToggleField label="Check Nulls" value={config.checkNulls} onChange={(v: boolean) => onChange('checkNulls', v)} />
                    </div>
                    <div className="mt-3">
                        <SelectField label="On Error" value={config.onError || 'RETRY_BATCH'} onChange={(v: string) => onChange('onError', v)} options={[{label: 'Retry Batch', value: 'RETRY_BATCH'}, {label: 'Skip Batch', value: 'SKIP'}, {label: 'Stop Flow', value: 'STOP'}]} />
                    </div>
                </CollapsibleSection>
            </div>
        );
    }

    // --- ITEM LIST (SIMPLE) ---
    if (subtype === NexusSubtype.ITEM_LIST) {
        return (
            <div className="space-y-5">
                <SectionHeader icon={List} title="Simple List Helper" />
                <SelectField label="Operation" value={config.operation || 'CONCAT'} onChange={(v: string) => onChange('operation', v)} options={[{label: 'Concatenate Items', value: 'CONCAT'}, {label: 'Limit Items', value: 'LIMIT'}, {label: 'Sort Items', value: 'SORT'}]} />
                <InputField label="Input Array" value={config.inputField} onChange={(v: string) => onChange('inputField', v)} placeholder="items" />
                {config.operation === 'LIMIT' && <InputField label="Max Items" type="number" value={config.limit} onChange={(v: string) => onChange('limit', parseInt(v))} />}
            </div>
        );
    }

    // --- CODE JS ---
    if (subtype === NexusSubtype.CODE_JS) {
        return (
            <div className="space-y-5">
                <SectionHeader icon={Code} title="Scripting" />
                <div className="flex gap-4 mb-4">
                    <div className="flex-1">
                        <label className="block text-[10px] text-gray-500 uppercase mb-1">Language</label>
                        <div className="flex bg-nexus-900 p-1 rounded-lg border border-nexus-800">
                            <button className={`flex-1 py-1.5 text-[10px] font-bold rounded transition-all bg-yellow-500/20 text-yellow-500`}>JavaScript</button>
                        </div>
                    </div>
                    <div className="flex-1">
                        <label className="block text-[10px] text-gray-500 uppercase mb-1">Execution Mode</label>
                        <SelectField value={config.mode || 'ALL'} onChange={(v: string) => onChange('mode', v)} options={[{label: 'Run Once', value: 'ALL'}, {label: 'Run per Item', value: 'ITEM'}]} />
                    </div>
                </div>
                <div className="relative">
                    <TextAreaField label="" value={config.code} onChange={(v: string) => onChange('code', v)} rows={12} placeholder="return { ...input, processed: true };" />
                    <div className="absolute top-0 right-0 text-[9px] bg-nexus-900 px-2 py-0.5 rounded border border-nexus-800 text-gray-400 font-bold font-mono">JS</div>
                </div>
                <p className="text-[9px] text-gray-500 mt-2">
                    Variables: <code>input</code> (object/array), <code>env</code>. Return a JSON object.
                </p>
            </div>
        );
    }

    return null;
};

export default LogicConfig;

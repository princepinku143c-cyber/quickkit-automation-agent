
import React, { useState } from 'react';
import { NexusSubtype } from '../../types';
import { FileSpreadsheet, Database, FileText, Calendar, Building2, GitMerge, ShoppingCart, CreditCard, Bitcoin, Layers, Zap, Cpu, ShieldCheck, Save, Play, PieChart, Activity, Gauge, Filter, Sparkles, RefreshCw, Table, Search, Trash2, Plus, ArrowRightLeft, MessageSquare, Edit, Archive, Link, Eye, Users, Target, Briefcase, Megaphone, BarChart3, DollarSign } from 'lucide-react';
import { SectionHeader, SelectField, InputField, ToggleField, TextAreaField, KeyValueList, CollapsibleSection, SliderField, RuleList } from '../ConfigInputs';

interface BusinessConfigProps {
    subtype: NexusSubtype;
    config: any;
    onChange: (key: string, value: any) => void;
}

const BusinessConfig: React.FC<BusinessConfigProps> = ({ subtype, config, onChange }) => {
    
    // --- MERGE - THE DATA FUSION ENGINE (ULTRA PRO MAXX) ---
    if (subtype === NexusSubtype.MERGE) {
        const [isTesting, setIsTesting] = useState(false);
        const [testResult, setTestResult] = useState<any>(null);

        const runMergeTest = () => {
            setIsTesting(true);
            setTimeout(() => {
                setTestResult({
                    matched: 85,
                    unmatchedLeft: 15,
                    unmatchedRight: 5,
                    sample: [
                        { id: 1, name: "Alice", email: "alice@test.com", _source: "merged" },
                        { id: 2, name: "Bob", email: "bob@test.com", _source: "merged" }
                    ]
                });
                setIsTesting(false);
            }, 800);
        };

        return (
            <div className="space-y-2">
                {/* TIER 1: QUICK MERGE */}
                <CollapsibleSection icon={GitMerge} title="Quick Merge" defaultOpen={true}>
                    <SelectField 
                        label="Merge Type" 
                        value={config.mergeMode || 'INNER_JOIN'} 
                        onChange={(v: string) => onChange('mergeMode', v)} 
                        options={[
                            {label: 'Inner Join (Match Only)', value: 'INNER_JOIN'},
                            {label: 'Left Join (Keep Left)', value: 'LEFT_JOIN'},
                            {label: 'Right Join (Keep Right)', value: 'RIGHT_JOIN'},
                            {label: 'Full Outer Join', value: 'FULL_JOIN'},
                            {label: 'Concatenate (Stack)', value: 'CONCAT'},
                            {label: 'Deep Merge Objects', value: 'DEEP_MERGE'}
                        ]} 
                    />
                    <div className="grid grid-cols-2 gap-3 mt-3">
                        <InputField label="Left Input" value={config.inputLeft} onChange={(v: string) => onChange('inputLeft', v)} placeholder="node_1" />
                        <InputField label="Right Input" value={config.inputRight} onChange={(v: string) => onChange('inputRight', v)} placeholder="node_2" />
                    </div>
                    {(config.mergeMode || 'INNER_JOIN').includes('JOIN') && (
                        <div className="mt-3">
                            <InputField label="Primary Join Key" value={config.joinKey} onChange={(v: string) => onChange('joinKey', v)} placeholder="email" hint="Field common to both inputs" />
                        </div>
                    )}
                </CollapsibleSection>

                {/* TIER 2: ADVANCED JOIN CONFIGURATION */}
                {(config.mergeMode || 'INNER_JOIN').includes('JOIN') && (
                    <CollapsibleSection icon={Layers} title="Advanced Join Rules">
                        <RuleList 
                            title="Additional Conditions" 
                            rules={config.joinConditions || []} 
                            onChange={(r: any) => onChange('joinConditions', r)} 
                        />
                        <div className="grid grid-cols-2 gap-4 mt-3">
                            <SelectField label="Match Strategy" value={config.matchStrategy || 'EXACT'} onChange={(v: string) => onChange('matchStrategy', v)} options={[{label: 'Exact Match', value: 'EXACT'}, {label: 'Case Insensitive', value: 'CASE_INSENSITIVE'}, {label: 'Fuzzy Match', value: 'FUZZY'}]} />
                            {config.matchStrategy === 'FUZZY' && (
                                <SliderField label="Fuzzy Threshold" value={config.fuzzyThreshold || 85} onChange={(v: number) => onChange('fuzzyThreshold', v)} min={50} max={100} unit="%" />
                            )}
                        </div>
                        <div className="grid grid-cols-2 gap-4 mt-3 border-t border-nexus-800/50 pt-3">
                            <InputField label="Prefix Left Fields" value={config.prefixLeft} onChange={(v: string) => onChange('prefixLeft', v)} placeholder="left_" />
                            <InputField label="Prefix Right Fields" value={config.prefixRight} onChange={(v: string) => onChange('prefixRight', v)} placeholder="right_" />
                        </div>
                    </CollapsibleSection>
                )}

                {/* TIER 3: DATA TRANSFORMATION */}
                <CollapsibleSection icon={Zap} title="Transformation">
                    <KeyValueList 
                        title="Field Calculations" 
                        items={config.transforms || []} 
                        onChange={(items: any[]) => onChange('transforms', items)} 
                        keyPlaceholder="New Field Name" 
                        valPlaceholder="Formula (left.price * right.qty)" 
                    />
                    <div className="mt-3">
                        <ToggleField label="Auto-Type Casting" value={config.autoTypeCast} onChange={(v: boolean) => onChange('autoTypeCast', v)} description="Convert strings to numbers/dates automatically." />
                    </div>
                </CollapsibleSection>

                {/* TIER 4: PERFORMANCE & OPTIMIZATION */}
                <CollapsibleSection icon={Cpu} title="Performance & Cache">
                    <div className="grid grid-cols-2 gap-4">
                        <SelectField label="Processing Mode" value={config.processMode || 'STREAM'} onChange={(v: string) => onChange('processMode', v)} options={[{label: 'Streaming (Low Memory)', value: 'STREAM'}, {label: 'In-Memory (Fast)', value: 'MEMORY'}]} />
                        <SelectField label="Parallel Threads" value={config.threads || '1'} onChange={(v: string) => onChange('threads', v)} options={[{label: '1 (Sequential)', value: '1'}, {label: '4 (Balanced)', value: '4'}, {label: '8 (Max)', value: '8'}]} />
                    </div>
                    <div className="mt-3 border-t border-nexus-800/50 pt-3">
                        <ToggleField label="Cache Results" value={config.enableCache} onChange={(v: boolean) => onChange('enableCache', v)} />
                        {config.enableCache && (
                            <div className="mt-2">
                                <SliderField label="Cache TTL (Minutes)" value={config.cacheTtl || 5} onChange={(v: number) => onChange('cacheTtl', v)} min={1} max={60} />
                            </div>
                        )}
                    </div>
                </CollapsibleSection>

                {/* TIER 5: ERROR HANDLING */}
                <CollapsibleSection icon={ShieldCheck} title="Quality & Validation">
                    <SelectField label="On Mismatch" value={config.onMismatch || 'NULL'} onChange={(v: string) => onChange('onMismatch', v)} options={[{label: 'Set Null', value: 'NULL'}, {label: 'Skip Record', value: 'SKIP'}, {label: 'Stop Workflow', value: 'ERROR'}]} />
                    <ToggleField label="Log Unmatched Records" value={config.logUnmatched} onChange={(v: boolean) => onChange('logUnmatched', v)} />
                    <ToggleField label="Generate Quality Report" value={config.qualityReport} onChange={(v: boolean) => onChange('qualityReport', v)} />
                </CollapsibleSection>

                {/* TIER 6: TEMPLATES */}
                <CollapsibleSection icon={Save} title="Templates">
                    <SelectField 
                        label="Load Preset" 
                        value="" 
                        onChange={(v: string) => {
                            if(v === 'VLOOKUP') { onChange('mergeMode', 'LEFT_JOIN'); onChange('matchStrategy', 'EXACT'); }
                            if(v === 'FUZZY_DEDUP') { onChange('mergeMode', 'INNER_JOIN'); onChange('matchStrategy', 'FUZZY'); onChange('fuzzyThreshold', 80); }
                        }} 
                        options={[
                            {label: 'Select...', value: ''},
                            {label: 'VLOOKUP / Enrichment', value: 'VLOOKUP'},
                            {label: 'Fuzzy Deduplication', value: 'FUZZY_DEDUP'},
                            {label: 'Transaction Reconciliation', value: 'RECON'}
                        ]} 
                    />
                </CollapsibleSection>

                {/* TIER 7: TEST & PREVIEW */}
                <div className="mt-4 pt-4 border-t border-nexus-800">
                    <SectionHeader icon={Play} title="Live Preview" />
                    <div className="bg-nexus-900 rounded-xl border border-nexus-800 p-4">
                        <button 
                            onClick={runMergeTest} 
                            disabled={isTesting}
                            className="w-full py-2 bg-nexus-800 hover:bg-nexus-accent hover:text-black border border-nexus-700 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 mb-3"
                        >
                            {isTesting ? <Activity size={14} className="animate-spin"/> : <Play size={14}/>} Test Merge Logic
                        </button>
                        
                        {testResult && (
                            <div className="animate-in fade-in space-y-3">
                                <div className="grid grid-cols-3 gap-2 text-center">
                                    <div className="bg-black/40 p-2 rounded border border-nexus-800">
                                        <div className="text-[9px] text-gray-500">MATCHED</div>
                                        <div className="text-nexus-success font-mono font-bold">{testResult.matched}%</div>
                                    </div>
                                    <div className="bg-black/40 p-2 rounded border border-nexus-800">
                                        <div className="text-[9px] text-gray-500">LEFT ONLY</div>
                                        <div className="text-yellow-500 font-mono font-bold">{testResult.unmatchedLeft}</div>
                                    </div>
                                    <div className="bg-black/40 p-2 rounded border border-nexus-800">
                                        <div className="text-[9px] text-gray-500">RIGHT ONLY</div>
                                        <div className="text-blue-500 font-mono font-bold">{testResult.unmatchedRight}</div>
                                    </div>
                                </div>
                                <div className="bg-black p-2 rounded border border-nexus-800 text-[10px] font-mono text-gray-400 overflow-x-auto">
                                    <pre>{JSON.stringify(testResult.sample, null, 2)}</pre>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    // --- GOOGLE SHEETS - THE DATA WAREHOUSE POWERHOUSE ---
    if (subtype === NexusSubtype.SHEETS_READ || subtype === NexusSubtype.SHEETS_WRITE) {
        return (
            <div className="space-y-2">
                
                {/* TIER 1: QUICK OPERATION */}
                <CollapsibleSection icon={FileSpreadsheet} title="Quick Operation" defaultOpen={true}>
                    <SelectField 
                        label="Operation" 
                        value={config.operation || 'READ_ROWS'} 
                        onChange={(v: string) => onChange('operation', v)} 
                        options={[
                            // READ
                            { label: 'Read Rows (Range)', value: 'READ_ROWS' },
                            { label: 'Read Entire Sheet', value: 'READ_SHEET' },
                            { label: 'Advanced Query (SQL)', value: 'QUERY' },
                            { label: 'Get Headers', value: 'GET_HEADERS' },
                            // WRITE
                            { label: 'Append Rows', value: 'APPEND_ROWS' },
                            { label: 'Update Rows', value: 'UPDATE_ROWS' },
                            { label: 'Replace / Overwrite', value: 'REPLACE_ROWS' },
                            { label: 'Delete Rows', value: 'DELETE_ROWS' },
                            { label: 'Clear Sheet', value: 'CLEAR_SHEET' },
                            // MANAGE
                            { label: 'Create Sheet', value: 'CREATE_SHEET' },
                            { label: 'Delete Sheet', value: 'DELETE_SHEET' },
                            { label: 'Add/Delete Column', value: 'MANAGE_COLUMNS' }
                        ]} 
                    />
                    <div className="mt-3">
                        <InputField label="Spreadsheet ID / URL" value={config.sheetId} onChange={(v: string) => onChange('sheetId', v)} placeholder="1BxiMVs0X..." />
                        <InputField label="Sheet Name" value={config.sheetName} onChange={(v: string) => onChange('sheetName', v)} placeholder="Sheet1" />
                    </div>
                </CollapsibleSection>

                {/* TIER 2: GENIUS CONFIGURATION */}
                {/* 2A: READ CONFIG */}
                {(config.operation === 'READ_ROWS' || config.operation === 'READ_SHEET' || !config.operation) && (
                    <CollapsibleSection icon={Search} title="Read Configuration">
                        <div className="grid grid-cols-2 gap-4">
                            <InputField label="Range" value={config.range} onChange={(v: string) => onChange('range', v)} placeholder="A1:E10" />
                            <ToggleField label="Include Headers" value={config.headerRow !== false} onChange={(v: boolean) => onChange('headerRow', v)} />
                        </div>
                        <div className="mt-3 grid grid-cols-2 gap-4">
                            <SelectField label="Format" value={config.format || 'JSON'} onChange={(v: string) => onChange('format', v)} options={[{label: 'JSON Objects', value: 'JSON'}, {label: 'Raw Arrays', value: 'ARRAYS'}]} />
                            <InputField label="Limit Rows" type="number" value={config.limit} onChange={(v: string) => onChange('limit', parseInt(v))} placeholder="Unlimited" />
                        </div>
                        <div className="mt-3 pt-3 border-t border-nexus-800/50">
                            <InputField label="Filter (Column Matches)" value={config.filter} onChange={(v: string) => onChange('filter', v)} placeholder="Status == 'Active'" />
                        </div>
                    </CollapsibleSection>
                )}

                {/* 2B: QUERY CONFIG */}
                {config.operation === 'QUERY' && (
                    <CollapsibleSection icon={Database} title="Query Builder">
                        <TextAreaField label="Google Query Language" value={config.query} onChange={(v: string) => onChange('query', v)} rows={4} placeholder="select A, sum(B) where C > 100 group by A" />
                        <p className="text-[9px] text-gray-500 mt-1">Use standard Google Visualization API Query Language.</p>
                    </CollapsibleSection>
                )}

                {/* 2C: WRITE CONFIG */}
                {(config.operation === 'APPEND_ROWS' || config.operation === 'UPDATE_ROWS' || config.operation === 'REPLACE_ROWS') && (
                    <CollapsibleSection icon={Table} title="Write Configuration">
                        <TextAreaField label="Data (JSON Array)" value={config.rowData} onChange={(v: string) => onChange('rowData', v)} rows={4} placeholder='[{"name": "John", "age": 30}]' />
                        
                        <div className="grid grid-cols-2 gap-4 mt-3">
                            <SelectField label="Value Input" value={config.valueInputOption || 'USER_ENTERED'} onChange={(v: string) => onChange('valueInputOption', v)} options={[{label: 'Parsed (Auto)', value: 'USER_ENTERED'}, {label: 'Raw String', value: 'RAW'}]} />
                            
                            {config.operation === 'UPDATE_ROWS' && (
                                <InputField label="Match Column (Unique ID)" value={config.matchColumn} onChange={(v: string) => onChange('matchColumn', v)} placeholder="email" />
                            )}
                        </div>

                        {config.operation === 'APPEND_ROWS' && (
                            <ToggleField label="Insert at Top" value={config.insertTop} onChange={(v: boolean) => onChange('insertTop', v)} className="mt-3" />
                        )}
                    </CollapsibleSection>
                )}

                {/* 2D: MANAGEMENT CONFIG */}
                {config.operation === 'CREATE_SHEET' && (
                    <CollapsibleSection icon={Plus} title="Sheet Options">
                        <InputField label="New Sheet Title" value={config.newSheetTitle} onChange={(v: string) => onChange('newSheetTitle', v)} />
                        <InputField label="Header Row (Comma Sep)" value={config.newHeaders} onChange={(v: string) => onChange('newHeaders', v)} placeholder="ID,Name,Email,Status" className="mt-3" />
                    </CollapsibleSection>
                )}

                {/* TIER 3: DATA TRANSFORMATION & AI */}
                <CollapsibleSection icon={Sparkles} title="Transformation & AI" badge="Smart">
                    <div className="space-y-3">
                        <ToggleField label="Auto-Detect Duplicates" value={config.dedup} onChange={(v: boolean) => onChange('dedup', v)} />
                        {config.dedup && (
                            <SelectField label="On Duplicate" value={config.dedupAction || 'SKIP'} onChange={(v: string) => onChange('dedupAction', v)} options={[{label: 'Skip Row', value: 'SKIP'}, {label: 'Update Existing', value: 'UPDATE'}, {label: 'Flag Error', value: 'ERROR'}]} />
                        )}
                        
                        <div className="pt-3 border-t border-nexus-800/50">
                            <ToggleField label="AI Auto-Fill Missing" value={config.aiFill} onChange={(v: boolean) => onChange('aiFill', v)} description="Predict missing values based on column patterns." />
                            <ToggleField label="Smart Type Conversion" value={config.smartType} onChange={(v: boolean) => onChange('smartType', v)} description="Convert 'YES' to TRUE, '2023-01' to Date." />
                        </div>
                    </div>
                </CollapsibleSection>

                {/* TIER 4: SYNC & INTEGRATION */}
                <CollapsibleSection icon={RefreshCw} title="Sync & Integration">
                    <ToggleField label="Enable Two-Way Sync" value={config.twoWaySync} onChange={(v: boolean) => onChange('twoWaySync', v)} />
                    {config.twoWaySync && (
                        <div className="mt-2 p-3 bg-nexus-900/50 rounded-lg border border-nexus-800">
                            <SelectField label="Target System" value={config.syncTarget || 'AIRTABLE'} onChange={(v: string) => onChange('syncTarget', v)} options={[{label: 'Airtable', value: 'AIRTABLE'}, {label: 'Postgres', value: 'POSTGRES'}, {label: 'HubSpot', value: 'HUBSPOT'}]} />
                            <div className="mt-2 text-[9px] text-nexus-accent flex items-center gap-1">
                                <Activity size={10}/> Syncs every 5 mins
                            </div>
                        </div>
                    )}
                    <ToggleField label="Trigger Webhook on Change" value={config.webhookTrigger} onChange={(v: boolean) => onChange('webhookTrigger', v)} className="mt-3" />
                </CollapsibleSection>

                {/* TIER 5: PERFORMANCE & MONITORING */}
                <CollapsibleSection icon={Gauge} title="Performance">
                    <div className="grid grid-cols-2 gap-4">
                        <SliderField label="Batch Size" value={config.batchSize || 1000} onChange={(v: number) => onChange('batchSize', v)} min={100} max={5000} step={100} />
                        <InputField label="Rate Limit (req/min)" type="number" value={config.rateLimit || 60} onChange={(v: string) => onChange('rateLimit', parseInt(v))} />
                    </div>
                    <div className="mt-3">
                        <ToggleField label="Cache Results" value={config.cache} onChange={(v: boolean) => onChange('cache', v)} description="Store read results for 5 mins." />
                    </div>
                </CollapsibleSection>

            </div>
        );
    }

    // --- AIRTABLE - THE FLEXIBLE DATABASE MASTER ---
    if (subtype === NexusSubtype.AIRTABLE) {
        return (
            <div className="space-y-2">
                
                {/* TIER 1: QUICK OPERATION */}
                <CollapsibleSection icon={Database} title="Quick Operation" defaultOpen={true}>
                    <SelectField 
                        label="Operation" 
                        value={config.operation || 'LIST_RECORDS'} 
                        onChange={(v: string) => onChange('operation', v)} 
                        options={[
                            // READ
                            { label: 'List Records', value: 'LIST_RECORDS' },
                            { label: 'Get Record', value: 'GET_RECORD' },
                            { label: 'Search Records', value: 'SEARCH_RECORDS' },
                            { label: 'Get All (Auto-Paginate)', value: 'GET_ALL' },
                            // WRITE
                            { label: 'Create Record', value: 'CREATE_RECORD' },
                            { label: 'Update Record', value: 'UPDATE_RECORD' },
                            { label: 'Upsert (Update/Create)', value: 'UPSERT_RECORD' },
                            { label: 'Delete Record', value: 'DELETE_RECORD' },
                            // BATCH
                            { label: 'Batch Create', value: 'BATCH_CREATE' },
                            { label: 'Batch Update', value: 'BATCH_UPDATE' },
                            { label: 'Batch Delete', value: 'BATCH_DELETE' },
                            // META
                            { label: 'List Views', value: 'LIST_VIEWS' },
                            { label: 'Get Schema', value: 'GET_SCHEMA' }
                        ]} 
                    />
                    <div className="grid grid-cols-2 gap-4 mt-3">
                        <InputField label="Base ID" value={config.baseId} onChange={(v: string) => onChange('baseId', v)} placeholder="app..." />
                        <InputField label="Table Name / ID" value={config.tableId} onChange={(v: string) => onChange('tableId', v)} placeholder="tbl..." />
                    </div>
                </CollapsibleSection>

                {/* TIER 2: POWER CONFIGURATION */}
                {/* READ Config */}
                {(config.operation === 'LIST_RECORDS' || config.operation === 'GET_ALL' || config.operation === 'SEARCH_RECORDS') && (
                    <CollapsibleSection icon={Search} title="Read Configuration">
                        {config.operation === 'SEARCH_RECORDS' ? (
                            <div className="space-y-3">
                                <div className="grid grid-cols-2 gap-4">
                                    <InputField label="Search Field" value={config.searchField} onChange={(v: string) => onChange('searchField', v)} placeholder="Email" />
                                    <InputField label="Search Value" value={config.searchValue} onChange={(v: string) => onChange('searchValue', v)} placeholder="john@doe.com" />
                                </div>
                                <ToggleField label="Fuzzy Match" value={config.fuzzyMatch} onChange={(v: boolean) => onChange('fuzzyMatch', v)} description="Allow typos (approximate matching)." />
                            </div>
                        ) : (
                            <div className="space-y-3">
                                <div className="grid grid-cols-2 gap-4">
                                    <InputField label="View ID / Name" value={config.viewId} onChange={(v: string) => onChange('viewId', v)} placeholder="viw..." />
                                    <InputField label="Sort By Field" value={config.sortField} onChange={(v: string) => onChange('sortField', v)} placeholder="Created Time" />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <SelectField label="Sort Direction" value={config.sortDir || 'asc'} onChange={(v: string) => onChange('sortDir', v)} options={[{label: 'Ascending', value: 'asc'}, {label: 'Descending', value: 'desc'}]} />
                                    <InputField label="Max Records" type="number" value={config.maxRecords} onChange={(v: string) => onChange('maxRecords', parseInt(v))} placeholder="100" />
                                </div>
                                <InputField label="Filter Formula" value={config.filterByFormula} onChange={(v: string) => onChange('filterByFormula', v)} placeholder="AND({Status}='Active', {Amount}>100)" />
                            </div>
                        )}
                        <div className="mt-3 border-t border-nexus-800/50 pt-3">
                            <InputField label="Fields to Return" value={config.fields} onChange={(v: string) => onChange('fields', v)} placeholder="Name, Email, Status" hint="Comma separated list" />
                        </div>
                    </CollapsibleSection>
                )}

                {/* WRITE Config */}
                {(config.operation === 'CREATE_RECORD' || config.operation === 'UPDATE_RECORD' || config.operation === 'UPSERT_RECORD' || (config.operation || '').includes('BATCH')) && (
                    <CollapsibleSection icon={Table} title="Write Configuration">
                        {(config.operation || '').includes('UPDATE') && (
                            <InputField label="Record ID" value={config.recordId} onChange={(v: string) => onChange('recordId', v)} placeholder="rec..." />
                        )}
                        {config.operation === 'UPSERT_RECORD' && (
                            <InputField label="Merge Key Fields" value={config.upsertFields} onChange={(v: string) => onChange('upsertFields', v)} placeholder="Email" hint="Fields to check for existing record" />
                        )}
                        
                        <div className="mt-3">
                            <TextAreaField 
                                label={(config.operation || '').includes('BATCH') ? "Records Array (JSON)" : "Fields Data (JSON)"}
                                value={config.jsonData} 
                                onChange={(v: string) => onChange('jsonData', v)} 
                                rows={6} 
                                placeholder={(config.operation || '').includes('BATCH') ? '[{"fields": {"Name": "A"}}, ...]' : '{"Name": "John Doe", "Status": "Active"}'} 
                            />
                        </div>
                        
                        <div className="mt-3">
                            <ToggleField label="Typecast (Auto-Convert)" value={config.typecast ?? true} onChange={(v: boolean) => onChange('typecast', v)} description="Allow Airtable to try converting values (e.g. string to select)." />
                        </div>
                    </CollapsibleSection>
                )}

                {/* TIER 3: VIEWS & FILTERING */}
                <CollapsibleSection icon={Filter} title="Views & Filters" badge="Pro">
                    <RuleList title="Filter Rules" rules={config.filterRules || []} onChange={(r: any) => onChange('filterRules', r)} />
                    <div className="mt-3">
                        <SelectField label="View Type" value={config.viewType || 'GRID'} onChange={(v: string) => onChange('viewType', v)} options={[{label: 'Grid', value: 'GRID'}, {label: 'Kanban', value: 'KANBAN'}, {label: 'Gallery', value: 'GALLERY'}, {label: 'Calendar', value: 'CALENDAR'}]} />
                    </div>
                </CollapsibleSection>

                {/* TIER 4: SYNC & AUTOMATION */}
                <CollapsibleSection icon={RefreshCw} title="Sync & Automation">
                    <ToggleField label="Two-Way Sync" value={config.twoWaySync} onChange={(v: boolean) => onChange('twoWaySync', v)} />
                    {config.twoWaySync && (
                        <div className="mt-2 p-3 bg-nexus-900/50 rounded-lg border border-nexus-800">
                            <SelectField label="Sync Source" value={config.syncSource || 'GOOGLE_SHEETS'} onChange={(v: string) => onChange('syncSource', v)} options={[{label: 'Google Sheets', value: 'GOOGLE_SHEETS'}, {label: 'HubSpot', value: 'HUBSPOT'}, {label: 'Postgres', value: 'POSTGRES'}]} />
                            <InputField label="Field Mapping (JSON)" value={config.fieldMapping} onChange={(v: string) => onChange('fieldMapping', v)} placeholder='{"Name": "fullname"}' className="mt-2" />
                        </div>
                    )}
                    <ToggleField label="Trigger Webhook on Change" value={config.webhookTrigger} onChange={(v: boolean) => onChange('webhookTrigger', v)} className="mt-3" />
                </CollapsibleSection>

                {/* TIER 5: PERFORMANCE */}
                <CollapsibleSection icon={Gauge} title="Performance">
                    <div className="grid grid-cols-2 gap-4">
                        <SliderField label="Batch Size" value={config.batchSize || 10} onChange={(v: number) => onChange('batchSize', v)} min={1} max={10} step={1} />
                        <InputField label="Rate Limit (req/sec)" type="number" value={config.rateLimit || 5} onChange={(v: string) => onChange('rateLimit', parseInt(v))} />
                    </div>
                    <ToggleField label="Cache Results" value={config.cache} onChange={(v: boolean) => onChange('cache', v)} className="mt-3" />
                </CollapsibleSection>
            </div>
        );
    }

    // --- NOTION - THE ULTIMATE KNOWLEDGE WORKSPACE ---
    if (subtype === NexusSubtype.NOTION) {
        return (
            <div className="space-y-2">
                {/* TIER 1: QUICK OPERATION */}
                <CollapsibleSection icon={FileText} title="Quick Operation" defaultOpen={true}>
                    <SelectField 
                        label="Operation" 
                        value={config.operation || 'QUERY_DATABASE'} 
                        onChange={(v: string) => onChange('operation', v)} 
                        options={[
                            { label: 'Query Database', value: 'QUERY_DATABASE' },
                            { label: 'Get Page', value: 'GET_PAGE' },
                            { label: 'Get Page Content', value: 'GET_PAGE_CONTENT' },
                            { label: 'Create Page', value: 'CREATE_PAGE' },
                            { label: 'Update Page', value: 'UPDATE_PAGE' },
                            { label: 'Create Database', value: 'CREATE_DATABASE' },
                            { label: 'Archive/Delete Page', value: 'ARCHIVE_PAGE' },
                            { label: 'Append Blocks', value: 'APPEND_BLOCKS' },
                            { label: 'Get Comments', value: 'GET_COMMENTS' },
                            { label: 'Add Comment', value: 'ADD_COMMENT' },
                            { label: 'Search', value: 'SEARCH' }
                        ]} 
                    />
                    <div className="mt-3">
                        <InputField label="Workspace / Integration" value={config.workspace} onChange={(v: string) => onChange('workspace', v)} placeholder="My Workspace" />
                        {(config.operation === 'QUERY_DATABASE' || config.operation === 'CREATE_PAGE' || config.operation === 'CREATE_DATABASE') && (
                             <InputField label="Database ID" value={config.databaseId} onChange={(v: string) => onChange('databaseId', v)} placeholder="db_..." />
                        )}
                        {(['GET_PAGE', 'GET_PAGE_CONTENT', 'UPDATE_PAGE', 'ARCHIVE_PAGE', 'APPEND_BLOCKS', 'GET_COMMENTS', 'ADD_COMMENT'].includes(config.operation)) && (
                             <InputField label="Page ID" value={config.pageId} onChange={(v: string) => onChange('pageId', v)} placeholder="page_..." />
                        )}
                    </div>
                </CollapsibleSection>

                {/* TIER 2: ADVANCED DATABASE OPS */}
                {config.operation === 'QUERY_DATABASE' && (
                    <CollapsibleSection icon={Filter} title="Query Configuration">
                        <RuleList title="Filters" rules={config.filters || []} onChange={(r: any) => onChange('filters', r)} />
                        <div className="mt-3 border-t border-nexus-800/50 pt-3">
                            <KeyValueList title="Sorts" items={config.sorts || []} onChange={(items: any[]) => onChange('sorts', items)} keyPlaceholder="Property" valPlaceholder="Direction (ascending/descending)" />
                        </div>
                        <div className="grid grid-cols-2 gap-4 mt-3">
                            <InputField label="Page Size" type="number" value={config.pageSize || 100} onChange={(v: string) => onChange('pageSize', parseInt(v))} />
                            <ToggleField label="Auto-Paginate" value={config.autoPaginate} onChange={(v: boolean) => onChange('autoPaginate', v)} />
                        </div>
                    </CollapsibleSection>
                )}

                {config.operation === 'CREATE_PAGE' && (
                    <CollapsibleSection icon={Plus} title="Page Content">
                        <InputField label="Title" value={config.title} onChange={(v: string) => onChange('title', v)} />
                        <div className="mt-3">
                            <TextAreaField label="Properties (JSON)" value={config.properties} onChange={(v: string) => onChange('properties', v)} rows={5} placeholder='{ "Status": { "select": { "name": "Active" } } }' />
                        </div>
                        <div className="mt-3">
                            <TextAreaField label="Content Blocks (JSON)" value={config.content} onChange={(v: string) => onChange('content', v)} rows={5} placeholder='[ { "object": "block", "type": "paragraph", ... } ]' />
                        </div>
                        <div className="grid grid-cols-2 gap-4 mt-3">
                            <InputField label="Icon (Emoji/URL)" value={config.icon} onChange={(v: string) => onChange('icon', v)} />
                            <InputField label="Cover Image URL" value={config.cover} onChange={(v: string) => onChange('cover', v)} />
                        </div>
                    </CollapsibleSection>
                )}

                {config.operation === 'UPDATE_PAGE' && (
                    <CollapsibleSection icon={Edit} title="Update Properties">
                        <TextAreaField label="Properties to Update (JSON)" value={config.properties} onChange={(v: string) => onChange('properties', v)} rows={5} />
                        <ToggleField label="Archive (Delete)" value={config.archive} onChange={(v: boolean) => onChange('archive', v)} />
                    </CollapsibleSection>
                )}

                {config.operation === 'ARCHIVE_PAGE' && (
                    <CollapsibleSection icon={Trash2} title="Deletion">
                        <ToggleField label="Confirm Archive" value={config.confirm} onChange={(v: boolean) => onChange('confirm', v)} activeColor="bg-red-500" />
                        <ToggleField label="Permanent Delete" value={config.permanent} onChange={(v: boolean) => onChange('permanent', v)} activeColor="bg-red-500" description="Cannot be undone." />
                    </CollapsibleSection>
                )}

                {config.operation === 'APPEND_BLOCKS' && (
                    <CollapsibleSection icon={Layers} title="Blocks">
                        <TextAreaField label="Blocks to Append (JSON)" value={config.content} onChange={(v: string) => onChange('content', v)} rows={6} />
                    </CollapsibleSection>
                )}

                {/* TIER 3: RELATIONS & ROLLUPS */}
                {(config.operation === 'CREATE_PAGE' || config.operation === 'UPDATE_PAGE') && (
                    <CollapsibleSection icon={ArrowRightLeft} title="Relations & Rollups">
                        <KeyValueList title="Relation Map" items={config.relations || []} onChange={(items: any[]) => onChange('relations', items)} keyPlaceholder="Property Name" valPlaceholder="Target Page IDs (comma sep)" />
                    </CollapsibleSection>
                )}

                {/* TIER 4: COLLABORATION */}
                {['GET_COMMENTS', 'ADD_COMMENT'].includes(config.operation) && (
                    <CollapsibleSection icon={MessageSquare} title="Collaboration">
                        {config.operation === 'ADD_COMMENT' && (
                            <TextAreaField label="Comment Text" value={config.commentText} onChange={(v: string) => onChange('commentText', v)} rows={3} />
                        )}
                        <InputField label="Block ID (Optional)" value={config.blockId} onChange={(v: string) => onChange('blockId', v)} placeholder="Attach comment to block" />
                    </CollapsibleSection>
                )}

                {/* TIER 5: SEARCH & DISCOVERY */}
                {config.operation === 'SEARCH' && (
                    <CollapsibleSection icon={Search} title="Search">
                        <InputField label="Query Keyword" value={config.query} onChange={(v: string) => onChange('query', v)} />
                        <div className="grid grid-cols-2 gap-4 mt-3">
                            <SelectField label="Filter Object" value={config.filterObject || 'page'} onChange={(v: string) => onChange('filterObject', v)} options={[{label: 'Page', value: 'page'}, {label: 'Database', value: 'database'}]} />
                            <SelectField label="Sort By" value={config.sortBy || 'relevance'} onChange={(v: string) => onChange('sortBy', v)} options={[{label: 'Relevance', value: 'relevance'}, {label: 'Last Edited', value: 'last_edited_time'}]} />
                        </div>
                    </CollapsibleSection>
                )}

                {/* TIER 6: SYNC & PERFORMANCE */}
                <CollapsibleSection icon={RefreshCw} title="Sync & Performance">
                    <div className="grid grid-cols-2 gap-4">
                        <SliderField label="Batch Size" value={config.batchSize || 10} onChange={(v: number) => onChange('batchSize', v)} min={1} max={100} />
                        <ToggleField label="Two-Way Sync" value={config.twoWaySync} onChange={(v: boolean) => onChange('twoWaySync', v)} />
                    </div>
                    {config.twoWaySync && (
                        <div className="mt-3 border-t border-nexus-800/50 pt-3">
                            <SelectField label="Sync Target" value={config.syncTarget || 'AIRTABLE'} onChange={(v: string) => onChange('syncTarget', v)} options={[{label: 'Airtable', value: 'AIRTABLE'}, {label: 'Google Sheets', value: 'SHEETS'}]} />
                        </div>
                    )}
                </CollapsibleSection>
            </div>
        );
    }

    // --- HUBSPOT - THE SALES & MARKETING POWERHOUSE ---
    if (subtype === NexusSubtype.HUBSPOT) {
        return (
            <div className="space-y-2">
                
                {/* TIER 1: QUICK OPERATION */}
                <CollapsibleSection icon={Building2} title="Quick Operation" defaultOpen={true}>
                    <div className="grid grid-cols-2 gap-4">
                        <SelectField 
                            label="Resource" 
                            value={config.resource || 'CONTACT'} 
                            onChange={(v: string) => onChange('resource', v)} 
                            options={[
                                { label: 'Contact', value: 'CONTACT' },
                                { label: 'Company', value: 'COMPANY' },
                                { label: 'Deal', value: 'DEAL' },
                                { label: 'Ticket', value: 'TICKET' },
                                { label: 'Product', value: 'PRODUCT' },
                                { label: 'Quote', value: 'QUOTE' },
                                { label: 'Email', value: 'EMAIL' },
                                { label: 'Custom Object', value: 'CUSTOM' }
                            ]} 
                        />
                        <SelectField 
                            label="Operation" 
                            value={config.operation || 'CREATE'} 
                            onChange={(v: string) => onChange('operation', v)} 
                            options={[
                                { label: 'Create', value: 'CREATE' },
                                { label: 'Get (Read)', value: 'GET' },
                                { label: 'Update', value: 'UPDATE' },
                                { label: 'Delete', value: 'DELETE' },
                                { label: 'Search', value: 'SEARCH' },
                                { label: 'Batch Create', value: 'BATCH_CREATE' },
                                { label: 'Batch Update', value: 'BATCH_UPDATE' }
                            ]} 
                        />
                    </div>
                </CollapsibleSection>

                {/* TIER 2: CONTACT OPERATIONS */}
                {config.resource === 'CONTACT' && (
                    <CollapsibleSection icon={Users} title="Contact Operations">
                        {config.operation === 'CREATE' && (
                            <div className="space-y-3">
                                <InputField label="Email (Required)" value={config.email} onChange={(v: string) => onChange('email', v)} placeholder="john@doe.com" />
                                <div className="grid grid-cols-2 gap-4">
                                    <InputField label="First Name" value={config.firstName} onChange={(v: string) => onChange('firstName', v)} />
                                    <InputField label="Last Name" value={config.lastName} onChange={(v: string) => onChange('lastName', v)} />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <InputField label="Phone" value={config.phone} onChange={(v: string) => onChange('phone', v)} />
                                    <InputField label="Company" value={config.company} onChange={(v: string) => onChange('company', v)} />
                                </div>
                                <div className="mt-3 pt-3 border-t border-nexus-800/50">
                                    <SelectField label="Lifecycle Stage" value={config.lifecycle || 'LEAD'} onChange={(v: string) => onChange('lifecycle', v)} options={[{label: 'Lead', value: 'LEAD'}, {label: 'MQL', value: 'MQL'}, {label: 'SQL', value: 'SQL'}, {label: 'Customer', value: 'CUSTOMER'}]} />
                                    <KeyValueList title="Custom Properties" items={config.customProps || []} onChange={(items: any[]) => onChange('customProps', items)} />
                                </div>
                            </div>
                        )}
                        
                        {(config.operation === 'UPDATE' || config.operation === 'DELETE') && (
                            <div className="space-y-3">
                                <InputField label="Contact ID / Email" value={config.contactId} onChange={(v: string) => onChange('contactId', v)} />
                                {config.operation === 'UPDATE' && <KeyValueList title="Properties to Update" items={config.updates || []} onChange={(items: any[]) => onChange('updates', items)} />}
                            </div>
                        )}

                        {config.operation === 'SEARCH' && (
                            <div className="space-y-3">
                                <InputField label="Search Query (Name/Email)" value={config.query} onChange={(v: string) => onChange('query', v)} />
                                <RuleList title="Advanced Filters" rules={config.filters || []} onChange={(r: any) => onChange('filters', r)} />
                            </div>
                        )}
                    </CollapsibleSection>
                )}

                {/* TIER 3: DEALS & PIPELINE */}
                {config.resource === 'DEAL' && (
                    <CollapsibleSection icon={DollarSign} title="Sales Pipeline">
                        {config.operation === 'CREATE' && (
                            <div className="space-y-3">
                                <InputField label="Deal Name" value={config.dealName} onChange={(v: string) => onChange('dealName', v)} />
                                <div className="grid grid-cols-2 gap-4">
                                    <InputField label="Amount" type="number" value={config.amount} onChange={(v: string) => onChange('amount', parseFloat(v))} />
                                    <InputField label="Close Date" value={config.closeDate} onChange={(v: string) => onChange('closeDate', v)} placeholder="YYYY-MM-DD" />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <SelectField label="Pipeline" value={config.pipeline || 'default'} onChange={(v: string) => onChange('pipeline', v)} options={[{label: 'Sales Pipeline', value: 'default'}]} />
                                    <SelectField label="Stage" value={config.stage || 'appointmentscheduled'} onChange={(v: string) => onChange('stage', v)} options={[{label: 'Appointment', value: 'appointmentscheduled'}, {label: 'Qualified', value: 'qualifiedtobuy'}, {label: 'Won', value: 'closedwon'}, {label: 'Lost', value: 'closedlost'}]} />
                                </div>
                                <div className="mt-3 pt-3 border-t border-nexus-800/50">
                                    <KeyValueList title="Associate with IDs" items={config.associations || []} onChange={(items: any[]) => onChange('associations', items)} keyPlaceholder="Type (contact/company)" valPlaceholder="ID" />
                                </div>
                            </div>
                        )}
                    </CollapsibleSection>
                )}

                {/* TIER 4: COMPANIES */}
                {config.resource === 'COMPANY' && (
                    <CollapsibleSection icon={Building2} title="Company Ops">
                        <InputField label="Company Name" value={config.companyName} onChange={(v: string) => onChange('companyName', v)} />
                        <InputField label="Domain" value={config.domain} onChange={(v: string) => onChange('domain', v)} className="mt-2" />
                        <ToggleField label="Auto-Enrich Data" value={config.enrich} onChange={(v: boolean) => onChange('enrich', v)} className="mt-3" />
                    </CollapsibleSection>
                )}

                {/* TIER 5: MARKETING & AUTOMATION */}
                <CollapsibleSection icon={Megaphone} title="Marketing & Automation">
                    <div className="grid grid-cols-2 gap-4">
                        <ToggleField label="Add to List" value={config.addToList} onChange={(v: boolean) => onChange('addToList', v)} />
                        <ToggleField label="Trigger Workflow" value={config.triggerWorkflow} onChange={(v: boolean) => onChange('triggerWorkflow', v)} />
                    </div>
                    {config.addToList && <InputField label="List ID" value={config.listId} onChange={(v: string) => onChange('listId', v)} className="mt-2" />}
                    {config.triggerWorkflow && <InputField label="Workflow ID" value={config.workflowId} onChange={(v: string) => onChange('workflowId', v)} className="mt-2" />}
                </CollapsibleSection>

                {/* TIER 6: ANALYTICS & REPORTS */}
                <CollapsibleSection icon={BarChart3} title="Analytics & Reporting">
                    <SelectField label="Report Type" value={config.reportType || 'NONE'} onChange={(v: string) => onChange('reportType', v)} options={[{label: 'None', value: 'NONE'}, {label: 'Sales Performance', value: 'SALES'}, {label: 'Lead Sources', value: 'LEADS'}]} />
                    {config.reportType !== 'NONE' && (
                        <div className="mt-2 p-2 bg-nexus-900 border border-nexus-800 rounded-lg text-[10px] text-gray-400 text-center">
                            Report JSON will be output to <code>data.report</code>
                        </div>
                    )}
                </CollapsibleSection>

                {/* TIER 7: PERFORMANCE */}
                <CollapsibleSection icon={Gauge} title="Performance & Limits">
                    <div className="grid grid-cols-2 gap-4">
                        <SliderField label="Batch Size" value={config.batchSize || 100} onChange={(v: number) => onChange('batchSize', v)} min={10} max={1000} step={10} />
                        <InputField label="Rate Limit (req/10s)" type="number" value={config.rateLimit || 100} onChange={(v: string) => onChange('rateLimit', parseInt(v))} />
                    </div>
                    <ToggleField label="Use Dead Letter Queue" value={config.dlq} onChange={(v: boolean) => onChange('dlq', v)} className="mt-3" />
                </CollapsibleSection>
            </div>
        );
    }

    // --- SALESFORCE / ZENDESK (Basic Fallback) ---
    if (subtype === NexusSubtype.SALESFORCE || subtype === NexusSubtype.ZENDESK) {
        return (
            <div className="space-y-5">
              <SectionHeader icon={Building2} title={`${subtype === NexusSubtype.SALESFORCE ? 'Salesforce' : 'Zendesk'} Operations`} />
              
              <div className="flex gap-2">
                  <div className="w-1/2">
                      <SelectField 
                          label="Resource" 
                          value={config.resource || 'contact'} 
                          onChange={(v: string) => onChange('resource', v)} 
                          options={[
                              { label: 'Contact', value: 'contact' },
                              { label: 'Account/Org', value: 'account' },
                              { label: 'Lead/Ticket', value: 'lead' }
                          ]} 
                      />
                  </div>
                  <div className="w-1/2">
                      <SelectField 
                          label="Operation" 
                          value={config.operation || 'create'} 
                          onChange={(v: string) => onChange('operation', v)} 
                          options={[
                              { label: 'Create', value: 'create' },
                              { label: 'Update', value: 'update' },
                              { label: 'Get', value: 'get' },
                              { label: 'List', value: 'list' },
                              { label: 'Delete', value: 'delete' }
                          ]} 
                      />
                  </div>
              </div>

              {(config.operation === 'get' || config.operation === 'update' || config.operation === 'delete') && (
                  <InputField label={`${config.resource || 'Object'} ID`} value={config.objectId} onChange={(v: string) => onChange('objectId', v)} />
              )}

              {(config.operation === 'create' || config.operation === 'update') && (
                  <KeyValueList title="Fields" items={config.properties || []} onChange={(items: any[]) => onChange('properties', items)} keyPlaceholder="Field API Name" valPlaceholder="Value" />
              )}
              
              {config.operation === 'list' && (
                  <InputField label="Query / Filter" value={config.query} onChange={(v: string) => onChange('query', v)} />
              )}
          </div>
        );
    }

    // --- COMMERCE (SHOPIFY) ---
    if (subtype === NexusSubtype.SHOPIFY) {
        return (
            <div className="space-y-5">
                <SectionHeader icon={ShoppingCart} title="Shopify Config" />
                <SelectField 
                    label="Resource" 
                    value={config.resource || 'order'} 
                    onChange={(v: string) => onChange('resource', v)} 
                    options={[{label: 'Order', value: 'order'}, {label: 'Product', value: 'product'}, {label: 'Customer', value: 'customer'}]} 
                />
                <SelectField 
                    label="Operation" 
                    value={config.operation || 'get'} 
                    onChange={(v: string) => onChange('operation', v)} 
                    options={[{label: 'Get', value: 'get'}, {label: 'List', value: 'list'}, {label: 'Create', value: 'create'}, {label: 'Update', value: 'update'}]} 
                />
                <InputField label="Shop URL" value={config.shopUrl} onChange={(v: string) => onChange('shopUrl', v)} placeholder="my-shop.myshopify.com" />
                {config.operation === 'get' && <InputField label="ID" value={config.id} onChange={(v: string) => onChange('id', v)} />}
            </div>
        );
    }

    // --- PAYMENTS (STRIPE / RAZORPAY) ---
    if (subtype === NexusSubtype.STRIPE || subtype === NexusSubtype.RAZORPAY) {
        return (
            <div className="space-y-5">
                <SectionHeader icon={CreditCard} title={`${subtype} Payments`} />
                <SelectField 
                    label="Action" 
                    value={config.operation || 'create_link'} 
                    onChange={(v: string) => onChange('operation', v)} 
                    options={[{label: 'Create Payment Link', value: 'create_link'}, {label: 'Get Transaction', value: 'get_txn'}, {label: 'Refund', value: 'refund'}]} 
                />
                {config.operation === 'create_link' && (
                    <>
                        <InputField label="Amount" type="number" value={config.amount} onChange={(v: string) => onChange('amount', parseFloat(v))} />
                        <InputField label="Currency" value={config.currency} onChange={(v: string) => onChange('currency', v)} placeholder="USD" />
                        <InputField label="Description" value={config.description} onChange={(v: string) => onChange('description', v)} />
                    </>
                )}
                {config.operation === 'get_txn' && <InputField label="Transaction ID" value={config.txnId} onChange={(v: string) => onChange('txnId', v)} />}
            </div>
        );
    }

    // --- CRYPTO ---
    if (subtype === NexusSubtype.CRYPTO_PRICE || subtype === NexusSubtype.BINANCE_TRADE) {
        return (
            <div className="space-y-5">
                <SectionHeader icon={Bitcoin} title="Crypto Operations" />
                <InputField label="Symbol / Pair" value={config.cryptoPair} onChange={(v: string) => onChange('cryptoPair', v)} placeholder="BTCUSDT" />
                
                {subtype === NexusSubtype.BINANCE_TRADE && (
                    <>
                        <SelectField label="Side" value={config.side || 'BUY'} onChange={(v: string) => onChange('side', v)} options={[{label: 'Buy', value: 'BUY'}, {label: 'Sell', value: 'SELL'}]} />
                        <InputField label="Quantity" type="number" value={config.quantity} onChange={(v: string) => onChange('quantity', v)} />
                    </>
                )}
            </div>
        );
    }

    // --- GOOGLE CALENDAR ---
    if (subtype === NexusSubtype.GOOGLE_CALENDAR) {
        return (
            <div className="space-y-5">
                <SectionHeader icon={Calendar} title="Google Calendar" />
                <SelectField 
                    label="Operation" 
                    value={config.operation || 'create'} 
                    onChange={(v: string) => onChange('operation', v)} 
                    options={[
                        { label: 'Create Event', value: 'create' },
                        { label: 'Get Event', value: 'get' },
                        { label: 'Update Event', value: 'update' },
                        { label: 'Delete Event', value: 'delete' },
                        { label: 'List Events', value: 'list' }
                    ]} 
                />
                <InputField label="Calendar ID" value={config.calendarId} onChange={(v: string) => onChange('calendarId', v)} placeholder="primary" />
                
                {(config.operation === 'create' || config.operation === 'update') && (
                    <>
                        <InputField label="Summary / Title" value={config.summary} onChange={(v: string) => onChange('summary', v)} />
                        <TextAreaField label="Description" value={config.description} onChange={(v: string) => onChange('description', v)} rows={2} />
                        <div className="grid grid-cols-2 gap-4">
                            <InputField label="Start Time (ISO)" value={config.start} onChange={(v: string) => onChange('start', v)} placeholder="2024-01-01T10:00:00Z" />
                            <InputField label="End Time (ISO)" value={config.end} onChange={(v: string) => onChange('end', v)} placeholder="2024-01-01T11:00:00Z" />
                        </div>
                        <InputField label="Attendees (Comma sep)" value={config.attendees} onChange={(v: string) => onChange('attendees', v)} />
                    </>
                )}
                
                {(config.operation === 'get' || config.operation === 'delete' || config.operation === 'update') && (
                    <InputField label="Event ID" value={config.eventId} onChange={(v: string) => onChange('eventId', v)} />
                )}
            </div>
        );
    }

    return null;
};

export default BusinessConfig;

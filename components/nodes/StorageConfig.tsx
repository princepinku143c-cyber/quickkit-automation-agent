
import React from 'react';
import { NexusSubtype } from '../../types';
import { HardDrive, Server, FileText, Database, UploadCloud, Search, FolderPlus, Download, Trash2, Share2, Lock, FileType, Filter, Activity, RefreshCw, Copy, Archive, Eye, Globe, Cloud, List, Play, Settings, Shield, Table, Plus, Key, BarChart3, Edit, Zap, Layers } from 'lucide-react';
import { SectionHeader, SelectField, InputField, TextAreaField, ToggleField, KeyValueList, CollapsibleSection, SliderField, RuleList } from '../ConfigInputs';

interface StorageConfigProps {
    subtype: NexusSubtype;
    config: any;
    onChange: (key: string, value: any) => void;
}

const StorageConfig: React.FC<StorageConfigProps> = ({ subtype, config, onChange }) => {

    // --- 1. READ FILE - THE UNIVERSAL READER ---
    if (subtype === NexusSubtype.READ_BINARY_FILE) {
        return (
            <div className="space-y-2">
                {/* TIER 1: QUICK READ */}
                <CollapsibleSection icon={FileText} title="Quick Read" defaultOpen={true}>
                    <SelectField 
                        label="Source Type" 
                        value={config.sourceType || 'LOCAL'} 
                        onChange={(v: string) => onChange('sourceType', v)} 
                        options={[
                            {label: 'Local File System', value: 'LOCAL'},
                            {label: 'URL / HTTP', value: 'URL'},
                            {label: 'Base64 String', value: 'BASE64'},
                            {label: 'Input Data Field', value: 'INPUT'}
                        ]} 
                    />
                    <div className="mt-3">
                        <InputField label="File Path / URL" value={config.filePath} onChange={(v: string) => onChange('filePath', v)} placeholder="/data/files/report.csv" />
                    </div>
                </CollapsibleSection>

                {/* TIER 2: FORMAT & PARSING */}
                <CollapsibleSection icon={FileType} title="Format & Parsing">
                    <SelectField 
                        label="File Format" 
                        value={config.format || 'AUTO'} 
                        onChange={(v: string) => onChange('format', v)} 
                        options={[
                            {label: 'Auto Detect', value: 'AUTO'},
                            {label: 'Text / String', value: 'TEXT'},
                            {label: 'JSON', value: 'JSON'},
                            {label: 'CSV / Excel', value: 'CSV'},
                            {label: 'Binary / Buffer', value: 'BINARY'},
                            {label: 'PDF (Text Extract)', value: 'PDF'}
                        ]} 
                    />
                    <div className="grid grid-cols-2 gap-4 mt-3">
                        <SelectField label="Encoding" value={config.encoding || 'utf8'} onChange={(v: string) => onChange('encoding', v)} options={[{label: 'UTF-8', value: 'utf8'}, {label: 'Base64', value: 'base64'}, {label: 'ASCII', value: 'ascii'}, {label: 'Hex', value: 'hex'}]} />
                        <ToggleField label="Trim Whitespace" value={config.trim} onChange={(v: boolean) => onChange('trim', v)} />
                    </div>
                    {config.format === 'CSV' && (
                        <div className="mt-3 p-3 bg-nexus-900/50 rounded border border-nexus-800">
                            <InputField label="Delimiter" value={config.delimiter} onChange={(v: string) => onChange('delimiter', v)} placeholder="," />
                            <ToggleField label="Has Headers" value={config.headers} onChange={(v: boolean) => onChange('headers', v)} className="mt-2" />
                        </div>
                    )}
                </CollapsibleSection>

                {/* TIER 3: ERROR & MONITORING */}
                <CollapsibleSection icon={Activity} title="Options">
                    <ToggleField label="Fail if Missing" value={config.errorOnMissing} onChange={(v: boolean) => onChange('errorOnMissing', v)} activeColor="bg-red-500" />
                    <ToggleField label="Read Stream (Large Files)" value={config.stream} onChange={(v: boolean) => onChange('stream', v)} />
                </CollapsibleSection>
            </div>
        );
    }

    // --- 2. WRITE FILE - THE UNIVERSAL WRITER ---
    if (subtype === NexusSubtype.WRITE_BINARY_FILE) {
        return (
            <div className="space-y-2">
                {/* TIER 1: QUICK WRITE */}
                <CollapsibleSection icon={HardDrive} title="Quick Write" defaultOpen={true}>
                    <InputField label="Destination Path" value={config.filePath} onChange={(v: string) => onChange('filePath', v)} placeholder="/data/output/result.json" />
                    <div className="mt-3">
                        <TextAreaField label="File Content / Data" value={config.fileContent} onChange={(v: string) => onChange('fileContent', v)} rows={4} placeholder="{{prevNode.data}}" />
                    </div>
                </CollapsibleSection>

                {/* TIER 2: OPTIONS */}
                <CollapsibleSection icon={Settings} title="Write Options">
                    <div className="grid grid-cols-2 gap-4">
                        <SelectField label="Operation" value={config.writeMode || 'OVERWRITE'} onChange={(v: string) => onChange('writeMode', v)} options={[{label: 'Overwrite', value: 'OVERWRITE'}, {label: 'Append', value: 'APPEND'}, {label: 'Create Unique', value: 'UNIQUE'}]} />
                        <SelectField label="Encoding" value={config.encoding || 'utf8'} onChange={(v: string) => onChange('encoding', v)} options={[{label: 'UTF-8', value: 'utf8'}, {label: 'Base64', value: 'base64'}, {label: 'Binary', value: 'binary'}]} />
                    </div>
                    <div className="mt-3">
                        <ToggleField label="Create Missing Folders" value={config.createDir} onChange={(v: boolean) => onChange('createDir', v)} />
                        <ToggleField label="Backup Existing File" value={config.backup} onChange={(v: boolean) => onChange('backup', v)} className="mt-2" />
                    </div>
                </CollapsibleSection>

                {/* TIER 3: COMPRESSION */}
                <CollapsibleSection icon={Archive} title="Compression">
                    <ToggleField label="Compress Output" value={config.compress} onChange={(v: boolean) => onChange('compress', v)} />
                    {config.compress && (
                        <div className="mt-2">
                            <SelectField label="Format" value={config.compressFormat || 'GZIP'} onChange={(v: string) => onChange('compressFormat', v)} options={[{label: 'Gzip', value: 'GZIP'}, {label: 'Zip', value: 'ZIP'}, {label: 'Deflate', value: 'DEFLATE'}]} />
                        </div>
                    )}
                </CollapsibleSection>
            </div>
        );
    }

    // --- 3. FTP/SFTP - THE TRANSFER PROTOCOL ---
    if (subtype === NexusSubtype.FTP) {
        return (
            <div className="space-y-2">
                {/* TIER 1 & 2: CONNECTION */}
                <CollapsibleSection icon={Server} title="Connection" defaultOpen={true}>
                    <div className="grid grid-cols-3 gap-2">
                        <div className="col-span-2">
                            <InputField label="Host" value={config.host} onChange={(v: string) => onChange('host', v)} placeholder="ftp.example.com" />
                        </div>
                        <InputField label="Port" value={config.port} onChange={(v: string) => onChange('port', v)} placeholder="22" />
                    </div>
                    <div className="grid grid-cols-2 gap-4 mt-3">
                        <SelectField label="Protocol" value={config.protocol || 'SFTP'} onChange={(v: string) => onChange('protocol', v)} options={[{label: 'SFTP (SSH)', value: 'SFTP'}, {label: 'FTP', value: 'FTP'}, {label: 'FTPS (Implicit)', value: 'FTPS'}, {label: 'FTPES (Explicit)', value: 'FTPES'}]} />
                        <SelectField label="Auth Type" value={config.authType || 'PASSWORD'} onChange={(v: string) => onChange('authType', v)} options={[{label: 'Password', value: 'PASSWORD'}, {label: 'Private Key', value: 'KEY'}]} />
                    </div>
                    <div className="grid grid-cols-2 gap-4 mt-3">
                        <InputField label="Username" value={config.username} onChange={(v: string) => onChange('username', v)} />
                        {config.authType === 'PASSWORD' ? (
                            <InputField label="Password" type="password" value={config.password} onChange={(v: string) => onChange('password', v)} />
                        ) : (
                            <div>
                                <TextAreaField label="Private Key" value={config.privateKey} onChange={(v: string) => onChange('privateKey', v)} rows={3} placeholder="-----BEGIN..." />
                                <InputField label="Passphrase" type="password" value={config.passphrase} onChange={(v: string) => onChange('passphrase', v)} className="mt-2" />
                            </div>
                        )}
                    </div>
                    <div className="mt-3">
                        <ToggleField label="Secure (Ignore Cert Errors)" value={config.ignoreCert} onChange={(v: boolean) => onChange('ignoreCert', v)} activeColor="bg-yellow-500" />
                    </div>
                </CollapsibleSection>

                {/* TIER 3 & 4: OPERATIONS */}
                <CollapsibleSection icon={RefreshCw} title="File Operations">
                    <SelectField 
                        label="Action" 
                        value={config.operation || 'LIST'} 
                        onChange={(v: string) => onChange('operation', v)} 
                        options={[
                            {label: 'List Files', value: 'LIST'},
                            {label: 'Upload File', value: 'UPLOAD'},
                            {label: 'Download File', value: 'DOWNLOAD'},
                            {label: 'Delete', value: 'DELETE'},
                            {label: 'Create Directory', value: 'MKDIR'},
                            {label: 'Rename / Move', value: 'RENAME'},
                            {label: 'Sync Directory', value: 'SYNC'}
                        ]} 
                    />
                    
                    <div className="mt-3">
                        <InputField label="Remote Path" value={config.remotePath} onChange={(v: string) => onChange('remotePath', v)} placeholder="/var/www/html/file.txt" />
                    </div>

                    {(config.operation === 'UPLOAD' || config.operation === 'SYNC') && (
                        <div className="mt-3">
                            <InputField label="Local Path / Content" value={config.localPath} onChange={(v: string) => onChange('localPath', v)} placeholder="./data/file.txt" />
                        </div>
                    )}

                    {config.operation === 'RENAME' && (
                        <div className="mt-3">
                            <InputField label="New Path / Destination" value={config.destPath} onChange={(v: string) => onChange('destPath', v)} placeholder="/var/www/html/newname.txt" />
                        </div>
                    )}

                    {config.operation === 'SYNC' && (
                        <div className="mt-3 border-t border-nexus-800/50 pt-3">
                            <SelectField label="Sync Direction" value={config.syncDir || 'LOCAL_TO_REMOTE'} onChange={(v: string) => onChange('syncDir', v)} options={[{label: 'Local → Remote', value: 'LOCAL_TO_REMOTE'}, {label: 'Remote → Local', value: 'REMOTE_TO_LOCAL'}]} />
                            <div className="mt-2">
                                <ToggleField label="Delete Extra Files" value={config.deleteExtra} onChange={(v: boolean) => onChange('deleteExtra', v)} activeColor="bg-red-500" />
                            </div>
                        </div>
                    )}

                    {config.operation === 'UPLOAD' && (
                        <div className="grid grid-cols-2 gap-4 mt-3">
                            <ToggleField label="Overwrite" value={config.overwrite ?? true} onChange={(v: boolean) => onChange('overwrite', v)} />
                            <ToggleField label="Create Directories" value={config.createDirs ?? true} onChange={(v: boolean) => onChange('createDirs', v)} />
                        </div>
                    )}
                    
                    {config.operation === 'LIST' && (
                        <div className="grid grid-cols-2 gap-4 mt-3">
                            <ToggleField label="Recursive" value={config.recursive} onChange={(v: boolean) => onChange('recursive', v)} />
                            <ToggleField label="Show Hidden" value={config.showHidden} onChange={(v: boolean) => onChange('showHidden', v)} />
                        </div>
                    )}
                </CollapsibleSection>

                {/* TIER 5: PERFORMANCE */}
                <CollapsibleSection icon={Settings} title="Performance">
                    <InputField label="Timeout (ms)" type="number" value={config.timeout} onChange={(v: string) => onChange('timeout', parseInt(v))} placeholder="30000" />
                    <div className="mt-3">
                        <ToggleField label="Keep Connection Alive" value={config.keepAlive} onChange={(v: boolean) => onChange('keepAlive', v)} />
                    </div>
                </CollapsibleSection>
            </div>
        );
    }

    // --- 4. AWS S3 - THE CLOUD GIANT ---
    if (subtype === NexusSubtype.AWS_S3) {
        return (
            <div className="space-y-2">
                {/* TIER 1: QUICK OPERATION */}
                <CollapsibleSection icon={UploadCloud} title="S3 Operation" defaultOpen={true}>
                    <SelectField 
                        label="Action" 
                        value={config.operation || 'UPLOAD'} 
                        onChange={(v: string) => onChange('operation', v)} 
                        options={[
                            {label: 'Upload File', value: 'UPLOAD'},
                            {label: 'Download File', value: 'DOWNLOAD'},
                            {label: 'List Objects', value: 'LIST'},
                            {label: 'Delete Object', value: 'DELETE'},
                            {label: 'Get Signed URL', value: 'SIGNED_URL'},
                            {label: 'Copy Object', value: 'COPY'},
                            {label: 'Create Bucket', value: 'CREATE_BUCKET'},
                            {label: 'Delete Bucket', value: 'DELETE_BUCKET'}
                        ]} 
                    />
                    <div className="grid grid-cols-2 gap-4 mt-3">
                        <InputField label="Bucket Name" value={config.bucket} onChange={(v: string) => onChange('bucket', v)} placeholder="my-app-assets" />
                        <InputField label="Region" value={config.region} onChange={(v: string) => onChange('region', v)} placeholder="us-east-1" />
                    </div>
                    
                    {!['CREATE_BUCKET', 'DELETE_BUCKET', 'LIST'].includes(config.operation) && (
                        <div className="mt-3">
                            <InputField label="Key (File Path)" value={config.key} onChange={(v: string) => onChange('key', v)} placeholder="uploads/image.png" />
                        </div>
                    )}
                </CollapsibleSection>

                {/* TIER 2: UPLOAD OPERATIONS */}
                {config.operation === 'UPLOAD' && (
                    <CollapsibleSection icon={Settings} title="Upload Settings">
                        <TextAreaField label="File Content / Binary" value={config.fileContent} onChange={(v: string) => onChange('fileContent', v)} rows={3} placeholder="{{input.data}}" />
                        
                        <div className="grid grid-cols-2 gap-4 mt-3">
                            <SelectField label="Storage Class" value={config.storageClass || 'STANDARD'} onChange={(v: string) => onChange('storageClass', v)} options={[{label: 'Standard', value: 'STANDARD'}, {label: 'Intelligent Tiering', value: 'INTELLIGENT_TIERING'}, {label: 'Standard IA', value: 'STANDARD_IA'}, {label: 'Glacier', value: 'GLACIER'}]} />
                            <SelectField label="ACL (Permissions)" value={config.acl || 'private'} onChange={(v: string) => onChange('acl', v)} options={[{label: 'Private', value: 'private'}, {label: 'Public Read', value: 'public-read'}, {label: 'Authenticated Read', value: 'authenticated-read'}]} />
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4 mt-3">
                            <SelectField label="Encryption" value={config.encryption || 'NONE'} onChange={(v: string) => onChange('encryption', v)} options={[{label: 'None', value: 'NONE'}, {label: 'AES-256', value: 'AES256'}, {label: 'AWS KMS', value: 'aws:kms'}]} />
                            <InputField label="Content-Type" value={config.contentType} onChange={(v: string) => onChange('contentType', v)} placeholder="Auto-detect" />
                        </div>

                        <div className="mt-3 pt-3 border-t border-nexus-800/50">
                            <KeyValueList title="Metadata" items={config.metadata || []} onChange={(items: any[]) => onChange('metadata', items)} />
                        </div>
                    </CollapsibleSection>
                )}

                {/* TIER 3: LISTING */}
                {config.operation === 'LIST' && (
                    <CollapsibleSection icon={Filter} title="Listing Filters">
                        <InputField label="Prefix (Folder)" value={config.prefix} onChange={(v: string) => onChange('prefix', v)} placeholder="uploads/" />
                        <div className="grid grid-cols-2 gap-4 mt-3">
                            <InputField label="Max Keys" type="number" value={config.maxKeys} onChange={(v: string) => onChange('maxKeys', parseInt(v))} placeholder="1000" />
                            <InputField label="Delimiter" value={config.delimiter} onChange={(v: string) => onChange('delimiter', v)} placeholder="/" />
                        </div>
                        <div className="mt-3">
                            <ToggleField label="Fetch All (Paginate)" value={config.paginate} onChange={(v: boolean) => onChange('paginate', v)} />
                        </div>
                    </CollapsibleSection>
                )}

                {/* TIER 4: ADVANCED */}
                {(config.operation === 'SIGNED_URL' || config.operation === 'COPY') && (
                    <CollapsibleSection icon={Shield} title="Advanced Config">
                        {config.operation === 'SIGNED_URL' && (
                            <>
                                <SelectField label="URL Type" value={config.urlOperation || 'getObject'} onChange={(v: string) => onChange('urlOperation', v)} options={[{label: 'Read (Download)', value: 'getObject'}, {label: 'Write (Upload)', value: 'putObject'}]} />
                                <InputField label="Expires In (Seconds)" type="number" value={config.expires} onChange={(v: string) => onChange('expires', parseInt(v))} placeholder="3600" className="mt-3" />
                            </>
                        )}
                        {config.operation === 'COPY' && (
                            <>
                                <InputField label="Source Bucket" value={config.sourceBucket} onChange={(v: string) => onChange('sourceBucket', v)} placeholder="source-bucket" />
                                <InputField label="Source Key" value={config.sourceKey} onChange={(v: string) => onChange('sourceKey', v)} placeholder="source/file.txt" className="mt-2" />
                            </>
                        )}
                    </CollapsibleSection>
                )}

                {/* TIER 5: PERFORMANCE */}
                <CollapsibleSection icon={Activity} title="Performance">
                    <ToggleField label="Transfer Acceleration" value={config.accelerate} onChange={(v: boolean) => onChange('accelerate', v)} description="Use AWS Edge locations." />
                    <ToggleField label="Request Payer" value={config.requestPayer} onChange={(v: boolean) => onChange('requestPayer', v)} description="Requester pays for data transfer." />
                </CollapsibleSection>
            </div>
        );
    }

    // --- 5. MYSQL & POSTGRES - THE RELATIONAL MASTERS ---
    if (subtype === NexusSubtype.MYSQL || subtype === NexusSubtype.POSTGRES) {
        return (
            <div className="space-y-2">
                {/* TIER 1: QUICK QUERY */}
                <CollapsibleSection icon={Database} title="Quick Query" defaultOpen={true}>
                    <SelectField 
                        label="Operation" 
                        value={config.operation || 'QUERY'} 
                        onChange={(v: string) => onChange('operation', v)} 
                        options={[
                            {label: 'Execute Query', value: 'QUERY'},
                            {label: 'Insert Rows', value: 'INSERT'},
                            {label: 'Update Rows', value: 'UPDATE'},
                            {label: 'Delete Rows', value: 'DELETE'},
                            {label: 'Upsert (Insert/Update)', value: 'UPSERT'}
                        ]} 
                    />
                    <div className="mt-3 grid grid-cols-2 gap-4">
                        <InputField label="Host" value={config.host} onChange={(v: string) => onChange('host', v)} placeholder="localhost" />
                        <InputField label="Database" value={config.database} onChange={(v: string) => onChange('database', v)} placeholder="my_db" />
                    </div>
                    {config.operation === 'QUERY' && (
                        <div className="mt-3">
                            <TextAreaField label="SQL Query" value={config.query} onChange={(v: string) => onChange('query', v)} rows={4} placeholder="SELECT * FROM users WHERE active = 1" />
                        </div>
                    )}
                </CollapsibleSection>

                {/* TIER 2: CONNECTION MANAGEMENT */}
                <CollapsibleSection icon={Server} title="Connection Details">
                    <div className="grid grid-cols-3 gap-2">
                        <div className="col-span-2">
                            <InputField label="Host" value={config.host} onChange={(v: string) => onChange('host', v)} placeholder="127.0.0.1" />
                        </div>
                        <InputField label="Port" value={config.port} onChange={(v: string) => onChange('port', v)} placeholder={subtype === NexusSubtype.POSTGRES ? "5432" : "3306"} />
                    </div>
                    <div className="grid grid-cols-2 gap-4 mt-3">
                        <InputField label="Username" value={config.user} onChange={(v: string) => onChange('user', v)} />
                        <InputField label="Password" type="password" value={config.password} onChange={(v: string) => onChange('password', v)} />
                    </div>
                    <div className="mt-3">
                        <InputField label="Database Name" value={config.database} onChange={(v: string) => onChange('database', v)} />
                        {subtype === NexusSubtype.POSTGRES && (
                            <InputField label="Schema" value={config.schema} onChange={(v: string) => onChange('schema', v)} placeholder="public" className="mt-2" />
                        )}
                    </div>
                    
                    <div className="mt-3 border-t border-nexus-800/50 pt-3">
                        <ToggleField label="Require SSL/TLS" value={config.ssl} onChange={(v: boolean) => onChange('ssl', v)} />
                        {config.ssl && (
                            <div className="mt-2 space-y-2 animate-in slide-in-from-top-1">
                                <TextAreaField label="CA Certificate" value={config.sslCa} onChange={(v: string) => onChange('sslCa', v)} rows={2} placeholder="-----BEGIN CERTIFICATE-----" />
                                <ToggleField label="Reject Unauthorized" value={config.sslRejectUnauthorized ?? true} onChange={(v: boolean) => onChange('sslRejectUnauthorized', v)} />
                            </div>
                        )}
                    </div>

                    <div className="grid grid-cols-2 gap-4 mt-3">
                        <InputField label="Connection Limit" type="number" value={config.connectionLimit} onChange={(v: string) => onChange('connectionLimit', parseInt(v))} placeholder="10" />
                        <InputField label="Connect Timeout (ms)" type="number" value={config.connectTimeout} onChange={(v: string) => onChange('connectTimeout', parseInt(v))} placeholder="10000" />
                    </div>
                </CollapsibleSection>

                {/* TIER 3: QUERY OPERATIONS */}
                {config.operation !== 'QUERY' && (
                    <CollapsibleSection icon={Table} title="Query Builder">
                        <InputField label="Table Name" value={config.table} onChange={(v: string) => onChange('table', v)} placeholder="users" />
                        
                        {(config.operation === 'INSERT' || config.operation === 'UPSERT') && (
                            <div className="mt-3">
                                <SelectField label="Data Source" value={config.dataMode || 'JSON'} onChange={(v: string) => onChange('dataMode', v)} options={[{label: 'JSON / Array', value: 'JSON'}, {label: 'Form Fields', value: 'FORM'}]} />
                                {config.dataMode === 'FORM' ? (
                                    <KeyValueList title="Columns & Values" items={config.values || []} onChange={(items: any[]) => onChange('values', items)} keyPlaceholder="Column" valPlaceholder="Value" />
                                ) : (
                                    <TextAreaField label="Data (JSON)" value={config.jsonData} onChange={(v: string) => onChange('jsonData', v)} rows={4} placeholder='[{"name": "Alice", "age": 30}]' />
                                )}
                                <ToggleField label="Ignore Duplicates" value={config.ignoreDuplicates} onChange={(v: boolean) => onChange('ignoreDuplicates', v)} className="mt-2" />
                            </div>
                        )}

                        {(config.operation === 'UPDATE' || config.operation === 'DELETE' || config.operation === 'UPSERT') && (
                            <div className="mt-3">
                                {config.operation === 'UPDATE' && (
                                    <KeyValueList title="Set Values" items={config.values || []} onChange={(items: any[]) => onChange('values', items)} keyPlaceholder="Column" valPlaceholder="New Value" />
                                )}
                                {config.operation !== 'INSERT' && (
                                    <div className="mt-3 border-t border-nexus-800/50 pt-3">
                                        <label className="text-[10px] font-bold text-gray-500 uppercase mb-2">Conditions (WHERE)</label>
                                        <RuleList rules={config.conditions || []} onChange={(r: any) => onChange('conditions', r)} />
                                    </div>
                                )}
                            </div>
                        )}
                        
                        {(config.operation === 'UPSERT' && subtype === NexusSubtype.POSTGRES) && (
                            <InputField label="Conflict Target (Columns)" value={config.conflictTarget} onChange={(v: string) => onChange('conflictTarget', v)} placeholder="id, email" className="mt-3" />
                        )}
                    </CollapsibleSection>
                )}

                {/* TIER 4: ADVANCED SQL */}
                <CollapsibleSection icon={Shield} title="Advanced SQL">
                    <ToggleField label="Use Transaction" value={config.transaction} onChange={(v: boolean) => onChange('transaction', v)} description="Wrap query in BEGIN/COMMIT." />
                    <ToggleField label="Multiple Statements" value={config.multipleStatements} onChange={(v: boolean) => onChange('multipleStatements', v)} />
                    
                    <div className="mt-3">
                        <SelectField label="Stored Procedure" value={config.procName || ''} onChange={(v: string) => onChange('procName', v)} options={[{label: 'None', value: ''}, {label: 'Call Procedure', value: 'CALL'}]} />
                        {config.procName === 'CALL' && (
                            <div className="mt-2">
                                <InputField label="Procedure Name" value={config.procedure} onChange={(v: string) => onChange('procedure', v)} placeholder="sp_get_users" />
                                <InputField label="Parameters (CSV)" value={config.params} onChange={(v: string) => onChange('params', v)} placeholder="1, 'active'" />
                            </div>
                        )}
                    </div>
                </CollapsibleSection>

                {/* TIER 5: PERFORMANCE */}
                <CollapsibleSection icon={Activity} title="Performance & Monitoring">
                    <ToggleField label="Stream Results" value={config.streamResults} onChange={(v: boolean) => onChange('streamResults', v)} description="Better for large datasets." />
                    <div className="grid grid-cols-2 gap-4 mt-3">
                        <InputField label="Max Rows (Limit)" type="number" value={config.limit} onChange={(v: string) => onChange('limit', parseInt(v))} placeholder="1000" />
                        <InputField label="Offset" type="number" value={config.offset} onChange={(v: string) => onChange('offset', parseInt(v))} placeholder="0" />
                    </div>
                    <div className="mt-3">
                        <ToggleField label="Explain Query" value={config.explain} onChange={(v: boolean) => onChange('explain', v)} description="Return execution plan." />
                    </div>
                </CollapsibleSection>
            </div>
        );
    }

    // --- 5. GOOGLE DRIVE - THE COLLABORATION HUB ---
    if (subtype === NexusSubtype.GOOGLE_DRIVE || subtype === NexusSubtype.DRIVE_UPLOAD) {
        return (
            <div className="space-y-2">
                {/* TIER 1: QUICK OPERATION */}
                <CollapsibleSection icon={Cloud} title="Quick Operation" defaultOpen={true}>
                    <SelectField 
                        label="Action" 
                        value={config.operation || 'UPLOAD'} 
                        onChange={(v: string) => onChange('operation', v)} 
                        options={[
                            {label: 'Upload File', value: 'UPLOAD'},
                            {label: 'Download File', value: 'DOWNLOAD'},
                            {label: 'List Files', value: 'LIST'},
                            {label: 'Create Folder', value: 'CREATE_FOLDER'},
                            {label: 'Delete File/Folder', value: 'DELETE'},
                            {label: 'Move / Copy', value: 'MOVE'},
                            {label: 'Add Permissions (Share)', value: 'SHARE'},
                            {label: 'Create Doc/Sheet', value: 'CREATE_DOC'}
                        ]} 
                    />
                    
                    {/* Dynamic Inputs based on Op */}
                    {['DOWNLOAD', 'DELETE', 'MOVE', 'SHARE'].includes(config.operation) && (
                        <div className="mt-3">
                            <InputField label="File ID" value={config.fileId} onChange={(v: string) => onChange('fileId', v)} placeholder="1A2B3C..." />
                        </div>
                    )}
                    
                    {['UPLOAD', 'CREATE_FOLDER', 'MOVE', 'CREATE_DOC'].includes(config.operation) && (
                        <div className="mt-3">
                            <InputField label="Parent Folder ID" value={config.parentId} onChange={(v: string) => onChange('parentId', v)} placeholder="root" />
                        </div>
                    )}
                </CollapsibleSection>

                {/* TIER 2: UPLOAD & CREATE */}
                {config.operation === 'UPLOAD' && (
                    <CollapsibleSection icon={UploadCloud} title="Upload Details">
                        <InputField label="Filename" value={config.fileName} onChange={(v: string) => onChange('fileName', v)} />
                        <div className="mt-3">
                            <TextAreaField label="File Content (Text/Base64)" value={config.fileContent} onChange={(v: string) => onChange('fileContent', v)} rows={3} />
                        </div>
                        <div className="grid grid-cols-2 gap-4 mt-3">
                            <InputField label="MIME Type" value={config.mimeType} onChange={(v: string) => onChange('mimeType', v)} placeholder="Auto" />
                            <ToggleField label="Convert to G-Doc" value={config.convert} onChange={(v: boolean) => onChange('convert', v)} />
                        </div>
                    </CollapsibleSection>
                )}

                {/* TIER 3: SEARCH & LIST */}
                {config.operation === 'LIST' && (
                    <CollapsibleSection icon={Search} title="Search Query">
                        <TextAreaField 
                            label="Query (q parameter)" 
                            value={config.query} 
                            onChange={(v: string) => onChange('query', v)} 
                            rows={3} 
                            placeholder="name contains 'invoice' and mimeType = 'application/pdf'" 
                            hint="Google Drive Query Language"
                        />
                        <div className="grid grid-cols-2 gap-4 mt-3">
                            <SelectField label="Order By" value={config.orderBy || 'modifiedTime desc'} onChange={(v: string) => onChange('orderBy', v)} options={[{label: 'Modified (Newest)', value: 'modifiedTime desc'}, {label: 'Name (A-Z)', value: 'name'}]} />
                            <InputField label="Limit" type="number" value={config.limit} onChange={(v: string) => onChange('limit', parseInt(v))} placeholder="100" />
                        </div>
                        <ToggleField label="Include Trashed" value={config.trashed} onChange={(v: boolean) => onChange('trashed', v)} className="mt-3" />
                    </CollapsibleSection>
                )}

                {/* TIER 4: PERMISSIONS & SHARING */}
                {config.operation === 'SHARE' && (
                    <CollapsibleSection icon={Share2} title="Sharing">
                        <SelectField label="Role" value={config.role || 'reader'} onChange={(v: string) => onChange('role', v)} options={[{label: 'Viewer', value: 'reader'}, {label: 'Commenter', value: 'commenter'}, {label: 'Editor', value: 'writer'}, {label: 'Owner', value: 'owner'}]} />
                        <SelectField label="Type" value={config.shareType || 'user'} onChange={(v: string) => onChange('shareType', v)} options={[{label: 'User', value: 'user'}, {label: 'Group', value: 'group'}, {label: 'Domain', value: 'domain'}, {label: 'Anyone', value: 'anyone'}]} />
                        {config.shareType !== 'anyone' && (
                            <div className="mt-3">
                                <InputField label="Email Address" value={config.emailAddress} onChange={(v: string) => onChange('emailAddress', v)} />
                            </div>
                        )}
                        <ToggleField label="Send Notification Email" value={config.notify} onChange={(v: boolean) => onChange('notify', v)} className="mt-3" />
                    </CollapsibleSection>
                )}

                {/* TIER 5: WORKSPACE OPS */}
                {config.operation === 'CREATE_DOC' && (
                    <CollapsibleSection icon={FileText} title="Google Docs/Sheets">
                        <InputField label="Title" value={config.fileName} onChange={(v: string) => onChange('fileName', v)} />
                        <SelectField label="Type" value={config.docType || 'document'} onChange={(v: string) => onChange('docType', v)} options={[{label: 'Google Doc', value: 'document'}, {label: 'Google Sheet', value: 'spreadsheet'}, {label: 'Google Slide', value: 'presentation'}]} className="mt-3" />
                    </CollapsibleSection>
                )}
            </div>
        );
    }

    // --- OTHER DATABASES (SQLite, Supabase) ---
    if ([NexusSubtype.SQLITE, NexusSubtype.SUPABASE].includes(subtype)) {
        return (
            <div className="space-y-4">
                <SectionHeader icon={Database} title="Database Query" />
                <SelectField label="Operation" value={config.dbOperation || 'SELECT'} onChange={(v: string) => onChange('dbOperation', v)} options={[{label: 'Select / Find', value: 'SELECT'}, {label: 'Insert / Create', value: 'INSERT'}, {label: 'Update', value: 'UPDATE'}, {label: 'Delete', value: 'DELETE'}]} />
                <TextAreaField label="SQL Query" value={config.dbQuery} onChange={(v: string) => onChange('dbQuery', v)} rows={6} placeholder="SELECT * FROM users WHERE status = 'active';" />
            </div>
        );
    }

    return null;
};

export default StorageConfig;

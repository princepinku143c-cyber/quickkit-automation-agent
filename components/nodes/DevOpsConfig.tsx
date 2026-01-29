
import React from 'react';
import { NexusSubtype } from '../../types';
import { Terminal, GitCommit, GitPullRequest, Table, Container, Settings, AlertCircle, Play, Shield, Activity, FileText, Database, Lock, Globe, Archive, Search, Users, Zap, Box, Tag, GitMerge, Cloud, RefreshCw, Layout, Layers, HardDrive, Cpu, Command, Key, Server, UploadCloud, DownloadCloud } from 'lucide-react';
import { SectionHeader, SelectField, InputField, TextAreaField, KeyValueList, CollapsibleSection, ToggleField, RuleList, SliderField } from '../ConfigInputs';

interface DevOpsConfigProps {
    subtype: NexusSubtype;
    config: any;
    onChange: (key: string, value: any) => void;
}

const DevOpsConfig: React.FC<DevOpsConfigProps> = ({ subtype, config, onChange }) => {
    const isGithub = subtype === NexusSubtype.GITHUB;
    const isGitlab = subtype === NexusSubtype.GITLAB;
    const isJira = subtype === NexusSubtype.JIRA;
    const isDocker = subtype === NexusSubtype.DOCKER;
    const isSsh = subtype === NexusSubtype.SSH;

    // --- GITHUB (Already Upgraded) ---
    if (isGithub) {
        return (
            <div className="space-y-2">
                <CollapsibleSection icon={GitCommit} title="Quick Operation" defaultOpen={true}>
                    <SelectField
                        label="Resource"
                        value={config.resource || 'issue'}
                        onChange={(v: string) => onChange('resource', v)}
                        options={[
                            { label: 'Repository', value: 'repo' },
                            { label: 'Issue', value: 'issue' },
                            { label: 'Pull Request', value: 'pr' },
                            { label: 'Release', value: 'release' },
                            { label: 'File / Content', value: 'file' },
                            { label: 'Branch', value: 'branch' },
                            { label: 'Workflow (Actions)', value: 'workflow' },
                            { label: 'Organization', value: 'org' },
                            { label: 'Gist', value: 'gist' }
                        ]}
                    />
                    
                    <SelectField
                        label="Operation"
                        value={config.operation || 'get'}
                        onChange={(v: string) => onChange('operation', v)}
                        options={
                            config.resource === 'repo' ? [
                                { label: 'Get Info', value: 'get' }, { label: 'Create Repo', value: 'create' }, { label: 'Update Repo', value: 'update' }, { label: 'Fork Repo', value: 'fork' }, { label: 'Delete Repo', value: 'delete' }
                            ] : config.resource === 'issue' ? [
                                { label: 'Create Issue', value: 'create' }, { label: 'List Issues', value: 'list' }, { label: 'Get Issue', value: 'get' }, { label: 'Update Issue', value: 'update' }, { label: 'Add Comment', value: 'comment' }, { label: 'Lock Issue', value: 'lock' }
                            ] : config.resource === 'pr' ? [
                                { label: 'Create PR', value: 'create' }, { label: 'List PRs', value: 'list' }, { label: 'Get PR', value: 'get' }, { label: 'Review PR', value: 'review' }, { label: 'Merge PR', value: 'merge' }
                            ] : config.resource === 'file' ? [
                                { label: 'Get Content', value: 'get' }, { label: 'Create/Update', value: 'create' }, { label: 'Delete File', value: 'delete' }, { label: 'Get Tree', value: 'tree' }
                            ] : config.resource === 'branch' ? [
                                { label: 'List Branches', value: 'list' }, { label: 'Get Branch', value: 'get' }, { label: 'Create Branch', value: 'create' }, { label: 'Merge Branch', value: 'merge' }
                            ] : config.resource === 'workflow' ? [
                                { label: 'Trigger Workflow', value: 'trigger' }, { label: 'List Runs', value: 'list_runs' }, { label: 'Get Run', value: 'get_run' }, { label: 'Cancel Run', value: 'cancel' }
                            ] : [
                                { label: 'Get', value: 'get' }, { label: 'List', value: 'list' }, { label: 'Create', value: 'create' }
                            ]
                        }
                    />

                    <div className="mt-3">
                        <InputField label="Repository (owner/repo)" value={config.repo} onChange={(v: string) => onChange('repo', v)} placeholder="facebook/react" />
                    </div>
                </CollapsibleSection>

                {(['repo', 'branch', 'file'].includes(config.resource)) && (
                    <CollapsibleSection icon={Database} title="Repository & Content">
                        {config.resource === 'repo' && config.operation === 'create' && (
                            <div className="space-y-3">
                                <InputField label="Repo Name" value={config.repoName} onChange={(v: string) => onChange('repoName', v)} />
                                <TextAreaField label="Description" value={config.description} onChange={(v: string) => onChange('description', v)} rows={2} />
                                <div className="grid grid-cols-2 gap-4">
                                    <SelectField label="Visibility" value={config.visibility || 'public'} onChange={(v: string) => onChange('visibility', v)} options={[{label: 'Public', value: 'public'}, {label: 'Private', value: 'private'}]} />
                                    <ToggleField label="Init README" value={config.autoInit} onChange={(v: boolean) => onChange('autoInit', v)} />
                                </div>
                            </div>
                        )}
                        {config.resource === 'branch' && (
                            <div className="space-y-3">
                                {config.operation === 'create' && <InputField label="New Branch Name" value={config.branchName} onChange={(v: string) => onChange('branchName', v)} />}
                                <InputField label="Source/Base Branch" value={config.baseBranch || 'main'} onChange={(v: string) => onChange('baseBranch', v)} />
                            </div>
                        )}
                        {config.resource === 'file' && (
                            <div className="space-y-3">
                                <InputField label="File Path" value={config.path} onChange={(v: string) => onChange('path', v)} placeholder="src/main.ts" />
                                <InputField label="Branch" value={config.branch || 'main'} onChange={(v: string) => onChange('branch', v)} />
                                {(config.operation === 'create' || config.operation === 'delete') && (
                                    <>
                                        {config.operation === 'create' && <TextAreaField label="File Content" value={config.content} onChange={(v: string) => onChange('content', v)} rows={6} />}
                                        <InputField label="Commit Message" value={config.commitMessage} onChange={(v: string) => onChange('commitMessage', v)} />
                                    </>
                                )}
                            </div>
                        )}
                    </CollapsibleSection>
                )}

                {/* Other GitHub Tiers (Issue, PR, Workflow) inherited from previous update... shortened for brevity as they are already in the file, 
                    but in a real overwrite I must include them. I will include the full GitHub block from before plus new ones. */}
                {config.resource === 'issue' && (
                    <CollapsibleSection icon={AlertCircle} title="Issue Management">
                        {config.operation === 'list' ? (
                            <div className="space-y-3">
                                <InputField label="Filter (State/Labels)" value={config.filter} onChange={(v: string) => onChange('filter', v)} placeholder="state=open&labels=bug" />
                                <SelectField label="Sort By" value={config.sort || 'created'} onChange={(v: string) => onChange('sort', v)} options={[{label: 'Created', value: 'created'}, {label: 'Updated', value: 'updated'}, {label: 'Comments', value: 'comments'}]} />
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {config.operation !== 'create' && <InputField label="Issue Number" value={config.issueNumber} onChange={(v: string) => onChange('issueNumber', v)} placeholder="#" />}
                                {(config.operation === 'create' || config.operation === 'update') && (
                                    <>
                                        <InputField label="Title" value={config.title} onChange={(v: string) => onChange('title', v)} />
                                        <TextAreaField label="Body (Markdown)" value={config.body} onChange={(v: string) => onChange('body', v)} rows={4} />
                                        <div className="grid grid-cols-2 gap-4">
                                            <InputField label="Labels (comma sep)" value={config.labels} onChange={(v: string) => onChange('labels', v)} placeholder="bug, urgent" />
                                            <InputField label="Assignees" value={config.assignees} onChange={(v: string) => onChange('assignees', v)} />
                                        </div>
                                    </>
                                )}
                                {config.operation === 'comment' && (
                                    <TextAreaField label="Comment" value={config.comment} onChange={(v: string) => onChange('comment', v)} rows={3} />
                                )}
                            </div>
                        )}
                    </CollapsibleSection>
                )}

                {config.resource === 'pr' && (
                    <CollapsibleSection icon={GitPullRequest} title="Pull Requests">
                        {config.operation === 'create' ? (
                            <div className="space-y-3">
                                <InputField label="Title" value={config.title} onChange={(v: string) => onChange('title', v)} />
                                <div className="grid grid-cols-2 gap-4">
                                    <InputField label="Head (Source)" value={config.head} onChange={(v: string) => onChange('head', v)} placeholder="feature-branch" />
                                    <InputField label="Base (Target)" value={config.base || 'main'} onChange={(v: string) => onChange('base', v)} />
                                </div>
                                <TextAreaField label="Description" value={config.body} onChange={(v: string) => onChange('body', v)} rows={4} />
                                <ToggleField label="Draft PR" value={config.draft} onChange={(v: boolean) => onChange('draft', v)} />
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {config.operation !== 'list' && <InputField label="PR Number" value={config.prNumber} onChange={(v: string) => onChange('prNumber', v)} />}
                                {config.operation === 'merge' && (
                                    <div className="space-y-3">
                                        <SelectField label="Merge Method" value={config.mergeMethod || 'merge'} onChange={(v: string) => onChange('mergeMethod', v)} options={[{label: 'Merge Commit', value: 'merge'}, {label: 'Squash', value: 'squash'}, {label: 'Rebase', value: 'rebase'}]} />
                                        <InputField label="Commit Title" value={config.commitTitle} onChange={(v: string) => onChange('commitTitle', v)} />
                                    </div>
                                )}
                                {config.operation === 'review' && (
                                    <div className="space-y-3">
                                        <SelectField label="Action" value={config.reviewAction || 'APPROVE'} onChange={(v: string) => onChange('reviewAction', v)} options={[{label: 'Approve', value: 'APPROVE'}, {label: 'Request Changes', value: 'REQUEST_CHANGES'}, {label: 'Comment', value: 'COMMENT'}]} />
                                        <TextAreaField label="Review Body" value={config.body} onChange={(v: string) => onChange('body', v)} rows={3} />
                                    </div>
                                )}
                            </div>
                        )}
                    </CollapsibleSection>
                )}

                {(['workflow', 'release'].includes(config.resource)) && (
                    <CollapsibleSection icon={Play} title="CI/CD & Releases">
                        {config.resource === 'workflow' ? (
                            <div className="space-y-3">
                                <InputField label="Workflow ID / Filename" value={config.workflowId} onChange={(v: string) => onChange('workflowId', v)} placeholder="main.yml" />
                                {config.operation === 'trigger' && (
                                    <>
                                        <InputField label="Ref (Branch/Tag)" value={config.ref || 'main'} onChange={(v: string) => onChange('ref', v)} />
                                        <TextAreaField label="Inputs (JSON)" value={config.inputs} onChange={(v: string) => onChange('inputs', v)} placeholder='{ "env": "prod" }' rows={3} />
                                    </>
                                )}
                            </div>
                        ) : (
                            <div className="space-y-3">
                                <div className="grid grid-cols-2 gap-4">
                                    <InputField label="Tag Name" value={config.tagName} onChange={(v: string) => onChange('tagName', v)} placeholder="v1.0.0" />
                                    <InputField label="Release Name" value={config.releaseName} onChange={(v: string) => onChange('releaseName', v)} />
                                </div>
                                <TextAreaField label="Release Notes" value={config.body} onChange={(v: string) => onChange('body', v)} rows={4} />
                                <div className="grid grid-cols-2 gap-4">
                                    <ToggleField label="Prerelease" value={config.prerelease} onChange={(v: boolean) => onChange('prerelease', v)} />
                                    <ToggleField label="Draft" value={config.draft} onChange={(v: boolean) => onChange('draft', v)} />
                                </div>
                            </div>
                        )}
                    </CollapsibleSection>
                )}

                <CollapsibleSection icon={Shield} title="Advanced & Security">
                    <ToggleField label="Check Security Alerts" value={config.checkSecurity} onChange={(v: boolean) => onChange('checkSecurity', v)} activeColor="bg-red-500" />
                    <div className="mt-3 border-t border-nexus-800/50 pt-3">
                        <SelectField label="Webhook Action" value={config.webhookAction || 'NONE'} onChange={(v: string) => onChange('webhookAction', v)} options={[{label: 'No Action', value: 'NONE'}, {label: 'Create Webhook', value: 'CREATE'}, {label: 'Delete Webhook', value: 'DELETE'}]} />
                        {config.webhookAction === 'CREATE' && (
                            <div className="mt-2">
                                <InputField label="Target URL" value={config.targetUrl} onChange={(v: string) => onChange('targetUrl', v)} />
                                <InputField label="Events (comma sep)" value={config.events} onChange={(v: string) => onChange('events', v)} placeholder="push, pull_request" />
                            </div>
                        )}
                    </div>
                </CollapsibleSection>
            </div>
        );
    }

    // --- GITLAB - THE COMPLETE DEVOPS PLATFORM ---
    if (isGitlab) {
        return (
            <div className="space-y-2">
                {/* TIER 1: QUICK OPERATION */}
                <CollapsibleSection icon={GitPullRequest} title="Quick Operation" defaultOpen={true}>
                    <div className="grid grid-cols-2 gap-4">
                        <SelectField
                            label="Resource"
                            value={config.resource || 'project'}
                            onChange={(v: string) => onChange('resource', v)}
                            options={[
                                { label: 'Project', value: 'project' },
                                { label: 'Issue', value: 'issue' },
                                { label: 'Merge Request', value: 'mr' },
                                { label: 'Pipeline', value: 'pipeline' },
                                { label: 'Job', value: 'job' },
                                { label: 'Commit', value: 'commit' },
                                { label: 'Branch', value: 'branch' },
                                { label: 'Tag', value: 'tag' },
                                { label: 'File / Content', value: 'file' },
                                { label: 'Release', value: 'release' },
                                { label: 'Registry Image', value: 'registry' },
                                { label: 'User', value: 'user' },
                                { label: 'Group', value: 'group' }
                            ]}
                        />
                        <SelectField
                            label="Operation"
                            value={config.operation || 'get'}
                            onChange={(v: string) => onChange('operation', v)}
                            options={
                                config.resource === 'project' ? [
                                    { label: 'Get', value: 'get' }, { label: 'Create', value: 'create' }, { label: 'Update', value: 'update' }, { label: 'Delete', value: 'delete' }, { label: 'List', value: 'list' }
                                ] : config.resource === 'issue' ? [
                                    { label: 'Create', value: 'create' }, { label: 'Update', value: 'update' }, { label: 'List', value: 'list' }, { label: 'Add Comment', value: 'comment' }
                                ] : config.resource === 'mr' ? [
                                    { label: 'Create', value: 'create' }, { label: 'Approve', value: 'approve' }, { label: 'Merge', value: 'merge' }, { label: 'List', value: 'list' }
                                ] : config.resource === 'pipeline' ? [
                                    { label: 'Trigger', value: 'trigger' }, { label: 'Get Status', value: 'get' }, { label: 'List', value: 'list' }, { label: 'Cancel', value: 'cancel' }, { label: 'Retry', value: 'retry' }
                                ] : config.resource === 'registry' ? [
                                    { label: 'List Images', value: 'list' }, { label: 'Get Image', value: 'get' }, { label: 'Delete Image', value: 'delete' }
                                ] : [
                                    { label: 'Get', value: 'get' }, { label: 'List', value: 'list' }, { label: 'Create', value: 'create' }, { label: 'Update', value: 'update' }, { label: 'Delete', value: 'delete' }
                                ]
                            }
                        />
                    </div>
                    <div className="mt-3">
                        <InputField label="Project ID / Path" value={config.projectId} onChange={(v: string) => onChange('projectId', v)} placeholder="group/project" />
                    </div>
                </CollapsibleSection>

                {/* TIER 2: PROJECT & REPO */}
                {(['project', 'branch', 'file', 'commit'].includes(config.resource)) && (
                    <CollapsibleSection icon={Database} title="Repository Management">
                        {config.resource === 'project' && config.operation === 'create' && (
                            <div className="space-y-3">
                                <InputField label="Project Name" value={config.projectName} onChange={(v: string) => onChange('projectName', v)} />
                                <div className="grid grid-cols-2 gap-4">
                                    <InputField label="Path (Slug)" value={config.path} onChange={(v: string) => onChange('path', v)} />
                                    <SelectField label="Visibility" value={config.visibility || 'private'} onChange={(v: string) => onChange('visibility', v)} options={[{label:'Private', value:'private'}, {label:'Internal', value:'internal'}, {label:'Public', value:'public'}]} />
                                </div>
                                <TextAreaField label="Description" value={config.description} onChange={(v: string) => onChange('description', v)} rows={2} />
                                <div className="grid grid-cols-2 gap-4">
                                    <ToggleField label="Init README" value={config.initReadme} onChange={(v: boolean) => onChange('initReadme', v)} />
                                    <ToggleField label="Enable CI/CD" value={config.enableCicd} onChange={(v: boolean) => onChange('enableCicd', v)} />
                                </div>
                            </div>
                        )}
                        {config.resource === 'branch' && (
                            <div className="space-y-3">
                                <InputField label="Branch Name" value={config.branch} onChange={(v: string) => onChange('branch', v)} />
                                {config.operation === 'create' && <InputField label="Ref (Source)" value={config.ref} onChange={(v: string) => onChange('ref', v)} placeholder="main" />}
                            </div>
                        )}
                        {config.resource === 'file' && (
                            <div className="space-y-3">
                                <InputField label="File Path" value={config.filePath} onChange={(v: string) => onChange('filePath', v)} />
                                <InputField label="Branch" value={config.branch} onChange={(v: string) => onChange('branch', v)} placeholder="main" />
                                {['create', 'update'].includes(config.operation) && (
                                    <>
                                        <TextAreaField label="Content" value={config.content} onChange={(v: string) => onChange('content', v)} rows={6} />
                                        <InputField label="Commit Message" value={config.commitMsg} onChange={(v: string) => onChange('commitMsg', v)} />
                                    </>
                                )}
                            </div>
                        )}
                    </CollapsibleSection>
                )}

                {/* TIER 3: ISSUE & MR */}
                {(['issue', 'mr'].includes(config.resource)) && (
                    <CollapsibleSection icon={GitMerge} title="Issues & Merge Requests">
                        {/* Issue Fields */}
                        {config.resource === 'issue' && ['create', 'update'].includes(config.operation) && (
                            <div className="space-y-3">
                                <InputField label="Title" value={config.title} onChange={(v: string) => onChange('title', v)} />
                                <TextAreaField label="Description" value={config.description} onChange={(v: string) => onChange('description', v)} rows={4} />
                                <div className="grid grid-cols-2 gap-4">
                                    <InputField label="Labels (comma sep)" value={config.labels} onChange={(v: string) => onChange('labels', v)} />
                                    <InputField label="Assignee IDs" value={config.assignees} onChange={(v: string) => onChange('assignees', v)} />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <InputField label="Milestone ID" value={config.milestoneId} onChange={(v: string) => onChange('milestoneId', v)} />
                                    <InputField label="Due Date" value={config.dueDate} onChange={(v: string) => onChange('dueDate', v)} placeholder="YYYY-MM-DD" />
                                </div>
                            </div>
                        )}
                        {/* MR Fields */}
                        {config.resource === 'mr' && config.operation === 'create' && (
                            <div className="space-y-3">
                                <div className="grid grid-cols-2 gap-4">
                                    <InputField label="Source Branch" value={config.sourceBranch} onChange={(v: string) => onChange('sourceBranch', v)} />
                                    <InputField label="Target Branch" value={config.targetBranch} onChange={(v: string) => onChange('targetBranch', v)} placeholder="main" />
                                </div>
                                <InputField label="Title" value={config.title} onChange={(v: string) => onChange('title', v)} />
                                <TextAreaField label="Description" value={config.description} onChange={(v: string) => onChange('description', v)} rows={4} />
                                <ToggleField label="Remove Source Branch" value={config.removeSource} onChange={(v: boolean) => onChange('removeSource', v)} />
                            </div>
                        )}
                    </CollapsibleSection>
                )}

                {/* TIER 4: CI/CD */}
                {(['pipeline', 'job'].includes(config.resource)) && (
                    <CollapsibleSection icon={Play} title="CI/CD Pipelines">
                        {config.resource === 'pipeline' && (
                            <div className="space-y-3">
                                {config.operation === 'trigger' && (
                                    <>
                                        <InputField label="Ref (Branch/Tag)" value={config.ref} onChange={(v: string) => onChange('ref', v)} placeholder="main" />
                                        <KeyValueList title="Variables" items={config.variables || []} onChange={(items: any[]) => onChange('variables', items)} />
                                    </>
                                )}
                                {['get', 'cancel', 'retry'].includes(config.operation) && (
                                    <InputField label="Pipeline ID" value={config.pipelineId} onChange={(v: string) => onChange('pipelineId', v)} />
                                )}
                            </div>
                        )}
                        {config.resource === 'job' && (
                            <InputField label="Job ID" value={config.jobId} onChange={(v: string) => onChange('jobId', v)} />
                        )}
                    </CollapsibleSection>
                )}

                {/* TIER 5: RELEASE & DEPLOY */}
                {config.resource === 'release' && (
                    <CollapsibleSection icon={Archive} title="Release Management">
                        <InputField label="Tag Name" value={config.tagName} onChange={(v: string) => onChange('tagName', v)} placeholder="v1.0.0" />
                        {config.operation === 'create' && (
                            <>
                                <InputField label="Release Name" value={config.name} onChange={(v: string) => onChange('name', v)} />
                                <TextAreaField label="Release Notes" value={config.description} onChange={(v: string) => onChange('description', v)} rows={4} />
                                <div className="grid grid-cols-2 gap-4">
                                    <InputField label="Milestones" value={config.milestones} onChange={(v: string) => onChange('milestones', v)} />
                                    <InputField label="Assets JSON" value={config.assets} onChange={(v: string) => onChange('assets', v)} placeholder='[{"name":"bin","url":"..."}]' />
                                </div>
                            </>
                        )}
                    </CollapsibleSection>
                )}

                {/* TIER 6 & 7: ADVANCED & ANALYTICS */}
                <CollapsibleSection icon={Settings} title="Advanced & Analytics">
                    <div className="grid grid-cols-2 gap-4">
                        <ToggleField label="Analytics" value={config.analytics} onChange={(v: boolean) => onChange('analytics', v)} />
                        <ToggleField label="Dead Letter Queue" value={config.dlq} onChange={(v: boolean) => onChange('dlq', v)} />
                    </div>
                    {config.resource === 'group' && (
                        <InputField label="Group ID / Path" value={config.groupId} onChange={(v: string) => onChange('groupId', v)} className="mt-2" />
                    )}
                    {config.resource === 'registry' && (
                        <InputField label="Image Tag" value={config.imageTag} onChange={(v: string) => onChange('imageTag', v)} placeholder="latest" className="mt-2" />
                    )}
                </CollapsibleSection>
            </div>
        );
    }

    // --- JIRA - THE AGILE TRACKING PLATFORM ---
    if (isJira) {
        return (
            <div className="space-y-2">
                {/* TIER 1: QUICK OPERATION */}
                <CollapsibleSection icon={Table} title="Quick Operation" defaultOpen={true}>
                    <SelectField
                        label="Resource"
                        value={config.resource || 'issue'}
                        onChange={(v: string) => onChange('resource', v)}
                        options={[
                            { label: 'Issue', value: 'issue' },
                            { label: 'Project', value: 'project' },
                            { label: 'Board', value: 'board' },
                            { label: 'Sprint', value: 'sprint' },
                            { label: 'Comment', value: 'comment' }
                        ]}
                    />
                    <SelectField
                        label="Operation"
                        value={config.operation || 'create'}
                        onChange={(v: string) => onChange('operation', v)}
                        options={[
                            { label: 'Create', value: 'create' },
                            { label: 'Update', value: 'update' },
                            { label: 'Get', value: 'get' },
                            { label: 'Search (JQL)', value: 'search' },
                            { label: 'Delete', value: 'delete' },
                            { label: 'Transition', value: 'transition' }
                        ]}
                    />
                    {config.resource !== 'search' && (
                        <InputField label="Project Key / ID" value={config.projectKey} onChange={(v: string) => onChange('projectKey', v)} placeholder="PROJ" className="mt-3" />
                    )}
                </CollapsibleSection>

                {/* TIER 2: ISSUE MANAGEMENT */}
                {config.resource === 'issue' && (
                    <CollapsibleSection icon={AlertCircle} title="Issue Details">
                        {(config.operation === 'create' || config.operation === 'update') && (
                            <div className="space-y-3">
                                <div className="grid grid-cols-2 gap-4">
                                    <SelectField label="Type" value={config.issueType || 'Task'} onChange={(v: string) => onChange('issueType', v)} options={[{label: 'Story', value: 'Story'}, {label: 'Task', value: 'Task'}, {label: 'Bug', value: 'Bug'}, {label: 'Epic', value: 'Epic'}]} />
                                    <SelectField label="Priority" value={config.priority || 'Medium'} onChange={(v: string) => onChange('priority', v)} options={[{label: 'Highest', value: 'Highest'}, {label: 'High', value: 'High'}, {label: 'Medium', value: 'Medium'}, {label: 'Low', value: 'Low'}]} />
                                </div>
                                <InputField label="Summary" value={config.summary} onChange={(v: string) => onChange('summary', v)} />
                                <TextAreaField label="Description" value={config.description} onChange={(v: string) => onChange('description', v)} rows={4} />
                                <div className="grid grid-cols-2 gap-4">
                                    <InputField label="Assignee ID" value={config.assignee} onChange={(v: string) => onChange('assignee', v)} />
                                    <InputField label="Reporter ID" value={config.reporter} onChange={(v: string) => onChange('reporter', v)} placeholder="Auto" />
                                </div>
                                <div className="mt-3 pt-3 border-t border-nexus-800/50">
                                    <InputField label="Components" value={config.components} onChange={(v: string) => onChange('components', v)} />
                                    <InputField label="Labels (comma sep)" value={config.labels} onChange={(v: string) => onChange('labels', v)} className="mt-2" />
                                </div>
                            </div>
                        )}
                        {config.operation === 'transition' && (
                            <InputField label="Transition ID / Name" value={config.transitionId} onChange={(v: string) => onChange('transitionId', v)} placeholder="Done" />
                        )}
                        {config.operation === 'search' && (
                            <TextAreaField label="JQL Query" value={config.jql} onChange={(v: string) => onChange('jql', v)} rows={3} placeholder="project = 'PROJ' AND status = 'In Progress'" />
                        )}
                    </CollapsibleSection>
                )}

                {/* TIER 3: SPRINT & BOARD */}
                {(['sprint', 'board'].includes(config.resource)) && (
                    <CollapsibleSection icon={Layout} title="Agile Boards">
                        {config.resource === 'board' && (
                            <InputField label="Board ID" value={config.boardId} onChange={(v: string) => onChange('boardId', v)} />
                        )}
                        {config.resource === 'sprint' && (
                            <div className="space-y-3">
                                <InputField label="Sprint Name / ID" value={config.sprintId} onChange={(v: string) => onChange('sprintId', v)} />
                                {config.operation === 'create' && (
                                    <div className="grid grid-cols-2 gap-4">
                                        <InputField label="Start Date" value={config.startDate} onChange={(v: string) => onChange('startDate', v)} placeholder="YYYY-MM-DD" />
                                        <InputField label="End Date" value={config.endDate} onChange={(v: string) => onChange('endDate', v)} placeholder="YYYY-MM-DD" />
                                    </div>
                                )}
                            </div>
                        )}
                    </CollapsibleSection>
                )}

                {/* TIER 4 & 5: AUTOMATION & METRICS */}
                <CollapsibleSection icon={Zap} title="Automation & Metrics">
                    <ToggleField label="Trigger Webhooks" value={config.webhooks} onChange={(v: boolean) => onChange('webhooks', v)} />
                    <div className="mt-3 border-t border-nexus-800/50 pt-3">
                        <ToggleField label="Fetch Agile Metrics" value={config.metrics} onChange={(v: boolean) => onChange('metrics', v)} description="Velocity, Burndown data" />
                    </div>
                </CollapsibleSection>
            </div>
        );
    }

    // --- DOCKER - THE CONTAINER ORCHESTRATION MASTER ---
    if (isDocker) {
        return (
            <div className="space-y-2">
                {/* TIER 1: QUICK OPERATION */}
                <CollapsibleSection icon={Container} title="Quick Operation" defaultOpen={true}>
                    <div className="grid grid-cols-2 gap-4">
                        <SelectField
                            label="Resource"
                            value={config.resource || 'container'}
                            onChange={(v: string) => onChange('resource', v)}
                            options={[
                                { label: 'Container', value: 'container' },
                                { label: 'Image', value: 'image' },
                                { label: 'Volume', value: 'volume' },
                                { label: 'Network', value: 'network' },
                                { label: 'Stack (Compose)', value: 'stack' }
                            ]}
                        />
                        <SelectField
                            label="Operation"
                            value={config.operation || 'list'}
                            onChange={(v: string) => onChange('operation', v)}
                            options={
                                config.resource === 'container' ? [
                                    { label: 'List', value: 'list' }, { label: 'Create', value: 'create' }, { label: 'Start', value: 'start' }, { label: 'Stop', value: 'stop' }, { label: 'Restart', value: 'restart' }, { label: 'Exec', value: 'exec' }, { label: 'Logs', value: 'logs' }
                                ] : config.resource === 'image' ? [
                                    { label: 'List', value: 'list' }, { label: 'Pull', value: 'pull' }, { label: 'Build', value: 'build' }, { label: 'Push', value: 'push' }
                                ] : [
                                    { label: 'List', value: 'list' }, { label: 'Create', value: 'create' }, { label: 'Delete', value: 'delete' }, { label: 'Inspect', value: 'inspect' }
                                ]
                            }
                        />
                    </div>
                </CollapsibleSection>

                {/* TIER 2: CONTAINER OPS */}
                {config.resource === 'container' && (
                    <CollapsibleSection icon={Box} title="Container Config">
                        {config.operation === 'create' && (
                            <div className="space-y-3">
                                <InputField label="Image" value={config.image} onChange={(v: string) => onChange('image', v)} placeholder="nginx:latest" />
                                <InputField label="Container Name" value={config.containerName} onChange={(v: string) => onChange('containerName', v)} />
                                <KeyValueList title="Port Mappings (Host:Container)" items={config.ports || []} onChange={(items: any[]) => onChange('ports', items)} keyPlaceholder="8080" valPlaceholder="80" />
                                <KeyValueList title="Env Variables" items={config.envVars || []} onChange={(items: any[]) => onChange('envVars', items)} />
                                <div className="mt-3 pt-3 border-t border-nexus-800/50">
                                    <SelectField label="Restart Policy" value={config.restartPolicy || 'no'} onChange={(v: string) => onChange('restartPolicy', v)} options={[{label: 'No', value: 'no'}, {label: 'Always', value: 'always'}, {label: 'Unless Stopped', value: 'unless-stopped'}]} />
                                </div>
                            </div>
                        )}
                        {['start', 'stop', 'restart', 'logs', 'exec'].includes(config.operation) && (
                            <InputField label="Container ID / Name" value={config.containerId} onChange={(v: string) => onChange('containerId', v)} />
                        )}
                        {config.operation === 'exec' && (
                            <div className="mt-3">
                                <InputField label="Command" value={config.command} onChange={(v: string) => onChange('command', v)} placeholder="ls -la" />
                                <div className="grid grid-cols-2 gap-4 mt-2">
                                    <InputField label="User" value={config.user} onChange={(v: string) => onChange('user', v)} placeholder="root" />
                                    <InputField label="Working Dir" value={config.workDir} onChange={(v: string) => onChange('workDir', v)} />
                                </div>
                            </div>
                        )}
                    </CollapsibleSection>
                )}

                {/* TIER 3: IMAGE OPS */}
                {config.resource === 'image' && (
                    <CollapsibleSection icon={Layers} title="Image Management">
                        <InputField label="Image Name:Tag" value={config.image} onChange={(v: string) => onChange('image', v)} placeholder="my-app:v1" />
                        {config.operation === 'build' && (
                            <div className="space-y-3 mt-3">
                                <InputField label="Context Path" value={config.contextPath} onChange={(v: string) => onChange('contextPath', v)} placeholder="./" />
                                <InputField label="Dockerfile Path" value={config.dockerfile} onChange={(v: string) => onChange('dockerfile', v)} placeholder="Dockerfile" />
                                <KeyValueList title="Build Args" items={config.buildArgs || []} onChange={(items: any[]) => onChange('buildArgs', items)} />
                            </div>
                        )}
                        {config.operation === 'push' && (
                            <div className="mt-3">
                                <InputField label="Registry" value={config.registry} onChange={(v: string) => onChange('registry', v)} placeholder="docker.io" />
                            </div>
                        )}
                    </CollapsibleSection>
                )}

                {/* TIER 4: NETWORK & VOLUME */}
                {(['network', 'volume'].includes(config.resource)) && (
                    <CollapsibleSection icon={HardDrive} title="Storage & Net">
                        <InputField label="Name" value={config.resourceName} onChange={(v: string) => onChange('resourceName', v)} />
                        {config.resource === 'network' && config.operation === 'create' && (
                            <SelectField label="Driver" value={config.driver || 'bridge'} onChange={(v: string) => onChange('driver', v)} options={[{label: 'Bridge', value: 'bridge'}, {label: 'Overlay', value: 'overlay'}, {label: 'Host', value: 'host'}]} className="mt-3" />
                        )}
                    </CollapsibleSection>
                )}

                {/* TIER 5: MONITORING */}
                <CollapsibleSection icon={Activity} title="Monitoring & Health">
                    <ToggleField label="Health Checks" value={config.healthCheck} onChange={(v: boolean) => onChange('healthCheck', v)} />
                    <ToggleField label="Streaming Stats" value={config.streamStats} onChange={(v: boolean) => onChange('streamStats', v)} description="Real-time CPU/Mem usage." />
                </CollapsibleSection>
            </div>
        );
    }

    // --- SSH ---
    if (isSsh) {
        return (
            <div className="space-y-2">
                {/* TIER 1: QUICK CONNECT */}
                <CollapsibleSection icon={Terminal} title="Quick Connect" defaultOpen={true}>
                    <div className="grid grid-cols-2 gap-4">
                        <InputField label="Host" value={config.host} onChange={(v: string) => onChange('host', v)} placeholder="192.168.1.1" />
                        <InputField label="Port" value={config.port} onChange={(v: string) => onChange('port', v)} placeholder="22" />
                    </div>
                    <div className="grid grid-cols-2 gap-4 mt-2">
                        <InputField label="Username" value={config.username} onChange={(v: string) => onChange('username', v)} placeholder="root" />
                        <SelectField label="Auth Method" value={config.authMethod || 'key'} onChange={(v: string) => onChange('authMethod', v)} options={[{ label: 'Private Key', value: 'key' }, { label: 'Password', value: 'password' }, { label: 'Agent', value: 'agent' }]} />
                    </div>
                    <div className="mt-3">
                        <InputField label="Quick Command" value={config.command} onChange={(v: string) => onChange('command', v)} placeholder="ls -la" />
                    </div>
                </CollapsibleSection>

                {/* TIER 2: CONNECTION MANAGEMENT */}
                <CollapsibleSection icon={Settings} title="Connection Management">
                    <SelectField label="Connection Type" value={config.connType || 'DIRECT'} onChange={(v: string) => onChange('connType', v)} options={[{label: 'Direct SSH', value: 'DIRECT'}, {label: 'Jump Host / Bastion', value: 'BASTION'}, {label: 'Tunnel', value: 'TUNNEL'}]} />
                    
                    {config.authMethod === 'key' && (
                        <div className="mt-3">
                            <TextAreaField label="Private Key" value={config.privateKey} onChange={(v: string) => onChange('privateKey', v)} rows={4} placeholder="-----BEGIN OPENSSH PRIVATE KEY-----" />
                            <InputField label="Passphrase" type="password" value={config.passphrase} onChange={(v: string) => onChange('passphrase', v)} className="mt-2" />
                        </div>
                    )}
                    {config.authMethod === 'password' && (
                        <div className="mt-3">
                            <InputField label="Password" type="password" value={config.password} onChange={(v: string) => onChange('password', v)} />
                        </div>
                    )}

                    {config.connType === 'BASTION' && (
                        <div className="mt-3 p-3 bg-nexus-900/50 rounded-lg border border-nexus-800">
                            <h4 className="text-[10px] font-bold text-gray-500 uppercase mb-2">Bastion Config</h4>
                            <div className="grid grid-cols-2 gap-2">
                                <InputField label="Bastion Host" value={config.bastionHost} onChange={(v: string) => onChange('bastionHost', v)} />
                                <InputField label="Bastion User" value={config.bastionUser} onChange={(v: string) => onChange('bastionUser', v)} />
                            </div>
                        </div>
                    )}
                    
                    <div className="grid grid-cols-2 gap-4 mt-3 pt-3 border-t border-nexus-800/50">
                        <InputField label="Timeout (s)" type="number" value={config.timeout} onChange={(v: string) => onChange('timeout', parseInt(v))} placeholder="30" />
                        <ToggleField label="Keep Alive" value={config.keepAlive} onChange={(v: boolean) => onChange('keepAlive', v)} />
                    </div>
                </CollapsibleSection>

                {/* TIER 3: COMMAND EXECUTION */}
                <CollapsibleSection icon={Command} title="Command Execution">
                    <SelectField label="Execution Mode" value={config.execMode || 'COMMAND'} onChange={(v: string) => onChange('execMode', v)} options={[{label: 'Single Command', value: 'COMMAND'}, {label: 'Script File', value: 'SCRIPT_FILE'}, {label: 'Inline Script', value: 'SCRIPT_INLINE'}]} />
                    
                    {config.execMode === 'SCRIPT_INLINE' ? (
                        <div className="mt-3">
                            <TextAreaField label="Shell Script" value={config.script} onChange={(v: string) => onChange('script', v)} rows={6} placeholder="#!/bin/bash\necho 'Hello'" />
                        </div>
                    ) : config.execMode === 'SCRIPT_FILE' ? (
                        <InputField label="Script Path" value={config.scriptPath} onChange={(v: string) => onChange('scriptPath', v)} placeholder="/tmp/script.sh" className="mt-3" />
                    ) : (
                        <div className="mt-3">
                            <TextAreaField label="Command" value={config.command} onChange={(v: string) => onChange('command', v)} rows={3} />
                        </div>
                    )}

                    <div className="mt-3 grid grid-cols-2 gap-4">
                        <InputField label="Working Directory" value={config.cwd} onChange={(v: string) => onChange('cwd', v)} placeholder="/home/user" />
                        <InputField label="Environment Vars (JSON)" value={config.envVars} onChange={(v: string) => onChange('envVars', v)} placeholder='{"NODE_ENV": "prod"}' />
                    </div>
                    
                    <div className="mt-3 pt-3 border-t border-nexus-800/50">
                        <ToggleField label="Run with Sudo" value={config.sudo} onChange={(v: boolean) => onChange('sudo', v)} activeColor="bg-red-500" />
                    </div>
                </CollapsibleSection>

                {/* TIER 4: FILE OPERATIONS */}
                <CollapsibleSection icon={HardDrive} title="File Operations (SFTP)">
                    <SelectField label="Action" value={config.fileOp || 'NONE'} onChange={(v: string) => onChange('fileOp', v)} options={[{label: 'None (Command Only)', value: 'NONE'}, {label: 'Upload File', value: 'UPLOAD'}, {label: 'Download File', value: 'DOWNLOAD'}, {label: 'List Directory', value: 'LIST'}]} />
                    
                    {config.fileOp !== 'NONE' && (
                        <div className="mt-3 space-y-3">
                            <InputField label="Remote Path" value={config.remotePath} onChange={(v: string) => onChange('remotePath', v)} placeholder="/var/www/html" />
                            {config.fileOp === 'UPLOAD' && (
                                <TextAreaField label="Local Content / File Data" value={config.fileContent} onChange={(v: string) => onChange('fileContent', v)} rows={4} />
                            )}
                            <div className="grid grid-cols-2 gap-4">
                                <InputField label="Permissions (chmod)" value={config.chmod} onChange={(v: string) => onChange('chmod', v)} placeholder="755" />
                                <InputField label="Owner (chown)" value={config.chown} onChange={(v: string) => onChange('chown', v)} placeholder="www-data" />
                            </div>
                        </div>
                    )}
                </CollapsibleSection>

                {/* TIER 5: ADVANCED */}
                <CollapsibleSection icon={Cpu} title="Advanced Terminal">
                    <ToggleField label="Use PTY (Pseudo-Terminal)" value={config.pty} onChange={(v: boolean) => onChange('pty', v)} description="Required for sudo/interactive commands." />
                    <InputField label="Terminal Type" value={config.termType || 'xterm'} onChange={(v: string) => onChange('termType', v)} className="mt-2" />
                </CollapsibleSection>
            </div>
        );
    }

    return null;
};

export default DevOpsConfig;


import React, { useState } from 'react';
import { NexusSubtype } from '../../types';
import { Mail, MessageCircle, Send, Eye, Share2, Linkedin, Instagram, Youtube, Twitter, Server, Lock, Paperclip, FileText, Tag, Hash, Image as ImageIcon, Smile, ThumbsUp, Filter, Search, Trash2, Edit3, Plus, Inbox, Settings, Layout, MousePointer, Users, Archive, Bell, Volume2, Shield } from 'lucide-react';
import { SectionHeader, SelectField, InputField, TextAreaField, ToggleField, KeyValueList, CollapsibleSection, SliderField, RuleList } from '../ConfigInputs';

interface SocialConfigProps {
    subtype: NexusSubtype;
    config: any;
    onChange: (key: string, value: any) => void;
}

const SocialConfig: React.FC<SocialConfigProps> = ({ subtype, config, onChange }) => {
    const [showCC, setShowCC] = useState(false);
    const [showPreview, setShowPreview] = useState(false);

    // --- 1. EMAIL SUITE (SMTP, GMAIL, OUTLOOK, MAILGUN, IMAP) ---
    if ([NexusSubtype.EMAIL, NexusSubtype.GMAIL, NexusSubtype.OUTLOOK, NexusSubtype.MAILGUN, NexusSubtype.IMAP].includes(subtype)) {
        const isImap = subtype === NexusSubtype.IMAP;
        const isSmtp = subtype === NexusSubtype.EMAIL;
        const isMailgun = subtype === NexusSubtype.MAILGUN;
        const isGmail = subtype === NexusSubtype.GMAIL;

        return (
            <div className="space-y-2">
                {/* TIER 1: QUICK OPERATION */}
                <CollapsibleSection icon={Mail} title="Quick Operation" defaultOpen={true}>
                    {isImap ? (
                        <>
                            <SelectField 
                                label="Operation" 
                                value={config.operation || 'READ'} 
                                onChange={(v: string) => onChange('operation', v)} 
                                options={[
                                    {label: 'Read Emails', value: 'READ'},
                                    {label: 'Mark as Read', value: 'MARK_READ'},
                                    {label: 'Move to Folder', value: 'MOVE'},
                                    {label: 'Delete Email', value: 'DELETE'}
                                ]} 
                            />
                            <div className="mt-3">
                                <InputField label="Search Query" value={config.searchQuery} onChange={(v: string) => onChange('searchQuery', v)} placeholder="FROM:boss@work.com UNSEEN" />
                            </div>
                        </>
                    ) : (
                        <>
                            {(isGmail || subtype === NexusSubtype.OUTLOOK) && (
                                <SelectField 
                                    label="Action" 
                                    value={config.operation || 'SEND'} 
                                    onChange={(v: string) => onChange('operation', v)} 
                                    options={[
                                        {label: 'Send Email', value: 'SEND'},
                                        {label: 'Create Draft', value: 'DRAFT'},
                                        {label: 'Reply to Thread', value: 'REPLY'},
                                        {label: 'Read Emails', value: 'READ'},
                                        {label: 'Add Label', value: 'LABEL'},
                                        {label: 'Delete Email', value: 'DELETE'}
                                    ]} 
                                />
                            )}
                            
                            {(config.operation === 'SEND' || config.operation === 'DRAFT' || config.operation === 'REPLY' || !config.operation) && (
                                <div className="space-y-3 mt-3">
                                    <InputField label="To (Recipient)" value={config.recipient} onChange={(v: string) => onChange('recipient', v)} placeholder="user@example.com" />
                                    <InputField label="Subject" value={config.subject} onChange={(v: string) => onChange('subject', v)} placeholder="Hello there" />
                                </div>
                            )}
                        </>
                    )}
                </CollapsibleSection>

                {/* TIER 2: CONNECTION (SMTP/IMAP ONLY) */}
                {(isSmtp || isImap) && (
                    <CollapsibleSection icon={Server} title="Server Connection">
                        <div className="grid grid-cols-3 gap-2">
                            <div className="col-span-2">
                                <InputField label="Host" value={config.host} onChange={(v: string) => onChange('host', v)} placeholder={isImap ? "imap.gmail.com" : "smtp.gmail.com"} />
                            </div>
                            <InputField label="Port" value={config.port} onChange={(v: string) => onChange('port', v)} placeholder={isImap ? "993" : "587"} />
                        </div>
                        <div className="grid grid-cols-2 gap-4 mt-3">
                            <SelectField label="Security" value={config.secure || 'TLS'} onChange={(v: string) => onChange('secure', v)} options={[{label: 'STARTTLS', value: 'TLS'}, {label: 'SSL/TLS', value: 'SSL'}, {label: 'None', value: 'NONE'}]} />
                            <ToggleField label="Verify Cert" value={config.verifyCert ?? true} onChange={(v: boolean) => onChange('verifyCert', v)} />
                        </div>
                        <div className="grid grid-cols-2 gap-4 mt-3">
                            <InputField label="Username" value={config.username} onChange={(v: string) => onChange('username', v)} />
                            <InputField label="Password" type="password" value={config.password} onChange={(v: string) => onChange('password', v)} />
                        </div>
                    </CollapsibleSection>
                )}

                {/* TIER 3: COMPOSITION & CONTENT */}
                {(!isImap && (config.operation === 'SEND' || config.operation === 'DRAFT' || config.operation === 'REPLY' || !config.operation)) && (
                    <CollapsibleSection icon={FileText} title="Content & Body">
                        <div className="flex justify-between items-center mb-2">
                            <button onClick={() => setShowCC(!showCC)} className="text-[10px] text-nexus-accent hover:underline flex items-center gap-1">
                                {showCC ? '- Hide CC/BCC' : '+ Add CC/BCC'}
                            </button>
                            <SelectField label="" value={config.bodyType || 'HTML'} onChange={(v: string) => onChange('bodyType', v)} options={[{label: 'HTML', value: 'HTML'}, {label: 'Plain Text', value: 'TEXT'}]} className="w-24" />
                        </div>
                        
                        {showCC && (
                            <div className="grid grid-cols-2 gap-4 mb-3 animate-in slide-in-from-top-1">
                                <InputField label="CC" value={config.cc} onChange={(v: string) => onChange('cc', v)} />
                                <InputField label="BCC" value={config.bcc} onChange={(v: string) => onChange('bcc', v)} />
                            </div>
                        )}

                        <TextAreaField label="Message Body" value={config.content} onChange={(v: string) => onChange('content', v)} rows={8} />
                        
                        <div className="flex justify-end mt-1">
                            <button onClick={() => setShowPreview(!showPreview)} className="text-[10px] text-gray-500 hover:text-white flex items-center gap-1">
                                <Eye size={12}/> {showPreview ? 'Hide Preview' : 'Show Preview'}
                            </button>
                        </div>
                        {showPreview && config.bodyType !== 'TEXT' && (
                            <div className="p-4 bg-white text-black rounded-lg text-sm border border-gray-300 min-h-[100px] mt-2" dangerouslySetInnerHTML={{ __html: config.content || '' }} />
                        )}

                        <div className="mt-4 pt-3 border-t border-nexus-800/50">
                            <KeyValueList title="Attachments" items={config.attachments || []} onChange={(items: any[]) => onChange('attachments', items)} keyPlaceholder="Filename" valPlaceholder="URL / Base64" />
                        </div>
                    </CollapsibleSection>
                )}

                {/* TIER 4: READING & MANAGEMENT */}
                {(config.operation === 'READ' || isImap) && (
                    <CollapsibleSection icon={Filter} title="Read Filters">
                        <div className="grid grid-cols-2 gap-4">
                            <SelectField label="Status" value={config.readStatus || 'UNSEEN'} onChange={(v: string) => onChange('readStatus', v)} options={[{label: 'Unread', value: 'UNSEEN'}, {label: 'Read', value: 'SEEN'}, {label: 'All', value: 'ALL'}]} />
                            <InputField label="From Address" value={config.fromFilter} onChange={(v: string) => onChange('fromFilter', v)} />
                        </div>
                        <div className="grid grid-cols-2 gap-4 mt-3">
                            <InputField label="Max Results" type="number" value={config.limit} onChange={(v: string) => onChange('limit', parseInt(v))} placeholder="10" />
                            <ToggleField label="Download Attachments" value={config.downloadAttachments} onChange={(v: boolean) => onChange('downloadAttachments', v)} />
                        </div>
                        {isGmail && (
                            <div className="mt-3">
                                <InputField label="Label Filter" value={config.labelFilter} onChange={(v: string) => onChange('labelFilter', v)} placeholder="INBOX" />
                            </div>
                        )}
                    </CollapsibleSection>
                )}

                {/* TIER 5: PROVIDER SPECIFICS */}
                {isMailgun && (
                    <CollapsibleSection icon={Send} title="Mailgun Options">
                        <InputField label="Domain" value={config.mailgunDomain} onChange={(v: string) => onChange('mailgunDomain', v)} placeholder="mg.example.com" />
                        <SelectField label="Region" value={config.mailgunRegion || 'US'} onChange={(v: string) => onChange('mailgunRegion', v)} options={[{label: 'US', value: 'US'}, {label: 'EU', value: 'EU'}]} className="mt-3" />
                        <div className="mt-3">
                            <ToggleField label="Enable Tracking" value={config.tracking} onChange={(v: boolean) => onChange('tracking', v)} />
                        </div>
                    </CollapsibleSection>
                )}

                {(isGmail || subtype === NexusSubtype.OUTLOOK) && config.operation === 'LABEL' && (
                    <CollapsibleSection icon={Tag} title="Labeling">
                        <InputField label="Label Name" value={config.labelName} onChange={(v: string) => onChange('labelName', v)} />
                        <SelectField label="Action" value={config.labelAction || 'ADD'} onChange={(v: string) => onChange('labelAction', v)} options={[{label: 'Add Label', value: 'ADD'}, {label: 'Remove Label', value: 'REMOVE'}]} className="mt-3" />
                    </CollapsibleSection>
                )}
            </div>
        );
    }

    // --- 2. CHAT SUITE (SLACK, DISCORD, TELEGRAM, WHATSAPP) ---
    if ([NexusSubtype.SLACK, NexusSubtype.DISCORD, NexusSubtype.TELEGRAM, NexusSubtype.WHATSAPP].includes(subtype)) {
        const isSlack = subtype === NexusSubtype.SLACK;
        const isDiscord = subtype === NexusSubtype.DISCORD;
        const isTelegram = subtype === NexusSubtype.TELEGRAM;

        return (
            <div className="space-y-2">
                {/* TIER 1: QUICK MESSAGE */}
                <CollapsibleSection icon={MessageCircle} title="Quick Message" defaultOpen={true}>
                    <SelectField 
                        label="Operation" 
                        value={config.operation || 'SEND'} 
                        onChange={(v: string) => onChange('operation', v)} 
                        options={[
                            {label: 'Send Message', value: 'SEND'},
                            ...(isSlack ? [
                                {label: 'Update Message', value: 'UPDATE'},
                                {label: 'Delete Message', value: 'DELETE'},
                                {label: 'Upload File', value: 'UPLOAD'},
                                {label: 'Add Reaction', value: 'REACT'},
                                {label: 'Get History', value: 'HISTORY'},
                                {label: 'Channel Operations', value: 'CHANNEL'},
                                {label: 'User Operations', value: 'USER'}
                            ] : []),
                            ...(isTelegram ? [
                                {label: 'Send Photo', value: 'PHOTO'},
                                {label: 'Send Document', value: 'DOCUMENT'}
                            ] : [])
                        ]} 
                    />
                    
                    <div className="mt-3">
                        <InputField 
                            label={isDiscord ? "Webhook URL / Channel ID" : isTelegram ? "Chat ID" : "Channel Name / ID"} 
                            value={config.recipient} 
                            onChange={(v: string) => onChange('recipient', v)} 
                            placeholder={isSlack ? "#general, @user, or C123456" : "123456789"} 
                        />
                    </div>

                    {(config.operation === 'SEND' || config.operation === 'UPDATE' || config.operation === 'PHOTO' || !config.operation) && (
                        <div className="mt-3">
                            <TextAreaField label="Message Text" value={config.content} onChange={(v: string) => onChange('content', v)} rows={4} placeholder="Hello world! *Bold* _Italic_" />
                        </div>
                    )}
                </CollapsibleSection>

                {/* SLACK: TIER 2 - RICH MESSAGES (BLOCK KIT) */}
                {isSlack && config.operation === 'SEND' && (
                    <CollapsibleSection icon={Layout} title="Rich Formatting (Block Kit)">
                        <div className="flex gap-2 mb-2">
                            <button onClick={() => onChange('blocks', JSON.stringify([{ "type": "section", "text": { "type": "mrkdwn", "text": "Hello" } }], null, 2))} className="text-[9px] bg-nexus-900 border border-nexus-700 px-2 py-1 rounded hover:text-nexus-accent transition-colors">+ Section</button>
                            <button onClick={() => onChange('blocks', JSON.stringify([{ "type": "image", "image_url": "https://...", "alt_text": "image" }], null, 2))} className="text-[9px] bg-nexus-900 border border-nexus-700 px-2 py-1 rounded hover:text-nexus-accent transition-colors">+ Image</button>
                            <button onClick={() => onChange('blocks', JSON.stringify([{ "type": "divider" }], null, 2))} className="text-[9px] bg-nexus-900 border border-nexus-700 px-2 py-1 rounded hover:text-nexus-accent transition-colors">+ Divider</button>
                        </div>
                        <TextAreaField label="Blocks JSON" value={config.blocks} onChange={(v: string) => onChange('blocks', v)} rows={6} placeholder='[ { "type": "section", ... } ]' />
                        
                        <div className="mt-3 pt-3 border-t border-nexus-800/50">
                            <label className="text-[10px] font-bold text-gray-500 uppercase">Threading Options</label>
                            <div className="grid grid-cols-2 gap-4 mt-2">
                                <InputField label="Thread TS (Reply)" value={config.threadTs} onChange={(v: string) => onChange('threadTs', v)} placeholder="1234567890.123456" />
                                <ToggleField label="Broadcast to Channel" value={config.broadcast} onChange={(v: boolean) => onChange('broadcast', v)} />
                            </div>
                        </div>
                    </CollapsibleSection>
                )}

                {/* DISCORD: TIER 2 - EMBEDS */}
                {isDiscord && config.operation === 'SEND' && (
                    <CollapsibleSection icon={Layout} title="Rich Embeds">
                        <div className="grid grid-cols-2 gap-4">
                            <InputField label="Title" value={config.embedTitle} onChange={(v: string) => onChange('embedTitle', v)} />
                            <InputField label="Color (Hex)" value={config.embedColor} onChange={(v: string) => onChange('embedColor', v)} placeholder="#5865F2" />
                        </div>
                        <div className="mt-3">
                            <TextAreaField label="Description" value={config.embedDescription} onChange={(v: string) => onChange('embedDescription', v)} rows={3} />
                        </div>
                        <div className="grid grid-cols-2 gap-4 mt-3">
                            <InputField label="URL" value={config.embedUrl} onChange={(v: string) => onChange('embedUrl', v)} placeholder="https://..." />
                            <InputField label="Thumbnail URL" value={config.embedThumbnail} onChange={(v: string) => onChange('embedThumbnail', v)} />
                        </div>
                        <div className="mt-3 pt-3 border-t border-nexus-800/50">
                            <KeyValueList title="Fields" items={config.embedFields || []} onChange={(items: any[]) => onChange('embedFields', items)} keyPlaceholder="Name" valPlaceholder="Value" />
                        </div>
                        <div className="mt-3 pt-3 border-t border-nexus-800/50">
                            <TextAreaField label="Raw Embeds JSON (Advanced)" value={config.embeds} onChange={(v: string) => onChange('embeds', v)} rows={4} placeholder='[ { "title": "...", "fields": [...] } ]' />
                        </div>
                    </CollapsibleSection>
                )}

                {/* SLACK: TIER 3 - MANAGEMENT */}
                {isSlack && (
                    <CollapsibleSection icon={Settings} title="Management & Interaction">
                        {['UPDATE', 'DELETE', 'REACT'].includes(config.operation) && (
                            <InputField label="Message Timestamp (TS)" value={config.messageTs} onChange={(v: string) => onChange('messageTs', v)} placeholder="1620000000.000000" />
                        )}
                        {config.operation === 'REACT' && (
                            <InputField label="Emoji Name" value={config.emoji} onChange={(v: string) => onChange('emoji', v)} placeholder="thumbsup" className="mt-3" />
                        )}
                        {config.operation === 'UPLOAD' && (
                            <div className="space-y-3 mt-2">
                                <InputField label="File URL / Base64" value={config.file} onChange={(v: string) => onChange('file', v)} />
                                <InputField label="Title" value={config.title} onChange={(v: string) => onChange('title', v)} />
                                <InputField label="Initial Comment" value={config.initialComment} onChange={(v: string) => onChange('initialComment', v)} />
                            </div>
                        )}
                        {config.operation === 'CHANNEL' && (
                            <div className="space-y-3 mt-2">
                                <SelectField label="Action" value={config.channelAction || 'CREATE'} onChange={(v: string) => onChange('channelAction', v)} options={[{label: 'Create', value: 'CREATE'}, {label: 'Archive', value: 'ARCHIVE'}, {label: 'Invite Users', value: 'INVITE'}, {label: 'Set Topic', value: 'TOPIC'}]} />
                                {config.channelAction === 'CREATE' && (
                                    <ToggleField label="Private Channel" value={config.isPrivate} onChange={(v: boolean) => onChange('isPrivate', v)} />
                                )}
                            </div>
                        )}
                    </CollapsibleSection>
                )}

                {/* DISCORD: TIER 3 - BOT OVERRIDES */}
                {isDiscord && (
                    <CollapsibleSection icon={Users} title="Bot Identity & TTS">
                        <div className="grid grid-cols-2 gap-4">
                            <InputField label="Bot Username" value={config.username} onChange={(v: string) => onChange('username', v)} />
                            <InputField label="Avatar URL" value={config.avatarUrl} onChange={(v: string) => onChange('avatarUrl', v)} />
                        </div>
                        <ToggleField label="Text-to-Speech (TTS)" value={config.tts} onChange={(v: boolean) => onChange('tts', v)} className="mt-3" />
                    </CollapsibleSection>
                )}

                {/* TELEGRAM: TIER 2 - OPTIONS */}
                {isTelegram && (
                    <CollapsibleSection icon={Settings} title="Message Options">
                        <SelectField label="Parse Mode" value={config.parseMode || 'Markdown'} onChange={(v: string) => onChange('parseMode', v)} options={[{label: 'Markdown', value: 'Markdown'}, {label: 'HTML', value: 'HTML'}]} />
                        <div className="grid grid-cols-2 gap-4 mt-3">
                            <ToggleField label="Disable Notification" value={config.silent} onChange={(v: boolean) => onChange('silent', v)} />
                            <ToggleField label="Protect Content" value={config.protectContent} onChange={(v: boolean) => onChange('protectContent', v)} description="Prevent forwarding/saving" />
                        </div>
                        {(config.operation === 'PHOTO' || config.operation === 'DOCUMENT') && (
                            <div className="mt-3">
                                <InputField label="File URL / ID" value={config.fileUrl} onChange={(v: string) => onChange('fileUrl', v)} />
                                <InputField label="Caption" value={config.caption} onChange={(v: string) => onChange('caption', v)} className="mt-2" />
                            </div>
                        )}
                    </CollapsibleSection>
                )}

                {/* SLACK: TIER 4 - HISTORY & SEARCH */}
                {isSlack && config.operation === 'HISTORY' && (
                    <CollapsibleSection icon={Search} title="History Filter">
                        <div className="grid grid-cols-2 gap-4">
                            <InputField label="Limit" type="number" value={config.limit} onChange={(v: string) => onChange('limit', parseInt(v))} placeholder="100" />
                            <InputField label="Oldest TS" value={config.oldest} onChange={(v: string) => onChange('oldest', v)} />
                        </div>
                        <ToggleField label="Include Replies" value={config.includeReplies} onChange={(v: boolean) => onChange('includeReplies', v)} className="mt-3" />
                    </CollapsibleSection>
                )}
            </div>
        );
    }

    // --- 3. SOCIAL MEDIA (LINKEDIN, TWITTER, ETC) ---
    if ([NexusSubtype.LINKEDIN, NexusSubtype.TWITTER, NexusSubtype.INSTAGRAM, NexusSubtype.FACEBOOK, NexusSubtype.YOUTUBE, NexusSubtype.TIKTOK].includes(subtype)) {
        return (
            <div className="space-y-2">
                <CollapsibleSection icon={Share2} title={`${subtype} Post`} defaultOpen={true}>
                    <SelectField 
                        label="Post Type" 
                        value={config.postType || 'TEXT'} 
                        onChange={(v: string) => onChange('postType', v)} 
                        options={[
                            {label: 'Text / Status', value: 'TEXT'}, 
                            {label: 'Image / Photo', value: 'IMAGE'}, 
                            {label: 'Video', value: 'VIDEO'}
                        ]} 
                    />

                    <div className="mt-3">
                        <TextAreaField label="Caption / Text" value={config.content} onChange={(v: string) => onChange('content', v)} rows={4} />
                    </div>
                    
                    {config.postType !== 'TEXT' && (
                        <div className="mt-3">
                            <InputField label="Media URL" value={config.mediaUrl} onChange={(v: string) => onChange('mediaUrl', v)} placeholder="https://..." />
                        </div>
                    )}

                    {subtype === NexusSubtype.YOUTUBE && (
                        <div className="mt-3 space-y-3">
                            <InputField label="Video Title" value={config.title} onChange={(v: string) => onChange('title', v)} />
                            <SelectField label="Privacy" value={config.privacy || 'private'} onChange={(v: string) => onChange('privacy', v)} options={[{label: 'Public', value: 'public'}, {label: 'Private', value: 'private'}, {label: 'Unlisted', value: 'unlisted'}]} />
                            <TextAreaField label="Tags (comma sep)" value={config.tags} onChange={(v: string) => onChange('tags', v)} rows={2} />
                        </div>
                    )}
                </CollapsibleSection>
            </div>
        );
    }

    return null;
};

export default SocialConfig;

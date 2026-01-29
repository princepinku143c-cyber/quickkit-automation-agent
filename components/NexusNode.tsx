
import React, { useState, memo, useEffect } from 'react';
import { Nexus, NexusSubtype, NexusType } from '../types';
import { NEXUS_DEFINITIONS } from '../constants';
import { Settings, ChevronDown, ChevronRight, Database, Link as LinkIcon } from 'lucide-react';
import JsonTree from './JsonTree'; 

interface NexusNodeProps {
  nexus: Nexus;
  isSelected: boolean;
  onSelect: (id: string) => void;
  onDragStart: (e: React.MouseEvent, id: string) => void;
  onConnectStart: (e: React.MouseEvent, id: string, handle: string, x: number, y: number) => void; 
  onConnectEnd: (e: React.MouseEvent, id: string) => void;
  onOpenProperties: (id: string) => void;
  onUpdate: (id: string, data: Partial<Nexus>) => void;
  onContextMenu: (e: React.MouseEvent, id: string) => void;
  isConnecting?: boolean; 
}

const NexusNode: React.FC<NexusNodeProps> = memo(({ 
  nexus, isSelected, onSelect, onDragStart, onConnectStart, onConnectEnd, onOpenProperties, onUpdate, onContextMenu, isConnecting
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editLabel, setEditLabel] = useState(nexus.label);
  const [isExpanded, setIsExpanded] = useState(false);
  
  const def = NEXUS_DEFINITIONS.find(d => d.subtype === nexus.subtype) || NEXUS_DEFINITIONS[0];
  const Icon = def.icon;
  const isTrigger = nexus.type === NexusType.TRIGGER;

  // Check if any config value contains a variable interpolation {{...}}
  const hasDynamicData = Object.values(nexus.config).some(val => typeof val === 'string' && val.includes('{{') && val.includes('}}'));

  // --- AESTHETIC ENGINE ---
  const getStyles = () => {
      if (nexus.type === NexusType.TRIGGER) return { accent: 'text-nexus-wire', border: 'border-nexus-wire/30', bg: 'bg-yellow-950/10', ring: 'ring-nexus-wire/50', socket: 'border-nexus-wire' };
      if (nexus.subtype.includes('AI') || nexus.subtype === 'AGENT') return { accent: 'text-nexus-accent', border: 'border-nexus-accent/30', bg: 'bg-emerald-950/10', ring: 'ring-nexus-accent/50', socket: 'border-nexus-accent' };
      if (nexus.type === NexusType.LOGIC) return { accent: 'text-purple-400', border: 'border-purple-500/30', bg: 'bg-purple-950/10', ring: 'ring-purple-500/50', socket: 'border-purple-500' };
      return { accent: 'text-blue-400', border: 'border-blue-500/30', bg: 'bg-blue-950/10', ring: 'ring-blue-500/50', socket: 'border-blue-500' };
  };

  const styles = getStyles();

  useEffect(() => { setEditLabel(nexus.label); }, [nexus.label]);

  const handleRenameSubmit = () => {
      if (editLabel.trim()) onUpdate(nexus.id, { label: editLabel });
      else setEditLabel(nexus.label);
      setIsEditing(false);
  };

  const { x, y } = nexus.position || { x: 0, y: 0 };
  const outputs = nexus.subtype === NexusSubtype.CONDITION ? ['true', 'false'] : (nexus.outputs || ['default']);
  
  return (
    <div
      className="absolute group select-none transition-transform will-change-transform z-10"
      style={{ transform: `translate3d(${x}px, ${y}px, 0)`, width: '260px' }}
      onMouseDown={(e) => { e.stopPropagation(); onSelect(nexus.id); }}
      onContextMenu={(e) => onContextMenu(e, nexus.id)} 
    >
        {/* --- NODE CHASSIS --- */}
        <div className={`
            relative flex flex-col rounded-xl overflow-hidden transition-all duration-200
            bg-[#09090b] shadow-xl
            ${isSelected ? `ring-1 ${styles.ring} shadow-[0_0_30px_-10px_rgba(0,0,0,0.5)]` : 'ring-1 ring-white/10 hover:ring-white/20'}
        `}>
            
            {/* --- HEADER (DRAG HANDLE) --- */}
            <div 
                className="h-10 flex items-center justify-between px-3 border-b border-white/5 cursor-grab active:cursor-grabbing bg-white/[0.02] relative group/header"
                onMouseDown={(e) => { 
                    e.stopPropagation(); 
                    e.preventDefault(); 
                    onDragStart(e, nexus.id); 
                }}
            >
                <div className="flex items-center gap-2.5 z-10 w-full pointer-events-none">
                    <div className={`w-6 h-6 rounded flex items-center justify-center ${styles.bg}`}>
                        <Icon size={14} className={styles.accent} strokeWidth={2.5} />
                    </div>
                    <div className="flex-1 min-w-0 flex items-center gap-2">
                        <span className="text-[9px] font-mono text-gray-500 uppercase tracking-wide">
                            {def.subtype.replace('_', ' ')}
                        </span>
                        {/* Auto-Wired Badge */}
                        {hasDynamicData && (
                            <div className="flex items-center gap-1 px-1.5 py-0.5 bg-blue-900/30 rounded border border-blue-500/20 text-[8px] text-blue-400 font-bold uppercase tracking-wider animate-in fade-in">
                                <LinkIcon size={8} /> Linked
                            </div>
                        )}
                    </div>
                    {/* Status LED */}
                    <div className={`w-1.5 h-1.5 rounded-full ${nexus.status === 'running' ? 'bg-nexus-accent animate-ping' : nexus.status === 'error' ? 'bg-red-500' : nexus.status === 'success' ? 'bg-nexus-success' : 'bg-gray-700'}`} />
                </div>
            </div>

            {/* --- BODY --- */}
            <div className="p-3 bg-[#09090b]">
                <div onDoubleClick={(e) => { e.stopPropagation(); setIsEditing(true); }} className="mb-2">
                    {isEditing ? (
                        <input 
                            value={editLabel} onChange={(e) => setEditLabel(e.target.value)}
                            onBlur={handleRenameSubmit} onKeyDown={e => e.key === 'Enter' && handleRenameSubmit()}
                            className="bg-black/50 border border-nexus-accent/50 rounded px-2 py-1 text-xs font-medium text-white outline-none w-full" autoFocus
                        />
                    ) : (
                        <div className="text-xs font-medium text-gray-200 truncate tracking-tight hover:text-white transition-colors cursor-text">
                            {nexus.label}
                        </div>
                    )}
                </div>

                <div className="flex justify-between items-center group/id">
                    <span className="text-[9px] font-mono text-gray-600 select-all">#{nexus.id.slice(-4)}</span>
                    <button onClick={(e) => { e.stopPropagation(); onOpenProperties(nexus.id); }} className="opacity-0 group-hover:opacity-100 transition-opacity p-1 text-gray-500 hover:text-white">
                        <Settings size={12}/>
                    </button>
                </div>

                {nexus.lastOutput && (
                    <div className="mt-3 pt-2 border-t border-white/5">
                        <button 
                            onClick={(e) => { e.stopPropagation(); setIsExpanded(!isExpanded); }}
                            className="w-full flex items-center justify-between text-[9px] font-bold text-gray-500 hover:text-nexus-accent transition-all"
                        >
                            <span className="flex items-center gap-1.5"><Database size={10}/> PAYLOAD</span>
                            {isExpanded ? <ChevronDown size={10}/> : <ChevronRight size={10}/>}
                        </button>
                        {isExpanded && (
                            <div className="mt-2 bg-black/50 rounded border border-white/5 p-2 max-h-32 overflow-y-auto custom-scrollbar">
                                <JsonTree data={nexus.lastOutput} />
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>

        {/* --- INPUT PORT (TARGET) --- */}
        {!isTrigger && (
             <div 
                className="absolute -left-[6px] top-[15px] z-50 w-4 h-4 flex items-center justify-center cursor-crosshair group/port"
                onMouseUp={(e) => { 
                    e.stopPropagation(); 
                    e.preventDefault();
                    onConnectEnd(e, nexus.id); 
                }}
             >
                 <div className={`
                    w-2.5 h-2.5 rounded-full bg-[#09090b] border border-gray-600 transition-all 
                    group-hover/port:border-white group-hover/port:scale-125
                    ${isConnecting ? 'ring-2 ring-white/50 bg-white scale-110 animate-pulse' : ''}
                 `}>
                    <div className="w-1 h-1 rounded-full bg-gray-500 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                 </div>
                 
                 <div className="absolute left-4 top-1/2 -translate-y-1/2 opacity-0 group-hover/port:opacity-100 transition-all bg-black border border-white/10 text-[9px] text-white px-2 py-1 rounded whitespace-nowrap pointer-events-none z-50">
                     Input
                 </div>
             </div>
        )}

        {/* --- OUTPUT PORTS (SOURCE) --- */}
        <div className="absolute -right-[6px] top-[15px] flex flex-col gap-[24px] z-50">
            {outputs.map((output, idx) => (
                <div key={output} className="relative flex items-center justify-center w-4 h-4">
                     {/* Label for Conditional */}
                     {nexus.subtype === NexusSubtype.CONDITION && (
                         <span className={`absolute right-5 text-[9px] font-bold uppercase tracking-wider pointer-events-none ${output === 'true' ? 'text-nexus-success' : 'text-red-400'}`}>
                             {output === 'true' ? 'YES' : 'NO'}
                         </span>
                     )}

                     <div 
                        className={`
                            w-2.5 h-2.5 rounded-full bg-[#09090b] border flex items-center justify-center cursor-crosshair transition-all hover:scale-125
                            ${output === 'true' ? 'border-nexus-success bg-nexus-success/10' : 
                              output === 'false' ? 'border-red-500 bg-red-500/10' : 
                              `${styles.socket} hover:bg-white hover:border-white`}
                        `}
                        onMouseDown={(e) => { 
                            e.stopPropagation(); 
                            e.preventDefault();
                            // Calculate exact center of this port
                            const rect = e.currentTarget.getBoundingClientRect();
                            const centerX = rect.left + rect.width / 2;
                            const centerY = rect.top + rect.height / 2;
                            onConnectStart(e, nexus.id, output, centerX, centerY); 
                        }}
                     >
                        <div className={`w-1 h-1 rounded-full ${output === 'true' ? 'bg-nexus-success' : output === 'false' ? 'bg-red-500' : 'bg-gray-400'}`} />
                     </div>
                </div>
            ))}
        </div>
    </div>
  );
});

export default memo(NexusNode);

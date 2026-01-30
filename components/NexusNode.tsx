
import React, { useState, memo, useEffect } from 'react';
import { Nexus, NexusSubtype, NexusType } from '../types';
import { NEXUS_DEFINITIONS } from '../constants';
import { Settings, ChevronDown, ChevronRight, Database, Link as LinkIcon, Activity } from 'lucide-react';
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
  const isActive = nexus.status === 'running';

  const hasDynamicData = Object.values(nexus.config).some(val => typeof val === 'string' && val.includes('{{') && val.includes('}}'));

  const getStyles = () => {
      if (nexus.type === NexusType.TRIGGER) return { accent: 'text-nexus-wire', border: 'border-nexus-wire/30', bg: 'bg-yellow-950/20', ring: 'ring-nexus-wire/50', socket: 'border-nexus-wire' };
      if (nexus.subtype.includes('AI') || nexus.subtype === 'AGENT') return { accent: 'text-nexus-accent', border: 'border-nexus-accent/30', bg: 'bg-emerald-950/20', ring: 'ring-nexus-accent/50', socket: 'border-nexus-accent' };
      if (nexus.type === NexusType.LOGIC) return { accent: 'text-purple-400', border: 'border-purple-500/30', bg: 'bg-purple-950/20', ring: 'ring-purple-500/50', socket: 'border-purple-500' };
      return { accent: 'text-blue-400', border: 'border-blue-500/30', bg: 'bg-blue-950/20', ring: 'ring-blue-500/50', socket: 'border-blue-500' };
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
      className={`absolute group select-none transition-transform will-change-transform z-10 ${isActive ? 'animate-float' : ''}`}
      style={{ transform: `translate3d(${x}px, ${y}px, 0)`, width: '260px' }}
      onMouseDown={(e) => { e.stopPropagation(); onSelect(nexus.id); }}
      onContextMenu={(e) => onContextMenu(e, nexus.id)} 
    >
        {/* --- NODE CHASSIS --- */}
        <div className={`
            relative flex flex-col rounded-xl overflow-hidden transition-all duration-300
            bg-[#09090b]/90 backdrop-blur-md shadow-2xl border
            ${isActive ? 'border-nexus-accent node-active scale-[1.02]' : isSelected ? `border-nexus-accent/50 ring-1 ${styles.ring}` : 'border-white/10 hover:border-white/20'}
        `}>
            
            {/* Holographic Header Scanline */}
            {isActive && <div className="absolute top-0 left-0 w-full h-0.5 bg-nexus-accent shadow-[0_0_10px_#00ff9d] animate-pulse z-20" />}

            {/* --- HEADER --- */}
            <div 
                className="h-10 flex items-center justify-between px-3 border-b border-white/5 cursor-grab active:cursor-grabbing bg-white/[0.03] relative group/header"
                onMouseDown={(e) => { 
                    e.stopPropagation(); 
                    e.preventDefault(); 
                    onDragStart(e, nexus.id); 
                }}
            >
                <div className="flex items-center gap-2.5 z-10 w-full pointer-events-none">
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${isActive ? 'bg-nexus-accent text-black' : styles.bg}`}>
                        {isActive ? <Activity size={16} className="animate-spin-slow" /> : <Icon size={14} className={styles.accent} strokeWidth={2.5} />}
                    </div>
                    <div className="flex-1 min-w-0 flex items-center gap-2">
                        <span className={`text-[10px] font-mono uppercase tracking-widest ${isActive ? 'text-nexus-accent' : 'text-gray-400'}`}>
                            {def.subtype.replace('_', ' ')}
                        </span>
                        {hasDynamicData && (
                            <div className="flex items-center gap-1 px-1.5 py-0.5 bg-blue-900/40 rounded border border-blue-500/30 text-[8px] text-blue-400 font-bold uppercase tracking-wider animate-in fade-in">
                                <LinkIcon size={8} /> Linked
                            </div>
                        )}
                    </div>
                    {/* Status LED */}
                    <div className={`w-2 h-2 rounded-full shadow-[0_0_8px] ${nexus.status === 'running' ? 'bg-nexus-accent animate-pulse-fast shadow-nexus-accent' : nexus.status === 'error' ? 'bg-red-500 shadow-red-500' : nexus.status === 'success' ? 'bg-nexus-success shadow-nexus-success' : 'bg-gray-700 shadow-transparent'}`} />
                </div>
            </div>

            {/* --- BODY --- */}
            <div className="p-4 bg-gradient-to-b from-transparent to-black/20">
                <div onDoubleClick={(e) => { e.stopPropagation(); setIsEditing(true); }} className="mb-2">
                    {isEditing ? (
                        <input 
                            value={editLabel} onChange={(e) => setEditLabel(e.target.value)}
                            onBlur={handleRenameSubmit} onKeyDown={e => e.key === 'Enter' && handleRenameSubmit()}
                            className="bg-black/80 border-2 border-nexus-accent rounded-lg px-3 py-1.5 text-sm font-bold text-white outline-none w-full shadow-inner" autoFocus
                        />
                    ) : (
                        <div className="text-sm font-bold text-gray-100 truncate tracking-tight hover:text-white transition-colors cursor-text">
                            {nexus.label}
                        </div>
                    )}
                </div>

                <div className="flex justify-between items-center group/id">
                    <span className="text-[10px] font-mono text-gray-600 select-all tracking-wider opacity-60 group-hover/id:opacity-100 transition-opacity">ID: {nexus.id.slice(-6)}</span>
                    <button onClick={(e) => { e.stopPropagation(); onOpenProperties(nexus.id); }} className="p-1.5 bg-white/5 rounded-lg text-gray-500 hover:text-white hover:bg-white/10 transition-all opacity-0 group-hover:opacity-100">
                        <Settings size={14}/>
                    </button>
                </div>

                {nexus.lastOutput && (
                    <div className="mt-4 pt-3 border-t border-white/5">
                        <button 
                            onClick={(e) => { e.stopPropagation(); setIsExpanded(!isExpanded); }}
                            className={`w-full flex items-center justify-between text-[10px] font-black uppercase tracking-widest transition-all ${isActive ? 'text-nexus-accent' : 'text-gray-500 hover:text-nexus-accent'}`}
                        >
                            <span className="flex items-center gap-2"><Database size={12}/> DATA_PAYLOAD</span>
                            {isExpanded ? <ChevronDown size={12}/> : <ChevronRight size={12}/>}
                        </button>
                        {isExpanded && (
                            <div className="mt-2 bg-black/60 backdrop-blur-sm rounded-lg border border-white/5 p-3 max-h-40 overflow-y-auto custom-scrollbar animate-in slide-in-from-top-1">
                                <JsonTree data={nexus.lastOutput} />
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>

        {/* --- INPUT PORT --- */}
        {!isTrigger && (
             <div 
                className="absolute -left-[8px] top-[14px] z-50 w-5 h-5 flex items-center justify-center cursor-crosshair group/port"
                onMouseUp={(e) => { 
                    e.stopPropagation(); 
                    e.preventDefault();
                    onConnectEnd(e, nexus.id); 
                }}
             >
                 <div className={`
                    w-3 h-3 rounded-full bg-[#050505] border-2 transition-all 
                    ${isConnecting ? 'border-nexus-accent ring-4 ring-nexus-accent/20 bg-nexus-accent scale-125' : 'border-gray-600 group-hover/port:border-white group-hover/port:scale-125'}
                 `}>
                    <div className="w-1.5 h-1.5 rounded-full bg-gray-500 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                 </div>
                 
                 <div className="absolute left-6 top-1/2 -translate-y-1/2 opacity-0 group-hover/port:opacity-100 transition-all bg-nexus-900 border border-white/10 text-[9px] font-black uppercase tracking-widest text-white px-2.5 py-1.5 rounded-lg whitespace-nowrap pointer-events-none z-50 shadow-2xl">
                     INP_GATE
                 </div>
             </div>
        )}

        {/* --- OUTPUT PORTS --- */}
        <div className="absolute -right-[8px] top-[14px] flex flex-col gap-[24px] z-50">
            {outputs.map((output, idx) => (
                <div key={output} className="relative flex items-center justify-center w-5 h-5">
                     {nexus.subtype === NexusSubtype.CONDITION && (
                         <span className={`absolute right-7 text-[10px] font-black uppercase tracking-[0.2em] pointer-events-none drop-shadow-md ${output === 'true' ? 'text-nexus-success' : 'text-red-400'}`}>
                             {output === 'true' ? 'YES' : 'NO'}
                         </span>
                     )}

                     <div 
                        className={`
                            w-3 h-3 rounded-full bg-[#050505] border-2 flex items-center justify-center cursor-crosshair transition-all hover:scale-150
                            ${output === 'true' ? 'border-nexus-success bg-nexus-success/10 hover:bg-nexus-success' : 
                              output === 'false' ? 'border-red-500 bg-red-500/10 hover:bg-red-500' : 
                              `${styles.socket} hover:bg-white hover:border-white`}
                        `}
                        onMouseDown={(e) => { 
                            e.stopPropagation(); 
                            e.preventDefault();
                            const rect = e.currentTarget.getBoundingClientRect();
                            const centerX = rect.left + rect.width / 2;
                            const centerY = rect.top + rect.height / 2;
                            onConnectStart(e, nexus.id, output, centerX, centerY); 
                        }}
                     >
                        <div className={`w-1.5 h-1.5 rounded-full ${output === 'true' ? 'bg-nexus-success' : output === 'false' ? 'bg-red-500' : 'bg-gray-400'}`} />
                     </div>
                     
                     <div className="absolute right-7 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-all bg-nexus-900 border border-white/10 text-[9px] font-black uppercase tracking-widest text-white px-2.5 py-1.5 rounded-lg whitespace-nowrap pointer-events-none z-50 shadow-2xl">
                         OUT_{output.toUpperCase()}
                     </div>
                </div>
            ))}
        </div>
    </div>
  );
});

export default memo(NexusNode);

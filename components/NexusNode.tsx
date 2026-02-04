
import React, { memo } from 'react';
import { Nexus, NexusType } from '../types';
import { NEXUS_DEFINITIONS } from '../constants';
import { Activity, Shield, HelpCircle } from 'lucide-react';

interface NexusNodeProps {
  nexus: Nexus;
  isSelected: boolean;
  onDragStart: (e: React.PointerEvent) => void;
  onConnectStart: (e: React.MouseEvent, id: string, handle: string, x: number, y: number) => void; 
  onConnectEnd: (e: React.MouseEvent, id: string) => void;
  onContextMenu: (e: React.MouseEvent, id: string) => void;
}

const NexusNode: React.FC<NexusNodeProps> = memo(({ 
  nexus, isSelected, onDragStart, onConnectStart, onConnectEnd, onContextMenu
}) => {
  // CRITICAL FAIL-SAFE: If nexus object itself is missing, return nothing.
  if (!nexus) return null;

  // FAIL-SAFE: Handle undefined or invalid subtypes gracefully
  // This prevents 'replace is not a function' errors if subtype is missing
  const safeSubtype = (nexus.subtype && typeof nexus.subtype === 'string') ? nexus.subtype : 'UNKNOWN';
  
  // FAIL-SAFE: Fallback to a generic definition if subtype not found in dictionary
  const def = NEXUS_DEFINITIONS.find(d => d.subtype === safeSubtype) || {
      icon: HelpCircle,
      label: 'Unknown Node',
      subtype: 'UNKNOWN'
  };
  
  const Icon = def.icon || HelpCircle;
  
  const isTrigger = nexus.type === NexusType.TRIGGER;
  const isActive = nexus.status === 'running';

  // FAIL-SAFE: Ensure outputs is always an array
  const outputs = safeSubtype === 'CONDITION' ? ['true', 'false'] : (Array.isArray(nexus.outputs) ? nexus.outputs : ['default']);
  
  // FAIL-SAFE: Force position to 0 if invalid to prevent transform errors
  const posX = Number.isFinite(nexus.position?.x) ? nexus.position.x : 0;
  const posY = Number.isFinite(nexus.position?.y) ? nexus.position.y : 0;

  return (
    <div
      id={`node-container-${nexus.id}`}
      className="absolute group select-none touch-none"
      style={{ 
          transform: `translate3d(${posX}px, ${posY}px, 0)`, 
          width: '260px', 
          zIndex: isSelected ? 100 : 10,
          willChange: 'transform',
          transition: 'box-shadow 0.2s ease'
      }}
      onContextMenu={(e) => onContextMenu(e, nexus.id)} 
    >
        <div className={`
            relative flex flex-col rounded-xl overflow-hidden
            bg-[#09090b]/98 backdrop-blur-xl shadow-2xl border transition-all duration-200
            ${isActive ? 'border-nexus-accent ring-4 ring-nexus-accent/10' : isSelected ? 'border-nexus-accent ring-2 ring-nexus-accent/20 scale-[1.01]' : 'border-white/10 hover:border-white/20'}
        `}>
            {/* Header - Dragging Handle */}
            <div 
                className="h-10 flex items-center px-3 border-b border-white/5 cursor-grab active:cursor-grabbing bg-white/[0.03] hover:bg-white/[0.06] transition-colors"
                onPointerDown={onDragStart}
            >
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center mr-3 transition-colors ${isActive ? 'bg-nexus-accent text-black shadow-[0_0_15px_rgba(0,255,157,0.3)]' : 'bg-white/5 text-nexus-accent'}`}>
                    {isActive ? <Activity size={14} className="animate-spin-slow" /> : <Icon size={14} strokeWidth={2.5} />}
                </div>
                <span className="text-[9px] font-mono uppercase tracking-widest text-gray-500 truncate flex-1 pointer-events-none">
                    {safeSubtype.replace(/_/g, ' ')}
                </span>
                <div className={`w-2 h-2 rounded-full shadow-sm ${nexus.status === 'running' ? 'bg-nexus-accent animate-pulse' : nexus.status === 'error' ? 'bg-red-500' : nexus.status === 'success' ? 'bg-nexus-success' : 'bg-gray-800'}`} />
            </div>

            {/* Body */}
            <div className="p-4 pointer-events-none">
                <div className="text-sm font-bold text-gray-100 truncate mb-1 tracking-tight">{nexus.label || 'Untitled'}</div>
                <div className="flex items-center gap-1.5 opacity-40">
                    <Shield size={10} className="text-gray-500"/>
                    <div className="text-[9px] font-mono text-gray-500">KNL_SEC_0x{nexus.id ? nexus.id.slice(-4).toUpperCase() : 'NULL'}</div>
                </div>
            </div>
        </div>

        {/* INPUT PORT (LEFT) */}
        {!isTrigger && (
             <div 
                className="absolute -left-[14px] top-[14px] w-8 h-8 flex items-center justify-center cursor-crosshair z-50 group/port"
                onPointerUp={(e) => { e.stopPropagation(); onConnectEnd(e, nexus.id); }}
                onPointerDown={e => e.stopPropagation()}
             >
                 <div className="w-3.5 h-3.5 rounded-full bg-[#050505] border-2 border-gray-600 group-hover/port:border-white group-hover/port:scale-125 transition-all shadow-lg" />
             </div>
        )}

        {/* OUTPUT PORTS (RIGHT) */}
        <div className="absolute -right-[14px] top-[14px] flex flex-col gap-[24px] z-50">
            {outputs.map((output) => (
                <div key={output} className="relative flex items-center justify-center w-8 h-8 group/port">
                     <div className="w-3.5 h-3.5 rounded-full bg-[#050505] border-2 border-blue-500 group-hover/port:border-white group-hover/port:scale-125 transition-all pointer-events-none shadow-lg" />
                     <div 
                        className="absolute inset-0 rounded-full cursor-crosshair"
                        onPointerDown={(e) => { 
                            e.stopPropagation(); 
                            const rect = e.currentTarget.getBoundingClientRect();
                            onConnectStart(e as any, nexus.id, output, rect.left + rect.width / 2, rect.top + rect.height / 2); 
                        }}
                     />
                </div>
            ))}
        </div>
    </div>
  );
});

export default NexusNode;

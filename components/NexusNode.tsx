
import React, { useState, memo } from 'react';
import { Nexus, NexusSubtype } from '../types';
import { NEXUS_DEFINITIONS } from '../constants';
import { AlertCircle, CheckCircle, Loader2, GripVertical, Power, Eye, HelpCircle, Settings } from 'lucide-react';

interface NexusNodeProps {
  nexus: Nexus;
  isSelected: boolean;
  onSelect: (id: string) => void;
  onDragStart: (e: React.MouseEvent, id: string) => void;
  onConnectStart: (e: React.MouseEvent, id: string, handle?: string) => void; 
  onConnectEnd: (e: React.MouseEvent, id: string) => void;
  onOpenProperties: (id: string) => void;
}

const NexusNode: React.FC<NexusNodeProps> = memo(({ 
  nexus, isSelected, onSelect, onDragStart, onConnectStart, onConnectEnd, onOpenProperties 
}) => {
  const [showInspector, setShowInspector] = useState(false);
  
  const def = NEXUS_DEFINITIONS.find(d => d.subtype === nexus.subtype) || {
      icon: HelpCircle,
      label: 'Unknown Block',
      subtype: 'UNKNOWN',
      description: 'Definition missing',
      defaultConfig: {}
  };
  const Icon = def.icon;

  const statusColor = {
    idle: 'border-nexus-700 bg-nexus-800',
    running: 'border-nexus-wire bg-nexus-800 shadow-[0_0_15px_rgba(255,215,0,0.5)]',
    success: 'border-nexus-success bg-nexus-800 shadow-[0_0_15px_rgba(0,255,157,0.5)]',
    error: 'border-nexus-danger bg-nexus-800 shadow-[0_0_15px_rgba(255,51,51,0.5)]',
  }[nexus.status || 'idle'];

  const ledColor = {
    idle: 'bg-nexus-600',
    running: 'bg-nexus-wire animate-pulse',
    success: 'bg-nexus-success',
    error: 'bg-nexus-danger',
  }[nexus.status || 'idle'];

  const outputs = nexus.outputs && nexus.outputs.length > 0 ? nexus.outputs : ['default'];
  const height = 88 + (outputs.length - 1) * 28;

  const posX = nexus.position?.x ?? 0;
  const posY = nexus.position?.y ?? 0;

  const handleTouchStart = (e: React.TouchEvent) => {
      const touch = e.touches[0];
      const mouseEvent = {
          ...e,
          clientX: touch.clientX,
          clientY: touch.clientY,
          stopPropagation: () => e.stopPropagation(),
          preventDefault: () => {} 
      } as unknown as React.MouseEvent;
      onDragStart(mouseEvent, nexus.id);
  };

  const toggleInspector = (e: React.MouseEvent) => {
      e.stopPropagation();
      setShowInspector(!showInspector);
  };

  return (
    <div
      className={`absolute w-[260px] flex items-center group select-none font-mono transition-transform duration-100 ease-out active:scale-95`}
      style={{ 
        transform: `translate(${posX}px, ${posY}px)`,
        zIndex: isSelected ? 50 : 10,
        touchAction: 'none',
        willChange: 'transform'
      }}
      onMouseDown={(e) => {
        e.stopPropagation();
        onDragStart(e, nexus.id);
      }}
      onTouchStart={handleTouchStart}
    >
      {/* Input Port (Pin) */}
      {nexus.type !== 'TRIGGER' && (
        <div className="relative -mr-[1px] z-20 flex items-center">
           <div className="w-4 h-2 bg-gray-500 border border-gray-700"></div>
           <div 
             className="absolute left-[-24px] top-[-15px] w-12 h-12 rounded-full flex items-center justify-center cursor-crosshair z-30"
             onMouseUp={(e) => { e.stopPropagation(); onConnectEnd(e, nexus.id); }}
             onTouchEnd={(e) => { e.stopPropagation(); onConnectEnd({} as any, nexus.id); }}
           >
              <div className="w-2.5 h-2.5 bg-nexus-600 border border-nexus-400 rounded-sm hover:bg-nexus-accent hover:border-nexus-accent transition-colors shadow-sm" />
           </div>
        </div>
      )}

      {/* Main Chip Body */}
      <div 
        className={`flex-1 flex flex-col rounded-sm border-2 ${statusColor} 
          ${isSelected ? 'ring-2 ring-white/50' : ''}
          shadow-lg relative overflow-visible`} 
        style={{ height: `${height}px` }}
      >
        <div className="flex items-center px-3 py-2 bg-[#000000] border-b border-nexus-700 justify-between h-8 shrink-0">
          <div className="flex items-center gap-2 overflow-hidden">
            <Icon size={14} className="text-gray-400 flex-shrink-0" />
            <span className="font-bold text-gray-200 text-xs tracking-wider uppercase truncate max-w-[140px]">
              {def.subtype ? def.subtype.replace(/_/g, ' ') : 'UNKNOWN'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {/* NEW: Settings Button */}
            {isSelected && (
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenProperties(nexus.id);
                }}
                className="p-1 bg-nexus-700/50 hover:bg-nexus-600 rounded-full text-gray-400 hover:text-white animate-in fade-in zoom-in-90 duration-150"
              >
                <Settings size={12} />
              </button>
            )}
            <div className={`w-2 h-2 rounded-full ${ledColor} shadow-[0_0_5px_currentColor]`} />
          </div>
        </div>

        <div className="p-3 bg-nexus-800 flex flex-col justify-between flex-1 relative overflow-hidden">
          <div className="text-sm font-medium text-gray-100 truncate w-full" title={nexus.label}>
            {nexus.label}
          </div>
          
          <div className="flex items-center justify-between text-[10px] text-gray-500 font-mono pt-1 border-t border-nexus-700/50 mt-auto">
             <span>ID: {nexus.id ? nexus.id.slice(-4) : '????'}</span>
             <span>{nexus.status === 'idle' ? 'RDY' : nexus.status?.toUpperCase()}</span>
          </div>

          {(nexus.status === 'success' || nexus.status === 'error') && (
              <div className="absolute top-2 right-2 z-30">
                  <button 
                    onClick={toggleInspector}
                    className="p-1.5 bg-black/40 hover:bg-black rounded-full cursor-pointer backdrop-blur-sm"
                  >
                     <Eye size={12} className={nexus.status === 'success' ? "text-nexus-success" : "text-red-500"} />
                  </button>
                  
                  {showInspector && (
                    <div className="absolute top-full right-0 mt-1 w-60 p-2 bg-nexus-950 border border-nexus-700 rounded shadow-2xl z-50 animate-in fade-in slide-in-from-top-1 duration-150">
                        <div className="flex justify-between items-center mb-1">
                            <span className="text-[10px] text-gray-400 font-bold uppercase">Last Output</span>
                            <button onClick={(e) => { e.stopPropagation(); setShowInspector(false); }} className="text-gray-500"><Power size={10}/></button>
                        </div>
                        <pre className="text-[9px] text-nexus-accent font-mono overflow-auto max-h-32 whitespace-pre-wrap break-all p-1 bg-black/50 rounded">
                            {nexus.lastOutput ? JSON.stringify(nexus.lastOutput, null, 2) : 'No Data'}
                        </pre>
                    </div>
                  )}
              </div>
          )}
        </div>
      </div>

      {/* Output Ports (Dynamic) */}
      <div className="flex flex-col relative -ml-[1px] z-20 space-y-[20px] py-[36px]" style={{ position: 'absolute', right: '-16px', top: 0 }}>
        {outputs.map((output, index) => (
             <div 
                key={output || index} 
                className="relative flex items-center group/pin"
                style={{ top: index * 4 }} 
             >
                <div className="w-4 h-2 bg-gray-500 border border-gray-700"></div>
                <div 
                    className="absolute right-[-24px] top-[-15px] w-12 h-12 rounded-full flex items-center justify-center cursor-crosshair z-30"
                    onMouseDown={(e) => { e.stopPropagation(); onConnectStart(e, nexus.id, output); }}
                    onTouchStart={(e) => {
                         const touch = e.touches[0];
                         const mouseEvent = { ...e, clientX: touch.clientX, clientY: touch.clientY, stopPropagation: () => e.stopPropagation() } as unknown as React.MouseEvent;
                        onConnectStart(mouseEvent, nexus.id, output);
                    }}
                >
                    <div className={`w-2.5 h-2.5 border rounded-full shadow-[0_0_5px_#ffd700] 
                        ${output === 'default' ? 'bg-nexus-wire border-orange-500' : 'bg-nexus-accent border-green-500'}`} 
                    />
                </div>
             </div>
        ))}
      </div>

    </div>
  );
});

export default NexusNode;


import React, { useRef, useState, useCallback, useEffect, memo } from 'react';
import { Nexus, Synapse } from '../types';
import NexusNode from './NexusNode';

interface CanvasProps {
  nexuses: Nexus[];
  synapses: Synapse[];
  selectedId: string | null;
  onSelectNexus: (id: string | null) => void;
  onUpdateNexusPosition: (id: string, x: number, y: number) => void;
  onAddSynapse: (sourceId: string, targetId: string, sourceHandle?: string) => void;
  onDeleteSynapse: (id: string) => void;
  onOpenProperties: (id: string) => void;
}

// --- MEMOIZED WIRE COMPONENT (CRITICAL FOR PERFORMANCE) ---
const MemoizedWire = memo(({ 
    synapse, 
    sourceNode, 
    targetNode, 
    onDelete 
}: { 
    synapse: Synapse, 
    sourceNode?: Nexus, 
    targetNode?: Nexus, 
    onDelete: (id: string) => void 
}) => {
    if (!sourceNode?.position || !targetNode?.position) return null;

    const outputs = sourceNode.outputs || ['default'];
    const handleIndex = outputs.indexOf(synapse.sourceHandle || 'default');
    const actualIndex = handleIndex !== -1 ? handleIndex : 0;

    const startX = sourceNode.position.x + 272; 
    const startY = sourceNode.position.y + 44 + (actualIndex * 28); 
    const endX = targetNode.position.x; 
    const endY = targetNode.position.y + 44;

    const dist = Math.abs(endX - startX);
    const cp1x = startX + dist * 0.5;
    const cp2x = endX - dist * 0.5;
    
    const path = `M ${startX} ${startY} C ${cp1x} ${startY}, ${cp2x} ${endY}, ${endX} ${endY}`;
    const isActive = sourceNode.status === 'running' || sourceNode.status === 'success';

    return (
        <g 
            className="cursor-pointer pointer-events-auto group"
            onDoubleClick={(e) => {
                e.stopPropagation();
                onDelete(synapse.id);
            }}
        >
            {/* Hit Area - Massive for Mobile Touch */}
            <path d={path} stroke="transparent" strokeWidth="30" fill="none" />
            {/* Visual Outline */}
            <path d={path} stroke="#000" strokeWidth="6" fill="none" opacity="0.5" />
            {/* Core Wire */}
            <path d={path} stroke={isActive ? '#00ff9d' : '#404040'} strokeWidth="3" fill="none" className="transition-colors duration-300" />
            {/* Data Flow Animation */}
            {isActive && (
                <path d={path} stroke="#fff" strokeWidth="3" fill="none" strokeDasharray="10, 150" strokeLinecap="round" className="animate-current opacity-70" />
            )}
        </g>
    );
}, (prev, next) => {
    return (
        prev.sourceNode?.position?.x === next.sourceNode?.position?.x &&
        prev.sourceNode?.position?.y === next.sourceNode?.position?.y &&
        prev.targetNode?.position?.x === next.targetNode?.position?.x &&
        prev.targetNode?.position?.y === next.targetNode?.position?.y &&
        prev.sourceNode?.status === next.sourceNode?.status
    );
});

const Canvas: React.FC<CanvasProps> = ({
  nexuses,
  synapses,
  selectedId,
  onSelectNexus,
  onUpdateNexusPosition,
  onAddSynapse,
  onDeleteSynapse,
  onOpenProperties
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [draggedNexusId, setDraggedNexusId] = useState<string | null>(null);

  // Logic to differentiate Tap from Drag
  const dragStartPos = useRef({ x: 0, y: 0 });
  const hasMovedSignificantDistance = useRef(false);

  const [connectingSourceId, setConnectingSourceId] = useState<string | null>(null);
  const [connectingSourceHandle, setConnectingSourceHandle] = useState<string | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  const canvasRef = useRef<HTMLDivElement>(null);
  const rAF = useRef<number | null>(null);

  const getRelativePos = (clientX: number, clientY: number) => {
    if (!canvasRef.current) return { x: 0, y: 0 };
    const rect = canvasRef.current.getBoundingClientRect();
    return {
      x: clientX - rect.left,
      y: clientY - rect.top
    };
  };

  const handleMove = useCallback((clientX: number, clientY: number) => {
    if (rAF.current) return;

    rAF.current = requestAnimationFrame(() => {
      const pos = getRelativePos(clientX, clientY);
      setMousePos(pos);

      // Check if user has moved finger enough to consider it a "Drag" vs a "Tap"
      if (isDragging && draggedNexusId) {
          const dist = Math.sqrt(
              Math.pow(pos.x - dragStartPos.current.x, 2) + 
              Math.pow(pos.y - dragStartPos.current.y, 2)
          );
          
          // Threshold of 5 pixels
          if (dist > 5) {
              hasMovedSignificantDistance.current = true;
          }

          if (hasMovedSignificantDistance.current) {
             onUpdateNexusPosition(draggedNexusId, pos.x - dragOffset.x, pos.y - dragOffset.y);
          }
      }
      rAF.current = null;
    });
  }, [isDragging, draggedNexusId, dragOffset, onUpdateNexusPosition]);

  useEffect(() => {
      return () => {
          if (rAF.current) cancelAnimationFrame(rAF.current);
      };
  }, []);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.target === canvasRef.current) {
      onSelectNexus(null);
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    handleMove(e.clientX, e.clientY);
  };

  // Unified End Handler for Mouse and Touch
  const handleInteractionEnd = () => {
    // If we were holding a node, but didn't move it significantly, treat it as a CLICK/TAP to select it.
    if (draggedNexusId && !hasMovedSignificantDistance.current) {
        onSelectNexus(draggedNexusId);
    }

    setIsDragging(false);
    setDraggedNexusId(null);
    setConnectingSourceId(null);
    setConnectingSourceHandle(null);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
      const touch = e.touches[0];
      handleMove(touch.clientX, touch.clientY);
  };

  const handleNexusDragStart = (e: React.MouseEvent, id: string) => {
    const pos = getRelativePos(e.clientX, e.clientY);
    const nexus = nexuses.find(n => n.id === id);
    if (nexus && nexus.position) {
      setIsDragging(true);
      setDraggedNexusId(id);
      
      // Reset drag tracking logic
      hasMovedSignificantDistance.current = false;
      dragStartPos.current = { x: pos.x, y: pos.y };

      setDragOffset({
        x: pos.x - nexus.position.x,
        y: pos.y - nexus.position.y
      });
    }
  };

  const handleConnectStart = (e: React.MouseEvent, id: string, handle: string = 'default') => {
    setConnectingSourceId(id);
    setConnectingSourceHandle(handle);
    const pos = getRelativePos(e.clientX, e.clientY);
    setMousePos(pos);
  };

  const handleConnectEnd = (e: React.MouseEvent, targetId: string) => {
    if (connectingSourceId && connectingSourceId !== targetId) {
      const exists = synapses.some(s => s.sourceId === connectingSourceId && s.targetId === targetId && s.sourceHandle === connectingSourceHandle);
      if (!exists) {
        onAddSynapse(connectingSourceId, targetId, connectingSourceHandle || 'default');
      }
    }
    setConnectingSourceId(null);
    setConnectingSourceHandle(null);
  };

  const getTempWirePath = () => {
      if (!connectingSourceId) return '';
      const source = nexuses.find(n => n.id === connectingSourceId);
      if (!source || !source.position) return '';
      
      const outputs = source.outputs || ['default'];
      const handleIndex = outputs.indexOf(connectingSourceHandle || 'default');
      const actualIndex = handleIndex !== -1 ? handleIndex : 0;

      const startX = source.position.x + 272; 
      const startY = source.position.y + 44 + (actualIndex * 28);
      const endX = mousePos.x;
      const endY = mousePos.y;

      const dist = Math.abs(endX - startX);
      const cp1x = startX + dist * 0.5;
      const cp2x = endX - dist * 0.5;
      
      return `M ${startX} ${startY} C ${cp1x} ${startY}, ${cp2x} ${endY}, ${endX} ${endY}`;
  };

  return (
    <div 
      ref={canvasRef}
      className="flex-1 h-full relative overflow-hidden grid-pattern cursor-default select-none"
      style={{ touchAction: 'none' }} 
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleInteractionEnd}
      onMouseLeave={handleInteractionEnd}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleInteractionEnd}
    >
      <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
        {synapses.map(synapse => (
            <MemoizedWire 
                key={synapse.id}
                synapse={synapse}
                sourceNode={nexuses.find(n => n.id === synapse.sourceId)}
                targetNode={nexuses.find(n => n.id === synapse.targetId)}
                onDelete={onDeleteSynapse}
            />
        ))}

        {connectingSourceId && (
          <path
            d={getTempWirePath()}
            stroke="#ffd700"
            strokeWidth="2"
            strokeDasharray="5,5"
            fill="none"
          />
        )}
      </svg>

      {nexuses.map(nexus => (
        <NexusNode
          key={nexus.id}
          nexus={nexus}
          isSelected={selectedId === nexus.id}
          onSelect={onSelectNexus}
          onDragStart={handleNexusDragStart}
          onConnectStart={handleConnectStart}
          onConnectEnd={handleConnectEnd}
          onOpenProperties={onOpenProperties}
        />
      ))}
    </div>
  );
};

export default Canvas;

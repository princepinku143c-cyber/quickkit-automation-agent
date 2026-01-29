
import React, { useRef, useState, useCallback, useEffect, memo } from 'react';
import { Nexus, Synapse, NexusSubtype } from '../types';
import NexusNode from './NexusNode';
import ContextMenu from './ContextMenu';
import { X } from 'lucide-react';

interface CanvasProps {
  nexuses: Nexus[];
  synapses: Synapse[];
  selectedId: string | null;
  onSelectNexus: (id: string | null) => void;
  onUpdateNexusPosition: (id: string, x: number, y: number) => void;
  onAddSynapse: (sourceId: string, targetId: string, sourceHandle?: string) => void;
  onDeleteSynapse: (id: string) => void;
  onOpenProperties: (id: string) => void;
  onNexusUpdate: (id: string, updates: Partial<Nexus>) => void;
  onNodeAction?: (action: 'RUN' | 'DUPLICATE' | 'DELETE' | 'COPY_ID', nodeId: string) => void;
  onCanvasDrop?: (data: { x: number; y: number; sourceId: string; sourceHandle: string }) => void;
}

// --- CONSTANTS ---
const NODE_WIDTH = 260;
const HEADER_HEIGHT = 40;
const PORT_OFFSET_TOP = 15;
const PORT_GAP = 24;

// --- UTILS ---
const getBezierPath = (x1: number, y1: number, x2: number, y2: number) => {
    const dist = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
    // Dynamic curvature based on distance
    const curvature = Math.min(dist * 0.5, 150); 
    
    // If target is behind source, loop around nicely
    if (x2 < x1) {
        return `M ${x1} ${y1} C ${x1 + 150} ${y1} ${x2 - 150} ${y2} ${x2} ${y2}`;
    }
    return `M ${x1} ${y1} C ${x1 + curvature} ${y1} ${x2 - curvature} ${y2} ${x2} ${y2}`;
};

// --- WIRE COMPONENT ---
const Wire = memo(({ synapse, sourceNode, targetNode, onDelete }: { synapse: Synapse, sourceNode?: Nexus, targetNode?: Nexus, onDelete: (id: string) => void }) => {
    if (!sourceNode?.position || !targetNode?.position) return null;

    const outputs = sourceNode.subtype === NexusSubtype.CONDITION ? ['true', 'false'] : (sourceNode.outputs || ['default']);
    const handleIdx = Math.max(0, outputs.indexOf(synapse.sourceHandle || 'default'));

    // Precise Port Calculation
    // Source: Right side, adjusted for multi-output index
    const startX = sourceNode.position.x + NODE_WIDTH;
    const startY = sourceNode.position.y + HEADER_HEIGHT + PORT_OFFSET_TOP + (handleIdx * 24) - 12; // -12 centers it on the dot row (24px height)
    
    // Target: Left side, single input
    const endX = targetNode.position.x;
    const endY = targetNode.position.y + HEADER_HEIGHT + PORT_OFFSET_TOP - 12;

    const pathString = getBezierPath(startX, startY, endX, endY);
    const midX = (startX + endX) / 2;
    const midY = (startY + endY) / 2;

    const isSuccess = synapse.sourceHandle === 'true';
    const isFailure = synapse.sourceHandle === 'false';
    
    let strokeColor = '#525252'; 
    if (isSuccess) strokeColor = '#00ff9d';
    else if (isFailure) strokeColor = '#ef4444';
    else if (sourceNode.subtype.includes('AI')) strokeColor = '#06b6d4';

    return (
        <g className="group wire-group">
            <path d={pathString} stroke="transparent" strokeWidth="24" fill="none" className="cursor-pointer" onDoubleClick={(e) => { e.stopPropagation(); onDelete(synapse.id); }} />
            <path d={pathString} stroke={strokeColor} strokeWidth="6" strokeOpacity="0" fill="none" className="transition-all duration-300 group-hover:stroke-opacity-20 blur-sm pointer-events-none" />
            <path d={pathString} stroke={strokeColor} strokeWidth="2" fill="none" className="pointer-events-none" />
            <circle r="2" fill={strokeColor} className="pointer-events-none">
                <animateMotion dur={isSuccess || isFailure ? "1.5s" : "3s"} repeatCount="indefinite" path={pathString} calcMode="linear" keyPoints="0;1" keyTimes="0;1" />
            </circle>
            <foreignObject x={midX - 10} y={midY - 10} width="20" height="20" className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none group-hover:pointer-events-auto">
                <button onClick={(e) => { e.stopPropagation(); onDelete(synapse.id); }} className="w-5 h-5 bg-[#09090b] border border-red-500 rounded-full flex items-center justify-center hover:bg-red-500 text-red-500 hover:text-white transition-colors cursor-pointer shadow-lg">
                    <X size={10} />
                </button>
            </foreignObject>
        </g>
    );
});

// --- MAIN CANVAS ---
const Canvas: React.FC<CanvasProps> = ({
  nexuses, synapses, selectedId, onSelectNexus, onUpdateNexusPosition, 
  onAddSynapse, onDeleteSynapse, onOpenProperties, onNexusUpdate, onNodeAction
}) => {
  // Interaction State
  const [draggingNode, setDraggingNode] = useState<{ id: string, startX: number, startY: number, initialX: number, initialY: number } | null>(null);
  const [connecting, setConnecting] = useState<{ id: string, handle: string, startX: number, startY: number } | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  
  const [contextMenu, setContextMenu] = useState<{ x: number, y: number, nodeId: string } | null>(null);
  const canvasRef = useRef<HTMLDivElement>(null);

  // Get mouse pos relative to canvas
  const getRelativePos = useCallback((clientX: number, clientY: number) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return { x: 0, y: 0 };
    return { x: clientX - rect.left, y: clientY - rect.top };
  }, []);

  // --- MOUSE MOVE HANDLER (The Engine) ---
  useEffect(() => {
    const handleMove = (e: MouseEvent) => {
        if (!canvasRef.current) return;
        const pos = getRelativePos(e.clientX, e.clientY);
        setMousePos(pos);

        if (draggingNode) {
            // Calculate delta and apply to initial position
            // This prevents the "jump to top-left" bug
            const dx = pos.x - draggingNode.startX;
            const dy = pos.y - draggingNode.startY;
            
            let newX = draggingNode.initialX + dx;
            let newY = draggingNode.initialY + dy;

            // Snap to Grid (10px)
            newX = Math.round(newX / 10) * 10;
            newY = Math.round(newY / 10) * 10;

            onUpdateNexusPosition(draggingNode.id, newX, newY);
        }
    };

    const handleUp = () => {
        setDraggingNode(null);
        setConnecting(null);
    };

    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleUp);
    return () => { 
        window.removeEventListener('mousemove', handleMove); 
        window.removeEventListener('mouseup', handleUp); 
    };
  }, [draggingNode, connecting, getRelativePos, onUpdateNexusPosition]);

  // --- HANDLERS ---

  const handleNodeDragStart = (e: React.MouseEvent, id: string) => {
      // Find current node position
      const node = nexuses.find(n => n.id === id);
      if (!node) return;
      
      const pos = getRelativePos(e.clientX, e.clientY);
      setDraggingNode({
          id,
          startX: pos.x,
          startY: pos.y,
          initialX: node.position.x,
          initialY: node.position.y
      });
  };

  const handleConnectStart = (e: React.MouseEvent, id: string, handle: string) => {
      const node = nexuses.find(n => n.id === id);
      if (!node) return;

      const outputs = node.subtype === NexusSubtype.CONDITION ? ['true', 'false'] : (node.outputs || ['default']);
      const handleIdx = Math.max(0, outputs.indexOf(handle));
      
      // Calculate precise start based on node position + port offset
      const startX = node.position.x + NODE_WIDTH;
      const startY = node.position.y + HEADER_HEIGHT + PORT_OFFSET_TOP + (handleIdx * 24) - 12;

      setConnecting({ id, handle, startX, startY });
  };

  const handleConnectEnd = (e: React.MouseEvent, targetId: string) => {
      if (connecting && connecting.id !== targetId) {
          onAddSynapse(connecting.id, targetId, connecting.handle);
      }
      setConnecting(null);
  };

  return (
    <div 
      ref={canvasRef}
      className="flex-1 h-full relative overflow-hidden bg-[#050505] cursor-default selection:bg-transparent"
      onMouseDown={() => { onSelectNexus(null); setContextMenu(null); }}
      style={{
          backgroundImage: 'radial-gradient(circle at 1px 1px, #1a1a1a 1px, transparent 0)',
          backgroundSize: '20px 20px'
      }}
    >
      
      {/* SVG LAYER (WIRES) */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none z-0 overflow-visible">
        {synapses.map(s => (
            <Wire 
                key={s.id} 
                synapse={s} 
                sourceNode={nexuses.find(n => n.id === s.sourceId)} 
                targetNode={nexuses.find(n => n.id === s.targetId)} 
                onDelete={onDeleteSynapse} 
            />
        ))}

        {/* GHOST WIRE (DRAGGING) */}
        {connecting && (
            <>
                <path 
                    d={getBezierPath(connecting.startX, connecting.startY, mousePos.x, mousePos.y)} 
                    stroke="#FFD700" 
                    strokeWidth="2" 
                    fill="none" 
                    strokeDasharray="5,5"
                    className="animate-pulse opacity-80"
                />
                <circle cx={connecting.startX} cy={connecting.startY} r="3" fill="#FFD700" />
                <circle cx={mousePos.x} cy={mousePos.y} r="3" fill="#FFD700" />
            </>
        )}
      </svg>

      {/* NODES LAYER */}
      {nexuses.map(nexus => (
        <NexusNode
          key={nexus.id} 
          nexus={nexus} 
          isSelected={selectedId === nexus.id}
          isConnecting={!!connecting}
          onSelect={onSelectNexus} 
          onDragStart={handleNodeDragStart}
          onConnectStart={handleConnectStart}
          onConnectEnd={handleConnectEnd}
          onOpenProperties={onOpenProperties} 
          onUpdate={onNexusUpdate} 
          onContextMenu={(e, id) => {
              e.preventDefault();
              setContextMenu({ x: e.clientX, y: e.clientY, nodeId: id });
          }}
        />
      ))}

      {/* CONTEXT MENU */}
      {contextMenu && (
          <ContextMenu 
              x={contextMenu.x} y={contextMenu.y} 
              nodeLabel={nexuses.find(n => n.id === contextMenu.nodeId)?.label || 'Node'}
              onClose={() => setContextMenu(null)}
              onAction={(a) => {
                  onNodeAction?.(a, contextMenu.nodeId);
                  setContextMenu(null);
              }}
          />
      )}
    </div>
  );
};

export default Canvas;

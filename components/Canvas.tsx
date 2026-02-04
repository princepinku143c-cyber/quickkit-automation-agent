
import React, { useRef, useState, useCallback, useEffect, useMemo, memo } from 'react';
import { Nexus, Synapse, NexusSubtype, NexusType } from '../types';
import NexusNode from './NexusNode';
import ContextMenu from './ContextMenu';
import { Plus, Minus, Maximize, Keyboard, Activity, Database, Sparkles, LayoutGrid } from 'lucide-react';

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
  onAddNexus?: (type: NexusType, subtype: NexusSubtype, pos?: {x: number, y: number}) => void;
  isScanning?: boolean;
}

const NODE_WIDTH = 260;
const GRID_SIZE = 20;

// --- UTILS ---
const snapToGrid = (val: number) => Math.round(val / GRID_SIZE) * GRID_SIZE;

const getBezierPath = (x1: number, y1: number, x2: number, y2: number) => {
    const dist = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
    const curvature = Math.min(dist * 0.5, 150); 
    return `M ${x1} ${y1} C ${x1 + curvature} ${y1} ${x2 - curvature} ${y2} ${x2} ${y2}`;
};

const Wire = memo(({ synapse, sourceNode, targetNode, zoom }: { synapse: Synapse, sourceNode?: Nexus, targetNode?: Nexus, zoom: number }) => {
    if (!sourceNode || !targetNode) return null;
    if (!sourceNode.position || !targetNode.position) return null;
    
    const sx = Number.isFinite(sourceNode.position.x) ? sourceNode.position.x : 0;
    const sy = Number.isFinite(sourceNode.position.y) ? sourceNode.position.y : 0;
    const tx = Number.isFinite(targetNode.position.x) ? targetNode.position.x : 0;
    const ty = Number.isFinite(targetNode.position.y) ? targetNode.position.y : 0;

    const outputs = sourceNode.subtype === 'CONDITION' ? ['true', 'false'] : (sourceNode.outputs || ['default']);
    const handleIdx = Math.max(0, outputs.indexOf(synapse.sourceHandle || 'default'));
    
    const startX = sx + NODE_WIDTH;
    const startY = sy + 20 + (handleIdx * 24);
    const endX = tx;
    const endY = ty + 20;
    
    const pathString = getBezierPath(startX, startY, endX, endY);
    let strokeColor = synapse.sourceHandle === 'true' ? '#00ff9d' : synapse.sourceHandle === 'false' ? '#ef4444' : '#3b82f6';

    return (
        <path d={pathString} stroke={strokeColor} strokeWidth={2 / zoom} strokeOpacity={0.6} fill="none" />
    );
});

const Canvas: React.FC<CanvasProps> = ({ nexuses, synapses, selectedId, onSelectNexus, onUpdateNexusPosition, onAddSynapse, onDeleteSynapse, onOpenProperties, onNexusUpdate, onNodeAction, onAddNexus, isScanning }) => {
  const [transform, setTransform] = useState({ x: 0, y: 0, zoom: 1 });
  const [connecting, setConnecting] = useState<{ id: string, handle: string, startX: number, startY: number } | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [contextMenu, setContextMenu] = useState<{ x: number, y: number, nodeId: string } | null>(null);
  
  // GHOST STATE for Drag Preview
  const [ghost, setGhost] = useState<{ x: number, y: number, type: string, subtype: string } | null>(null);

  const canvasRef = useRef<HTMLDivElement>(null);
  const transformRef = useRef(transform);
  const dragRef = useRef({
      active: false,
      mode: 'PAN' as 'PAN' | 'NODE',
      id: null as string | null,
      startX: 0, startY: 0, 
      initX: 0, initY: 0,   
      lastMoveX: 0, lastMoveY: 0,
      movedPixels: 0
  });

  useEffect(() => { transformRef.current = transform; }, [transform]);

  useEffect(() => {
      nexuses.forEach(node => {
          if (!node || !node.id) return;
          const el = document.getElementById(`node-container-${node.id}`);
          if (el && dragRef.current.id !== node.id) {
              const x = Number.isFinite(node.position?.x) ? node.position.x : 0;
              const y = Number.isFinite(node.position?.y) ? node.position.y : 0;
              el.style.transform = `translate3d(${x}px, ${y}px, 0)`;
          }
      });
  }, [nexuses]);

  const safeNexuses = useMemo(() => {
      if (!Array.isArray(nexuses)) return [];
      
      return nexuses.map(n => {
          if (!n || typeof n !== 'object') return null;
          const safeN = { ...n };
          
          if (!safeN.id) safeN.id = `temp_repair_${Math.random()}`;
          if (!safeN.position || typeof safeN.position !== 'object' || !Number.isFinite(safeN.position.x) || !Number.isFinite(safeN.position.y)) {
              safeN.position = { x: 0, y: 0 };
          }
          if (!safeN.subtype) {
              safeN.subtype = NexusSubtype.NO_OP;
          }
          return safeN;
      }).filter(n => n !== null) as Nexus[];
  }, [nexuses]);

  const nodeMap = useMemo(() => {
      const map = new Map<string, Nexus>();
      safeNexuses.forEach(n => map.set(n.id, n));
      return map;
  }, [safeNexuses]);

  const debugStats = useMemo(() => {
      const selected = safeNexuses.find(n => n.id === selectedId);
      return {
          total: nexuses.length,
          rendered: safeNexuses.length,
          discrepancy: nexuses.length - safeNexuses.length,
          lastPos: selected ? `x:${Math.round(selected.position.x)}, y:${Math.round(selected.position.y)}` : 'No Selection'
      };
  }, [nexuses, safeNexuses, selectedId]);

  const getCanvasCoords = useCallback((screenX: number, screenY: number) => {
      if (!canvasRef.current) return { x: 0, y: 0 };
      const rect = canvasRef.current.getBoundingClientRect();
      const t = transformRef.current;
      return {
          x: (screenX - rect.left - t.x) / t.zoom,
          y: (screenY - rect.top - t.y) / t.zoom
      };
  }, []);

  // --- DRAG AND DROP HANDLERS (UPDATED) ---
  const handleDragOver = (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation(); // Stop React from interfering
      e.dataTransfer.dropEffect = 'copy';

      if (!canvasRef.current) return;

      const type = e.dataTransfer.types.includes('nexus/type') ? 'nexus' : null;
      if (!type) return;

      const subtype = e.dataTransfer.types.find(t => t !== 'nexus/type' && t !== 'Files') || 'Node';

      const rect = canvasRef.current.getBoundingClientRect();
      const t = transformRef.current;
      
      // Calculate raw canvas coords
      const rawX = (e.clientX - rect.left - t.x) / t.zoom;
      const rawY = (e.clientY - rect.top - t.y) / t.zoom;

      // Snap and Center (assuming node width ~260, height ~80)
      const snappedX = snapToGrid(rawX - 130);
      const snappedY = snapToGrid(rawY - 40);

      setGhost({ x: snappedX, y: snappedY, type: 'nexus', subtype });
  };

  const handleDragLeave = (e: React.DragEvent) => {
      e.preventDefault();
      setGhost(null);
  };

  const handleDrop = (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setGhost(null);

      if (!onAddNexus || !canvasRef.current) return;

      const type = e.dataTransfer.getData('nexus/type') as NexusType;
      const subtype = e.dataTransfer.getData('nexus/subtype') as NexusSubtype;

      if (type && subtype) {
          const rect = canvasRef.current.getBoundingClientRect();
          const t = transformRef.current;
          
          // Precise Coordinate Calculation
          const rawX = (e.clientX - rect.left - t.x) / t.zoom;
          const rawY = (e.clientY - rect.top - t.y) / t.zoom;

          // Apply Snap-to-Grid
          const finalX = snapToGrid(rawX - 130);
          const finalY = snapToGrid(rawY - 40);

          onAddNexus(type, subtype, { x: finalX, y: finalY });
      }
  };

  const handlePointerDown = (e: React.PointerEvent, id?: string) => {
      if (e.button !== 0) return; 
      const isNode = !!id;
      const d = dragRef.current;
      const t = transformRef.current;

      d.active = true;
      d.mode = isNode ? 'NODE' : 'PAN';
      d.id = id || null;
      d.startX = e.clientX;
      d.startY = e.clientY;
      d.movedPixels = 0;

      if (isNode && id) {
          const node = nodeMap.get(id);
          if (node) {
              d.initX = node.position.x;
              d.initY = node.position.y;
              d.lastMoveX = node.position.x;
              d.lastMoveY = node.position.y;
          }
      } else {
          d.initX = t.x;
          d.initY = t.y;
      }

      const target = e.currentTarget as HTMLElement;
      target.setPointerCapture(e.pointerId);
      setContextMenu(null);
      e.stopPropagation();
  };

  const handlePointerMove = (e: React.PointerEvent) => {
      const d = dragRef.current;
      if (!d.active) {
          if (connecting) {
              const pos = getCanvasCoords(e.clientX, e.clientY);
              setMousePos(pos);
          }
          return;
      }

      const t = transformRef.current;
      const dx = (e.clientX - d.startX);
      const dy = (e.clientY - d.startY);
      
      d.movedPixels = Math.sqrt(dx*dx + dy*dy);

      if (d.mode === 'NODE' && d.id) {
          // Normalize delta by zoom level
          const rawNextX = d.initX + dx / t.zoom;
          const rawNextY = d.initY + dy / t.zoom;
          
          // Snap to Grid during drag
          const nextX = snapToGrid(rawNextX);
          const nextY = snapToGrid(rawNextY);
          
          if (Number.isFinite(nextX) && Number.isFinite(nextY)) {
              d.lastMoveX = nextX;
              d.lastMoveY = nextY;
              const el = document.getElementById(`node-container-${d.id}`);
              if (el) {
                  el.style.transform = `translate3d(${nextX}px, ${nextY}px, 0)`;
                  el.style.zIndex = "1000";
              }
          }
      } else if (d.mode === 'PAN') {
          setTransform(prev => ({ ...prev, x: d.initX + dx, y: d.initY + dy }));
      }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
      const d = dragRef.current;
      if (!d.active) return;

      const nodeId = d.id;
      const moved = d.movedPixels;

      if (d.mode === 'NODE' && nodeId) {
          if (moved < 5) {
              onOpenProperties(nodeId); 
              onSelectNexus(nodeId);
          } else {
              if (Number.isFinite(d.lastMoveX) && Number.isFinite(d.lastMoveY)) {
                  onUpdateNexusPosition(nodeId, d.lastMoveX, d.lastMoveY);
              }
          }
          const el = document.getElementById(`node-container-${nodeId}`);
          if (el) el.style.zIndex = "";
      } else if (d.mode === 'PAN' && moved < 5) {
          onSelectNexus(null);
      }

      d.active = false;
      d.id = null;
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
      setConnecting(null);
  };

  const handleWheel = (e: React.WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
          e.preventDefault();
          const delta = -e.deltaY * 0.001;
          const newZoom = Math.min(Math.max(transform.zoom + delta, 0.1), 3);
          setTransform(prev => ({ ...prev, zoom: newZoom }));
      } else {
          setTransform(prev => ({ ...prev, x: prev.x - e.deltaX, y: prev.y - e.deltaY }));
      }
  };

  return (
    <div 
      ref={canvasRef}
      className="flex-1 h-full relative overflow-hidden bg-[#050505] touch-none select-none outline-none"
      onPointerDown={(e) => handlePointerDown(e)}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onWheel={handleWheel}
      style={{ 
          backgroundImage: 'radial-gradient(circle at 1px 1px, #1a1a1a 1px, transparent 0)', 
          backgroundSize: `${30 * transform.zoom}px ${30 * transform.zoom}px`,
          backgroundPosition: `${transform.x}px ${transform.y}px`
      }}
    >
      <div 
        className="w-full h-full relative origin-top-left"
        style={{ 
            transform: `translate3d(${transform.x}px, ${transform.y}px, 0) scale(${transform.zoom})`,
            willChange: 'transform'
        }}
      >
          {/* EMPTY STATE OVERLAY */}
          {safeNexuses.length === 0 && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0 opacity-50">
                  <div className="flex flex-col items-center gap-4 p-8 border-2 border-dashed border-white/5 rounded-[40px] bg-black/20 backdrop-blur-sm">
                      <div className="flex gap-4">
                          <div className="w-16 h-16 bg-nexus-accent/5 rounded-2xl flex items-center justify-center border border-nexus-accent/10 text-nexus-accent">
                              <Sparkles size={32}/>
                          </div>
                          <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center border border-white/10 text-gray-500">
                              <LayoutGrid size={32}/>
                          </div>
                      </div>
                      <div className="text-center">
                          <h3 className="text-xl font-black text-white uppercase tracking-widest mb-1">Canvas Ready</h3>
                          <p className="text-xs text-gray-500 max-w-[200px]">
                              Drag blocks from the sidebar or click the <b className="text-nexus-accent">AI Architect</b> to build instantly.
                          </p>
                      </div>
                  </div>
              </div>
          )}

          <svg className="absolute inset-0 w-full h-full pointer-events-none z-0 overflow-visible">
            {synapses.map(s => (
                <Wire key={s.id} synapse={s} zoom={transform.zoom} sourceNode={nodeMap.get(s.sourceId)} targetNode={nodeMap.get(s.targetId)} />
            ))}
            {connecting && (
                <path d={getBezierPath(connecting.startX, connecting.startY, mousePos.x, mousePos.y)} stroke="#ffd700" strokeWidth={2 / transform.zoom} fill="none" strokeDasharray="5,5" />
            )}
          </svg>

          {safeNexuses.map(nexus => (
            <NexusNode
              key={nexus.id} 
              nexus={nexus} 
              isSelected={selectedId === nexus.id}
              onDragStart={(e) => handlePointerDown(e, nexus.id)}
              onConnectStart={(e, id, h, sx, sy) => {
                  const pos = getCanvasCoords(sx, sy);
                  setConnecting({ id, handle: h, startX: pos.x, startY: pos.y });
              }}
              onConnectEnd={(e, targetId) => {
                  if (connecting && connecting.id !== targetId) onAddSynapse(connecting.id, targetId, connecting.handle);
                  setConnecting(null);
              }}
              onContextMenu={(e, id) => {
                  e.preventDefault();
                  setContextMenu({ x: e.clientX, y: e.clientY, nodeId: id });
              }}
            />
          ))}

          {/* --- GHOST PREVIEW --- */}
          {ghost && (
              <div 
                  className="absolute border-2 border-dashed border-nexus-accent/50 bg-nexus-accent/5 rounded-xl flex items-center justify-center pointer-events-none"
                  style={{
                      left: ghost.x,
                      top: ghost.y,
                      width: '260px',
                      height: '70px',
                      zIndex: 5
                  }}
              >
                  <span className="text-nexus-accent/70 text-xs font-black uppercase tracking-widest">
                      {ghost.subtype || 'New Node'}
                  </span>
              </div>
          )}
      </div>

      {contextMenu && (
          <ContextMenu x={contextMenu.x} y={contextMenu.y} nodeLabel={nodeMap.get(contextMenu.nodeId)?.label || 'Node'} onClose={() => setContextMenu(null)} onAction={(a) => { onNodeAction?.(a, contextMenu.nodeId); setContextMenu(null); }} />
      )}

      {/* --- LIVE STATE MONITOR (VERIFICATION TOOL) --- */}
      <div className="absolute bottom-4 left-4 p-3 bg-nexus-900/90 border border-nexus-800 rounded-xl shadow-2xl backdrop-blur-md flex flex-col gap-2 pointer-events-none z-[1000]">
          <div className="flex items-center gap-2 text-[10px] font-black uppercase text-nexus-accent tracking-widest border-b border-white/5 pb-1">
              <Activity size={12} className="animate-pulse"/> State Monitor
          </div>
          <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-[9px] font-mono text-gray-400">
              <span>Memory Nodes:</span>
              <span className="text-white font-bold">{debugStats.total}</span>
              
              <span>Rendered Nodes:</span>
              <span className={`font-bold ${debugStats.discrepancy === 0 ? 'text-green-400' : 'text-red-500'}`}>
                  {debugStats.rendered}
              </span>

              <span>Selection:</span>
              <span className="text-white truncate max-w-[100px]">{debugStats.lastPos}</span>
          </div>
      </div>
    </div>
  );
};

export default Canvas;

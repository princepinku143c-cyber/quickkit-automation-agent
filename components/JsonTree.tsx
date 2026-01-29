
import React, { useState } from 'react';
import { ChevronRight, ChevronDown, Copy, Check, AlertCircle } from 'lucide-react';

interface JsonTreeProps {
  data: any;
  level?: number;
  label?: string;
}

// 🛡️ SAFETY LIMIT: Prevents Stack Overflow / Browser Hangs
const MAX_DEPTH = 5; 

const JsonTree: React.FC<JsonTreeProps> = ({ data, level = 0, label }) => {
  const [isExpanded, setIsExpanded] = useState(level < 1); // Auto-expand first level only
  const [copied, setCopied] = useState(false);

  // --- SAFETY CHECK: STOP RECURSION ---
  if (level > MAX_DEPTH) {
      return (
          <div className="flex font-mono text-[9px] text-gray-600 px-1 ml-4 items-center gap-1" style={{ marginLeft: level * 12 }}>
              <AlertCircle size={8} /> <span>Depth limit reached...</span>
          </div>
      );
  }

  const handleCopy = (e: React.MouseEvent) => {
      e.stopPropagation();
      try {
        navigator.clipboard.writeText(JSON.stringify(data, null, 2));
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (err) {
        console.error("Copy failed (Circular structure?)", err);
      }
  };

  const isObject = typeof data === 'object' && data !== null;
  const isArray = Array.isArray(data);
  const isEmpty = isObject && Object.keys(data).length === 0;

  // Primitive Rendering
  if (!isObject) {
    let colorClass = 'text-gray-300';
    if (typeof data === 'string') colorClass = 'text-green-400';
    if (typeof data === 'number') colorClass = 'text-nexus-wire';
    if (typeof data === 'boolean') colorClass = 'text-purple-400';
    if (data === null || data === undefined) colorClass = 'text-gray-500 italic';

    return (
      <div className="flex font-mono text-[10px] hover:bg-white/5 px-1 rounded cursor-text select-text" style={{ marginLeft: level * 12 }}>
        {label && <span className="text-blue-300 mr-1 opacity-80">{label}:</span>}
        <span className={`${colorClass} break-all`}>{String(data)}</span>
      </div>
    );
  }

  // Object/Array Rendering
  return (
    <div className="font-mono text-[10px] select-text">
      <div 
        className="flex items-center gap-1 hover:bg-white/5 px-1 rounded cursor-pointer group"
        style={{ marginLeft: level * 12 }}
        onClick={(e) => { e.stopPropagation(); setIsExpanded(!isExpanded); }}
      >
        <span className="text-gray-500">
            {isExpanded ? <ChevronDown size={10} /> : <ChevronRight size={10} />}
        </span>
        
        {label && <span className="text-blue-300 mr-1 opacity-80">{label}:</span>}
        
        <span className="text-gray-400">
            {isArray ? `Array(${data.length})` : `Object{${Object.keys(data).length}}`}
        </span>

        {!isExpanded && <span className="text-gray-600 ml-1 opacity-50">...</span>}

        {/* Quick Copy Button on Hover */}
        <button 
            onClick={handleCopy}
            className="ml-auto opacity-0 group-hover:opacity-100 p-0.5 hover:text-white text-gray-500 transition-opacity"
            title="Copy JSON"
        >
            {copied ? <Check size={10} className="text-green-500"/> : <Copy size={10}/>}
        </button>
      </div>

      {isExpanded && !isEmpty && (
        <div>
          {Object.entries(data).map(([key, value]) => (
            <JsonTree key={key} data={value} level={level + 1} label={isArray ? undefined : key} />
          ))}
        </div>
      )}
    </div>
  );
};

export default JsonTree;

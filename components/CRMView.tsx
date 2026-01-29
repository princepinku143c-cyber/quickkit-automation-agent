
import React, { useState } from 'react';
import { 
  Users, BarChart3, Kanban, Search, Phone, Mail, 
  MoreHorizontal, Plus, Filter, ArrowUpRight, ArrowDownRight,
  TrendingUp, Calendar, DollarSign, CheckCircle2, Clock
} from 'lucide-react';
import { MOCK_CONTACTS, MOCK_DEALS } from '../constants';
import { DealStage } from '../types';

// --- NATIVE SVG CHART ---
const SimpleDualChart = ({ data }: { data: any[] }) => {
    if (!data || data.length === 0) return null;
    
    const maxSales = Math.max(...data.map(d => d.sales)) * 1.2;
    const maxLeads = Math.max(...data.map(d => d.leads)) * 1.5; // Scale differently
    const width = 100;
    
    const salesPoints = data.map((d, i) => {
        const x = (i / (data.length - 1)) * width;
        const y = 100 - (d.sales / maxSales) * 100;
        return `${x},${y}`;
    }).join(' ');

    const leadsPoints = data.map((d, i) => {
        const x = (i / (data.length - 1)) * width;
        const y = 100 - (d.leads / maxLeads) * 100;
        return `${x},${y}`;
    }).join(' ');

    const salesPath = `M 0,100 ${salesPoints.split(' ').map(p => 'L ' + p).join(' ')} L 100,100 Z`;
    const leadsPath = `M ${leadsPoints.split(' ').map((p, i) => (i === 0 ? 'M ' : 'L ') + p).join(' ')}`;

    return (
        <div className="w-full h-full flex flex-col">
            <div className="flex-1 relative overflow-hidden">
                <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full">
                    {/* Sales Area */}
                    <path d={salesPath} fill="#00ff9d" fillOpacity="0.2" />
                    <path d={salesPath.replace('M 0,100', 'M').replace('L 100,100 Z', '')} fill="none" stroke="#00ff9d" strokeWidth="2" vectorEffect="non-scaling-stroke" />
                    
                    {/* Leads Line */}
                    <path d={leadsPath} fill="none" stroke="#3b82f6" strokeWidth="2" strokeDasharray="4 4" vectorEffect="non-scaling-stroke" />
                </svg>
            </div>
            <div className="flex justify-between mt-2 px-1 text-[10px] text-gray-500">
                {data.map((d, i) => <span key={i}>{d.name}</span>)}
            </div>
        </div>
    );
};

interface CRMViewProps {
  onBack: () => void;
}

const CRMView: React.FC<CRMViewProps> = ({ onBack }) => {
  const [activeTab, setActiveTab] = useState<'DASHBOARD' | 'PIPELINE' | 'CONTACTS'>('DASHBOARD');
  const [searchTerm, setSearchTerm] = useState('');

  // --- MOCK CHART DATA ---
  const chartData = [
    { name: 'Mon', leads: 4, sales: 2400 },
    { name: 'Tue', leads: 7, sales: 1398 },
    { name: 'Wed', leads: 12, sales: 9800 },
    { name: 'Thu', leads: 9, sales: 3908 },
    { name: 'Fri', leads: 15, sales: 4800 },
    { name: 'Sat', leads: 10, sales: 3800 },
    { name: 'Sun', leads: 6, sales: 4300 },
  ];

  // --- RENDERERS ---

  const renderDashboard = () => (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-nexus-900 border border-nexus-800 p-5 rounded-xl">
                <div className="flex justify-between items-start mb-2">
                    <div className="p-2 bg-nexus-accent/10 rounded-lg"><Users size={18} className="text-nexus-accent"/></div>
                    <span className="flex items-center text-[10px] text-nexus-success bg-nexus-success/10 px-1.5 py-0.5 rounded font-bold">+12%</span>
                </div>
                <div className="text-2xl font-bold text-white">1,248</div>
                <div className="text-xs text-gray-500 mt-1">Total Leads</div>
            </div>
            <div className="bg-nexus-900 border border-nexus-800 p-5 rounded-xl">
                <div className="flex justify-between items-start mb-2">
                    <div className="p-2 bg-blue-500/10 rounded-lg"><DollarSign size={18} className="text-blue-500"/></div>
                    <span className="flex items-center text-[10px] text-nexus-success bg-nexus-success/10 px-1.5 py-0.5 rounded font-bold">+5%</span>
                </div>
                <div className="text-2xl font-bold text-white">$42,500</div>
                <div className="text-xs text-gray-500 mt-1">Revenue (This Month)</div>
            </div>
            <div className="bg-nexus-900 border border-nexus-800 p-5 rounded-xl">
                <div className="flex justify-between items-start mb-2">
                    <div className="p-2 bg-purple-500/10 rounded-lg"><BarChart3 size={18} className="text-purple-500"/></div>
                    <span className="flex items-center text-[10px] text-red-400 bg-red-400/10 px-1.5 py-0.5 rounded font-bold">-2%</span>
                </div>
                <div className="text-2xl font-bold text-white">4.8%</div>
                <div className="text-xs text-gray-500 mt-1">Conversion Rate</div>
            </div>
            <div className="bg-nexus-900 border border-nexus-800 p-5 rounded-xl">
                <div className="flex justify-between items-start mb-2">
                    <div className="p-2 bg-yellow-500/10 rounded-lg"><Calendar size={18} className="text-yellow-500"/></div>
                    <span className="flex items-center text-[10px] text-gray-500 px-1.5 py-0.5 rounded font-bold">Today</span>
                </div>
                <div className="text-2xl font-bold text-white">18</div>
                <div className="text-xs text-gray-500 mt-1">Appointments Booked</div>
            </div>
        </div>

        {/* Main Chart */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[400px]">
             <div className="lg:col-span-2 bg-nexus-900 border border-nexus-800 rounded-xl p-6 flex flex-col">
                <h3 className="text-sm font-bold text-white mb-6 flex items-center gap-2">
                    <TrendingUp size={16} className="text-nexus-accent"/> Lead Source & Revenue
                </h3>
                <div className="flex-1 w-full min-h-0">
                    <SimpleDualChart data={chartData} />
                </div>
             </div>

             <div className="bg-nexus-900 border border-nexus-800 rounded-xl p-6 overflow-y-auto">
                 <h3 className="text-sm font-bold text-white mb-4">Recent Activity</h3>
                 <div className="space-y-4">
                     {[1,2,3,4,5].map((i) => (
                         <div key={i} className="flex gap-3 items-start border-b border-nexus-800/50 pb-3 last:border-0">
                             <div className="w-8 h-8 rounded-full bg-nexus-800 flex items-center justify-center shrink-0">
                                 <CheckCircle2 size={14} className="text-nexus-success"/>
                             </div>
                             <div>
                                 <div className="text-xs text-white font-bold">New Lead: John Doe</div>
                                 <div className="text-[10px] text-gray-500">Form submitted via Website</div>
                                 <div className="text-[9px] text-gray-600 mt-1">2 mins ago</div>
                             </div>
                         </div>
                     ))}
                 </div>
             </div>
        </div>
    </div>
  );

  const renderPipeline = () => {
    const stages: DealStage[] = ['NEW', 'QUALIFIED', 'PROPOSAL', 'NEGOTIATION', 'WON'];
    
    return (
        <div className="h-full overflow-x-auto">
            <div className="flex gap-4 min-w-max h-full pb-4">
                {stages.map(stage => {
                    const stageDeals = MOCK_DEALS.filter(d => d.stage === stage);
                    const totalValue = stageDeals.reduce((acc, curr) => acc + curr.value, 0);

                    return (
                        <div key={stage} className="w-72 bg-nexus-900/50 border border-nexus-800 rounded-xl flex flex-col h-full">
                            <div className="p-3 border-b border-nexus-800 bg-nexus-900 rounded-t-xl sticky top-0 z-10">
                                <div className="flex justify-between items-center mb-1">
                                    <span className="text-xs font-bold text-gray-300 uppercase tracking-wider">{stage}</span>
                                    <span className="bg-nexus-800 text-[9px] px-2 py-0.5 rounded text-gray-400">{stageDeals.length}</span>
                                </div>
                                <div className="text-sm font-bold text-white">${totalValue.toLocaleString()}</div>
                                <div className="w-full h-1 bg-nexus-800 mt-2 rounded-full overflow-hidden">
                                    <div className={`h-full ${stage === 'WON' ? 'bg-nexus-success' : 'bg-blue-500'}`} style={{ width: '40%' }}></div>
                                </div>
                            </div>
                            
                            <div className="p-2 space-y-2 flex-1 overflow-y-auto">
                                {stageDeals.map(deal => (
                                    <div key={deal.id} className="bg-nexus-950 p-3 rounded-lg border border-nexus-800 hover:border-nexus-600 cursor-pointer group shadow-sm">
                                        <div className="text-xs text-gray-500 mb-1">{MOCK_CONTACTS.find(c => c.id === deal.contactId)?.name}</div>
                                        <div className="text-sm font-bold text-white mb-2">{deal.title}</div>
                                        <div className="flex justify-between items-center mt-2 pt-2 border-t border-nexus-900">
                                            <span className="text-xs font-mono text-nexus-accent">${deal.value}</span>
                                            <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                                                <button className="p-1 hover:bg-nexus-800 rounded"><Phone size={12} className="text-gray-400"/></button>
                                                <button className="p-1 hover:bg-nexus-800 rounded"><Mail size={12} className="text-gray-400"/></button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                <button className="w-full py-2 text-[10px] text-gray-500 border border-dashed border-nexus-800 rounded hover:border-nexus-600 hover:text-gray-300 transition-colors">
                                    + Add Deal
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
  };

  const renderContacts = () => (
      <div className="bg-nexus-900 border border-nexus-800 rounded-xl overflow-hidden flex flex-col h-full">
          <div className="p-4 border-b border-nexus-800 flex justify-between items-center gap-4">
              <div className="relative flex-1 max-w-md">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"/>
                  <input 
                    type="text" 
                    placeholder="Search contacts..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-nexus-950 border border-nexus-800 rounded-lg pl-9 pr-4 py-2 text-xs text-white focus:outline-none focus:border-nexus-700"
                  />
              </div>
              <div className="flex gap-2">
                   <button className="px-3 py-2 bg-nexus-800 text-gray-300 text-xs rounded-lg border border-nexus-700 flex items-center gap-2"><Filter size={12}/> Filter</button>
                   <button className="px-3 py-2 bg-nexus-accent text-black font-bold text-xs rounded-lg flex items-center gap-2"><Plus size={12}/> Add Contact</button>
              </div>
          </div>
          
          <div className="overflow-auto flex-1">
              <table className="w-full text-left text-xs">
                  <thead className="bg-nexus-950 text-gray-500 font-bold uppercase tracking-wider sticky top-0 z-10">
                      <tr>
                          <th className="p-4">Name</th>
                          <th className="p-4">Status</th>
                          <th className="p-4">Email</th>
                          <th className="p-4">Last Activity</th>
                          <th className="p-4 text-right">Action</th>
                      </tr>
                  </thead>
                  <tbody className="divide-y divide-nexus-800 text-gray-300">
                      {MOCK_CONTACTS.filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase())).map(contact => (
                          <tr key={contact.id} className="hover:bg-nexus-800/50 transition-colors group">
                              <td className="p-4">
                                  <div className="font-bold text-white">{contact.name}</div>
                                  <div className="text-[10px] text-gray-500">{contact.company}</div>
                              </td>
                              <td className="p-4">
                                  <div className="flex gap-1">
                                      {contact.tags.map(tag => (
                                          <span key={tag} className="px-2 py-0.5 rounded bg-nexus-800 border border-nexus-700 text-[10px] text-gray-400">
                                              {tag}
                                          </span>
                                      ))}
                                  </div>
                              </td>
                              <td className="p-4 text-gray-400">{contact.email}</td>
                              <td className="p-4 text-gray-500">{new Date(contact.lastActivity).toLocaleDateString()}</td>
                              <td className="p-4 text-right">
                                  <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                      <button className="p-1.5 bg-nexus-800 hover:bg-nexus-700 rounded text-gray-400"><Phone size={14}/></button>
                                      <button className="p-1.5 bg-nexus-800 hover:bg-nexus-700 rounded text-gray-400"><Mail size={14}/></button>
                                      <button className="p-1.5 bg-nexus-800 hover:bg-nexus-700 rounded text-gray-400"><MoreHorizontal size={14}/></button>
                                  </div>
                              </td>
                          </tr>
                      ))}
                  </tbody>
              </table>
          </div>
      </div>
  );

  return (
    <div className="h-full flex flex-col bg-[#050505] overflow-hidden">
        {/* CRM Header */}
        <header className="h-14 border-b border-nexus-800 bg-nexus-900/90 flex items-center justify-between px-6 shrink-0 z-20">
            <h1 className="text-lg font-bold text-white flex items-center gap-2">
                <Users className="text-blue-500" /> 
                Business CRM
            </h1>
            <div className="flex bg-nexus-950 p-1 rounded-lg border border-nexus-800">
                <button 
                    onClick={() => setActiveTab('DASHBOARD')}
                    className={`px-4 py-1.5 rounded text-xs font-bold flex items-center gap-2 transition-all ${activeTab === 'DASHBOARD' ? 'bg-nexus-800 text-white shadow' : 'text-gray-500 hover:text-gray-300'}`}
                >
                    <BarChart3 size={14}/> Insights
                </button>
                <button 
                    onClick={() => setActiveTab('PIPELINE')}
                    className={`px-4 py-1.5 rounded text-xs font-bold flex items-center gap-2 transition-all ${activeTab === 'PIPELINE' ? 'bg-nexus-800 text-white shadow' : 'text-gray-500 hover:text-gray-300'}`}
                >
                    <Kanban size={14}/> Pipeline
                </button>
                <button 
                    onClick={() => setActiveTab('CONTACTS')}
                    className={`px-4 py-1.5 rounded text-xs font-bold flex items-center gap-2 transition-all ${activeTab === 'CONTACTS' ? 'bg-nexus-800 text-white shadow' : 'text-gray-500 hover:text-gray-300'}`}
                >
                    <Users size={14}/> Contacts
                </button>
            </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 p-6 overflow-hidden relative">
            {activeTab === 'DASHBOARD' && renderDashboard()}
            {activeTab === 'PIPELINE' && renderPipeline()}
            {activeTab === 'CONTACTS' && renderContacts()}
        </div>
    </div>
  );
};

export default CRMView;

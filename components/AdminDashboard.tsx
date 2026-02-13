
import React, { useState, useEffect } from 'react';
import { X, Tag, Plus, Trash2, Power, RefreshCw, DollarSign, ListFilter, Users, Shield, CreditCard, Settings, Search, CheckCircle, AlertTriangle, Lock, Activity, TrendingUp, BarChart3 } from 'lucide-react';
import { listPromos, createPromo, togglePromo, deletePromo, listUsers, listPayments, updateUserRole, updateUserTier, toggleUserStatus } from '../services/adminService';
import { AdminPromo, PlanTier, UserAccount, AdminPayment, UserRole, UserPlan } from '../types';
import { requireAdmin, isAdmin } from '../services/adminGuard'; // 🔥 UPDATED IMPORT

interface AdminDashboardProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser?: UserPlan | null; // Added prop
}

type TabType = 'USERS' | 'PAYMENTS' | 'PROMOS' | 'SETTINGS';

const AdminDashboard: React.FC<AdminDashboardProps> = ({ isOpen, onClose, currentUser }) => {
  const [activeTab, setActiveTab] = useState<TabType>('USERS');
  const [isLoading, setIsLoading] = useState(false);

  // DATA STATES
  const [promos, setPromos] = useState<AdminPromo[]>([]);
  const [users, setUsers] = useState<UserAccount[]>([]);
  const [payments, setPayments] = useState<AdminPayment[]>([]);
  
  // STATS STATE (FOUNDER VIEW)
  const [stats, setStats] = useState({ 
      totalUsers: 0, 
      totalRuns: 0, 
      freeUsers: 0, 
      proUsers: 0, 
      businessUsers: 0,
      mrr: 0 
  });

  // FILTERS
  const [userSearch, setUserSearch] = useState('');
  
  // CREATE FORM STATE
  const [newCode, setNewCode] = useState('');
  const [newType, setNewType] = useState<'PERCENT' | 'FLAT'>('PERCENT');
  const [newValue, setNewValue] = useState('');
  const [newCurrency, setNewCurrency] = useState('USD');
  const [newMax, setNewMax] = useState('');
  const [newPlans, setNewPlans] = useState<PlanTier[]>(['PRO']);

  // 🔥 REAL PERMISSION CHECK
  const isOwner = currentUser?.role === 'OWNER';

  useEffect(() => {
      if (isOpen) {
          try {
              // 🔥 HARD BLOCK: Throw error if not admin
              requireAdmin(currentUser || null);
              loadAllData();
          } catch (e: any) {
              alert(e.message);
              onClose();
          }
      }
  }, [isOpen, currentUser]);

  // --- ANALYTICS ENGINE ---
  useEffect(() => {
      if (users.length > 0) {
          const totalUsers = users.length;
          const totalRuns = users.reduce((acc, u) => acc + (u.usage?.runs || 0), 0);
          
          const freeUsers = users.filter(u => u.tier === 'FREE').length;
          const proUsers = users.filter(u => u.tier === 'PRO').length;
          const businessUsers = users.filter(u => u.tier === 'BUSINESS').length;

          // Estimated MRR Calculation (Based on standard pricing)
          // Pro = $49, Business = $99
          const estimatedMRR = (proUsers * 49) + (businessUsers * 99);

          setStats({ 
              totalUsers, 
              totalRuns, 
              freeUsers, 
              proUsers, 
              businessUsers,
              mrr: estimatedMRR 
          });
      }
  }, [users]);

  const loadAllData = async () => {
      setIsLoading(true);
      const [pData, uData, payData] = await Promise.all([
          listPromos(),
          listUsers(),
          listPayments()
      ]);
      setPromos(pData);
      setUsers(uData);
      setPayments(payData);
      setIsLoading(false);
  };

  // --- HANDLERS ---

  const handleCreatePromo = async () => {
      if (!newCode || !newValue) return;
      try {
          await createPromo({
              code: newCode,
              type: newType,
              value: parseFloat(newValue),
              currency: newType === 'FLAT' ? (newCurrency as any) : undefined,
              maxUses: parseInt(newMax) || 100,
              validPlans: newPlans,
              active: true
          });
          loadAllData();
          setNewCode('');
          setNewValue('');
      } catch (e: any) {
          alert(e.message);
      }
  };

  const handleRoleChange = async (uid: string, role: UserRole) => {
      if (!confirm(`Change role to ${role}?`)) return;
      try { await updateUserRole(uid, role); loadAllData(); } catch(e: any) { alert(e.message); }
  };

  const handleTierChange = async (uid: string, tier: PlanTier) => {
      if (!confirm(`Change plan to ${tier}?`)) return;
      try { await updateUserTier(uid, tier); loadAllData(); } catch(e: any) { alert(e.message); }
  };

  const handleToggleStatus = async (uid: string) => {
      if (!confirm("Toggle user access?")) return;
      try { await toggleUserStatus(uid); loadAllData(); } catch(e: any) { alert(e.message); }
  };

  const togglePlan = (p: PlanTier) => {
      if (newPlans.includes(p)) setNewPlans(newPlans.filter(x => x !== p));
      else setNewPlans([...newPlans, p]);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[500] flex items-center justify-center p-4 bg-black/95 backdrop-blur-md">
      <div className="w-full max-w-7xl h-[90vh] bg-[#0a0a0a] border border-nexus-800 rounded-[32px] shadow-2xl flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="p-6 border-b border-nexus-800 flex justify-between items-center bg-nexus-950">
            <div className="flex items-center gap-4">
                <div className="p-3 bg-nexus-accent/10 rounded-xl text-nexus-accent border border-nexus-accent/20">
                    <Shield size={24}/>
                </div>
                <div>
                    <h2 className="text-xl font-black text-white uppercase tracking-wider">Admin Console</h2>
                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-[0.2em]">System Control • {isOwner ? 'Owner' : 'Admin'} Mode</p>
                </div>
            </div>
            <div className="flex items-center gap-4">
                <button onClick={loadAllData} className="p-3 bg-nexus-900 hover:bg-nexus-800 rounded-2xl text-gray-500 hover:text-white transition-all"><RefreshCw size={20} className={isLoading ? 'animate-spin' : ''}/></button>
                <button onClick={onClose} className="p-3 bg-nexus-900 hover:bg-nexus-800 rounded-2xl text-gray-500 hover:text-white transition-all"><X size={20}/></button>
            </div>
        </div>

        <div className="flex flex-1 overflow-hidden">
            {/* Sidebar */}
            <div className="w-64 bg-nexus-950 border-r border-nexus-800 p-6 space-y-2 flex flex-col">
                <button onClick={() => setActiveTab('USERS')} className={`w-full text-left px-4 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-3 transition-all ${activeTab === 'USERS' ? 'bg-white text-black shadow-lg' : 'text-gray-500 hover:bg-white/5'}`}>
                    <Users size={16}/> Users
                </button>
                <button onClick={() => setActiveTab('PAYMENTS')} className={`w-full text-left px-4 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-3 transition-all ${activeTab === 'PAYMENTS' ? 'bg-white text-black shadow-lg' : 'text-gray-500 hover:bg-white/5'}`}>
                    <CreditCard size={16}/> Payments
                </button>
                <button onClick={() => setActiveTab('PROMOS')} className={`w-full text-left px-4 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-3 transition-all ${activeTab === 'PROMOS' ? 'bg-white text-black shadow-lg' : 'text-gray-500 hover:bg-white/5'}`}>
                    <Tag size={16}/> Promos
                </button>
                {isOwner && (
                    <button onClick={() => setActiveTab('SETTINGS')} className={`w-full text-left px-4 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-3 transition-all ${activeTab === 'SETTINGS' ? 'bg-white text-black shadow-lg' : 'text-gray-500 hover:bg-white/5'}`}>
                        <Settings size={16}/> Settings
                    </button>
                )}
            </div>

            {/* Content */}
            <div className="flex-1 bg-[#050505] p-8 overflow-y-auto custom-scrollbar">
                
                {/* --- USERS TAB --- */}
                {activeTab === 'USERS' && (
                    <div className="space-y-8">
                        {/* FOUNDER DASHBOARD HUD */}
                        <div className="grid grid-cols-4 gap-4">
                            {/* Card 1: Total Users */}
                            <div className="p-5 bg-nexus-900 border border-nexus-800 rounded-2xl flex flex-col justify-between h-32 relative overflow-hidden group">
                                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity"><Users size={60}/></div>
                                <div className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Total Users</div>
                                <div>
                                    <div className="text-3xl font-black text-white">{stats.totalUsers}</div>
                                    <div className="text-[10px] text-gray-500 mt-1">Total Registrations</div>
                                </div>
                            </div>

                            {/* Card 2: MRR (Revenue) */}
                            <div className="p-5 bg-nexus-900 border border-nexus-800 rounded-2xl flex flex-col justify-between h-32 relative overflow-hidden group">
                                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity text-green-500"><DollarSign size={60}/></div>
                                <div className="text-[10px] font-black text-green-500 uppercase tracking-widest flex items-center gap-2"><TrendingUp size={12}/> Est. Monthly Revenue</div>
                                <div>
                                    <div className="text-3xl font-black text-white">${stats.mrr}</div>
                                    <div className="text-[10px] text-gray-500 mt-1">Based on active plans</div>
                                </div>
                            </div>

                            {/* Card 3: Plan Breakdown */}
                            <div className="p-5 bg-nexus-900 border border-nexus-800 rounded-2xl flex flex-col justify-between h-32">
                                <div className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Plan Distribution</div>
                                <div className="space-y-1">
                                    <div className="flex justify-between text-[10px] font-bold"><span className="text-gray-500">Free</span> <span className="text-white">{stats.freeUsers}</span></div>
                                    <div className="flex justify-between text-[10px] font-bold"><span className="text-nexus-accent">Pro</span> <span className="text-white">{stats.proUsers}</span></div>
                                    <div className="flex justify-between text-[10px] font-bold"><span className="text-purple-400">Business</span> <span className="text-white">{stats.businessUsers}</span></div>
                                </div>
                            </div>

                            {/* Card 4: Total Consumption */}
                            <div className="p-5 bg-nexus-900 border border-nexus-800 rounded-2xl flex flex-col justify-between h-32 relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-4 opacity-10"><Activity size={60}/></div>
                                <div className="text-[10px] font-black text-yellow-500 uppercase tracking-widest">System Load</div>
                                <div>
                                    <div className="text-3xl font-black text-white">{stats.totalRuns.toLocaleString()}</div>
                                    <div className="text-[10px] text-gray-500 mt-1">Total Workflow Runs</div>
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-between items-center">
                            <h3 className="text-xl font-bold text-white">User Management</h3>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600" size={14}/>
                                <input 
                                    value={userSearch}
                                    onChange={(e) => setUserSearch(e.target.value)}
                                    placeholder="Search users..."
                                    className="bg-nexus-900 border border-nexus-800 rounded-xl pl-9 pr-4 py-2 text-xs text-white focus:border-nexus-accent outline-none w-64"
                                />
                            </div>
                        </div>

                        <div className="bg-nexus-900/20 border border-nexus-800 rounded-2xl overflow-hidden">
                            <table className="w-full text-left text-xs">
                                <thead className="bg-nexus-950 text-gray-500 font-bold uppercase">
                                    <tr>
                                        <th className="p-4">User</th>
                                        <th className="p-4">Role</th>
                                        <th className="p-4">Plan</th>
                                        <th className="p-4">Runs</th>
                                        <th className="p-4">Status</th>
                                        <th className="p-4">Joined</th>
                                        <th className="p-4 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-nexus-800 text-gray-300">
                                    {users.filter(u => u.email.toLowerCase().includes(userSearch.toLowerCase()) || u.displayName.toLowerCase().includes(userSearch.toLowerCase())).map(u => (
                                        <tr key={u.uid} className="hover:bg-white/5 group">
                                            <td className="p-4">
                                                <div className="font-bold text-white">{u.displayName}</div>
                                                <div className="text-[10px] text-gray-500">{u.email}</div>
                                            </td>
                                            <td className="p-4">
                                                <select 
                                                    value={u.role} 
                                                    onChange={(e) => handleRoleChange(u.uid, e.target.value as UserRole)}
                                                    className={`bg-black border border-nexus-800 rounded px-2 py-1 text-[10px] font-bold outline-none cursor-pointer ${u.role === 'OWNER' ? 'text-nexus-accent' : u.role === 'ADMIN' ? 'text-blue-400' : 'text-gray-400'}`}
                                                    disabled={!isOwner || (u.role === 'OWNER' && u.uid === currentUser?.uid)}
                                                >
                                                    <option value="USER">USER</option>
                                                    <option value="ADMIN">ADMIN</option>
                                                    <option value="OWNER">OWNER</option>
                                                </select>
                                            </td>
                                            <td className="p-4">
                                                <select 
                                                    value={u.tier} 
                                                    onChange={(e) => handleTierChange(u.uid, e.target.value as PlanTier)}
                                                    className={`bg-black border border-nexus-800 rounded px-2 py-1 text-[10px] font-bold outline-none cursor-pointer ${u.tier === 'BUSINESS' ? 'text-purple-400' : u.tier === 'PRO' ? 'text-nexus-accent' : 'text-gray-400'}`}
                                                >
                                                    <option value="FREE">FREE</option>
                                                    <option value="PRO">PRO</option>
                                                    <option value="BUSINESS">BUSINESS</option>
                                                </select>
                                            </td>
                                            <td className="p-4 font-mono text-gray-400">
                                                {u.usage?.runs || 0}
                                            </td>
                                            <td className="p-4">
                                                <span className={`px-2 py-1 rounded text-[9px] font-bold uppercase ${u.status === 'ACTIVE' ? 'bg-green-900/30 text-green-400' : 'bg-red-900/30 text-red-400'}`}>
                                                    {u.status}
                                                </span>
                                            </td>
                                            <td className="p-4 text-gray-500 font-mono">
                                                {new Date(u.joinedAt).toLocaleDateString()}
                                            </td>
                                            <td className="p-4 text-right">
                                                <button 
                                                    onClick={() => handleToggleStatus(u.uid)} 
                                                    disabled={u.role === 'OWNER'}
                                                    className="p-2 hover:bg-red-900/20 text-gray-500 hover:text-red-500 rounded transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                                                    title={u.status === 'ACTIVE' ? "Disable Account" : "Activate Account"}
                                                >
                                                    <Power size={14}/>
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* --- PAYMENTS TAB --- */}
                {activeTab === 'PAYMENTS' && (
                    <div className="space-y-6">
                        <h3 className="text-xl font-bold text-white">Transaction History</h3>
                        <div className="bg-nexus-900/20 border border-nexus-800 rounded-2xl overflow-hidden">
                            <table className="w-full text-left text-xs">
                                <thead className="bg-nexus-950 text-gray-500 font-bold uppercase">
                                    <tr>
                                        <th className="p-4">Date</th>
                                        <th className="p-4">User</th>
                                        <th className="p-4">Amount</th>
                                        <th className="p-4">Gateway</th>
                                        <th className="p-4">Status</th>
                                        <th className="p-4 text-right">ID</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-nexus-800 text-gray-300">
                                    {payments.map(pay => (
                                        <tr key={pay.id} className="hover:bg-white/5">
                                            <td className="p-4 text-gray-500 font-mono">{new Date(pay.date).toLocaleDateString()}</td>
                                            <td className="p-4 text-white">{pay.userEmail}</td>
                                            <td className="p-4 font-bold text-white">{pay.currency === 'INR' ? '₹' : '$'}{pay.amount}</td>
                                            <td className="p-4">
                                                <span className="bg-black border border-nexus-800 px-2 py-1 rounded text-[9px] uppercase font-bold text-gray-400">{pay.gateway}</span>
                                            </td>
                                            <td className="p-4">
                                                <span className={`flex items-center gap-1 text-[10px] font-bold uppercase ${pay.status === 'SUCCESS' ? 'text-green-400' : pay.status === 'FAILED' ? 'text-red-400' : 'text-yellow-400'}`}>
                                                    {pay.status === 'SUCCESS' ? <CheckCircle size={12}/> : <AlertTriangle size={12}/>}
                                                    {pay.status}
                                                </span>
                                            </td>
                                            <td className="p-4 text-right text-gray-600 font-mono text-[10px]">{pay.id}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* --- PROMOS TAB --- */}
                {activeTab === 'PROMOS' && (
                    <div className="space-y-8">
                        {/* CREATE FORM */}
                        <div className="bg-nexus-900/50 border border-nexus-800 rounded-2xl p-6">
                            <h3 className="text-xs font-black text-white uppercase tracking-widest mb-4 flex items-center gap-2"><Plus size={14}/> Create New Code</h3>
                            <div className="grid grid-cols-4 gap-4 mb-4">
                                <input value={newCode} onChange={e => setNewCode(e.target.value.toUpperCase())} placeholder="CODE (e.g. SAVE20)" className="bg-black border border-nexus-800 rounded-xl p-3 text-xs text-white outline-none focus:border-nexus-accent" />
                                <select value={newType} onChange={e => setNewType(e.target.value as any)} className="bg-black border border-nexus-800 rounded-xl p-3 text-xs text-white outline-none">
                                    <option value="PERCENT">Percentage (%)</option>
                                    <option value="FLAT">Flat Amount</option>
                                </select>
                                <input type="number" value={newValue} onChange={e => setNewValue(e.target.value)} placeholder="Value (e.g. 20)" className="bg-black border border-nexus-800 rounded-xl p-3 text-xs text-white outline-none" />
                                <input type="number" value={newMax} onChange={e => setNewMax(e.target.value)} placeholder="Max Uses (100)" className="bg-black border border-nexus-800 rounded-xl p-3 text-xs text-white outline-none" />
                            </div>
                            
                            <div className="flex justify-between items-center">
                                <div className="flex gap-4">
                                    {newType === 'FLAT' && (
                                        <div className="flex items-center gap-2 bg-black px-3 py-2 rounded-lg border border-nexus-800">
                                            <span className="text-[10px] text-gray-500 font-bold">CURRENCY</span>
                                            <select value={newCurrency} onChange={e => setNewCurrency(e.target.value)} className="bg-transparent text-white text-xs outline-none">
                                                <option value="USD">USD</option>
                                                <option value="INR">INR</option>
                                            </select>
                                        </div>
                                    )}
                                    <div className="flex items-center gap-2">
                                        <span className="text-[10px] text-gray-500 font-bold uppercase">Valid Plans:</span>
                                        {['PRO', 'BUSINESS'].map(p => (
                                            <button 
                                                key={p} 
                                                onClick={() => togglePlan(p as PlanTier)}
                                                className={`px-3 py-1.5 rounded text-[9px] font-bold border ${newPlans.includes(p as PlanTier) ? 'bg-nexus-accent text-black border-nexus-accent' : 'bg-transparent text-gray-500 border-nexus-800'}`}
                                            >
                                                {p}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <button onClick={handleCreatePromo} disabled={!newCode || !newValue} className="px-6 py-3 bg-white text-black font-black rounded-xl text-[10px] uppercase tracking-widest hover:bg-gray-200 transition-all">
                                    Create Promo
                                </button>
                            </div>
                        </div>

                        {/* LIST */}
                        <div className="bg-nexus-900/20 border border-nexus-800 rounded-2xl overflow-hidden">
                            <table className="w-full text-left text-xs">
                                <thead className="bg-nexus-950 text-gray-500 font-bold uppercase">
                                    <tr>
                                        <th className="p-4">Code</th>
                                        <th className="p-4">Discount</th>
                                        <th className="p-4">Usage</th>
                                        <th className="p-4">Plans</th>
                                        <th className="p-4">Status</th>
                                        <th className="p-4 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-nexus-800 text-gray-300">
                                    {promos.map(p => (
                                        <tr key={p.code} className="hover:bg-white/5">
                                            <td className="p-4 font-mono font-bold text-white">{p.code}</td>
                                            <td className="p-4 text-nexus-accent font-bold">
                                                {p.type === 'PERCENT' ? `${p.value}%` : `${p.currency === 'INR' ? '₹' : '$'}${p.value}`}
                                            </td>
                                            <td className="p-4 text-gray-400">{p.used} / {p.maxUses}</td>
                                            <td className="p-4"><span className="bg-black px-2 py-1 rounded text-[9px] border border-nexus-800">{p.validPlans.join(', ')}</span></td>
                                            <td className="p-4">
                                                <span className={`px-2 py-1 rounded text-[9px] font-bold uppercase ${p.active ? 'bg-green-900/30 text-green-400' : 'bg-red-900/30 text-red-400'}`}>
                                                    {p.active ? 'Active' : 'Disabled'}
                                                </span>
                                            </td>
                                            <td className="p-4 text-right flex justify-end gap-2">
                                                <button onClick={() => { togglePromo(p.code); loadAllData(); }} className="p-2 hover:bg-nexus-800 rounded text-gray-400 hover:text-white" title="Toggle">
                                                    <Power size={14}/>
                                                </button>
                                                <button onClick={() => { deletePromo(p.code); loadAllData(); }} className="p-2 hover:bg-red-900/30 rounded text-gray-400 hover:text-red-500" title="Delete">
                                                    <Trash2 size={14}/>
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* --- SETTINGS TAB --- */}
                {activeTab === 'SETTINGS' && (
                    <div className="space-y-6 max-w-2xl">
                        <div className="bg-nexus-900/30 border border-nexus-800 rounded-2xl p-6">
                            <h3 className="text-lg font-bold text-white mb-4">System Settings</h3>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-[10px] font-black text-gray-500 uppercase mb-2">Product Name</label>
                                    <input defaultValue="NexusStream" className="w-full bg-black border border-nexus-800 rounded-xl p-3 text-white text-xs outline-none" disabled={!isOwner} />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-gray-500 uppercase mb-2">Support Email</label>
                                    <input defaultValue="support@nexusstream.ai" className="w-full bg-black border border-nexus-800 rounded-xl p-3 text-white text-xs outline-none" disabled={!isOwner} />
                                </div>
                                <div className="pt-4 border-t border-nexus-800">
                                    <label className="flex items-center gap-3 cursor-pointer">
                                        <input type="checkbox" defaultChecked className="accent-nexus-accent w-4 h-4" disabled={!isOwner} />
                                        <span className="text-sm text-gray-300">Enable Maintenance Mode</span>
                                    </label>
                                    <p className="text-[10px] text-gray-500 mt-1 ml-7">Prevents non-admin users from accessing the app.</p>
                                </div>
                            </div>
                            {isOwner && (
                                <div className="mt-6 flex justify-end">
                                    <button className="px-6 py-2 bg-white text-black font-bold rounded-xl text-xs hover:bg-gray-200 transition-colors">Save Changes</button>
                                </div>
                            )}
                        </div>

                        <div className="bg-red-900/10 border border-red-900/30 rounded-2xl p-6">
                            <h3 className="text-lg font-bold text-red-500 mb-2 flex items-center gap-2">
                                <Lock size={18}/> Danger Zone
                            </h3>
                            <p className="text-xs text-red-400/70 mb-4">Irreversible actions for the entire platform.</p>
                            <button disabled={!isOwner} className="px-4 py-2 bg-red-600/20 text-red-500 border border-red-600/50 rounded-xl text-xs font-bold hover:bg-red-600 hover:text-white transition-all disabled:opacity-50">
                                Reset All User Quotas
                            </button>
                        </div>
                    </div>
                )}

            </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;

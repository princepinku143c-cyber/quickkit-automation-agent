
import React, { useState } from 'react';
import { X, User, CreditCard, ShieldCheck, LogOut, CheckCircle, AlertTriangle, Calendar, Download, Zap, RefreshCw, ShoppingBag, Settings as SettingsIcon } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { PaymentGateway } from '../services/paymentGateway';
import { PLAN_LIMITS, ADDON_PACKS } from '../constants';
import { AddOnPack } from '../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpgrade: () => void;
  userPlan: any;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, onUpgrade, userPlan }) => {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<'PROFILE' | 'BILLING'>('PROFILE');
  const [isCancelling, setIsCancelling] = useState(false);
  const [cancelConfirm, setCancelConfirm] = useState(false);
  const [isBuying, setIsBuying] = useState<string | null>(null);

  const billingAutomationEnabled = false;
  const showComingSoonBillingNotice = !billingAutomationEnabled;

  if (!isOpen) return null;

  const handleCancel = async () => {
      if (!userPlan.subscriptionId) {
          alert("No active subscription found.");
          return;
      }
      setIsCancelling(true);
      try {
          await PaymentGateway.cancelSubscription(userPlan.subscriptionId, userPlan.provider || 'RAZORPAY');
          alert("Subscription cancelled. Access remains until period end.");
          setCancelConfirm(false);
          onClose();
          window.location.reload();
      } catch (e: any) {
          alert(e?.message || "Failed to cancel. Please contact support.");
      } finally {
          setIsCancelling(false);
      }
  };

  const handleBuyAddon = async (pack: AddOnPack) => {
      setIsBuying(pack.id);
      try {
          const order = await PaymentGateway.createAddonOrder(pack.id, userPlan.region || 'GLOBAL');
          PaymentGateway.openRazorpay(order, user?.email || 'guest', 
              async (res) => {
                  const valid = await PaymentGateway.verifyBackend(res);
                  if (valid) {
                      alert(`Successfully added ${pack.credits} credits!`);
                      window.location.reload();
                  }
              },
              (err) => alert("Purchase failed.")
          );
      } catch (e: any) {
          console.error(e);
          alert(e?.message || "Add-on purchase is currently unavailable.");
      } finally {
          setIsBuying(null);
      }
  };

  const handleRefund = async () => {
      if (!confirm("Are you sure? This will immediately downgrade your account to Free.")) return;
      try {
          // Mock payment ID from user plan or fetch latest invoice
          if (!userPlan.lastPaymentId) throw new Error('No recent payment found for refund.');
          await PaymentGateway.requestRefund(userPlan.lastPaymentId, 'User requested via settings');
          alert("Refund processed. Your plan has been downgraded.");
          window.location.reload();
      } catch (e: any) {
          alert(e?.message || "Refund failed. You may be outside the 7-day window.");
      }
  };

  const planName = PLAN_LIMITS[userPlan.tier as keyof typeof PLAN_LIMITS]?.LABEL || 'Free';
  const expiryDate = new Date(userPlan.expiresAt || Date.now()).toLocaleDateString();
  const regionSymbol = userPlan.region === 'IN' ? '₹' : '$';
  
  // Logic to hide add-ons for Pro/Business
  const isUnlimitedPlan = userPlan.tier === 'PRO' || userPlan.tier === 'BUSINESS';

  return (
    <div className="fixed inset-0 z-[400] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-300">
      <div className="w-full max-w-4xl h-[85vh] bg-[#0a0a0a] border border-nexus-800 rounded-[32px] shadow-2xl flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="p-8 border-b border-nexus-800 flex justify-between items-center bg-nexus-950">
            <h2 className="text-2xl font-black text-white uppercase tracking-wider flex items-center gap-3">
                <SettingsIcon /> Workspace Settings
            </h2>
            <button onClick={onClose} className="p-2 text-gray-500 hover:text-white transition-colors"><X size={24}/></button>
        </div>

        <div className="flex flex-1 overflow-hidden">
            {/* Sidebar */}
            <div className="w-64 bg-nexus-950 border-r border-nexus-800 p-6 space-y-2">
                <button 
                    onClick={() => setActiveTab('PROFILE')}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold transition-all ${activeTab === 'PROFILE' ? 'bg-nexus-accent text-black shadow-lg shadow-nexus-accent/20' : 'text-gray-500 hover:text-white hover:bg-white/5'}`}
                >
                    <User size={18}/> Profile
                </button>
                <button 
                    onClick={() => setActiveTab('BILLING')}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold transition-all ${activeTab === 'BILLING' ? 'bg-nexus-accent text-black shadow-lg shadow-nexus-accent/20' : 'text-gray-500 hover:text-white hover:bg-white/5'}`}
                >
                    <CreditCard size={18}/> Billing & Plan
                </button>
                
                <div className="pt-8">
                    <button onClick={logout} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold text-red-500 hover:bg-red-500/10 transition-all">
                        <LogOut size={18}/> Sign Out
                    </button>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 p-10 overflow-y-auto custom-scrollbar bg-black/20">
                {activeTab === 'PROFILE' && (
                    <div className="space-y-8 animate-in slide-in-from-right-4">
                        <div className="flex items-center gap-6">
                            <div className="w-24 h-24 rounded-3xl bg-nexus-accent/10 border border-nexus-accent/20 flex items-center justify-center overflow-hidden">
                                {user?.photoURL ? <img src={user.photoURL} className="w-full h-full object-cover" /> : <User size={40} className="text-nexus-accent" />}
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-white">{user?.displayName || 'User'}</h3>
                                <p className="text-sm text-gray-500">{user?.email}</p>
                                <div className="mt-2 flex gap-2">
                                    <span className="px-2 py-1 bg-nexus-900 border border-nexus-800 rounded text-[9px] text-gray-400 font-bold uppercase">{userPlan.tier} Plan</span>
                                    <span className="px-2 py-1 bg-blue-900/20 border border-blue-800 rounded text-[9px] text-blue-400 font-bold uppercase">ID: {user?.uid.slice(0,8)}</span>
                                </div>
                            </div>
                        </div>

                        <div className="bg-nexus-900/30 border border-nexus-800 rounded-2xl p-6">
                            <h4 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                                <ShieldCheck size={16} className="text-nexus-accent"/> Security
                            </h4>
                            <p className="text-xs text-gray-500 mb-4">Your account is secured via Google Authentication. We do not store passwords.</p>
                            <div className="flex items-center gap-2 text-[10px] font-mono text-gray-400 bg-black p-2 rounded w-fit border border-nexus-800">
                                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span> Encrypted Session Active
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'BILLING' && (
                    <div className="space-y-8 animate-in slide-in-from-right-4">
                        {showComingSoonBillingNotice && (
                            <div className="bg-yellow-500/10 border border-yellow-500/30 text-yellow-200 rounded-2xl p-4 text-xs">
                                Billing automation actions (cancel, refund, add-ons) are temporarily disabled while backend rollout is finalized.
                            </div>
                        )}

                        {/* Current Plan Card */}
                        <div className="bg-gradient-to-br from-nexus-900 to-black border border-nexus-800 rounded-[24px] p-8 relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-3 opacity-10"><CreditCard size={100} /></div>
                            
                            <div className="flex justify-between items-start relative z-10">
                                <div>
                                    <div className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Current Subscription</div>
                                    <h3 className="text-3xl font-black text-white mb-2">{planName}</h3>
                                    <div className="flex items-center gap-2 mt-2">
                                        {userPlan.tier === 'FREE' ? (
                                            <span className="text-xs text-red-500 font-bold bg-red-900/20 px-2 py-1 rounded border border-red-900/30">You are on Free Plan</span>
                                        ) : (
                                            <>
                                                <span className={`px-2 py-1 rounded text-[9px] font-bold uppercase ${userPlan.autoRenew ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-500'}`}>
                                                    {userPlan.autoRenew ? 'Active' : 'Cancelled'}
                                                </span>
                                                <span className="text-xs text-gray-500">
                                                    Plan valid till: <strong className="text-white">{expiryDate}</strong>
                                                </span>
                                            </>
                                        )}
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    {userPlan.tier === 'FREE' ? (
                                        <button onClick={() => { onClose(); onUpgrade(); }} className="px-6 py-3 bg-nexus-accent text-black font-bold rounded-xl text-xs uppercase hover:scale-105 transition-all shadow-lg">
                                            Upgrade to Pro
                                        </button>
                                    ) : userPlan.autoRenew ? (
                                        <button onClick={() => billingAutomationEnabled && setCancelConfirm(true)} disabled={!billingAutomationEnabled} className="px-6 py-3 bg-nexus-900 border border-nexus-800 text-gray-400 font-bold rounded-xl text-xs uppercase hover:text-white hover:border-red-500 hover:bg-red-900/10 transition-all disabled:opacity-50 disabled:cursor-not-allowed">
                                            Cancel Plan
                                        </button>
                                    ) : (
                                        <button onClick={() => { onClose(); onUpgrade(); }} className="px-6 py-3 bg-nexus-accent text-black font-bold rounded-xl text-xs uppercase hover:scale-105 transition-all shadow-lg">
                                            Re-Activate Pro
                                        </button>
                                    )}
                                </div>
                            </div>
                            
                            {userPlan.tier !== 'FREE' && (
                                <div className="mt-4 pt-4 border-t border-white/5 flex gap-4">
                                    <button onClick={billingAutomationEnabled ? handleRefund : undefined} disabled={!billingAutomationEnabled} className="text-[10px] text-gray-500 hover:text-white underline decoration-dotted disabled:opacity-50 disabled:cursor-not-allowed">Request Refund (7-Day Policy)</button>
                                </div>
                            )}
                        </div>

                        {/* USAGE & ADD-ONS (CONDITIONAL VISIBILITY) */}
                        {isUnlimitedPlan ? (
                            <div className="bg-nexus-accent/10 border border-nexus-accent/30 p-6 rounded-2xl flex items-center gap-4">
                                <div className="w-12 h-12 bg-nexus-accent/20 rounded-full flex items-center justify-center text-nexus-accent">
                                    <Zap size={24} fill="currentColor"/>
                                </div>
                                {userPlan.tier === 'BUSINESS' ? (
                                    <div>
                                        <h4 className="text-lg font-black text-white">Unlimited Power Active</h4>
                                        <p className="text-xs text-gray-400 leading-relaxed">
                                            Relax. You have unlimited access to the Architect and all premium nodes. No add-ons required.
                                        </p>
                                    </div>
                                ) : (
                                    <div>
                                        <h4 className="text-lg font-black text-white">Pro Access Active</h4>
                                        <p className="text-xs text-gray-400 leading-relaxed">
                                            You have 5,000 monthly runs and full access to Architect Pro.
                                        </p>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div>
                                <div className="flex justify-between items-center mb-4">
                                    <h4 className="text-sm font-bold text-white flex items-center gap-2">
                                        <Zap size={16} className="text-nexus-wire"/> AI Fuel & Add-ons
                                    </h4>
                                    <span className="text-[10px] font-bold text-nexus-accent bg-nexus-accent/10 px-2 py-1 rounded-full uppercase tracking-wider">
                                        Balance: {userPlan.credits || 0} Credits
                                    </span>
                                </div>
                                
                                <div className="grid grid-cols-3 gap-4">
                                    {ADDON_PACKS.map(pack => (
                                        <div key={pack.id} className="bg-nexus-900/40 border border-nexus-800 p-4 rounded-2xl hover:border-nexus-accent/50 transition-all group">
                                            <div className="flex justify-between items-start mb-2">
                                                 <div className="p-2 bg-nexus-950 rounded-lg text-nexus-accent"><ShoppingBag size={16}/></div>
                                                 <div className="text-xs font-bold text-white">{regionSymbol}{userPlan.region === 'IN' ? pack.price.IN : pack.price.GLOBAL}</div>
                                            </div>
                                            <div className="text-sm font-black text-white uppercase tracking-tight">{pack.name}</div>
                                            <div className="text-[10px] text-gray-500 mb-4">+{pack.credits} AI Prompts</div>
                                            <button 
                                                onClick={billingAutomationEnabled ? () => handleBuyAddon(pack) : undefined}
                                                disabled={!!isBuying || !billingAutomationEnabled}
                                                className="w-full py-2 bg-white/5 hover:bg-nexus-accent hover:text-black text-white text-[10px] font-bold rounded-lg uppercase tracking-wider transition-all"
                                            >
                                                {!billingAutomationEnabled ? 'Coming Soon' : (isBuying === pack.id ? 'Processing...' : 'Buy Now')}
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Invoice History */}
                        <div className="opacity-50 pointer-events-none grayscale">
                            <h4 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                                <Download size={16} className="text-gray-500"/> Invoice History
                            </h4>
                            <div className="bg-nexus-900/30 border border-nexus-800 rounded-2xl p-4 text-[10px] text-gray-500 text-center">
                                No invoices available in demo mode.
                            </div>
                        </div>

                        {/* Cancel Modal */}
                        {cancelConfirm && (
                            <div className="fixed inset-0 z-[500] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                                <div className="bg-nexus-900 border border-red-900/50 w-full max-w-sm rounded-3xl p-8 shadow-2xl relative">
                                    <div className="w-12 h-12 bg-red-900/20 rounded-full flex items-center justify-center mb-6 mx-auto border border-red-900/30">
                                        <AlertTriangle size={24} className="text-red-500"/>
                                    </div>
                                    <h3 className="text-xl font-bold text-white text-center mb-2">Cancel Subscription?</h3>
                                    <p className="text-xs text-gray-500 text-center mb-8">You will keep access until the end of your current billing period.</p>
                                    
                                    <div className="flex gap-3">
                                        <button onClick={() => setCancelConfirm(false)} className="flex-1 py-3 bg-nexus-800 text-white rounded-xl text-[10px] font-bold uppercase tracking-widest">Keep Plan</button>
                                        <button onClick={handleCancel} disabled={isCancelling} className="flex-1 py-3 bg-red-600 text-white rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-red-500 transition-all">
                                            {isCancelling ? 'Processing...' : 'Confirm'}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
      </div>
    </div>
  );
};

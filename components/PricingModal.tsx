
import React, { useState, useEffect, useRef } from 'react';
import { Check, X, Crown, ShieldCheck, Zap, Briefcase, Star, CreditCard, Loader2, PartyPopper, AlertTriangle, ArrowRight, Tag, RefreshCcw, Shield, ExternalLink, Lock } from 'lucide-react';
import { Region, PlanTier, UserPlan, CouponData } from '../types';
import { useAuth } from '../context/AuthContext';
import { processPaymentSuccess, validateCoupon } from '../services/cloudStore';
import { BillingEngine } from '../services/billingService';
import LegalModal from './LegalModal';

interface PricingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpgrade?: (plan: UserPlan) => void;
}

type ModalState = 'SELECTION' | 'SUMMARY' | 'PROCESSING' | 'SUCCESS' | 'ERROR';

const PricingModal: React.FC<PricingModalProps> = ({ isOpen, onClose, onUpgrade }) => {
  const { user } = useAuth();
  const [uiState, setUiState] = useState<ModalState>('SELECTION');
  const [errorMessage, setErrorMessage] = useState('');
  const [isLegalOpen, setIsLegalOpen] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  
  const [region, setRegion] = useState<Region>('IN');
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [selectedPaidTier, setSelectedPaidTier] = useState<PlanTier>('PRO');
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<CouponData | null>(null);
  const [autoRenew, setAutoRenew] = useState(true);
  const [isValidatingCoupon, setIsValidatingCoupon] = useState(false);

  const paypalContainerRef = useRef<HTMLDivElement>(null);

  const prices = {
    IN: { PRO: { monthly: 799, yearly: 7191 }, BUSINESS: { monthly: 1999, yearly: 17991 }, symbol: '₹' },
    GLOBAL: { PRO: { monthly: 9.99, yearly: 89.91 }, BUSINESS: { monthly: 24.99, yearly: 224.91 }, symbol: '$' }
  };

  useEffect(() => {
    if (isOpen) {
        setUiState('SELECTION');
        setErrorMessage('');
        setAgreedToTerms(false);
    }
  }, [isOpen]);

  const handleApplyCoupon = async () => {
      if (!couponCode.trim()) return;
      setIsValidatingCoupon(true);
      try {
          const coupon = await validateCoupon(couponCode, selectedPaidTier);
          setAppliedCoupon(coupon);
          if (coupon.requiredAutoPay) setAutoRenew(true);
      } catch (e: any) {
          setErrorMessage(e.message);
          setAppliedCoupon(null);
      } finally { setIsValidatingCoupon(false); }
  };

  const getFinalAmount = () => {
      const priceObj = prices[region][selectedPaidTier === 'BUSINESS' ? 'BUSINESS' : 'PRO'];
      const baseAmount = billingCycle === 'monthly' ? priceObj.monthly : priceObj.yearly;
      if (appliedCoupon) {
          const discountAmount = (baseAmount * appliedCoupon.discountPercent) / 100;
          return Math.max(0, Math.floor((baseAmount - discountAmount) * 100) / 100);
      }
      return baseAmount;
  };

  const handleSuccess = async (details: any) => {
      setUiState('PROCESSING');
      try {
          if (!user) throw new Error("User session expired.");
          
          // CRITICAL: Simulate Backend Verification (Handshake)
          await BillingEngine.verifyTransaction({
              paymentId: details.paymentId,
              tier: selectedPaidTier,
              region: region
          });

          const newPlan = await processPaymentSuccess(user.uid, user.email || 'unknown', {
              paymentId: details.paymentId,
              amount: getFinalAmount(),
              currency: region === 'IN' ? 'INR' : 'USD',
              gateway: region === 'IN' ? 'razorpay' : 'paypal',
              tier: selectedPaidTier,
              cycle: billingCycle,
              autoRenew: autoRenew
          });

          setUiState('SUCCESS');
          if (onUpgrade) onUpgrade(newPlan);
      } catch (err: any) {
          setErrorMessage(err.message || "Activation failed. Verification error.");
          setUiState('ERROR');
      }
  };

  const handleRazorpayPayment = async () => {
    if (!agreedToTerms) { alert("Please agree to the Terms of Service."); return; }
    setUiState('PROCESSING');
    const amount = getFinalAmount();
    const options = {
      key: "rzp_test_NexusLive", 
      amount: Math.round(amount * 100), 
      currency: "INR",
      name: "NexusStream",
      description: `Upgrade to ${selectedPaidTier}`,
      handler: async (response: any) => await handleSuccess({ paymentId: response.razorpay_payment_id }),
      prefill: { name: user?.displayName, email: user?.email },
      theme: { color: "#00ff9d" },
      modal: { ondismiss: () => setUiState('SUMMARY') }
    };
    try { const rzp = new (window as any).Razorpay(options); rzp.open(); } 
    catch (e) { setErrorMessage("Network error connecting to payment gateway."); setUiState('ERROR'); }
  };

  if (!isOpen) return null;

  const currentPrices = prices[region];
  const finalPrice = getFinalAmount();

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/95 backdrop-blur-3xl animate-in fade-in duration-300">
      <LegalModal isOpen={isLegalOpen} onClose={() => setIsLegalOpen(false)} />
      
      <div className="w-full max-w-6xl bg-nexus-900 border border-nexus-800 rounded-3xl shadow-2xl flex flex-col max-h-[95vh] overflow-hidden relative">
        {uiState === 'SUCCESS' && (
            <div className="absolute inset-0 z-50 bg-nexus-950 flex flex-col items-center justify-center text-center p-8 animate-in zoom-in-95">
                <div className="w-24 h-24 bg-nexus-accent/20 rounded-full flex items-center justify-center mb-6 shadow-[0_0_50px_#00ff9d33]">
                    <PartyPopper size={48} className="text-nexus-accent animate-bounce" />
                </div>
                <h2 className="text-3xl font-black text-white mb-2 uppercase tracking-widest">Protocol Verified</h2>
                <p className="text-gray-400 mb-8 max-w-md">Your production stack is now active. All advanced AI limits have been removed.</p>
                <button onClick={onClose} className="px-12 py-4 bg-white text-black font-black rounded-2xl uppercase text-xs tracking-widest hover:scale-105 transition-all shadow-xl">Enter Dashboard</button>
            </div>
        )}

        {uiState === 'PROCESSING' && (
            <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center text-center p-8">
                <Loader2 size={48} className="text-nexus-accent animate-spin mb-4" />
                <h3 className="text-xl font-bold text-white uppercase tracking-widest">Verifying Handshake...</h3>
                <p className="text-gray-500 text-xs mt-2">Connecting to Secure Token Service.</p>
            </div>
        )}

        <div className="p-6 border-b border-nexus-800 flex justify-between items-center bg-nexus-950">
           <div className="flex items-center gap-3">
              <div className="p-2 bg-nexus-accent/10 rounded-lg"><Crown size={24} className="text-nexus-accent" /></div>
              <div>
                <h2 className="text-xl font-black text-white uppercase tracking-wider leading-none">Upgrade Protocol</h2>
                <div className="flex items-center gap-2 mt-1">
                    <span className="w-1.5 h-1.5 bg-nexus-success rounded-full animate-pulse"></span>
                    <span className="text-[8px] font-black text-gray-500 uppercase tracking-widest">Verified Merchant Tunnel Active</span>
                </div>
              </div>
           </div>
           <button onClick={onClose} className="p-2 text-gray-500 hover:text-white"><X size={24} /></button>
        </div>

        <div className="p-6 overflow-y-auto bg-[#050505] flex-1">
          {uiState === 'SELECTION' && (
            <div className="space-y-6">
                <div className="flex flex-col sm:flex-row justify-center items-center gap-6">
                    <div className="flex p-1 bg-nexus-950 rounded-xl border border-nexus-800">
                        <button onClick={() => setRegion('IN')} className={`px-6 py-2 text-[10px] font-black rounded-lg transition-all ${region === 'IN' ? 'bg-nexus-800 text-white shadow ring-1 ring-nexus-accent' : 'text-gray-500 hover:text-white'}`}>🇮🇳 INR (LOCAL)</button>
                        <button onClick={() => setRegion('GLOBAL')} className={`px-6 py-2 text-[10px] font-black rounded-lg transition-all ${region === 'GLOBAL' ? 'bg-nexus-800 text-white shadow ring-1 ring-blue-500' : 'text-gray-500 hover:text-white'}`}>🌍 USD (GLOBAL)</button>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="p-8 rounded-[32px] border border-nexus-800 bg-nexus-900/30 opacity-40">
                        <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-1">Starter Core</h3>
                        <div className="text-4xl font-black text-white mb-6">{currentPrices.symbol}0</div>
                        <ul className="space-y-3 mb-8 text-[11px] text-gray-500"><li>● 5 Workflows</li><li>● Basic AI Only</li></ul>
                        <button disabled className="w-full py-4 bg-nexus-800 text-gray-500 rounded-2xl text-[10px] font-black uppercase">Current Plan</button>
                    </div>

                    <div className={`p-8 rounded-[32px] border-2 transition-all cursor-pointer ${selectedPaidTier === 'PRO' ? 'border-nexus-accent bg-nexus-accent/5' : 'border-nexus-800 bg-nexus-900/50'}`} onClick={() => setSelectedPaidTier('PRO')}>
                        <div className="text-xs font-black text-nexus-accent uppercase tracking-widest mb-1">Nexus Pro</div>
                        <div className="text-4xl font-black text-white mb-6">{currentPrices.symbol}{billingCycle === 'monthly' ? currentPrices.PRO.monthly : currentPrices.PRO.yearly}</div>
                        <button onClick={() => setUiState('SUMMARY')} className="w-full py-4 bg-nexus-accent text-black rounded-2xl text-[10px] font-black uppercase hover:scale-105 transition-all shadow-lg">Initialize Pro</button>
                    </div>

                    <div className={`p-8 rounded-[32px] border-2 transition-all cursor-pointer ${selectedPaidTier === 'BUSINESS' ? 'border-nexus-wire bg-nexus-wire/5' : 'border-nexus-800 bg-nexus-900/50'}`} onClick={() => setSelectedPaidTier('BUSINESS')}>
                        <div className="text-xs font-black text-nexus-wire uppercase tracking-widest mb-1">Enterprise</div>
                        <div className="text-4xl font-black text-white mb-6">{currentPrices.symbol}{billingCycle === 'monthly' ? currentPrices.BUSINESS.monthly : currentPrices.BUSINESS.yearly}</div>
                        <button onClick={() => setUiState('SUMMARY')} className="w-full py-4 bg-nexus-wire text-black rounded-2xl text-[10px] font-black uppercase hover:scale-105 transition-all shadow-lg">Initialize Enterprise</button>
                    </div>
                </div>
            </div>
          )}

          {uiState === 'SUMMARY' && (
             <div className="max-w-2xl mx-auto space-y-6 animate-in slide-in-from-right">
                <div className="bg-nexus-900/50 border border-nexus-800 p-8 rounded-[32px]">
                    <div className="flex justify-between items-center mb-8">
                        <div>
                            <div className="text-[10px] text-gray-500 uppercase tracking-widest mb-1">Final Selection</div>
                            <div className="text-2xl font-black text-white">Nexus {selectedPaidTier} • <span className="text-nexus-accent">{currentPrices.symbol}{finalPrice}</span></div>
                        </div>
                        <button onClick={() => setUiState('SELECTION')} className="p-2 text-gray-600 hover:text-white transition-colors"><RefreshCcw size={16}/></button>
                    </div>

                    <div className="space-y-4">
                        <div className="flex items-center gap-4 p-4 bg-black/40 rounded-2xl border border-white/5 cursor-pointer" onClick={() => setAgreedToTerms(!agreedToTerms)}>
                            <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${agreedToTerms ? 'bg-nexus-accent border-nexus-accent' : 'border-white/10'}`}>
                                {agreedToTerms && <Check size={14} className="text-black font-black"/>}
                            </div>
                            <div className="text-[11px] text-gray-400">
                                I agree to the <button onClick={(e) => { e.stopPropagation(); setIsLegalOpen(true); }} className="text-white hover:underline">Terms of Service</button> and <button onClick={(e) => { e.stopPropagation(); setIsLegalOpen(true); }} className="text-white hover:underline">Privacy Policy</button>.
                            </div>
                        </div>
                        
                        <div className="flex items-center gap-4 p-4 bg-blue-600/5 rounded-2xl border border-blue-600/20">
                             <Lock size={16} className="text-blue-500 shrink-0"/>
                             <p className="text-[10px] text-blue-200/60 leading-relaxed italic">NexusStream is a digital SaaS platform. No physical goods are shipped. Payments are for digital workspace access.</p>
                        </div>
                    </div>

                    <div className="pt-8">
                        {region === 'IN' ? (
                            <button onClick={handleRazorpayPayment} disabled={!agreedToTerms} className="w-full py-5 bg-nexus-accent text-black rounded-2xl text-[12px] font-black uppercase tracking-[0.2em] hover:scale-[1.02] transition-all flex items-center justify-center gap-3 disabled:opacity-30 shadow-2xl">
                                Verify & Pay via Razorpay <ArrowRight size={18}/>
                            </button>
                        ) : (
                            <div ref={paypalContainerRef} className="min-h-[45px] opacity-100"></div>
                        )}
                    </div>
                </div>
             </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PricingModal;

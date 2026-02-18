
import React, { useState, useEffect } from 'react';
import { Check, X, Crown, ShieldCheck, Zap, AlertTriangle, ArrowRight, Tag, RefreshCcw, Lock, Globe, Ticket, PartyPopper, Loader2 } from 'lucide-react';
import { Region, PlanTier, UserPlan, CouponData } from '../types';
import { useAuth } from '../context/AuthContext';
import { PaymentGateway } from '../services/paymentGateway';
import LegalModal from './LegalModal';
import { PLAN_LIMITS } from '../constants';
import { toast } from 'react-hot-toast';

interface PricingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpgrade?: (plan: UserPlan) => void;
  triggerReason?: string;
}

type ModalState = 'SELECTION' | 'SUMMARY' | 'PROCESSING';

const PricingModal: React.FC<PricingModalProps> = ({ isOpen, onClose, onUpgrade, triggerReason }) => {
  const { user } = useAuth();
  const [uiState, setUiState] = useState<ModalState>('SELECTION');
  const [isLegalOpen, setIsLegalOpen] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  
  const [region, setRegion] = useState<Region>('GLOBAL');
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [selectedPaidTier, setSelectedPaidTier] = useState<PlanTier>('PRO');
  
  const [isLoading, setIsLoading] = useState(false);

  // Prices
  const prices = {
    IN: { PRO: { monthly: 2499, yearly: 24990 }, BUSINESS: { monthly: 4999, yearly: 49990 }, symbol: '₹' },
    GLOBAL: { PRO: { monthly: 49, yearly: 490 }, BUSINESS: { monthly: 99, yearly: 990 }, symbol: '$' }
  };

  useEffect(() => {
    if (isOpen) {
        setUiState('SELECTION');
        setIsLoading(false);
        setAgreedToTerms(false);
    }
  }, [isOpen]);

  const handlePayPalUpgrade = async () => {
      if (!agreedToTerms) { 
          toast.error("Please agree to the Terms of Service."); 
          return; 
      }
      
      setIsLoading(true);
      setUiState('PROCESSING');

      try {
          // 1. Call Backend
          const order = await PaymentGateway.createPayPalOrder(selectedPaidTier, billingCycle);
          
          if (order.approvalUrl) {
              // 2. Redirect to PayPal
              window.location.href = order.approvalUrl;
          } else {
              throw new Error("Invalid response from server");
          }

      } catch (err: any) {
          console.error("Payment Start Error:", err);
          toast.error(err.message || "Failed to initialize payment.");
          setUiState('SUMMARY'); // Go back to summary
          setIsLoading(false);
      }
  };

  if (!isOpen) return null;

  const currentPrices = prices[region];
  const priceObj = currentPrices[selectedPaidTier];
  const amount = billingCycle === 'monthly' ? priceObj.monthly : priceObj.yearly;

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/95 backdrop-blur-3xl animate-in fade-in duration-300">
      <LegalModal isOpen={isLegalOpen} onClose={() => setIsLegalOpen(false)} />
      
      <div className="w-full max-w-6xl bg-nexus-900 border border-nexus-800 rounded-3xl shadow-2xl flex flex-col max-h-[95vh] overflow-hidden relative">
        
        {/* PROCESSING OVERLAY */}
        {uiState === 'PROCESSING' && (
            <div className="absolute inset-0 z-50 bg-black/90 flex flex-col items-center justify-center text-center p-8">
                <Loader2 size={48} className="text-nexus-accent animate-spin mb-4" />
                <h3 className="text-xl font-bold text-white uppercase tracking-widest">Connecting to PayPal...</h3>
                <p className="text-gray-400 text-sm mt-2">Redirecting you to secure checkout.</p>
            </div>
        )}

        {/* HEADER */}
        <div className="p-6 border-b border-nexus-800 flex justify-between items-center bg-nexus-950">
           <div className="flex items-center gap-3">
              <div className="p-2 bg-nexus-accent/10 rounded-lg"><Crown size={24} className="text-nexus-accent" /></div>
              <h2 className="text-xl font-black text-white uppercase tracking-wider">Upgrade Plan</h2>
           </div>
           <button onClick={onClose} className="p-2 text-gray-500 hover:text-white"><X size={24} /></button>
        </div>

        <div className="p-6 overflow-y-auto bg-[#050505] flex-1">
          {uiState === 'SELECTION' ? (
            <div className="space-y-8">
                {/* Simplified for brevity - Imagine Plan Selection Grid Here */}
                <div className="flex justify-center gap-4">
                    <button onClick={() => setSelectedPaidTier('PRO')} className={`p-8 border rounded-2xl w-64 ${selectedPaidTier === 'PRO' ? 'border-nexus-accent bg-nexus-accent/10' : 'border-nexus-800'}`}>
                        <div className="text-2xl font-bold text-white">PRO</div>
                        <div className="text-4xl mt-2 font-black">{currentPrices.symbol}{currentPrices.PRO.monthly}</div>
                    </button>
                    <button onClick={() => setSelectedPaidTier('BUSINESS')} className={`p-8 border rounded-2xl w-64 ${selectedPaidTier === 'BUSINESS' ? 'border-nexus-wire bg-nexus-wire/10' : 'border-nexus-800'}`}>
                        <div className="text-2xl font-bold text-white">BUSINESS</div>
                        <div className="text-4xl mt-2 font-black">{currentPrices.symbol}{currentPrices.BUSINESS.monthly}</div>
                    </button>
                </div>
                <div className="text-center">
                    <button onClick={() => setUiState('SUMMARY')} className="px-8 py-3 bg-nexus-accent text-black font-bold rounded-xl">Continue</button>
                </div>
            </div>
          ) : (
             <div className="max-w-md mx-auto space-y-6">
                <div className="bg-nexus-900/50 border border-nexus-800 p-8 rounded-[32px]">
                    <div className="text-center mb-6">
                        <div className="text-xs text-gray-500 uppercase tracking-widest mb-1">Total Due</div>
                        <div className="text-4xl font-black text-white">{currentPrices.symbol}{amount}</div>
                        <div className="text-sm text-nexus-accent mt-1">{selectedPaidTier} Plan ({billingCycle})</div>
                    </div>

                    <div className="flex items-center gap-4 p-4 bg-black/40 rounded-2xl border border-white/5 cursor-pointer mb-6" onClick={() => setAgreedToTerms(!agreedToTerms)}>
                        <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${agreedToTerms ? 'bg-nexus-accent border-nexus-accent' : 'border-white/10'}`}>
                            {agreedToTerms && <Check size={14} className="text-black font-black"/>}
                        </div>
                        <div className="text-[11px] text-gray-400">
                            I agree to the <button className="text-white hover:underline">Terms of Service</button>.
                        </div>
                    </div>

                    <button 
                        onClick={handlePayPalUpgrade} 
                        disabled={!agreedToTerms || isLoading} 
                        className="w-full py-4 bg-blue-600 text-white rounded-2xl text-[12px] font-black uppercase tracking-[0.2em] hover:bg-blue-500 transition-all flex items-center justify-center gap-3 disabled:opacity-50 shadow-2xl"
                    >
                        {isLoading ? <Loader2 className="animate-spin"/> : <ArrowRight size={18}/>}
                        Pay with PayPal
                    </button>
                    
                    <button onClick={() => setUiState('SELECTION')} className="w-full mt-4 text-xs text-gray-500 hover:text-white">Back to Plans</button>
                </div>
             </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PricingModal;

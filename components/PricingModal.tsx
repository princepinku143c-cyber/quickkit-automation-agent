
import React, { useState, useEffect, useRef } from 'react';
import { Check, X, Crown, ShieldCheck, Zap, Briefcase, Star, CreditCard, Loader2, Wifi, WifiOff, PartyPopper, AlertTriangle, ArrowRight, Tag, RefreshCcw } from 'lucide-react';
import { Region, PlanTier, UserPlan, CouponData } from '../types';
import { useAuth } from '../context/AuthContext';
import { processPaymentSuccess, validateCoupon } from '../services/cloudStore';

interface PricingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpgrade?: (plan: UserPlan) => void;
}

type ModalState = 'SELECTION' | 'SUMMARY' | 'PROCESSING' | 'SUCCESS' | 'ERROR';

const PricingModal: React.FC<PricingModalProps> = ({ isOpen, onClose, onUpgrade }) => {
  const { user } = useAuth();
  
  // State Machine
  const [uiState, setUiState] = useState<ModalState>('SELECTION');
  const [errorMessage, setErrorMessage] = useState('');
  
  // Selection State
  const [region, setRegion] = useState<Region>('IN');
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [selectedPaidTier, setSelectedPaidTier] = useState<PlanTier>('PRO');
  
  // Payment Page (Summary) State
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<CouponData | null>(null);
  const [autoRenew, setAutoRenew] = useState(true);
  const [isValidatingCoupon, setIsValidatingCoupon] = useState(false);

  const [paypalReady, setPaypalReady] = useState(false);
  const paypalContainerRef = useRef<HTMLDivElement>(null);

  // --- CONFIG ---
  const prices = {
    IN: {
      PRO: { monthly: 799, yearly: 7191 },
      BUSINESS: { monthly: 1999, yearly: 17991 },
      symbol: '₹'
    },
    GLOBAL: {
      PRO: { monthly: 9.99, yearly: 89.91 },
      BUSINESS: { monthly: 24.99, yearly: 224.91 },
      symbol: '$'
    }
  };

  // Reset state on open
  useEffect(() => {
    if (isOpen) {
        setUiState('SELECTION');
        setErrorMessage('');
        setCouponCode('');
        setAppliedCoupon(null);
        setAutoRenew(true);
    }
  }, [isOpen]);

  // --- LOGIC: COUPON & PRICE ---
  const handleApplyCoupon = async () => {
      if (!couponCode.trim()) return;
      setIsValidatingCoupon(true);
      setErrorMessage('');
      try {
          const coupon = await validateCoupon(couponCode, selectedPaidTier);
          setAppliedCoupon(coupon);
          if (coupon.requiredAutoPay) {
              setAutoRenew(true); // Force Auto-Pay
          }
      } catch (e: any) {
          setErrorMessage(e.message);
          setAppliedCoupon(null);
      } finally {
          setIsValidatingCoupon(false);
      }
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

  // --- CORE: HANDLE SUCCESS ---
  const handleSuccess = async (details: any) => {
      setUiState('PROCESSING');
      try {
          if (!user) throw new Error("User not authenticated");

          // Call "Backend" Logic
          const newPlan = await processPaymentSuccess(user.uid, user.email || 'unknown', {
              paymentId: details.paymentId,
              amount: getFinalAmount(),
              currency: region === 'IN' ? 'INR' : 'USD',
              gateway: region === 'IN' ? 'razorpay' : 'paypal',
              tier: selectedPaidTier,
              cycle: billingCycle,
              couponCode: appliedCoupon?.code,
              autoRenew: autoRenew
          });

          // Update UI
          setUiState('SUCCESS');
          if (onUpgrade) onUpgrade(newPlan);
          
          // Auto-close after 3 seconds
          setTimeout(() => {
              onClose();
          }, 4000);

      } catch (err: any) {
          console.error("Payment Process Error", err);
          setErrorMessage(err.message || "Payment received, but activation failed. Contact support.");
          setUiState('ERROR');
      }
  };

  // --- 1. RAZORPAY LOGIC ---
  const handleRazorpayPayment = async () => {
    if (!user) return;
    
    // Optimistic Load
    setUiState('PROCESSING');

    const amount = getFinalAmount();

    const options = {
      key: "rzp_test_PlaceHolder", // ⚠️ Live Key in Prod
      amount: Math.round(amount * 100), 
      currency: "INR",
      name: "NexusStream",
      description: `${selectedPaidTier} (${billingCycle})`,
      image: "https://cdn-icons-png.flaticon.com/512/9626/9626629.png",
      handler: async function (response: any) {
        await handleSuccess({
            paymentId: response.razorpay_payment_id,
            amount: amount
        });
      },
      prefill: {
        name: user.displayName || "User",
        email: user.email || "user@example.com",
      },
      theme: { color: "#00ff9d" },
      modal: {
        ondismiss: function() { setUiState('SUMMARY'); }
      }
    };

    try {
        const rzp = new (window as any).Razorpay(options);
        rzp.open();
    } catch (e) {
        setErrorMessage("Razorpay SDK failed. Check network.");
        setUiState('ERROR');
    }
  };

  // --- 2. PAYPAL LOGIC ---
  useEffect(() => {
    let intervalId: any;

    if (isOpen && region === 'GLOBAL' && uiState === 'SUMMARY') {
        const checkAndRender = () => {
            const paypal = (window as any).paypal;
            if (paypal && paypalContainerRef.current) {
                setPaypalReady(true);
                paypalContainerRef.current.innerHTML = ''; // Clean

                const amount = getFinalAmount();

                try {
                    paypal.Buttons({
                        style: { layout: 'vertical', color: 'blue', shape: 'rect', label: 'pay', height: 45 },
                        createOrder: (data: any, actions: any) => {
                            return actions.order.create({
                                purchase_units: [{
                                    description: `NexusStream ${selectedPaidTier}`,
                                    amount: { currency_code: 'USD', value: amount.toString() }
                                }]
                            });
                        },
                        onApprove: async (data: any, actions: any) => {
                            const order = await actions.order.capture();
                            await handleSuccess({
                                paymentId: order.id,
                                amount: amount
                            });
                        },
                        onError: (err: any) => {
                            console.error("PayPal Error", err);
                            // Do not crash UI, let user retry
                        }
                    }).render(paypalContainerRef.current);
                } catch (e) { console.error("PP Render", e); }
                return true; 
            }
            return false;
        };

        if (!checkAndRender()) {
            intervalId = setInterval(() => {
                if (checkAndRender()) clearInterval(intervalId);
            }, 500);
        }
    } else {
        setPaypalReady(false);
    }
    return () => clearInterval(intervalId);
  }, [isOpen, region, selectedPaidTier, billingCycle, uiState, appliedCoupon]); 

  if (!isOpen) return null;

  const currentPrices = prices[region];
  const priceObj = currentPrices[selectedPaidTier === 'BUSINESS' ? 'BUSINESS' : 'PRO'];
  const basePrice = billingCycle === 'monthly' ? priceObj.monthly : priceObj.yearly;
  const finalPrice = getFinalAmount();

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/95 backdrop-blur-xl animate-in fade-in duration-300">
      <div className="w-full max-w-6xl bg-nexus-900 border border-nexus-800 rounded-3xl shadow-2xl flex flex-col max-h-[95vh] overflow-hidden relative">
        
        {/* SUCCESS VIEW */}
        {uiState === 'SUCCESS' && (
            <div className="absolute inset-0 z-50 bg-nexus-950 flex flex-col items-center justify-center text-center p-8 animate-in zoom-in-95">
                <div className="w-24 h-24 bg-nexus-accent/20 rounded-full flex items-center justify-center mb-6 shadow-[0_0_50px_rgba(0,255,157,0.3)]">
                    <PartyPopper size={48} className="text-nexus-accent animate-bounce" />
                </div>
                <h2 className="text-3xl font-display font-bold text-white mb-2">Payment Successful!</h2>
                <p className="text-gray-400 mb-8 max-w-md">
                    Welcome to <b>NexusStream {selectedPaidTier}</b>. Your plan is active until {new Date(Date.now() + 30*24*60*60*1000).toLocaleDateString()}.
                </p>
                <div className="flex gap-4">
                    <div className="bg-nexus-900 border border-nexus-800 p-4 rounded-xl min-w-[150px]">
                        <div className="text-[10px] text-gray-500 uppercase">Amount Paid</div>
                        <div className="text-xl font-bold text-nexus-accent">{currentPrices.symbol}{finalPrice}</div>
                    </div>
                    <div className="bg-nexus-900 border border-nexus-800 p-4 rounded-xl min-w-[150px]">
                        <div className="text-[10px] text-gray-500 uppercase">Auto-Renew</div>
                        <div className="text-xl font-bold text-white">{autoRenew ? 'Active' : 'Off'}</div>
                    </div>
                </div>
                <button onClick={onClose} className="mt-8 px-8 py-3 bg-white text-black font-bold rounded-xl hover:scale-105 transition-transform">
                    Go to Dashboard
                </button>
            </div>
        )}

        {/* PROCESSING VIEW */}
        {uiState === 'PROCESSING' && (
            <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center text-center p-8">
                <Loader2 size={48} className="text-nexus-accent animate-spin mb-4" />
                <h3 className="text-xl font-bold text-white">Verifying Transaction...</h3>
                <p className="text-gray-500 text-sm mt-2">Do not close this window.</p>
            </div>
        )}

        {/* ERROR VIEW */}
        {uiState === 'ERROR' && (
            <div className="absolute inset-0 z-50 bg-nexus-950/90 flex flex-col items-center justify-center text-center p-8">
                <AlertTriangle size={48} className="text-red-500 mb-4" />
                <h3 className="text-xl font-bold text-white">Payment Failed</h3>
                <p className="text-red-400 text-sm mt-2 mb-6 max-w-md">{errorMessage}</p>
                <div className="flex gap-4">
                    <button onClick={() => setUiState('SUMMARY')} className="px-6 py-2 bg-nexus-800 text-white rounded-lg font-bold">Try Again</button>
                    <button onClick={onClose} className="px-6 py-2 text-gray-500 hover:text-white">Cancel</button>
                </div>
            </div>
        )}

        {/* HEADER */}
        <div className="p-6 border-b border-nexus-800 flex justify-between items-center bg-nexus-950">
           <div className="flex items-center gap-3">
              <div className="p-2 bg-nexus-accent/10 rounded-lg">
                <Crown size={24} className="text-nexus-accent" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white uppercase tracking-tight">Upgrade Plan</h2>
                <div className="flex items-center gap-2">
                    <p className="text-[10px] text-gray-500 font-mono uppercase tracking-widest">
                        {uiState === 'SUMMARY' ? 'Order Summary' : 'Select your power'}
                    </p>
                </div>
              </div>
           </div>
           <button onClick={onClose} className="p-2 text-gray-400 hover:text-white transition-colors"><X size={24} /></button>
        </div>

        {/* CONTENT AREA */}
        <div className="p-6 overflow-y-auto bg-[#050505] flex-1">
          
          {/* STATE: SELECTION */}
          {uiState === 'SELECTION' && (
            <div className="space-y-6">
                {/* Controls */}
                <div className="flex flex-col sm:flex-row justify-center items-center gap-6">
                    <div className="flex p-1 bg-nexus-950 rounded-xl border border-nexus-800">
                        <button onClick={() => setRegion('IN')} className={`px-6 py-2 text-[10px] font-black rounded-lg transition-all flex items-center gap-2 ${region === 'IN' ? 'bg-nexus-800 text-white shadow ring-1 ring-nexus-wire' : 'text-gray-500 hover:text-white'}`}>
                            🇮🇳 INDIA <span className="text-[8px] bg-nexus-wire text-black px-1.5 rounded font-bold">RAZORPAY</span>
                        </button>
                        <button onClick={() => setRegion('GLOBAL')} className={`px-6 py-2 text-[10px] font-black rounded-lg transition-all flex items-center gap-2 ${region === 'GLOBAL' ? 'bg-nexus-800 text-white shadow ring-1 ring-blue-500' : 'text-gray-500 hover:text-white'}`}>
                            🌍 GLOBAL <span className="text-[8px] bg-blue-600 text-white px-1.5 rounded font-bold">PAYPAL</span>
                        </button>
                    </div>
                    <div className="flex p-1 bg-nexus-950 rounded-xl border border-nexus-800 relative">
                        <div className="absolute -top-3 -right-3 bg-nexus-accent text-black text-[8px] font-black px-2 py-0.5 rounded-full animate-bounce">SAVE 25%</div>
                        <button onClick={() => setBillingCycle('monthly')} className={`px-6 py-2 text-[10px] font-black rounded-lg transition-all ${billingCycle === 'monthly' ? 'bg-nexus-accent text-black' : 'text-gray-500'}`}>MONTHLY</button>
                        <button onClick={() => setBillingCycle('yearly')} className={`px-6 py-2 text-[10px] font-black rounded-lg transition-all ${billingCycle === 'yearly' ? 'bg-nexus-accent text-black' : 'text-gray-500'}`}>YEARLY</button>
                    </div>
                </div>

                {/* Pricing Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* FREE */}
                    <div className="p-6 rounded-2xl border border-nexus-700 bg-nexus-900/30 flex flex-col hover:border-gray-500 transition-colors opacity-50">
                        <div className="mb-4">
                            <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest mb-1">Starter</h3>
                            <div className="text-4xl font-black text-white">{currentPrices.symbol}0</div>
                        </div>
                        <ul className="space-y-4 mb-8 flex-1">
                            <li className="flex items-center gap-3 text-xs text-gray-300"><Check size={10}/> 3/5 Workflows</li>
                        </ul>
                        <button disabled className="w-full py-3 bg-nexus-800 text-gray-500 rounded-xl text-[10px] font-black uppercase border border-nexus-700">Current Plan</button>
                    </div>

                    {/* PRO */}
                    <div 
                        className={`p-6 rounded-2xl border-2 flex flex-col relative transition-all cursor-pointer ${selectedPaidTier === 'PRO' ? 'border-nexus-accent bg-nexus-accent/5 shadow-[0_0_30px_rgba(0,255,157,0.1)]' : 'border-nexus-800 bg-nexus-900/50 opacity-60'}`}
                        onClick={() => setSelectedPaidTier('PRO')}
                    >
                        <div className="absolute top-0 right-0 p-1.5 bg-nexus-accent text-black text-[9px] font-black uppercase px-4 rounded-bl-xl">Popular</div>
                        <div className="mb-4">
                            <h3 className="text-sm font-black text-nexus-accent uppercase tracking-widest mb-1 flex items-center gap-2"><Star size={14} fill="currentColor"/> Pro</h3>
                            <div className="text-4xl font-black text-white">
                                {currentPrices.symbol}{billingCycle === 'monthly' ? currentPrices.PRO.monthly : currentPrices.PRO.yearly}
                            </div>
                        </div>
                        <ul className="space-y-4 mb-8 flex-1">
                            <li className="flex items-center gap-3 text-xs text-white"><Check size={10} className="text-nexus-accent"/> Unlimited Workflows</li>
                            <li className="flex items-center gap-3 text-xs text-white"><Check size={10} className="text-nexus-accent"/> Advanced AI</li>
                        </ul>
                        <button 
                            onClick={() => { setSelectedPaidTier('PRO'); setUiState('SUMMARY'); }}
                            className="w-full py-3 bg-nexus-accent text-black rounded-xl text-[10px] font-black uppercase hover:scale-105 transition-all"
                        >
                            Select Pro
                        </button>
                    </div>

                    {/* BUSINESS */}
                    <div 
                        className={`p-6 rounded-2xl border-2 flex flex-col transition-all cursor-pointer ${selectedPaidTier === 'BUSINESS' ? 'border-nexus-wire bg-nexus-wire/5 shadow-[0_0_30px_rgba(255,215,0,0.1)]' : 'border-nexus-800 bg-nexus-900/50 opacity-60'}`}
                        onClick={() => setSelectedPaidTier('BUSINESS')}
                    >
                        <div className="mb-4">
                            <h3 className="text-sm font-black text-nexus-wire uppercase tracking-widest mb-1 flex items-center gap-2"><Briefcase size={14} /> Business</h3>
                            <div className="text-4xl font-black text-white">
                                {currentPrices.symbol}{billingCycle === 'monthly' ? currentPrices.BUSINESS.monthly : currentPrices.BUSINESS.yearly}
                            </div>
                        </div>
                        <ul className="space-y-4 mb-8 flex-1">
                            <li className="flex items-center gap-3 text-xs text-white"><Check size={10} className="text-nexus-wire"/> Everything in Pro</li>
                            <li className="flex items-center gap-3 text-xs text-white"><Check size={10} className="text-nexus-wire"/> Account Manager</li>
                        </ul>
                        <button 
                            onClick={() => { setSelectedPaidTier('BUSINESS'); setUiState('SUMMARY'); }}
                            className="w-full py-3 bg-nexus-wire text-black rounded-xl text-[10px] font-black uppercase hover:scale-105 transition-all"
                        >
                            Select Business
                        </button>
                    </div>
                </div>
            </div>
          )}

          {/* STATE: SUMMARY (CHECKOUT) */}
          {uiState === 'SUMMARY' && (
             <div className="max-w-2xl mx-auto space-y-6 animate-in slide-in-from-right">
                
                {/* Plan Details Card */}
                <div className="bg-nexus-900/50 border border-nexus-800 p-6 rounded-2xl flex justify-between items-center">
                    <div>
                        <div className="text-xs text-gray-500 uppercase tracking-widest mb-1">Selected Plan</div>
                        <div className="text-xl font-bold text-white flex items-center gap-2">
                             NexusStream {selectedPaidTier} 
                             <span className="text-[10px] bg-nexus-800 px-2 py-0.5 rounded border border-nexus-700">{billingCycle}</span>
                        </div>
                    </div>
                    <button onClick={() => setUiState('SELECTION')} className="text-xs text-nexus-accent hover:underline">Change</button>
                </div>

                {/* Coupon Section */}
                <div className="bg-nexus-900/50 border border-nexus-800 p-6 rounded-2xl">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                        <Tag size={12} /> Add Coupon Code
                    </label>
                    <div className="flex gap-2">
                        <input 
                            type="text" 
                            placeholder="Enter code here..." 
                            value={couponCode}
                            onChange={(e) => setCouponCode(e.target.value)}
                            disabled={!!appliedCoupon}
                            className={`flex-1 bg-nexus-950 border rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-1 transition-all ${errorMessage ? 'border-red-500 focus:ring-red-500' : 'border-nexus-700 focus:border-nexus-accent'}`}
                        />
                        {appliedCoupon ? (
                             <button onClick={() => { setAppliedCoupon(null); setCouponCode(''); }} className="px-4 bg-nexus-800 hover:bg-red-900/30 text-gray-400 hover:text-red-500 border border-nexus-700 rounded-lg">
                                <X size={16} />
                             </button>
                        ) : (
                             <button 
                                onClick={handleApplyCoupon} 
                                disabled={!couponCode || isValidatingCoupon}
                                className="px-6 bg-white text-black font-bold rounded-lg text-xs uppercase disabled:opacity-50"
                             >
                                {isValidatingCoupon ? <Loader2 size={14} className="animate-spin"/> : 'Apply'}
                             </button>
                        )}
                    </div>
                    {errorMessage && <div className="text-red-500 text-[10px] mt-2 flex items-center gap-1"><AlertTriangle size={10}/> {errorMessage}</div>}
                    {appliedCoupon && <div className="text-nexus-accent text-[10px] mt-2 flex items-center gap-1"><Check size={10}/> Coupon Applied! Auto-pay enabled.</div>}
                </div>

                {/* Auto-Pay Toggle */}
                <div className="bg-nexus-900/50 border border-nexus-800 p-4 rounded-xl flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-nexus-wire/10 rounded-lg"><RefreshCcw size={16} className="text-nexus-wire"/></div>
                        <div>
                            <div className="text-xs font-bold text-white">Enable Auto-Renewal</div>
                            <div className="text-[10px] text-gray-500">Secure uninterrupted service</div>
                        </div>
                    </div>
                    <button 
                        onClick={() => !appliedCoupon && setAutoRenew(!autoRenew)}
                        className={`w-10 h-5 rounded-full relative transition-colors ${autoRenew ? 'bg-nexus-success' : 'bg-gray-700'} ${appliedCoupon ? 'cursor-not-allowed opacity-80' : ''}`}
                    >
                        <div className={`absolute top-1 w-3 h-3 rounded-full bg-black transition-transform ${autoRenew ? 'left-6' : 'left-1'}`} />
                    </button>
                </div>

                {/* Pricing Breakdown */}
                <div className="border-t border-nexus-800 pt-4 space-y-2">
                    <div className="flex justify-between text-xs text-gray-400">
                        <span>Subtotal</span>
                        <span>{currentPrices.symbol}{basePrice}</span>
                    </div>
                    {appliedCoupon && (
                        <div className="flex justify-between text-xs text-nexus-accent font-bold">
                            <span>Discount ({appliedCoupon.discountPercent}%)</span>
                            <span>- {currentPrices.symbol}{Math.floor(basePrice - finalPrice)}</span>
                        </div>
                    )}
                    <div className="flex justify-between text-xl font-bold text-white pt-2 border-t border-nexus-800/50 mt-2">
                        <span>Total Due</span>
                        <span>{currentPrices.symbol}{finalPrice}</span>
                    </div>
                </div>

                {/* Pay Button */}
                <div className="pt-4">
                    {region === 'IN' ? (
                       <button onClick={handleRazorpayPayment} className="w-full py-4 bg-nexus-accent text-black rounded-xl text-sm font-black uppercase hover:scale-[1.02] transition-all flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(0,255,157,0.3)]">
                           Pay {currentPrices.symbol}{finalPrice} via Razorpay <ArrowRight size={16}/>
                       </button>
                    ) : (
                        <div className="w-full">
                            <div className="text-center text-[10px] font-bold text-gray-400 mb-2 uppercase tracking-widest">Secure Payment via PayPal</div>
                            <div ref={paypalContainerRef} className="min-h-[45px]"></div>
                        </div>
                    )}
                </div>

             </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default PricingModal;

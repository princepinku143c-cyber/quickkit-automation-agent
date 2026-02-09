
import React, { useState, useEffect, useRef } from 'react';
import { Check, X, Crown, ShieldCheck, Zap, Briefcase, Star, CreditCard, Loader2, PartyPopper, AlertTriangle, ArrowRight, Tag, RefreshCcw, Shield, ExternalLink, Lock, Globe, Ticket, Calendar } from 'lucide-react';
import { Region, PlanTier, UserPlan, CouponData } from '../types';
import { useAuth } from '../context/AuthContext';
import { validateCoupon } from '../services/cloudStore';
import { PaymentGateway } from '../services/paymentGateway';
import LegalModal from './LegalModal';
import { PLAN_LIMITS, PAYPAL_PLAN_IDS } from '../constants';

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
  const [verificationStep, setVerificationStep] = useState(0); // For UI animation
  
  // REGION & PRICING STATE
  const [region, setRegion] = useState<Region>('GLOBAL');
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [selectedPaidTier, setSelectedPaidTier] = useState<PlanTier>('PRO');
  
  // PROMO CODE STATE
  const [showPromoInput, setShowPromoInput] = useState(false);
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<CouponData | null>(null);
  const [isValidatingCoupon, setIsValidatingCoupon] = useState(false);
  const [couponError, setCouponError] = useState('');

  const [autoRenew, setAutoRenew] = useState(true);
  const paypalContainerRef = useRef<HTMLDivElement>(null);
  const paypalScriptLoaded = useRef(false);

  // --- PRICING CONFIGURATION ---
  const prices = {
    IN: { 
        PRO: { monthly: 2499, yearly: 24990 }, 
        BUSINESS: { monthly: 4999, yearly: 49990 }, 
        symbol: '₹',
        label: 'Regional Pricing (India)',
        subtext: 'Special regional pricing for India.'
    },
    GLOBAL: { 
        PRO: { monthly: 49, yearly: 490 }, 
        BUSINESS: { monthly: 99, yearly: 990 }, 
        symbol: '$',
        label: 'Standard Global Pricing',
        subtext: 'Standard global pricing.'
    }
  };

  // --- REGION DETECTION ---
  useEffect(() => {
    if (isOpen) {
        setUiState('SELECTION');
        setErrorMessage('');
        setAgreedToTerms(false);
        setAppliedCoupon(null);
        setCouponCode('');
        setShowPromoInput(false);
        setVerificationStep(0);

        const cached = localStorage.getItem("nexus_pricing_region");
        if (cached === "IN" || cached === "GLOBAL") {
            setRegion(cached as Region);
        } else {
            fetch("https://ipapi.co/country/")
              .then(res => res.text())
              .then(code => {
                  const detected = code.trim() === "IN" ? "IN" : "GLOBAL";
                  setRegion(detected);
                  localStorage.setItem("nexus_pricing_region", detected);
              })
              .catch(() => setRegion("GLOBAL"));
        }
    }
  }, [isOpen]);

  // --- ANIMATED VERIFICATION STEPS ---
  useEffect(() => {
      if (uiState === 'PROCESSING') {
          const interval = setInterval(() => {
              setVerificationStep(prev => (prev + 1) % 4);
          }, 800);
          return () => clearInterval(interval);
      }
  }, [uiState]);

  const toggleRegion = (r: Region) => {
      setRegion(r);
      localStorage.setItem("nexus_pricing_region", r);
      setAppliedCoupon(null); 
      setCouponCode('');
      setCouponError('');
  };

  const getFinalAmount = () => {
      // Logic only for PRO since BUSINESS is custom/contact
      if (selectedPaidTier === 'BUSINESS') return 0;

      const priceObj = prices[region]['PRO'];
      const baseAmount = billingCycle === 'monthly' ? priceObj.monthly : priceObj.yearly;
      
      if (appliedCoupon) {
          let discount = 0;
          if (appliedCoupon.discountType === 'PERCENT') {
              discount = (baseAmount * appliedCoupon.discountValue) / 100;
          } else if (appliedCoupon.discountType === 'FLAT') {
              discount = appliedCoupon.discountValue;
          }
          return Math.max(0, Math.floor((baseAmount - discount) * 100) / 100);
      }
      return baseAmount;
  };

  const getBaseAmount = () => {
      if (selectedPaidTier === 'BUSINESS') return 0;
      const priceObj = prices[region]['PRO'];
      return billingCycle === 'monthly' ? priceObj.monthly : priceObj.yearly;
  };

  const handleApplyCoupon = async () => {
      if (!couponCode.trim()) return;
      setIsValidatingCoupon(true);
      setCouponError('');
      
      try {
          const coupon = await validateCoupon(couponCode, selectedPaidTier, region);
          setAppliedCoupon(coupon);
          if (coupon.requiredAutoPay) setAutoRenew(true);
      } catch (e: any) {
          setCouponError(e.message || "Invalid code");
          setAppliedCoupon(null);
      } finally { 
          setIsValidatingCoupon(false); 
      }
  };

  const removeCoupon = () => {
      setAppliedCoupon(null);
      setCouponCode('');
      setCouponError('');
  };

  // --- PAYMENT FLOW HANDLER ---
  const handlePaymentStart = async () => {
      if (selectedPaidTier === 'BUSINESS') return; // Should not happen via this flow

      if (!agreedToTerms) { alert("Please agree to the Terms of Service."); return; }
      
      setUiState('PROCESSING');

      try {
          if (!user) throw new Error("User session expired.");

          // 1. Create Order (Server-Side)
          const order = await PaymentGateway.createOrder(selectedPaidTier, billingCycle, region);

          // 2. Open Gateway
          if (region === 'IN') {
              // RAZORPAY FLOW
              PaymentGateway.openRazorpay(
                  order,
                  user.email || 'guest',
                  async (response) => {
                      // 3. Verify on Backend
                      setUiState('PROCESSING'); 
                      const isValid = await PaymentGateway.verifyBackend(response);
                      if (isValid) {
                          completeUpgrade(response.paymentId, 'RAZORPAY');
                      } else {
                          throw new Error("Payment Verification Failed. Contact Support.");
                      }
                  },
                  (err) => {
                      setUiState('ERROR');
                      setErrorMessage(err.description || "Payment Cancelled");
                  }
              );
          } else {
              // PAYPAL handled by button renderer below
          }

      } catch (err: any) {
          setErrorMessage(err.message || "Initialization failed.");
          setUiState('ERROR');
      }
  };

  const completeUpgrade = (txnId: string, provider: 'RAZORPAY' | 'PAYPAL') => {
      if (!user) return;
      
      const newPlan: UserPlan = { 
          uid: user.uid, 
          email: user.email || 'unknown', 
          tier: selectedPaidTier, 
          region: region, 
          role: 'USER',
          status: 'active', 
          expiresAt: Date.now() + (billingCycle === 'monthly' ? 30 : 365) * 24 * 60 * 60 * 1000, 
          updatedAt: Date.now(), 
          autoRenew: true, 
          lastPaymentId: txnId,
          provider: provider,
          credits: selectedPaidTier === 'PRO' ? 100000 : 1000000, 
          monthlyLimit: selectedPaidTier === 'PRO' ? 100000 : 1000000,
          aiUsed: 0
      };

      if (onUpgrade) onUpgrade(newPlan);
      setUiState('SUCCESS');
  };

  const handleContactSales = () => {
      window.location.href = "mailto:sales@nexusstream.ai?subject=Business Plan Inquiry";
  };

  // --- DYNAMIC PAYPAL LOADER & RENDERER ---
  useEffect(() => {
    // Only load/render if Global (Not India), Summary Screen, Not Business Plan
    if (isOpen && region === 'GLOBAL' && uiState === 'SUMMARY' && selectedPaidTier !== 'BUSINESS' && paypalContainerRef.current) {
        
        // 1. DYNAMICALLY LOAD SCRIPT
        const loadPayPal = async () => {
            if (paypalScriptLoaded.current) return Promise.resolve();
            // @ts-ignore
            if (window.paypal) {
                paypalScriptLoaded.current = true;
                return Promise.resolve();
            }

            // Using Vite environment variable as per user request
            // @ts-ignore
            const clientID = import.meta.env.VITE_PAYPAL_CLIENT_ID;
            if (!clientID) {
                console.error("VITE_PAYPAL_CLIENT_ID missing");
                return Promise.reject("PayPal Client ID Not Found");
            }

            return new Promise((resolve, reject) => {
                const script = document.createElement('script');
                script.src = `https://www.paypal.com/sdk/js?client-id=${clientID}&vault=true&intent=subscription`;
                script.onload = () => {
                    paypalScriptLoaded.current = true;
                    resolve(true);
                };
                script.onerror = () => reject("PayPal Script Failed");
                document.body.appendChild(script);
            });
        };

        // 2. RENDER BUTTONS
        loadPayPal().then(() => {
            if (!paypalContainerRef.current) return;
            paypalContainerRef.current.innerHTML = '';
            
            try {
                // @ts-ignore
                if (window.paypal) {
                    const planId = billingCycle === 'monthly' ? PAYPAL_PLAN_IDS.PRO_MONTHLY : PAYPAL_PLAN_IDS.PRO_YEARLY;
                    
                    // @ts-ignore
                    window.paypal.Buttons({
                        style: { layout: 'vertical', color: 'blue', shape: 'rect', label: 'pay' },
                        createSubscription: (data: any, actions: any) => {
                            return actions.subscription.create({
                                'plan_id': planId
                            });
                        },
                        onApprove: async (data: any, actions: any) => {
                            setUiState('PROCESSING');
                            const isValid = await PaymentGateway.verifyBackend({ subscriptionId: data.subscriptionID });
                            if (isValid) {
                                completeUpgrade(data.subscriptionID, 'PAYPAL');
                            } else {
                                setUiState('ERROR');
                                setErrorMessage("Subscription Verification Failed");
                            }
                        },
                        onError: (err: any) => {
                            console.warn("PayPal Error", err);
                            // Fallback simulation for dev mode if needed
                            // handlePaymentStart(); 
                        }
                    }).render(paypalContainerRef.current);
                }
            } catch (e) {
                console.error("PayPal Render Error", e);
            }
        }).catch(err => {
            console.error("PayPal Load Error:", err);
            // Fallback UI
            if (paypalContainerRef.current) {
                const btn = document.createElement('button');
                btn.className = "w-full py-4 bg-gray-800 text-gray-400 font-bold rounded-xl flex items-center justify-center gap-2 cursor-not-allowed";
                btn.innerHTML = `<span>PayPal Unavailable (Config Error)</span>`;
                paypalContainerRef.current.appendChild(btn);
            }
        });
    }
  }, [isOpen, region, uiState, selectedPaidTier, billingCycle, appliedCoupon]);

  if (!isOpen) return null;

  const currentPrices = prices[region];
  const finalPrice = getFinalAmount();
  const basePrice = getBaseAmount();

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/95 backdrop-blur-3xl animate-in fade-in duration-300">
      <LegalModal isOpen={isLegalOpen} onClose={() => setIsLegalOpen(false)} />
      
      <div className="w-full max-w-6xl bg-nexus-900 border border-nexus-800 rounded-3xl shadow-2xl flex flex-col max-h-[95vh] overflow-hidden relative">
        
        {/* SUCCESS STATE */}
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

        {/* ERROR STATE */}
        {uiState === 'ERROR' && (
            <div className="absolute inset-0 z-50 bg-black/90 backdrop-blur-sm flex flex-col items-center justify-center text-center p-8 animate-in zoom-in-95">
                <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center mb-6 border border-red-500/30">
                    <AlertTriangle size={40} className="text-red-500" />
                </div>
                <h3 className="text-xl font-bold text-white uppercase tracking-widest">Transaction Failed</h3>
                <p className="text-gray-400 text-sm mt-2 max-w-xs">{errorMessage}</p>
                <button onClick={() => setUiState('SUMMARY')} className="mt-8 px-8 py-3 bg-nexus-900 border border-nexus-800 rounded-xl text-white text-xs font-bold uppercase hover:bg-nexus-800">Try Again</button>
            </div>
        )}

        {/* PROCESSING STATE WITH MESSAGING */}
        {uiState === 'PROCESSING' && (
            <div className="absolute inset-0 z-50 bg-black/95 backdrop-blur-sm flex flex-col items-center justify-center text-center p-8">
                <div className="relative mb-8">
                    <div className="w-16 h-16 border-4 border-nexus-800 border-t-nexus-accent rounded-full animate-spin"></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                        <Lock size={20} className="text-nexus-accent animate-pulse"/>
                    </div>
                </div>
                
                <h3 className="text-xl font-bold text-white uppercase tracking-widest mb-2">Secure Handshake</h3>
                <div className="h-6 overflow-hidden relative w-64">
                    <div className="absolute w-full transition-all duration-500 text-xs text-nexus-accent font-mono" style={{ transform: `translateY(-${verificationStep * 20}px)` }}>
                        <div className="h-5">Encrypting Payload...</div>
                        <div className="h-5">Verifying Gateway Signature...</div>
                        <div className="h-5">Upgrading Cluster Access...</div>
                        <div className="h-5">Finalizing Transaction...</div>
                    </div>
                </div>
            </div>
        )}

        {/* HEADER */}
        <div className="p-6 border-b border-nexus-800 flex justify-between items-center bg-nexus-950">
           <div className="flex items-center gap-3">
              <div className="p-2 bg-nexus-accent/10 rounded-lg"><Crown size={24} className="text-nexus-accent" /></div>
              <div>
                <h2 className="text-xl font-black text-white uppercase tracking-wider leading-none">Upgrade Protocol</h2>
                <div className="flex items-center gap-2 mt-1">
                    <span className="w-1.5 h-1.5 bg-nexus-success rounded-full animate-pulse"></span>
                    <span className="text-[8px] font-black text-gray-500 uppercase tracking-widest">Secure Gateway Active</span>
                </div>
              </div>
           </div>
           <button onClick={onClose} className="p-2 text-gray-500 hover:text-white"><X size={24} /></button>
        </div>

        <div className="p-6 overflow-y-auto bg-[#050505] flex-1">
          {uiState === 'SELECTION' && (
            <div className="space-y-8">
                <div className="text-center mb-8">
                    <h1 className="text-3xl md:text-4xl font-black text-white mb-3">Design Automations Smarter</h1>
                    <p className="text-gray-400 text-sm md:text-base max-w-2xl mx-auto">Build, validate, and improve workflows visually — before you automate anything.</p>
                </div>

                {/* CONTROLS ROW: REGION & BILLING CYCLE */}
                <div className="flex flex-col items-center gap-6 mb-8">
                    <div className="flex gap-4">
                        <div className="flex p-1 bg-nexus-950 rounded-xl border border-nexus-800">
                            <button onClick={() => toggleRegion('IN')} className={`px-4 py-2 text-[10px] font-black rounded-lg transition-all flex items-center gap-2 ${region === 'IN' ? 'bg-nexus-800 text-white shadow ring-1 ring-nexus-accent' : 'text-gray-500 hover:text-white'}`}>🇮🇳 India (₹)</button>
                            <button onClick={() => toggleRegion('GLOBAL')} className={`px-4 py-2 text-[10px] font-black rounded-lg transition-all flex items-center gap-2 ${region === 'GLOBAL' ? 'bg-nexus-800 text-white shadow ring-1 ring-blue-500' : 'text-gray-500 hover:text-white'}`}>🌍 Global ($)</button>
                        </div>
                        <div className="flex p-1 bg-nexus-950 rounded-xl border border-nexus-800 relative">
                            <button onClick={() => setBillingCycle('monthly')} className={`px-4 py-2 text-[10px] font-black rounded-lg transition-all ${billingCycle === 'monthly' ? 'bg-nexus-800 text-white shadow' : 'text-gray-500 hover:text-white'}`}>Monthly</button>
                            <button onClick={() => setBillingCycle('yearly')} className={`px-4 py-2 text-[10px] font-black rounded-lg transition-all relative ${billingCycle === 'yearly' ? 'bg-nexus-800 text-white shadow' : 'text-gray-500 hover:text-white'}`}>Yearly <span className="absolute -top-3 -right-3 bg-nexus-accent text-black text-[8px] px-1.5 py-0.5 rounded-full font-black animate-bounce">-17%</span></button>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 text-[10px] text-gray-500 bg-white/5 px-3 py-1.5 rounded-full border border-white/5">
                        <Globe size={10} className={region === 'IN' ? 'text-nexus-accent' : 'text-blue-500'} />
                        {currentPrices.subtext}
                    </div>
                </div>

                {/* PLANS GRID */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* EXPLORER (FREE) PLAN */}
                    <div className="p-8 rounded-[32px] border border-nexus-800 bg-nexus-900/30 flex flex-col">
                        <div className="mb-4">
                            <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-1">{PLAN_LIMITS.FREE.LABEL}</h3>
                            <div className="text-4xl font-black text-white">{currentPrices.symbol}0 <span className="text-sm font-medium text-gray-500">/ Free</span></div>
                            <p className="text-[10px] text-gray-500 mt-2">Best for trying the platform logic.</p>
                        </div>
                        <ul className="space-y-3 mb-8 text-[11px] text-gray-400 flex-1">
                            <li className="flex gap-2"><Check size={14} className="text-nexus-accent"/> 1 Workflow Project</li>
                            <li className="flex gap-2"><Check size={14} className="text-nexus-accent"/> 5 AI Prompts (Lifetime)</li>
                            <li className="flex gap-2"><Check size={14} className="text-nexus-accent"/> Visual Canvas</li>
                            <li className="flex gap-2 text-gray-600"><X size={14}/> Cloud Save</li>
                        </ul>
                        <div className="mt-auto">
                            <div className="text-[9px] text-gray-500 text-center mb-2">Need more prompts? Buy AI Fuel via Settings.</div>
                            <button disabled className="w-full py-4 bg-nexus-800 text-gray-500 rounded-2xl text-[10px] font-black uppercase cursor-not-allowed">Active Plan</button>
                        </div>
                    </div>

                    {/* PRO PLAN */}
                    <div className={`p-8 rounded-[32px] border-2 transition-all cursor-pointer relative overflow-hidden flex flex-col ${selectedPaidTier === 'PRO' ? 'border-nexus-accent bg-nexus-accent/5' : 'border-nexus-800 bg-nexus-900/50'}`} onClick={() => setSelectedPaidTier('PRO')}>
                        <div className="absolute top-0 right-0 bg-nexus-accent text-black text-[9px] font-black uppercase px-3 py-1 rounded-bl-xl">Most Popular</div>
                        <div className="mb-4">
                            <div className="text-xs font-black text-nexus-accent uppercase tracking-widest mb-1">{PLAN_LIMITS.PRO.LABEL}</div>
                            <div className="text-4xl font-black text-white">{currentPrices.symbol}{billingCycle === 'monthly' ? currentPrices.PRO.monthly : currentPrices.PRO.yearly} <span className="text-sm font-medium text-gray-500">/ {billingCycle === 'monthly' ? 'mo' : 'yr'}</span></div>
                            {billingCycle === 'yearly' && <p className="text-[10px] text-nexus-success mt-1 font-bold">🎉 2 Months Free applied</p>}
                            <p className="text-[10px] text-gray-400 mt-2">No prompt limits. Just design.</p>
                        </div>
                        <ul className="space-y-3 mb-8 text-[11px] text-gray-300 flex-1">
                            <li className="flex gap-2"><Check size={14} className="text-nexus-accent"/> Unlimited Workflows</li>
                            <li className="flex gap-2"><Check size={14} className="text-nexus-accent"/> <strong className="text-white">Unlimited Architect AI</strong></li>
                            <li className="flex gap-2"><Check size={14} className="text-nexus-accent"/> Cloud Save & History</li>
                            <li className="flex gap-2"><Check size={14} className="text-nexus-accent"/> Design-Only Channels</li>
                        </ul>
                        <button onClick={() => setUiState('SUMMARY')} className="w-full py-4 bg-nexus-accent text-black rounded-2xl text-[10px] font-black uppercase hover:scale-105 transition-all shadow-lg">Upgrade to Pro</button>
                    </div>

                    {/* BUSINESS PLAN - NO PRICE DISPLAY */}
                    <div className="p-8 rounded-[32px] border border-nexus-800 bg-nexus-900/50 flex flex-col">
                        <div className="mb-4">
                            <div className="text-xs font-black text-gray-400 uppercase tracking-widest mb-1">{PLAN_LIMITS.BUSINESS.LABEL}</div>
                            <div className="text-4xl font-black text-white">Custom</div>
                            <p className="text-[10px] text-gray-400 mt-2">For teams collaborating on automation design.</p>
                        </div>
                        <ul className="space-y-3 mb-8 text-[11px] text-gray-300 flex-1">
                            <li className="flex gap-2"><Check size={14} className="text-white"/> Everything in Pro</li>
                            <li className="flex gap-2"><Check size={14} className="text-white"/> Team Collaboration</li>
                            <li className="flex gap-2"><Check size={14} className="text-white"/> Audit Logs</li>
                            <li className="flex gap-2"><Check size={14} className="text-white"/> SLA Support</li>
                        </ul>
                        <button onClick={handleContactSales} className="w-full py-4 bg-white text-black rounded-2xl text-[10px] font-black uppercase hover:bg-gray-200 transition-all shadow-lg">Contact Sales</button>
                    </div>
                </div>

                <div className="bg-blue-900/20 border border-blue-500/30 rounded-xl p-4 flex items-start gap-4">
                    <Lock size={20} className="text-blue-400 mt-1 shrink-0" />
                    <div>
                        <h4 className="text-sm font-bold text-white mb-1">Honest Note</h4>
                        <p className="text-xs text-blue-200/80 leading-relaxed">
                            This platform helps you design and plan automations with AI. Execution support is coming later.
                        </p>
                    </div>
                </div>
            </div>
          )}

          {uiState === 'SUMMARY' && selectedPaidTier === 'PRO' && (
             <div className="max-w-2xl mx-auto space-y-6 animate-in slide-in-from-right">
                <div className="bg-nexus-900/50 border border-nexus-800 p-8 rounded-[32px]">
                    <div className="flex justify-between items-center mb-8">
                        <div>
                            <div className="text-[10px] text-gray-500 uppercase tracking-widest mb-1">Final Selection</div>
                            <div className="flex items-baseline gap-3">
                                {appliedCoupon ? (
                                    <>
                                        <div className="text-2xl font-black text-white line-through opacity-50">{currentPrices.symbol}{basePrice}</div>
                                        <div className="text-3xl font-black text-nexus-accent">{currentPrices.symbol}{finalPrice}</div>
                                    </>
                                ) : (
                                    <div className="text-3xl font-black text-white">{currentPrices.symbol}{basePrice}</div>
                                )}
                                <span className="text-xs font-bold text-gray-500">{selectedPaidTier} • {billingCycle}</span>
                            </div>
                        </div>
                        <button onClick={() => setUiState('SELECTION')} className="p-2 text-gray-600 hover:text-white transition-colors"><RefreshCcw size={16}/></button>
                    </div>

                    {/* PROMO CODE SECTION */}
                    <div className="space-y-3">
                        {!appliedCoupon && !showPromoInput && (
                            <button 
                                onClick={() => setShowPromoInput(true)} 
                                className="text-xs text-nexus-accent font-bold hover:underline flex items-center gap-1"
                            >
                                <Tag size={12} /> Have a promo code?
                            </button>
                        )}

                        {showPromoInput && !appliedCoupon && (
                            <div className="flex gap-2 animate-in slide-in-from-top-2">
                                <div className="flex-1 relative">
                                    <input 
                                        type="text" 
                                        value={couponCode} 
                                        onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                                        placeholder="Enter code" 
                                        className="w-full bg-black/40 border border-nexus-700 rounded-lg px-3 py-2 text-xs text-white focus:border-nexus-accent outline-none"
                                    />
                                    {couponError && <span className="text-[9px] text-red-500 absolute -bottom-4 left-1">{couponError}</span>}
                                </div>
                                <button 
                                    onClick={handleApplyCoupon} 
                                    disabled={!couponCode || isValidatingCoupon}
                                    className="px-4 py-2 bg-nexus-800 text-white rounded-lg text-xs font-bold hover:bg-nexus-700 transition-all disabled:opacity-50"
                                >
                                    {isValidatingCoupon ? <Loader2 size={12} className="animate-spin"/> : 'Apply'}
                                </button>
                            </div>
                        )}

                        {appliedCoupon && (
                            <div className="flex items-center justify-between p-3 bg-nexus-accent/10 border border-nexus-accent/30 rounded-xl animate-in fade-in">
                                <div className="flex items-center gap-3">
                                    <div className="p-1.5 bg-nexus-accent text-black rounded-lg"><Ticket size={14}/></div>
                                    <div>
                                        <div className="text-[10px] font-black text-nexus-accent uppercase tracking-widest">Code Applied</div>
                                        <div className="text-xs font-bold text-white">{appliedCoupon.code}</div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className="text-xs font-bold text-green-400">
                                        Saved {currentPrices.symbol}{basePrice - finalPrice}
                                    </span>
                                    <button onClick={removeCoupon} className="text-gray-500 hover:text-white"><X size={14}/></button>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="h-px bg-white/10 my-6"></div>

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
                             <p className="text-[10px] text-blue-200/60 leading-relaxed italic">NexusStream is a digital SaaS platform. No physical goods.</p>
                        </div>
                    </div>

                    <div className="pt-8">
                        {/* DYNAMIC PAYMENT GATEWAY RENDERER */}
                        {region === 'IN' ? (
                            <button 
                                onClick={handlePaymentStart} 
                                disabled={!agreedToTerms} 
                                className="w-full py-5 bg-nexus-accent text-black rounded-2xl text-[12px] font-black uppercase tracking-[0.2em] hover:scale-[1.02] transition-all flex items-center justify-center gap-3 disabled:opacity-30 shadow-2xl"
                            >
                                Pay {currentPrices.symbol}{finalPrice} via Razorpay <ArrowRight size={18}/>
                            </button>
                        ) : (
                            <div className={`transition-opacity duration-500 ${agreedToTerms ? 'opacity-100 pointer-events-auto' : 'opacity-30 pointer-events-none'}`}>
                                <div key={finalPrice} ref={paypalContainerRef} className="min-h-[150px]"></div>
                            </div>
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

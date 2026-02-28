import React, { useState, useMemo } from "react";
import { Crown, Zap, ArrowRight, ShieldCheck, Loader2, X, Globe, CreditCard, Ticket } from "lucide-react";
import { PaymentGateway } from "../services/paymentGateway";
import { CouponService } from "../services/couponService";
import { toast } from "react-hot-toast";
import { useAuth } from "../context/AuthContext";
import { AdminPromo } from "../types";

interface PricingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpgrade?: any;
  triggerReason?: string;
}

const PricingModal: React.FC<PricingModalProps> = ({
  isOpen,
  onClose,
  onUpgrade,
  triggerReason
}) => {
  const { user } = useAuth();
  const [step, setStep] = useState<"plans" | "checkout">("plans");
  const [selected, setSelected] = useState<"PRO" | "BUSINESS" | null>(null);
  const [currency, setCurrency] = useState<"USD" | "INR">("USD");
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<AdminPromo | null>(null);
  const [isValidating, setIsValidating] = useState(false);

  const planData = useMemo(() => ({
    PRO: {
      basePrice: currency === 'USD' ? (billingCycle === 'monthly' ? 49 : 490) : (billingCycle === 'monthly' ? 3999 : 39990),
      symbol: currency === 'USD' ? '$' : '₹',
      glow: "shadow-[0_0_40px_rgba(0,255,200,0.4)] border-cyan-400"
    },
    BUSINESS: {
      basePrice: currency === 'USD' ? (billingCycle === 'monthly' ? 99 : 990) : (billingCycle === 'monthly' ? 8999 : 89990),
      symbol: currency === 'USD' ? '$' : '₹',
      glow: "shadow-[0_0_40px_rgba(255,200,0,0.4)] border-yellow-400"
    }
  }), [currency, billingCycle]);

  const finalPrice = useMemo(() => {
    if (!selected) return 0;
    const base = planData[selected].basePrice;
    if (!appliedCoupon) return base;
    return CouponService.calculateDiscount(base, appliedCoupon);
  }, [selected, planData, appliedCoupon]);

  if (!isOpen) return null;

  const handleApplyCoupon = async () => {
    if (!couponCode.trim() || !selected) return;
    setIsValidating(true);
    try {
      const promo = await CouponService.validate(couponCode, selected, currency);
      setAppliedCoupon(promo);
      toast.success("Coupon Applied!");
    } catch (e: any) {
      toast.error(e.message || "Invalid Coupon");
      setAppliedCoupon(null);
    } finally {
      setIsValidating(false);
    }
  };

  const handlePayment = async () => {
      if (!selected) return;
      if (!agreed) {
          toast.error("Please agree to the Terms.");
          return;
      }
      
      setLoading(true);

      if (finalPrice <= 0 && appliedCoupon) {
          try {
              const success = await PaymentGateway.applyFreeCoupon(
                  user?.uid || 'guest',
                  appliedCoupon.code,
                  selected,
                  billingCycle,
                  currency
              );
              if (success) {
                  toast.success("Plan Upgraded Successfully!");
                  window.location.reload();
              }
          } catch (e: any) {
              toast.error(e.message || "Coupon activation failed.");
          } finally {
              setLoading(false);
          }
          return;
      }
      try {
          if (currency === 'USD') {
              // --- PAYPAL FLOW (Global) ---
              const res = await PaymentGateway.createPayPalOrder(selected, billingCycle, appliedCoupon?.code);
              if (res.approvalUrl) {
                  const paypalWindow = window.open(res.approvalUrl, 'nexus-paypal-checkout', 'popup=yes,width=520,height=720');
                  if (!paypalWindow) {
                      window.location.href = res.approvalUrl;
                  }
              } else {
                  throw new Error("No approval URL");
              }
          } else {
              // --- RAZORPAY FLOW (India) ---
              const region = 'IN';
              
              // 1. Create Order
              const order = await PaymentGateway.createOrder(selected, billingCycle, region, appliedCoupon?.code);
              
              // 2. Open Modal
              await PaymentGateway.openRazorpay(
                  order,
                  user?.email || 'guest@nexusstream.ai',
                  async (response: any) => {
                      // Success Callback
                      toast.success("Payment Successful! Verifying...");
                      const valid = await PaymentGateway.verifyBackend(response);
                      if (valid) {
                          window.location.reload(); 
                      } else {
                          toast.error("Verification failed. Contact support.");
                      }
                      setLoading(false);
                  },
                  (error: any) => {
                      console.error(error);
                      toast.error("Payment Cancelled");
                      setLoading(false);
                  }
              );
          }
      } catch (e: any) {
          console.error(e);
          toast.error("Payment initialization failed. Please try again.");
          setLoading(false);
      }
  };

  return (
    <div className="fixed inset-0 z-[300] bg-black/90 backdrop-blur-xl flex items-center justify-center p-4 animate-in fade-in duration-200">

      <div className="w-full max-w-[820px] bg-[#050505] border border-white/10 rounded-3xl p-6 md:p-12 relative shadow-2xl overflow-y-auto max-h-[95vh] custom-scrollbar">

        {/* HEADER */}
        <div className="flex flex-col md:flex-row justify-between items-start mb-8 md:mb-12 gap-6">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 md:w-12 md:h-12 bg-nexus-accent/10 rounded-xl md:rounded-2xl flex items-center justify-center border border-nexus-accent/20">
                <Zap className="text-nexus-accent md:w-6 md:h-6" size={20} fill="currentColor" />
            </div>
            <div>
                <h2 className="text-xl md:text-2xl font-black tracking-widest text-white leading-none uppercase">
                Upgrade Plan
                </h2>
                {triggerReason && <p className="text-[10px] md:text-xs text-red-400 mt-1 font-bold">{triggerReason}</p>}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 md:gap-4 w-full md:w-auto">
              {/* CURRENCY TOGGLE */}
              <div className="flex bg-nexus-900 p-1 rounded-lg border border-nexus-800 flex-1 md:flex-none">
                  <button 
                    onClick={() => setCurrency('USD')}
                    className={`flex-1 md:flex-none px-3 py-1.5 rounded-md text-[9px] md:text-[10px] font-bold transition-all ${currency === 'USD' ? 'bg-white text-black shadow' : 'text-gray-500 hover:text-white'}`}
                  >
                      USD ($)
                  </button>
                  <button 
                    onClick={() => setCurrency('INR')}
                    className={`flex-1 md:flex-none px-3 py-1.5 rounded-md text-[9px] md:text-[10px] font-bold transition-all ${currency === 'INR' ? 'bg-white text-black shadow' : 'text-gray-500 hover:text-white'}`}
                  >
                      INR (₹)
                  </button>
              </div>

              <div className="flex bg-nexus-900 p-1 rounded-lg border border-nexus-800 flex-1 md:flex-none">
                  <button
                    onClick={() => setBillingCycle('monthly')}
                    className={`flex-1 md:flex-none px-3 py-1.5 rounded-md text-[9px] md:text-[10px] font-bold transition-all ${billingCycle === 'monthly' ? 'bg-white text-black shadow' : 'text-gray-500 hover:text-white'}`}
                  >
                      Monthly
                  </button>
                  <button
                    onClick={() => setBillingCycle('yearly')}
                    className={`flex-1 md:flex-none px-3 py-1.5 rounded-md text-[9px] md:text-[10px] font-bold transition-all ${billingCycle === 'yearly' ? 'bg-white text-black shadow' : 'text-gray-500 hover:text-white'}`}
                  >
                      Yearly
                  </button>
              </div>

              <button
                onClick={onClose}
                className="absolute top-6 right-6 md:static text-gray-400 hover:text-white p-2 hover:bg-white/10 rounded-full transition-all"
              >
                <X size={20} className="md:w-6 md:h-6" />
              </button>
          </div>
        </div>

        {/* STEP 1 — PLAN SELECTION */}
        {step === "plans" && (
          <div className="animate-in slide-in-from-right duration-300">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">

              {/* PRO */}
              <div
                onClick={() => setSelected("PRO")}
                className={`cursor-pointer p-8 md:p-10 rounded-3xl border transition-all duration-300 bg-[#0a0a0a] 
                ${
                   selected === "PRO"
                    ? planData.PRO.glow
                    : "border-white/10 hover:border-cyan-500 hover:shadow-[0_0_20px_rgba(0,255,200,0.2)]"
                }`}
              >
                <div className="flex justify-between items-start mb-4">
                    <h3 className="text-xl font-bold text-white">PRO</h3>
                    {selected === "PRO" && <Zap size={20} className="text-cyan-400 fill-current"/>}
                </div>
                <p className="text-5xl font-black text-white mb-4">
                  {planData.PRO.symbol}{planData.PRO.basePrice}
                </p>
                <p className="text-xs text-gray-500 mb-4">/{billingCycle === 'monthly' ? 'month' : 'year'}</p>
                <ul className="text-gray-400 space-y-2 text-sm">
                  <li>• 5,000 Runs / mo</li>
                  <li>• 100 Active Nodes</li>
                  <li>• Cloud Saves</li>
                </ul>
              </div>

              {/* BUSINESS */}
              <div
                onClick={() => setSelected("BUSINESS")}
                className={`cursor-pointer p-8 md:p-10 rounded-3xl border transition-all duration-300 bg-[#0a0a0a] 
                ${
                  selected === "BUSINESS"
                    ? planData.BUSINESS.glow
                    : "border-white/10 hover:border-yellow-400 hover:shadow-[0_0_20px_rgba(255,200,0,0.2)]"
                }`}
              >
                <div className="flex justify-between items-start mb-4">
                    <h3 className="text-xl font-bold text-white">BUSINESS</h3>
                    {selected === "BUSINESS" && <Crown size={20} className="text-yellow-400 fill-current"/>}
                </div>
                <p className="text-5xl font-black text-white mb-4">
                  {planData.BUSINESS.symbol}{planData.BUSINESS.basePrice}
                </p>
                <p className="text-xs text-gray-500 mb-4">/{billingCycle === 'monthly' ? 'month' : 'year'}</p>
                <ul className="text-gray-400 space-y-2 text-sm">
                  <li>• Unlimited Runs</li>
                  <li>• 999 Active Nodes</li>
                  <li>• Priority Support</li>
                </ul>
              </div>
            </div>

            <div className="text-center">
              <button
                disabled={!selected}
                onClick={() => setStep("checkout")}
                className={`px-12 py-4 rounded-xl font-bold tracking-widest transition-all duration-300 text-sm 
                ${
                  selected
                    ? "bg-gradient-to-r from-cyan-400 to-blue-500 text-black hover:scale-105 shadow-lg"
                    : "bg-gray-800 text-gray-500 cursor-not-allowed"
                }`}
              >
                CONTINUE
              </button>
            </div>
          </div>
        )}

        {/* STEP 2 — CHECKOUT */}
        {step === "checkout" && selected && (
          <div className="max-w-md mx-auto text-center animate-in slide-in-from-right duration-300">

            <div className="mb-8 p-6 bg-white/5 rounded-2xl border border-white/10">
                <p className="text-xs text-gray-400 tracking-widest mb-2 uppercase font-bold">
                Total Due Now
                </p>

                <h3 className={`text-6xl font-black mb-2 ${selected === 'PRO' ? 'text-cyan-400' : 'text-yellow-400'}`}>
                {planData[selected].symbol}{finalPrice}
                </h3>
                <p className="text-xs text-gray-500 mb-2">Billed {billingCycle}</p>

                {appliedCoupon && (
                    <div className="flex items-center justify-center gap-2 text-nexus-accent text-[10px] font-bold uppercase mb-2">
                        <Ticket size={12} />
                        Coupon Applied: {appliedCoupon.code} (-{appliedCoupon.type === 'PERCENT' ? `${appliedCoupon.value}%` : `${planData[selected].symbol}${appliedCoupon.value}`})
                        <button onClick={() => { setAppliedCoupon(null); setCouponCode(""); }} className="ml-1 text-red-400 hover:text-red-300">Remove</button>
                    </div>
                )}

                <p className="text-gray-400 text-sm">
                {selected} Plan (Monthly Subscription)
                </p>
                
                <div className="mt-4 flex justify-center gap-2">
                    <span className="text-[10px] bg-nexus-900 border border-white/10 px-2 py-1 rounded text-gray-400 font-bold uppercase">
                        Gateway: {currency === 'USD' ? 'PayPal' : 'Razorpay'}
                    </span>
                </div>
            </div>

            {/* COUPON INPUT */}
            {!appliedCoupon && (
                <div className="mb-8 flex gap-2">
                    <input 
                        type="text" 
                        value={couponCode}
                        onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                        placeholder="PROMO CODE"
                        className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs font-bold tracking-widest focus:outline-none focus:border-nexus-accent/50 transition-all"
                    />
                    <button 
                        onClick={handleApplyCoupon}
                        disabled={isValidating || !couponCode.trim()}
                        className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold transition-all disabled:opacity-50"
                    >
                        {isValidating ? <Loader2 size={14} className="animate-spin" /> : "APPLY"}
                    </button>
                </div>
            )}

            {/* TERMS */}
            <div className="flex justify-center items-center gap-3 mb-8 cursor-pointer group" onClick={() => setAgreed(!agreed)}>
              <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${agreed ? 'bg-cyan-400 border-cyan-400' : 'border-gray-600 group-hover:border-gray-400'}`}>
                  {agreed && <ArrowRight size={12} className="text-black"/>}
              </div>
              <span className="text-sm text-gray-400 group-hover:text-white transition-colors">
                I agree to the Terms of Service
              </span>
            </div>

            {/* PAY BUTTON */}
            <button
              disabled={!agreed || loading}
              onClick={handlePayment}
              className={`w-full py-4 rounded-xl font-bold tracking-widest transition-all duration-300 flex items-center justify-center gap-3 
              ${
                agreed && !loading
                  ? "bg-gradient-to-r from-cyan-400 to-blue-500 text-black shadow-[0_0_30px_rgba(0,255,200,0.4)] hover:scale-105 hover:shadow-[0_0_50px_rgba(0,255,200,0.6)]"
                  : "bg-gray-800 text-gray-500 cursor-not-allowed"
              }`}
            >
              {loading ? (
                  <Loader2 size={20} className="animate-spin" />
              ) : (
                    <>
                      {currency === 'USD' ? <Globe size={18} /> : <CreditCard size={18} />}
                      PAY WITH {currency === 'USD' ? 'PAYPAL' : 'RAZORPAY'}
                      <ArrowRight size={18} />
                    </>
              )}
            </button>

            {/* BACK BUTTON */}
            <button
              onClick={() => setStep("plans")}
              disabled={loading}
              className="mt-6 text-gray-500 hover:text-white text-xs font-bold uppercase tracking-widest transition-colors"
            >
              Back to Plans
            </button>

            {/* SECURITY BADGE */}
            <div className="flex justify-center items-center gap-2 mt-8 text-[10px] text-gray-600 font-bold uppercase tracking-wider">
              <ShieldCheck size={12} />
              Secure Payment via {currency === 'USD' ? 'PayPal' : 'Razorpay'} • Encrypted Checkout
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default PricingModal;

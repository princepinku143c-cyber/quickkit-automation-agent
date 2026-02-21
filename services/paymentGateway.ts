
import { PlanTier, Region } from '../types';
import { auth } from './firebase'; 

interface OrderResponse {
    id?: string;
    approvalUrl?: string;
}

export const PaymentGateway = {
    
    /**
     * Create PayPal Order (Server-to-Server) for Global Users
     */
    async createPayPalOrder(tier: PlanTier, cycle: 'monthly' | 'yearly', coupon?: string): Promise<OrderResponse> {
        const user = auth.currentUser;
        if (!user) throw new Error("User must be logged in");

        const amount = tier === 'PRO' ? 49 : 99; 

        try {
            const response = await fetch('/api/billing/paypal/createOrder', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    amount, 
                    currency: 'USD',
                    userId: user.uid,
                    coupon
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || `PayPal Error: ${response.status}`);
            }
            
            if (!data.approvalUrl) {
                throw new Error("Backend did not return an approval link.");
            }
            
            return data; 
        } catch (e: any) {
            console.error("PayPal Init Error:", e);
            throw e; 
        }
    },

    /**
     * Create Razorpay Order for Indian Users
     */
    async createOrder(tier: PlanTier, cycle: 'monthly' | 'yearly', region: Region, coupon?: string): Promise<any> {
        const user = auth.currentUser;
        if (!user) throw new Error("User must be logged in");

        // INR Pricing Logic
        const price = tier === 'PRO' ? 3999 : 8999; 

        try {
            const response = await fetch('/api/billing/razorpay/createOrder', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    amount: price * 100, // Amount in paise
                    currency: 'INR',
                    notes: { 
                        userId: user.uid,
                        tier, 
                        cycle,
                        coupon
                    }
                })
            });

            if (!response.ok) {
                 const err = await response.json();
                 throw new Error(err.error || "Razorpay Order Creation Failed");
            }
            
            return await response.json();
        } catch (e: any) {
            console.error("Razorpay Create Order Error:", e);
            throw e;
        }
    },

    /**
     * Open Razorpay Checkout Modal
     */
    async openRazorpay(order: any, email: string, success: (res: any) => void, fail: (err: any) => void) {
        if (!(window as any).Razorpay) {
            fail("Razorpay SDK not loaded. Please refresh.");
            return;
        }

        const options = {
            key: (import.meta as any).env.VITE_RAZORPAY_KEY_ID || "rzp_test_YOUR_KEY_HERE", 
            amount: order.amount,
            currency: order.currency,
            name: "NexusStream",
            description: "Pro Subscription",
            order_id: order.id,
            prefill: { email },
            theme: { color: "#00ff9d" },
            handler: function (response: any) {
                success(response);
            },
            modal: {
                ondismiss: function() {
                    fail("Payment Cancelled by user");
                }
            }
        };
        
        const rzp = new (window as any).Razorpay(options);
        rzp.open();
    },

    /**
     * Verify Payment Signature on Backend
     */
    async verifyBackend(payload: any): Promise<boolean> {
         try {
             const response = await fetch('/api/billing/verify', {
                 method: 'POST',
                 headers: { 'Content-Type': 'application/json' },
                 body: JSON.stringify(payload)
             });
             const data = await response.json();
             return data.success === true;
         } catch (e) {
             console.error("Verification Error:", e);
             return false;
         }
    },

    async requestRefund(paymentId: string, reason: string): Promise<boolean> {
        // Placeholder for refund logic
        return true;
    },

    async createAddonOrder(packId: string, region: Region): Promise<any> {
        // Simplified Addon Order Logic
        return {};
    },

    async cancelSubscription(id: string, provider: string): Promise<boolean> {
        // Cancellation logic
        return true;
    }
};

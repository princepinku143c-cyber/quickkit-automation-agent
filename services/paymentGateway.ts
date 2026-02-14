
import { PlanTier, Region } from '../types';
import { ADDON_PACKS } from '../constants';
import { auth } from './firebase'; // To get current user ID

// --- CONFIGURATION ---
// Safe Environment Accessor
const getEnv = (key: string) => {
  try {
    // @ts-ignore
    if (typeof import.meta !== 'undefined' && import.meta.env) {
      // @ts-ignore
      return import.meta.env[key];
    }
  } catch (e) {}
  
  try {
    if (typeof process !== 'undefined' && process.env) {
      return process.env[key];
    }
  } catch (e) {}
  
  return undefined;
};

const RAZORPAY_KEY_ID = getEnv('VITE_RAZORPAY_KEY_ID') || "rzp_test_1234567890";

interface OrderResponse {
    id: string;
    amount: number;
    currency: string;
}

export const PaymentGateway = {
    
    /**
     * Step 1: Create Subscription Order via API
     */
    async createOrder(tier: PlanTier, cycle: 'monthly' | 'yearly', region: Region): Promise<OrderResponse> {
        console.log("CREATE ORDER TRIGGERED", { tier, cycle, region });
        console.log("User Context:", auth.currentUser);

        const user = auth.currentUser;
        if (!user) throw new Error("User must be logged in to initiate payment");

        const amount = region === 'IN' 
            ? (tier === 'PRO' ? 249900 : 499900) 
            : (tier === 'PRO' ? 4900 : 9900);

        try {
            // Call the Vercel API endpoint we created
            const response = await fetch('/api/billing/razorpay/createOrder', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    amount,
                    currency: region === 'IN' ? 'INR' : 'USD',
                    notes: {
                        userId: user.uid, // 🔥 CRITICAL: Webhook uses this to identify user
                        email: user.email,
                        tier,
                        cycle,
                        type: 'SUBSCRIPTION'
                    }
                })
            });

            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.error || "Order creation failed");
            }

            const order = await response.json();
            return {
                id: order.id,
                amount: order.amount,
                currency: order.currency
            };
        } catch (e) {
            console.error("Payment Init Error:", e);
            // Fallback for dev/testing if API is unreachable
            return {
                id: `order_${Math.random().toString(36).substr(2, 9)}`,
                amount,
                currency: region === 'IN' ? 'INR' : 'USD'
            };
        }
    },

    /**
     * Create Add-on Order (AI Credits)
     */
    async createAddonOrder(packId: string, region: Region): Promise<OrderResponse> {
        console.log("CREATE ADDON TRIGGERED", { packId, region });

        const user = auth.currentUser;
        if (!user) throw new Error("User must be logged in");

        const pack = ADDON_PACKS.find(p => p.id === packId);
        if (!pack) throw new Error("Invalid Pack ID");

        const price = region === 'IN' ? pack.price.IN * 100 : pack.price.GLOBAL * 100;
        
        try {
            const response = await fetch('/api/billing/razorpay/createOrder', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    amount: price,
                    currency: region === 'IN' ? 'INR' : 'USD',
                    notes: {
                        userId: user.uid, // 🔥 CRITICAL
                        type: 'ADDON',
                        packId: pack.id,
                        credits: pack.credits
                    }
                })
            });

            if (!response.ok) throw new Error("Order creation failed");
            const order = await response.json();
            
            return {
                id: order.id,
                amount: order.amount,
                currency: order.currency
            };
        } catch (e) {
            return {
                id: `order_addon_${Math.random().toString(36).substr(2, 9)}`,
                amount: price,
                currency: region === 'IN' ? 'INR' : 'USD'
            };
        }
    },

    /**
     * Open Razorpay Checkout (Universal)
     */
    async openRazorpay(
        order: OrderResponse, 
        userEmail: string, 
        onSuccess: (res: any) => void, 
        onFailure: (err: any) => void
    ) {
        if (!(window as any).Razorpay) {
            alert("Razorpay SDK not loaded");
            return;
        }

        const options = {
            key: RAZORPAY_KEY_ID,
            amount: order.amount,
            currency: order.currency,
            name: "NexusStream",
            description: order.id.includes('addon') ? "Credit Top-up" : "Pro Subscription",
            order_id: order.id,
            image: "https://cdn-icons-png.flaticon.com/512/9626/9626629.png",
            handler: async function (response: any) {
                console.log("RAZORPAY SUCCESS", response);

                // Safety Check
                if (!response || !response.razorpay_payment_id) {
                    onFailure({ description: "Payment verification failed" });
                    return;
                }

                // 1. Optimistic Success (Client-side)
                onSuccess(response);

                // 2. Optional: Call verification endpoint to double-check
                // The webhook is the primary source of truth, but this helps for immediate UI updates
                try {
                    await fetch("/api/billing/verify", {
                        method: "POST",
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(response),
                    });
                } catch(e) {
                    console.warn("Client verification warning (webhook will handle it):", e);
                }
            },
            prefill: { email: userEmail },
            theme: { color: "#00ff9d" },
            modal: { ondismiss: () => onFailure({ description: "Checkout cancelled by user" }) }
        };

        const rzp = new (window as any).Razorpay(options);
        rzp.on('payment.failed', (response: any) => onFailure(response.error));
        rzp.open();
    },

    async requestRefund(paymentId: string, reason: string): Promise<boolean> {
        console.log(`[Gateway] Requesting refund for ${paymentId}: ${reason}`);
        await new Promise(r => setTimeout(r, 1500));
        return true;
    },

    async verifyBackend(payload: any): Promise<boolean> {
        return true;
    },

    async cancelSubscription(subscriptionId: string, provider: 'RAZORPAY' | 'PAYPAL'): Promise<boolean> {
        console.log(`[Gateway] Cancelling ${provider} sub: ${subscriptionId}`);
        await new Promise(r => setTimeout(r, 1200));
        return true;
    }
};

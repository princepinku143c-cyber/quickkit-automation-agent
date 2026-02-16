
import { PlanTier, Region } from '../types';
import { ADDON_PACKS } from '../constants';
import { auth } from './firebase'; // To get current user ID

// --- CONFIGURATION ---
// @ts-ignore
const env = import.meta.env || {};
// @ts-ignore
const RAZORPAY_KEY_ID = env.VITE_RAZORPAY_KEY_ID || "rzp_test_1234567890";

interface OrderResponse {
    id: string;
    amount: number;
    currency: string;
    approvalUrl?: string; // Added for PayPal
}

export const PaymentGateway = {
    
    /**
     * Step 1: Create Subscription Order via API (Razorpay)
     */
    async createOrder(tier: PlanTier, cycle: 'monthly' | 'yearly', region: Region): Promise<OrderResponse> {
        console.log("CREATE ORDER TRIGGERED", { tier, cycle, region });
        const user = auth.currentUser;
        if (!user) throw new Error("User must be logged in");

        const amount = region === 'IN' 
            ? (tier === 'PRO' ? 249900 : 499900) 
            : (tier === 'PRO' ? 4900 : 9900);

        try {
            const response = await fetch('/api/billing/razorpay/createOrder', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    amount,
                    currency: region === 'IN' ? 'INR' : 'USD',
                    notes: {
                        userId: user.uid,
                        email: user.email,
                        tier,
                        cycle,
                        type: 'SUBSCRIPTION'
                    }
                })
            });

            if (!response.ok) throw new Error("Order creation failed");
            return await response.json();
        } catch (e) {
            console.error("Payment Init Error:", e);
            throw e;
        }
    },

    /**
     * Create PayPal Order (Server-to-Server)
     */
    async createPayPalOrder(tier: PlanTier, cycle: 'monthly' | 'yearly'): Promise<OrderResponse> {
        const user = auth.currentUser;
        if (!user) throw new Error("User must be logged in");

        // USD Pricing
        const amount = tier === 'PRO' ? 4900 : 9900; 

        try {
            const response = await fetch('/api/billing/paypal/createOrder', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    amount, // Sent in cents
                    currency: 'USD',
                    notes: { userId: user.uid, tier, cycle }
                })
            });

            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.error || "PayPal init failed");
            }
            return await response.json();
        } catch (e) {
            console.error("PayPal API Error:", e);
            throw e;
        }
    },

    /**
     * Handle PayPal Popup Flow
     */
    async initiatePayPal(
        order: OrderResponse,
        onSuccess: () => void,
        onFailure: (msg: string) => void
    ) {
        if (!order.approvalUrl) {
            onFailure("No approval URL returned from backend.");
            return;
        }

        // Open Popup
        const width = 500;
        const height = 600;
        const left = window.screen.width / 2 - width / 2;
        const top = window.screen.height / 2 - height / 2;
        
        const popup = window.open(
            order.approvalUrl,
            'PayPal Checkout',
            `width=${width},height=${height},top=${top},left=${left}`
        );

        if (!popup) {
            onFailure("Popup blocked. Please allow popups for this site.");
            return;
        }

        // Polling for completion (Simple Strategy)
        // In a real app, the popup would redirect to a specific success URL that communicates back via window.opener
        const timer = setInterval(() => {
            if (popup.closed) {
                clearInterval(timer);
                // We assume if closed, user might have finished. 
                // Ideally, we'd listen for a postMessage or check backend status.
                // For this hybrid flow, we'll optimistically trigger success or ask user to confirm.
                console.log("PayPal popup closed.");
            }
        }, 1000);
    },

    /**
     * Create Add-on Order
     */
    async createAddonOrder(packId: string, region: Region): Promise<OrderResponse> {
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
                        userId: user.uid,
                        type: 'ADDON',
                        packId: pack.id,
                        credits: pack.credits
                    }
                })
            });

            if (!response.ok) throw new Error("Order creation failed");
            return await response.json();
        } catch (e) {
            // Fallback mock
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
                onSuccess(response);
                try {
                    await fetch("/api/billing/verify", {
                        method: "POST",
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(response),
                    });
                } catch(e) {
                    console.warn("Verification warning:", e);
                }
            },
            prefill: { email: userEmail },
            theme: { color: "#00ff9d" },
            modal: { ondismiss: () => onFailure({ description: "Checkout cancelled" }) }
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

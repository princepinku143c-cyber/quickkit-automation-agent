
import { PlanTier, Region } from '../types';
import { ADDON_PACKS } from '../constants';

// --- CONFIGURATION ---
const RAZORPAY_KEY_ID = "rzp_test_1234567890"; // REPLACE WITH LIVE KEY

interface OrderResponse {
    id: string;
    amount: number;
    currency: string;
}

export const PaymentGateway = {
    
    async createOrder(tier: PlanTier, cycle: 'monthly' | 'yearly', region: Region): Promise<OrderResponse> {
        await new Promise(r => setTimeout(r, 800));
        const amount = region === 'IN' 
            ? (tier === 'PRO' ? 249900 : 499900) 
            : (tier === 'PRO' ? 4900 : 9900);

        return {
            id: `order_${Math.random().toString(36).substr(2, 9)}`,
            amount,
            currency: region === 'IN' ? 'INR' : 'USD'
        };
    },

    async createAddonOrder(packId: string, region: Region): Promise<OrderResponse> {
        const pack = ADDON_PACKS.find(p => p.id === packId);
        if (!pack) throw new Error("Invalid Pack ID");

        const price = region === 'IN' ? pack.price.IN * 100 : pack.price.GLOBAL * 100;
        
        return {
            id: `order_addon_${Math.random().toString(36).substr(2, 9)}`,
            amount: price,
            currency: region === 'IN' ? 'INR' : 'USD'
        };
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
            description: "Subscription Upgrade",
            order_id: order.id,
            image: "https://cdn-icons-png.flaticon.com/512/9626/9626629.png",
            handler: async function (response: any) {
                // 🔥 FIX: Safety Check for React Error #310
                if (!response || !response.razorpay_payment_id) {
                    console.error("Payment not verified: Missing ID");
                    alert("Payment not verified: No ID returned.");
                    onFailure({ description: "Payment not verified" });
                    return;
                }

                try {
                    // Call the new verification endpoint
                    const verify = await fetch("/api/billing/verify", {
                        method: "POST",
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(response),
                    });

                    if (verify.ok) {
                        const result = await verify.json();
                        if (result.success) {
                            alert("Upgrade Successful ✅");
                            window.location.reload();
                            onSuccess(response);
                        } else {
                            throw new Error(result.error || "Verification failed");
                        }
                    } else {
                        throw new Error("Server Verification Failed");
                    }
                } catch (err: any) {
                    console.error("Verification Error:", err);
                    alert("Verification Failed ❌: " + err.message);
                    onFailure(err);
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

    // Legacy method kept for backward compatibility if needed, but openRazorpay now uses fetch directly
    async verifyBackend(payload: any): Promise<boolean> {
        return true;
    },

    async cancelSubscription(subscriptionId: string, provider: 'RAZORPAY' | 'PAYPAL'): Promise<boolean> {
        console.log(`[Gateway] Cancelling ${provider} sub: ${subscriptionId}`);
        await new Promise(r => setTimeout(r, 1200));
        return true;
    }
};

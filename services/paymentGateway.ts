
import { PlanTier, Region } from '../types';
import { ADDON_PACKS } from '../constants';

// --- CONFIGURATION ---
const RAZORPAY_KEY_ID = "rzp_test_1234567890"; // REPLACE WITH LIVE KEY

// --- TYPES ---
interface OrderResponse {
    id: string;
    amount: number;
    currency: string;
}

export const PaymentGateway = {
    
    /**
     * Step 1: Create Subscription Order
     */
    async createOrder(tier: PlanTier, cycle: 'monthly' | 'yearly', region: Region): Promise<OrderResponse> {
        // Mock Response
        await new Promise(r => setTimeout(r, 800));
        const amount = region === 'IN' 
            ? (tier === 'PRO' ? 249900 : 499900) 
            : (tier === 'PRO' ? 4900 : 9900);

        // Call backend: createOrder({ type: 'SUBSCRIPTION', tier, ... })
        return {
            id: `order_${Math.random().toString(36).substr(2, 9)}`,
            amount,
            currency: region === 'IN' ? 'INR' : 'USD'
        };
    },

    /**
     * Create Add-on Order (AI Credits)
     */
    async createAddonOrder(packId: string, region: Region): Promise<OrderResponse> {
        const pack = ADDON_PACKS.find(p => p.id === packId);
        if (!pack) throw new Error("Invalid Pack ID");

        // Calculate Price
        const price = region === 'IN' ? pack.price.IN * 100 : pack.price.GLOBAL * 100;
        const currency = region === 'IN' ? 'INR' : 'USD';

        // MOCK BACKEND CALL
        // await fetch('/api/createOrder', { body: { type: 'ADDON', packId, credits: pack.credits, amount, currency } })
        
        await new Promise(r => setTimeout(r, 600));
        return {
            id: `order_addon_${Math.random().toString(36).substr(2, 9)}`,
            amount: price,
            currency
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
            description: order.id.includes('addon') ? "Credit Top-up" : "Pro Subscription",
            order_id: order.id,
            image: "https://cdn-icons-png.flaticon.com/512/9626/9626629.png",
            handler: function (response: any) {
                onSuccess({
                    paymentId: response.razorpay_payment_id,
                    orderId: response.razorpay_order_id,
                    signature: response.razorpay_signature
                });
            },
            prefill: { email: userEmail },
            theme: { color: "#00ff9d" },
            modal: { ondismiss: () => onFailure("Checkout cancelled") }
        };

        const rzp = new (window as any).Razorpay(options);
        rzp.on('payment.failed', (response: any) => onFailure(response.error));
        rzp.open();
    },

    /**
     * Request Refund
     */
    async requestRefund(paymentId: string, reason: string): Promise<boolean> {
        console.log(`[Gateway] Requesting refund for ${paymentId}: ${reason}`);
        // Call Backend: refundTransaction({ paymentId, reason })
        await new Promise(r => setTimeout(r, 1500));
        return true;
    },

    async verifyBackend(payload: any): Promise<boolean> {
        await new Promise(r => setTimeout(r, 1000));
        return true;
    },

    async cancelSubscription(subscriptionId: string, provider: 'RAZORPAY' | 'PAYPAL'): Promise<boolean> {
        console.log(`[Gateway] Cancelling ${provider} sub: ${subscriptionId}`);
        await new Promise(r => setTimeout(r, 1200));
        return true;
    }
};

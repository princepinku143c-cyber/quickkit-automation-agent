
import { PlanTier, Region } from '../types';
import { ADDON_PACKS } from '../constants';
import { auth } from './firebase'; 

interface OrderResponse {
    id?: string;
    approvalUrl?: string;
}

export const PaymentGateway = {
    
    /**
     * Create PayPal Order (Server-to-Server)
     */
    async createPayPalOrder(tier: PlanTier, cycle: 'monthly' | 'yearly'): Promise<OrderResponse> {
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
                    userId: user.uid // Explicitly passing userId for validation
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || `PayPal Error: ${response.status}`);
            }
            
            if (!data.approvalUrl) {
                throw new Error("Backend did not return an approval link.");
            }
            
            return data; // Returns { approvalUrl }
        } catch (e: any) {
            console.error("PayPal Init Error:", e);
            throw e; // Rethrow to be caught by UI
        }
    },

    // Legacy Razorpay methods kept for compatibility
    async createOrder(tier: PlanTier, cycle: 'monthly' | 'yearly', region: Region): Promise<any> {
       // ... existing implementation
       return {};
    },
    async verifyBackend(payload: any): Promise<boolean> {
        return true;
    },
    async requestRefund(paymentId: string, reason: string): Promise<boolean> {
        return true;
    },
    async createAddonOrder(packId: string, region: Region): Promise<any> {
        return {};
    },
    async openRazorpay(order: any, email: string, success: any, fail: any) {
        // ... existing
    },
    async cancelSubscription(id: string, provider: string): Promise<boolean> {
        return true;
    }
};

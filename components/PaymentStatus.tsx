
import React from 'react';
import { PartyPopper, XCircle } from 'lucide-react';

interface PaymentStatusProps {
    type: 'success' | 'cancel';
}

export const PaymentStatus: React.FC<PaymentStatusProps> = ({ type }) => {
    if (type === 'success') {
        return (
            <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center text-center p-8">
                <div className="w-20 h-20 bg-nexus-success/20 rounded-full flex items-center justify-center mb-6 animate-bounce">
                    <PartyPopper size={32} className="text-nexus-success" />
                </div>
                <h2 className="text-2xl font-black text-white uppercase tracking-widest">Payment Successful!</h2>
                <p className="text-gray-400 text-sm mt-2 mb-6">Your PRO plan is now active.</p>
                {!window.opener && (
                    <button 
                      onClick={() => window.location.href = '/'}
                      className="px-6 py-2 bg-nexus-accent text-black font-bold rounded-lg text-xs uppercase"
                    >
                        Go to Dashboard
                    </button>
                )}
                {window.opener && <p className="text-gray-500 text-xs">Closing secure window...</p>}
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center text-center p-8">
            <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center mb-6">
                <XCircle size={32} className="text-red-500" />
            </div>
            <h2 className="text-2xl font-black text-white uppercase tracking-widest">Payment Cancelled</h2>
            <p className="text-gray-400 text-sm mt-2 mb-6">You can retry anytime.</p>
            {!window.opener && (
                <button 
                  onClick={() => window.location.href = '/'}
                  className="px-6 py-2 bg-gray-800 text-white font-bold rounded-lg text-xs uppercase hover:bg-gray-700"
                >
                    Return to App
                </button>
            )}
            {window.opener && <p className="text-gray-500 text-xs">Closing secure window...</p>}
        </div>
    );
};

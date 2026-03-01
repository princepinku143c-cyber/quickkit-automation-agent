
import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle, XCircle, ArrowLeft, Loader2 } from 'lucide-react';
import { PaymentGateway } from '../services/paymentGateway';

export const PaymentSuccess: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const paymentId = searchParams.get('paymentId') || searchParams.get('token');
  const plan = searchParams.get('plan') || 'PRO';
  const [isConfirming, setIsConfirming] = useState(!!paymentId);
  const [confirmError, setConfirmError] = useState<string | null>(null);

  useEffect(() => {
    if (paymentId) {
      const confirmPayment = async () => {
        try {
          const result = await PaymentGateway.capturePayPalOrder(paymentId);
          if (result.success) {
            setIsConfirming(false);
          } else {
            setConfirmError(result.message || "Verification failed.");
            setIsConfirming(false);
          }
        } catch (e) {
          setConfirmError("An unexpected error occurred during verification.");
          setIsConfirming(false);
        }
      };
      confirmPayment();
    }
  }, [paymentId]);

  if (isConfirming) {
    return (
      <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center p-4">
        <Loader2 className="w-12 h-12 text-blue-500 animate-spin mb-4" />
        <h2 className="text-xl font-bold text-white">Verifying Payment...</h2>
        <p className="text-gray-400 mt-2 text-center">Please wait while we activate your plan.</p>
      </div>
    );
  }

  if (confirmError) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
        <div className="bg-gray-800 rounded-2xl p-8 max-w-md w-full text-center border border-gray-700 shadow-2xl">
          <div className="w-20 h-20 bg-yellow-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <XCircle className="w-10 h-10 text-yellow-400" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Verification Pending</h1>
          <p className="text-gray-400 mb-6">{confirmError}</p>
          <button onClick={() => navigate('/dashboard')} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-lg transition-colors">
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <div className="bg-gray-800 rounded-2xl p-8 max-w-md w-full text-center border border-gray-700 shadow-2xl">
        <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="w-10 h-10 text-green-400" />
        </div>
        <h1 className="text-2xl font-bold text-white mb-2">Payment Successful!</h1>
        <p className="text-gray-400 mb-4">Your <span className="text-blue-400 font-semibold">{plan.toUpperCase()}</span> plan is now active.</p>
        <div className="bg-gray-700/50 rounded-lg p-4 mb-6 text-left">
          <p className="text-sm text-gray-300 font-medium mb-2">Your benefits:</p>
          <ul className="text-sm text-gray-400 space-y-1">
            <li>Unlimited projects</li>
            <li>Priority support</li>
            <li>Advanced integrations</li>
            <li>Custom workflows</li>
          </ul>
        </div>
        {paymentId && <p className="text-xs text-gray-500 mb-6 font-mono">ID: {paymentId}</p>}
        <button onClick={() => navigate('/dashboard')} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2">
          <ArrowLeft className="w-4 h-4" /> Go to Dashboard
        </button>
      </div>
    </div>
  );
};

export const PaymentFailure: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const error = searchParams.get('error');

  const errorMessages: Record<string, string> = {
    'payment_cancelled': 'You cancelled the payment.',
    'insufficient_funds': 'Insufficient funds in your account.',
    'card_declined': 'Your card was declined.',
    'default': 'Something went wrong with your payment. Please try again.'
  };

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <div className="bg-gray-800 rounded-2xl p-8 max-w-md w-full text-center border border-gray-700 shadow-2xl">
        <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
          <XCircle className="w-10 h-10 text-red-400" />
        </div>
        <h1 className="text-2xl font-bold text-white mb-2">Payment Failed</h1>
        <p className="text-gray-400 mb-6">{errorMessages[error || 'default']}</p>
        <div className="flex gap-3">
          <button onClick={() => navigate('/pricing')} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-lg transition-colors">Try Again</button>
          <button onClick={() => navigate('/dashboard')} className="flex-1 bg-gray-700 hover:bg-gray-600 text-white font-medium py-3 px-6 rounded-lg transition-colors">Dashboard</button>
        </div>
      </div>
    </div>
  );
};

import React, { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, Loader2, PartyPopper, TriangleAlert, XCircle } from 'lucide-react';
import { PaymentGateway } from '../services/paymentGateway';

interface PaymentStatusProps {
  type: 'success' | 'cancel';
  orderToken?: string;
}

type CaptureState = 'idle' | 'processing' | 'confirmed' | 'failed';

export const PaymentStatus: React.FC<PaymentStatusProps> = ({ type, orderToken }) => {
  const [captureState, setCaptureState] = useState<CaptureState>(type === 'success' ? 'processing' : 'idle');
  const [errorMessage, setErrorMessage] = useState<string>('');

  useEffect(() => {
    if (type !== 'success') return;

    const capturePayment = async () => {
      if (!orderToken) {
        setCaptureState('failed');
        setErrorMessage('Missing secure PayPal token. Please contact support with screenshot.');
        return;
      }

      const result = await PaymentGateway.capturePayPalOrder(orderToken);
      if (result.success) {
        setCaptureState('confirmed');
        return;
      }

      setCaptureState('failed');
      setErrorMessage(result.message || 'We could not confirm this payment automatically.');
    };

    capturePayment();
  }, [type, orderToken]);

  useEffect(() => {
    if (!window.opener) return;

    if (type === 'cancel') {
      window.opener.postMessage({ type: 'NEXUS_PAYMENT_CANCEL', status: 'cancel' }, window.location.origin);
      setTimeout(() => window.close(), 500);
      return;
    }

    if (type === 'success' && captureState === 'confirmed') {
      window.opener.postMessage({ type: 'NEXUS_PAYMENT_SUCCESS', status: 'success' }, window.location.origin);
      setTimeout(() => window.close(), 700);
    }
  }, [type, captureState]);

  const content = useMemo(() => {
    if (type === 'cancel') {
      return {
        icon: <XCircle size={32} className="text-red-500" />,
        iconWrapper: 'bg-red-500/20',
        title: 'Payment Cancelled',
        subtitle: 'No worries — you can retry your plan upgrade anytime.',
        ctaText: 'Return to App',
        ctaClass: 'bg-gray-800 text-white hover:bg-gray-700'
      };
    }

    if (captureState === 'processing') {
      return {
        icon: <Loader2 size={32} className="text-blue-400 animate-spin" />,
        iconWrapper: 'bg-blue-500/20',
        title: 'Confirming Payment Securely...',
        subtitle: 'Please wait while we activate your plan and sync your account.',
        ctaText: 'Back to Dashboard',
        ctaClass: 'bg-nexus-accent text-black hover:opacity-90'
      };
    }

    if (captureState === 'confirmed') {
      return {
        icon: <CheckCircle2 size={32} className="text-green-400" />,
        iconWrapper: 'bg-green-500/20',
        title: 'Payment Confirmed!',
        subtitle: 'Your subscription is active and ready to use.',
        ctaText: 'Go to Dashboard',
        ctaClass: 'bg-nexus-accent text-black hover:opacity-90'
      };
    }

    return {
      icon: <TriangleAlert size={32} className="text-yellow-400" />,
      iconWrapper: 'bg-yellow-500/20',
      title: 'Payment Verification Needs Attention',
      subtitle: errorMessage || 'Please retry from dashboard or contact support with your order details.',
      ctaText: 'Back to Dashboard',
      ctaClass: 'bg-yellow-500 text-black hover:bg-yellow-400'
    };
  }, [type, captureState, errorMessage]);

  return (
    <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center text-center p-8">
      <div className="w-20 h-20 rounded-full flex items-center justify-center mb-6 animate-fade-in border border-white/10 shadow-[0_0_30px_rgba(59,130,246,0.15)]">
        {type === 'success' && captureState === 'confirmed' ? (
          <PartyPopper size={32} className="text-nexus-success absolute opacity-40" />
        ) : null}
        <div className={`w-16 h-16 rounded-full flex items-center justify-center ${content.iconWrapper}`}>
          {content.icon}
        </div>
      </div>
      <h2 className="text-2xl font-black text-white uppercase tracking-widest">{content.title}</h2>
      <p className="text-gray-400 text-sm mt-2 mb-6 max-w-md">{content.subtitle}</p>

      {!window.opener && (
        <button
          onClick={() => {
            window.history.pushState({}, '', '/app');
            window.dispatchEvent(new PopStateEvent('popstate'));
          }}
          className={`px-6 py-2 font-bold rounded-lg text-xs uppercase transition-all ${content.ctaClass}`}
        >
          {content.ctaText}
        </button>
      )}
      {window.opener && type === 'success' && captureState === 'processing' && (
        <p className="text-gray-500 text-xs">Please keep this secure window open...</p>
      )}
      {window.opener && type === 'success' && captureState === 'confirmed' && (
        <p className="text-gray-500 text-xs">Closing secure window...</p>
      )}
    </div>
  );
};


import React, { useEffect, useRef } from 'react';
import { ShieldCheck, X } from 'lucide-react';
import { RECAPTCHA_SITE_KEY } from '../constants';

interface RecaptchaModalProps {
  isOpen: boolean;
  onVerify: (token: string) => void;
  onCancel: () => void;
}

const RecaptchaModal: React.FC<RecaptchaModalProps> = ({ isOpen, onVerify, onCancel }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<number | null>(null);

  useEffect(() => {
    const grecaptcha = (window as any).grecaptcha;

    if (isOpen && grecaptcha && containerRef.current) {
      if (widgetIdRef.current === null) {
        try {
            widgetIdRef.current = grecaptcha.render(containerRef.current, {
                'sitekey': RECAPTCHA_SITE_KEY,
                'callback': (token: string) => {
                    onVerify(token);
                },
                'theme': 'dark'
            });
        } catch (e) {
            console.error("Recaptcha Render Error:", e);
        }
      } else {
          grecaptcha.reset(widgetIdRef.current);
      }
    }
  }, [isOpen, onVerify]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-nexus-900 border border-nexus-700 rounded-2xl shadow-2xl p-8 max-w-sm w-full text-center relative">
        <button onClick={onCancel} className="absolute top-4 right-4 text-gray-500 hover:text-white">
            <X size={20} />
        </button>
        
        <div className="w-16 h-16 bg-nexus-800 rounded-full flex items-center justify-center mx-auto mb-6 border border-nexus-700">
            <ShieldCheck size={32} className="text-nexus-accent" />
        </div>
        
        <h2 className="text-xl font-bold text-white mb-2">Verification Required</h2>
        <p className="text-gray-400 text-xs mb-6">
            This workflow is protected. Please complete the captcha to continue execution.
        </p>

        <div className="flex justify-center">
            <div ref={containerRef}></div>
        </div>
      </div>
    </div>
  );
};

export default RecaptchaModal;

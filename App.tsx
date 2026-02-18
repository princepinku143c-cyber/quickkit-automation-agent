
import React, { useState, useEffect, Suspense } from 'react';
import Sidebar from './components/Sidebar';
import NexusMascot from './components/NexusMascot';
import LandingPage from './components/LandingPage';
import AuthPage from './components/AuthPage'; 
import { SettingsModal } from './components/SettingsModal';
import { Project, UserPlan } from './types';
import { useAuth } from './context/AuthContext';
import { subscribeToProjects, createProject, deleteProject } from './services/projectService';
import { subscribeToUserProfile } from './services/userService'; 
import { Toaster, toast } from 'react-hot-toast';
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react';

const Canvas = React.lazy(() => import('./components/Canvas'));
const PropertiesPanel = React.lazy(() => import('./components/PropertiesPanel'));
const ProjectList = React.lazy(() => import('./components/ProjectList'));
const PricingModal = React.lazy(() => import('./components/PricingModal'));

// --- COMPONENTS FOR SUCCESS / CANCEL ---
const PaymentSuccess = () => (
    <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center text-center p-8 animate-in fade-in">
        <div className="w-20 h-20 bg-nexus-success/20 rounded-full flex items-center justify-center mb-6 animate-bounce">
            <CheckCircle2 size={40} className="text-nexus-success" />
        </div>
        <h2 className="text-3xl font-black text-white uppercase tracking-widest mb-2">Payment Successful!</h2>
        <p className="text-gray-400 text-sm mb-8">Your PRO plan is now active. Redirecting...</p>
        <button onClick={() => window.location.href = '/'} className="px-8 py-3 bg-nexus-accent text-black font-bold rounded-xl text-xs uppercase">Go to Dashboard</button>
    </div>
);

const PaymentCancel = () => (
    <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center text-center p-8 animate-in fade-in">
        <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center mb-6">
            <XCircle size={40} className="text-red-500" />
        </div>
        <h2 className="text-3xl font-black text-white uppercase tracking-widest mb-2">Payment Cancelled</h2>
        <p className="text-gray-400 text-sm mb-8">You can retry anytime.</p>
        <button onClick={() => window.location.href = '/'} className="px-8 py-3 bg-gray-800 text-white font-bold rounded-xl text-xs uppercase hover:bg-gray-700">Return to App</button>
    </div>
);

const AppContent: React.FC = () => {
  const { user } = useAuth();
  const [appRoute, setAppRoute] = useState<'landing' | 'auth' | 'app'>('landing');
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('signup');
  const [currentView, setCurrentView] = useState<'dashboard' | 'editor'>('dashboard');
  const [projects, setProjects] = useState<Project[]>([]);
  const [userPlan, setUserPlan] = useState<any>({ tier: 'FREE' });
  const [isPricingModalOpen, setIsPricingModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // --- QUERY PARAM ROUTING ---
  const params = new URLSearchParams(window.location.search);
  const isPaymentSuccess = params.get('payment_success') === 'true';
  const isPaymentCancel = params.get('payment_cancel') === 'true';

  useEffect(() => {
      if (user) {
          setAppRoute('app');
          subscribeToUserProfile(user.uid, (profile) => {
              if (profile) setUserPlan(profile);
          });
          subscribeToProjects(user.uid, setProjects);
      } else {
          setAppRoute('landing');
      }
  }, [user]);

  if (isPaymentSuccess) return <PaymentSuccess />;
  if (isPaymentCancel) return <PaymentCancel />;

  if (!user && appRoute === 'landing') return <LandingPage onNavigate={(mode) => { setAuthMode(mode); setAppRoute('auth'); }} />;
  if (!user && appRoute === 'auth') return <AuthPage view={authMode} onBack={() => setAppRoute('landing')} />;

  return (
    <div className="flex h-screen bg-[#050505] text-white overflow-hidden relative">
      <Toaster position="top-right" toastOptions={{ style: { background: '#1a1a1a', color: '#fff', border: '1px solid #333' } }} />
      
      <Suspense fallback={<div className="flex items-center justify-center w-full h-full bg-black"><Loader2 className="animate-spin text-white"/></div>}>
          <PricingModal isOpen={isPricingModalOpen} onClose={() => setIsPricingModalOpen(false)} />
          <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} onUpgrade={() => setIsPricingModalOpen(true)} userPlan={userPlan} />
      </Suspense>

      <NexusMascot />
      
      <Sidebar 
        isOpen={true} 
        onClose={() => {}} 
        onAddNexus={() => {}} 
        onLoadBlueprint={() => {}} 
        onClear={() => {}} 
        onOpenSettings={() => setIsSettingsOpen(true)} 
        onNavigateProjects={() => setCurrentView('dashboard')} 
        currentView={currentView}
        userPlan={userPlan}
        onOpenAI={() => {}}
      />

      <div className="flex-1 flex flex-col relative h-full">
        <Suspense fallback={<div className="flex items-center justify-center h-full"><Loader2 className="animate-spin"/></div>}>
            {currentView === 'dashboard' ? (
                <ProjectList 
                    projects={projects}
                    onCreateProject={(t, d) => createProject({ title: t, description: d })}
                    onOpenProject={() => setCurrentView('editor')}
                    onDeleteProject={deleteProject}
                    userPlan={userPlan.tier}
                    onUpgrade={() => setIsPricingModalOpen(true)}
                />
            ) : (
                <Canvas nexuses={[]} synapses={[]} selectedId={null} onSelectNexus={() => {}} onUpdateNexusPosition={() => {}} onAddSynapse={() => {}} onDeleteSynapse={() => {}} onOpenProperties={() => {}} onNexusUpdate={() => {}} />
            )}
        </Suspense>
      </div>
    </div>
  );
};

export default AppContent;

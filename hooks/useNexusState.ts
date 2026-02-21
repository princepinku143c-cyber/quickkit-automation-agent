
import { useState, useEffect, useRef } from 'react';
import { Nexus, Synapse, Project, ExecutionState, PlanTier, UserPlan } from '../types';
import { subscribeToProjects } from '../services/projectService';
import { subscribeToUserProfile } from '../services/userService';
import { useAuth } from '../context/AuthContext';

export const useNexusState = () => {
    const { user, isDevMode } = useAuth();
    const [nexuses, setNexuses] = useState<Nexus[]>([]);
    const [synapses, setSynapses] = useState<Synapse[]>([]);
    const [projects, setProjects] = useState<Project[]>([]);
    const [currentProject, setCurrentProject] = useState<Project | null>(null);
    const [userPlan, setUserPlan] = useState<PlanTier>('FREE');
    const [fullPlan, setFullPlan] = useState<UserPlan | null>(null);
    const [syncStatus, setSyncStatus] = useState<'synced' | 'dirty' | 'saving'>('synced');
    const [interruptedState, setInterruptedState] = useState<ExecutionState | null>(null);

    useEffect(() => {
        if (user) {
            if (isDevMode) {
                setUserPlan('ELITE');
                setFullPlan({
                    uid: user.uid,
                    email: user.email || '',
                    tier: 'ELITE',
                    role: 'ADMIN',
                    status: 'active',
                    credits: 999999,
                    aiUsed: 0,
                    monthlyLimit: 999999,
                    onboardingDone: true,
                    updatedAt: Date.now(),
                    expiresAt: 0
                } as any);
                return;
            }

            const unsubscribeProfile = subscribeToUserProfile(user.uid, (profile) => {
                if (profile) {
                    setFullPlan(profile);
                    setUserPlan(profile.tier || profile.plan?.tier || 'FREE');
                }
            });

            const unsubscribeProjects = subscribeToProjects(user.uid, (projs) => {
                setProjects(projs);
            });

            return () => {
                unsubscribeProfile();
                unsubscribeProjects();
            };
        } else {
            setFullPlan(null);
            setUserPlan('FREE');
            setProjects([]);
        }
    }, [user]);

    return {
        nexuses, setNexuses,
        synapses, setSynapses,
        projects, setProjects,
        currentProject, setCurrentProject,
        userPlan, setUserPlan,
        fullPlan, setFullPlan,
        syncStatus, setSyncStatus,
        interruptedState, setInterruptedState
    };
};

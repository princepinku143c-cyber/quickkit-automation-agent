
import React, { useCallback } from 'react';
import { Project, Nexus, Synapse, NexusType, NexusSubtype, PlanTier, UserPlan } from '../types';
import { createProject, deleteProject } from '../services/projectService';
import { canAddNode } from '../services/usageGuard';
import { PLAN_LIMITS, NEXUS_DEFINITIONS, getDefaultNodeSettings } from '../constants';
import { toast } from 'react-hot-toast';

const deepClone = <T,>(value: T): T => {
  try {
    return JSON.parse(JSON.stringify(value));
  } catch {
    return value;
  }
};

export const useProjectActions = (
    userId: string | undefined,
    projects: Project[],
    userPlan: PlanTier,
    fullPlan: UserPlan | null,
    nexuses: Nexus[],
    setNexuses: React.Dispatch<React.SetStateAction<Nexus[]>>,
    setSynapses: React.Dispatch<React.SetStateAction<Synapse[]>>,
    setCurrentProject: React.Dispatch<React.SetStateAction<Project | null>>,
    setCurrentView: React.Dispatch<React.SetStateAction<'dashboard' | 'editor'>>,
    setSyncStatus: React.Dispatch<React.SetStateAction<'synced' | 'dirty' | 'saving'>>,
    setPricingReason: React.Dispatch<React.SetStateAction<string | undefined>>,
    setIsPricingModalOpen: React.Dispatch<React.SetStateAction<boolean>>,
    setSelectedId: React.Dispatch<React.SetStateAction<string | null>>,
    setIsPropertiesOpen: React.Dispatch<React.SetStateAction<boolean>>
) => {
    const handleCreateNewProject = async (title: string, desc: string) => {
        if (!userId) {
            toast.error("Please login to create projects.");
            return;
        }
        try {
            const limits = PLAN_LIMITS[userPlan as keyof typeof PLAN_LIMITS] || PLAN_LIMITS.FREE;
            if (projects.length >= limits.PROJECTS) {
                setPricingReason(`Project Limit Reached (${limits.PROJECTS}). Upgrade to save more.`);
                setIsPricingModalOpen(true);
                return;
            }
            
            const newId = await createProject(userId, { title, description: desc });
            // We don't have the full project object yet, but we can construct a minimal one for opening
            const minimalProject: Project = {
                id: newId,
                userId,
                title,
                description: desc,
                status: 'DRAFT',
                nexuses: [],
                synapses: [],
                tags: [],
                createdAt: Date.now(),
                updatedAt: Date.now()
            };
            handleOpenProject(minimalProject);
        } catch (e: any) {
            const limits = PLAN_LIMITS[userPlan as keyof typeof PLAN_LIMITS] || PLAN_LIMITS.FREE;
            if (e.message === 'PROJECT_LIMIT_REACHED') {
                setPricingReason(`Cloud Storage Full (${limits.PROJECTS} Projects). Upgrade to save more.`);
                setIsPricingModalOpen(true);
            } else {
                console.error("Project Creation Failed", e);
                toast.error("Failed to create project. Please try again.");
            }
        }
    };

    const handleOpenProject = (p: Project) => {
        const draftKey = `nexus_draft_${p.id}`;
        const draftRaw = localStorage.getItem(draftKey);
        let nodesToLoad = p.nexuses || [];
        let edgesToLoad = p.synapses || [];
        let isDraftNewer = false;

        if (draftRaw) {
            try {
                const draft = JSON.parse(draftRaw);
                const cloudTime = p.updatedAt || 0;
                if (draft.timestamp > cloudTime) {
                    nodesToLoad = draft.nexuses;
                    edgesToLoad = draft.synapses;
                    isDraftNewer = true;
                }
            } catch (e) {}
        }

        setCurrentProject(p);
        setNexuses(nodesToLoad);
        setSynapses(edgesToLoad);
        setSyncStatus(isDraftNewer ? 'dirty' : 'synced');
        setCurrentView('editor');
        localStorage.setItem('nexus_last_project_id', p.id);
        localStorage.setItem('nexus_last_view', 'editor');
    };

    const handleDeleteProject = async (id: string) => {
        if(window.confirm("Are you sure? This will delete the workflow forever.")) {
            await deleteProject(id);
            localStorage.removeItem(`nexus_draft_${id}`);
            toast.success("Project deleted");
        }
    };

    const handleAddNexus = useCallback((type: NexusType, subtype: NexusSubtype, dropPosition?: { x: number, y: number }) => {
        const limits = PLAN_LIMITS[userPlan as keyof typeof PLAN_LIMITS] || PLAN_LIMITS.FREE;
        if (fullPlan && !canAddNode(fullPlan, nexuses.length)) {
            setPricingReason(`Node Limit Reached (${limits.MAX_NODES}). Upgrade for complex flows.`);
            setIsPricingModalOpen(true);
            return;
        }

        const definition = NEXUS_DEFINITIONS.find(d => d.subtype === subtype);
        const nodeLabel = definition?.label || `New ${subtype}`;
        const defaultConfig = deepClone(definition?.defaultConfig || {});

        const id = `n-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
        setNexuses(prev => {
            let safeX = 100;
            let safeY = 300 + (prev.length % 5 * 20);
            if (dropPosition) { safeX = dropPosition.x; safeY = dropPosition.y; }
            else {
                const max = Math.max(...prev.map(n => n.position?.x || 0));
                if (Number.isFinite(max)) safeX = max + 300;
            }
            const newNode: Nexus = { 
                id, type, subtype, label: nodeLabel,
                position: { x: safeX, y: safeY }, config: defaultConfig, settings: getDefaultNodeSettings(subtype), status: 'idle' 
            };
            return [...prev, newNode];
        });
        setSelectedId(id);
        setIsPropertiesOpen(true);
    }, [nexuses.length, fullPlan, userPlan, setNexuses, setSelectedId, setIsPropertiesOpen, setIsPricingModalOpen, setPricingReason]);

    return {
        handleCreateNewProject,
        handleOpenProject,
        handleDeleteProject,
        handleAddNexus
    };
};

"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { supabase } from "./supabase";

interface WorkspaceContextType {
  currentWorkspaceOwnerId: string | null;
  currentWorkspaceRole: "owner" | "viewer" | "editor" | null;
  visitWorkspace: (ownerId: string, role: "viewer" | "editor") => void;
  leaveWorkspace: () => void;
  isVisiting: boolean;
}

const WorkspaceContext = createContext<WorkspaceContextType | undefined>(undefined);

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const [currentWorkspaceOwnerId, setCurrentWorkspaceOwnerId] = useState<string | null>(null);
  const [currentWorkspaceRole, setCurrentWorkspaceRole] = useState<"owner" | "viewer" | "editor" | null>(null);
  const [myUserId, setMyUserId] = useState<string | null>(null);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    async function initialize() {
      // First, restore from localStorage if visiting
      const stored = localStorage.getItem("visitingWorkspace");
      
      // Get current user ID
      const { data } = await supabase.auth.getUser();
      if (data.user) {
        setMyUserId(data.user.id);
        
        if (stored) {
          // Restore visiting workspace
          try {
            const { ownerId, role } = JSON.parse(stored);
            setCurrentWorkspaceOwnerId(ownerId);
            setCurrentWorkspaceRole(role);
          } catch {
            localStorage.removeItem("visitingWorkspace");
            // Default to own workspace
            setCurrentWorkspaceOwnerId(data.user.id);
            setCurrentWorkspaceRole("owner");
          }
        } else {
          // Default to own workspace
          setCurrentWorkspaceOwnerId(data.user.id);
          setCurrentWorkspaceRole("owner");
        }
      }
      
      setInitialized(true);
    }
    
    initialize();
  }, []);

  function visitWorkspace(ownerId: string, role: "viewer" | "editor") {
    setCurrentWorkspaceOwnerId(ownerId);
    setCurrentWorkspaceRole(role);
    // Store in localStorage so it persists across page reloads
    localStorage.setItem("visitingWorkspace", JSON.stringify({ ownerId, role }));
  }

  function leaveWorkspace() {
    if (myUserId) {
      setCurrentWorkspaceOwnerId(myUserId);
      setCurrentWorkspaceRole("owner");
      localStorage.removeItem("visitingWorkspace");
    }
  }

  // Restore from localStorage on mount - removed duplicate logic

  const isVisiting = currentWorkspaceOwnerId !== myUserId && currentWorkspaceOwnerId !== null;
  
  // Ensure role is "owner" when viewing own workspace
  const effectiveRole = isVisiting ? currentWorkspaceRole : "owner";

  return (
    <WorkspaceContext.Provider
      value={{
        currentWorkspaceOwnerId,
        currentWorkspaceRole: effectiveRole,
        visitWorkspace,
        leaveWorkspace,
        isVisiting,
      }}
    >
      {children}
    </WorkspaceContext.Provider>
  );
}

export function useWorkspace() {
  const context = useContext(WorkspaceContext);
  if (!context) {
    throw new Error("useWorkspace must be used within WorkspaceProvider");
  }
  return context;
}

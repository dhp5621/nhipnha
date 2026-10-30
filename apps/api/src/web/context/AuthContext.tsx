import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { Family, Member, Role } from '@nhipnha/shared';
import { webStorage } from '../services/webStorage';
import { apiClient, setApiSession, setUnauthorizedHandler } from '../services/api';

export const DEMO_FAMILY_CODE = 'NHIP-8868';
export const DEMO_FAMILY_ID = 'fam_dongthap_001';

interface AuthContextType {
  family: Family | null;
  member: Member | null;
  personalLoginCode: string | null;
  isLoading: boolean;
  isPaired: boolean;
  isDemoAccount: boolean;
  isOwner: boolean;
  pairWithQR: (qrData: string, role?: Role, name?: string) => Promise<void>;
  pairWithCode: (code: string, role?: Role, name?: string) => Promise<void>;
  createNewFamily: (
    familyName: string,
    province: string,
    role: Role,
    memberName: string,
    email?: string,
    password?: string
  ) => Promise<{ loginCode?: string }>;
  loginWithEmail: (email: string, password: string) => Promise<void>;
  loginWithQR: (qrPayload: string) => Promise<void>;
  loginDemoAccount: (role?: Role) => Promise<void>;
  switchRole: (role: Role, name?: string) => Promise<void>;
  refreshMemberState: (updatedMember?: Member) => Promise<void>;
  savePersonalLoginCode: (loginCode: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [family, setFamily] = useState<Family | null>(null);
  const [member, setMember] = useState<Member | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [personalLoginCode, setPersonalLoginCode] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const logout = useCallback(async () => {
    setApiSession(null);
    await webStorage.clearAuth();
    setFamily(null);
    setMember(null);
    setToken(null);
    setPersonalLoginCode(null);
  }, []);

  useEffect(() => {
    setUnauthorizedHandler(() => {
      logout();
    });
    return () => setUnauthorizedHandler(null);
  }, [logout]);

  useEffect(() => {
    async function loadStoredAuth() {
      try {
        const stored = await webStorage.getAuth();
        if (stored.family && stored.member) {
          setFamily(stored.family);
          setMember(stored.member);
          setToken(stored.token ?? null);
          setPersonalLoginCode(stored.loginCode ?? null);
          setApiSession({
            memberId: stored.member.id,
            token: stored.token || undefined,
          });
        }
      } catch (err) {
        console.error('Error loading auth state:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadStoredAuth();
  }, []);

  const pairWithQR = async (qrData: string, role?: Role, name?: string) => {
    setIsLoading(true);
    try {
      const res = await apiClient.pairWithQR(qrData, role, name);
      setFamily(res.family);
      setMember(res.member);
      setToken(res.token ?? null);
      setPersonalLoginCode(res.loginCode ?? null);
      setApiSession({
        memberId: res.member.id,
        token: res.token,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const pairWithCode = async (code: string, role?: Role, name?: string) => {
    setIsLoading(true);
    try {
      const res = await apiClient.pairWithCode(code, role, name);
      setFamily(res.family);
      setMember(res.member);
      setToken(res.token ?? null);
      setPersonalLoginCode(res.loginCode ?? null);
      setApiSession({
        memberId: res.member.id,
        token: res.token,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const createNewFamily = async (
    familyName: string,
    province: string,
    role: Role,
    memberName: string,
    email?: string,
    password?: string
  ): Promise<{ loginCode?: string }> => {
    setIsLoading(true);
    try {
      const res = await apiClient.createFamily(
        familyName,
        province,
        role,
        memberName,
        email,
        password
      );
      setFamily(res.family);
      setMember(res.member);
      setToken(res.token ?? null);
      setPersonalLoginCode(res.loginCode ?? null);
      setApiSession({
        memberId: res.member.id,
        token: res.token,
      });
      return { loginCode: res.loginCode };
    } finally {
      setIsLoading(false);
    }
  };

  const loginWithEmail = async (email: string, pass: string) => {
    setIsLoading(true);
    try {
      const res = await apiClient.loginWithEmail(email, pass);
      setFamily(res.family);
      setMember(res.member);
      setToken(res.token);
      setPersonalLoginCode(res.loginCode ?? null);
      setApiSession({
        memberId: res.member.id,
        token: res.token,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loginWithQR = async (qrPayload: string) => {
    setIsLoading(true);
    try {
      const res = await apiClient.loginWithQR(qrPayload);
      setFamily(res.family);
      setMember(res.member);
      setToken(res.token);
      setPersonalLoginCode(res.loginCode ?? null);
      setApiSession({
        memberId: res.member.id,
        token: res.token,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loginDemoAccount = async (role: Role = 'CHILD') => {
    const roleNames: Record<Role, string> = {
      CHILD: 'Bé An',
      PARENT: 'Mẹ Hoa',
      GRANDPARENT: 'Bà Nội',
    };
    await pairWithCode(DEMO_FAMILY_CODE, role, roleNames[role]);
  };

  const switchRole = async (newRole: Role, newName?: string) => {
    if (!family) return;
    const defaultNames: Record<Role, string> = {
      CHILD: 'Bé An',
      PARENT: 'Mẹ Hoa',
      GRANDPARENT: 'Bà Nội',
    };
    const targetName = newName || defaultNames[newRole];

    try {
      const res = await apiClient.pairWithCode(family.code, newRole, targetName);
      setFamily(res.family);
      setMember(res.member);
      setToken(res.token ?? null);
      setPersonalLoginCode(res.loginCode ?? null);
      setApiSession({
        memberId: res.member.id,
        token: res.token,
      });
    } catch {
      // Local fallback
      const updatedMember: Member = {
        id: member?.id || `mem_${Date.now()}`,
        familyId: family.id,
        role: newRole,
        name: targetName,
        createdAt: member?.createdAt || new Date().toISOString(),
      };
      setMember(updatedMember);
      await webStorage.saveAuth(family, updatedMember, token, personalLoginCode);
    }
  };

  const refreshMemberState = async (updatedMember?: Member) => {
    if (updatedMember) {
      setMember(updatedMember);
      if (family) {
        await webStorage.saveAuth(family, updatedMember, token, personalLoginCode);
      }
      return;
    }
    if (!family || !token) return;
    try {
      const session = await apiClient.fetchSession();
      setFamily(session.family);
      setMember(session.member);
      await webStorage.saveAuth(session.family, session.member, token, personalLoginCode);
    } catch {
      // Ignore background refresh errors
    }
  };

  const savePersonalLoginCode = async (code: string) => {
    setPersonalLoginCode(code);
    if (family && member) {
      await webStorage.saveAuth(family, member, token, code);
    }
  };

  const isPaired = !!family && !!member;
  const isDemoAccount =
    family?.id === DEMO_FAMILY_ID || family?.code === DEMO_FAMILY_CODE;
  const isOwner = !!member?.isOwner;

  return (
    <AuthContext.Provider
      value={{
        family,
        member,
        personalLoginCode,
        isLoading,
        isPaired,
        isDemoAccount,
        isOwner,
        pairWithQR,
        pairWithCode,
        createNewFamily,
        loginWithEmail,
        loginWithQR,
        loginDemoAccount,
        switchRole,
        refreshMemberState,
        savePersonalLoginCode,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

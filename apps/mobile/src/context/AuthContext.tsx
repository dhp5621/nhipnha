import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { Family, Member, Role } from '@nhipnha/shared';
import { offlineStorage } from '../services/offlineStorage';
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
    await offlineStorage.clearAuth();
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
        const stored = await offlineStorage.getAuth();
        if (stored.family && stored.member) {
          setFamily(stored.family);
          setMember(stored.member);
          setToken(stored.token);
          setPersonalLoginCode(stored.loginCode);
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

  const isDemoAccount =
    family?.id === DEMO_FAMILY_ID ||
    family?.code?.toUpperCase() === DEMO_FAMILY_CODE;

  const isOwner = !!member?.isOwner;

  const applySessionResult = (result: {
    family: Family;
    member: Member;
    token?: string;
    loginCode?: string;
  }) => {
    setFamily(result.family);
    setMember(result.member);
    if (result.token !== undefined) setToken(result.token || null);
    if (result.loginCode !== undefined) setPersonalLoginCode(result.loginCode || null);
    setApiSession({
      memberId: result.member.id,
      token: result.token,
    });
  };

  const pairWithQR = async (qrData: string, role?: Role, name?: string) => {
    setIsLoading(true);
    try {
      const result = await apiClient.pairWithQR(qrData, role, name);
      applySessionResult(result);
    } finally {
      setIsLoading(false);
    }
  };

  const pairWithCode = async (code: string, role?: Role, name?: string) => {
    setIsLoading(true);
    try {
      const cleanCode = code.trim().toUpperCase();
      const result = await apiClient.pairWithCode(cleanCode, role, name);
      applySessionResult(result);
    } finally {
      setIsLoading(false);
    }
  };

  const loginWithEmail = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const result = await apiClient.loginWithEmail(email, password);
      applySessionResult(result);
    } finally {
      setIsLoading(false);
    }
  };

  const loginWithQR = async (qrPayload: string) => {
    setIsLoading(true);
    try {
      const result = await apiClient.loginWithQR(qrPayload);
      applySessionResult({ ...result, loginCode: qrPayload });
    } finally {
      setIsLoading(false);
    }
  };

  const loginDemoAccount = async (role: Role = 'CHILD') => {
    const defaultName =
      role === 'CHILD' ? 'Bé An' : role === 'PARENT' ? 'Mẹ Hoa' : 'Bà Nội Bảy';
    await pairWithCode(DEMO_FAMILY_CODE, role, defaultName);
  };

  const createNewFamily = async (
    familyName: string,
    province: string,
    role: Role,
    memberName: string,
    email?: string,
    password?: string
  ) => {
    setIsLoading(true);
    try {
      const result = await apiClient.createFamily(
        familyName.trim() || 'Gia đình mình',
        province.trim() || 'Việt Nam',
        role,
        memberName.trim() || 'Chủ nhà',
        email,
        password
      );
      applySessionResult(result);
      return { loginCode: result.loginCode };
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Role switching on the same device is ONLY allowed in Demo mode (`NHIP-8868`).
   * In production, roles are strictly assigned by the family owner.
   */
  const switchRole = async (newRole: Role, newName?: string) => {
    if (!family || !isDemoAccount) return;
    const result = await apiClient.pairWithCode(DEMO_FAMILY_CODE, newRole, newName || '');
    applySessionResult(result);
  };

  const refreshMemberState = async (updatedMember?: Member) => {
    if (updatedMember && family) {
      setMember(updatedMember);
      await offlineStorage.saveAuth(
        family,
        updatedMember,
        token || undefined,
        personalLoginCode || undefined
      );
    }
  };

  const savePersonalLoginCode = async (code: string) => {
    setPersonalLoginCode(code);
    await offlineStorage.savePersonalLoginCode(code);
  };

  return (
    <AuthContext.Provider
      value={{
        family,
        member,
        personalLoginCode,
        isLoading,
        isPaired: !!family && !!member,
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

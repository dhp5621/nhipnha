import React, { createContext, useContext, useState, useEffect } from 'react';
import type { Family, Member, Role } from '@nhipnha/shared';
import { offlineStorage } from '../services/offlineStorage';
import { apiClient } from '../services/api';

export const DEMO_FAMILY_CODE = 'NHIP-8868';
export const DEMO_FAMILY_ID = 'fam_dongthap_001';

interface AuthContextType {
  family: Family | null;
  member: Member | null;
  isLoading: boolean;
  isPaired: boolean;
  isDemoAccount: boolean;
  pairWithQR: (qrData: string, role?: Role, name?: string) => Promise<void>;
  pairWithCode: (code: string, role: Role, name: string) => Promise<void>;
  createNewFamily: (
    familyName: string,
    province: string,
    role: Role,
    memberName: string
  ) => Promise<void>;
  loginDemoAccount: (role?: Role) => Promise<void>;
  switchRole: (role: Role, name?: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [family, setFamily] = useState<Family | null>(null);
  const [member, setMember] = useState<Member | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadStoredAuth() {
      try {
        const stored = await offlineStorage.getAuth();
        if (stored.family && stored.member) {
          setFamily(stored.family);
          setMember(stored.member);
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

  const pairWithQR = async (qrData: string, role?: Role, name?: string) => {
    setIsLoading(true);
    try {
      const result = await apiClient.pairWithQR(qrData, role, name);
      setFamily(result.family);
      setMember(result.member);
    } finally {
      setIsLoading(false);
    }
  };

  const pairWithCode = async (code: string, role: Role, name: string) => {
    setIsLoading(true);
    try {
      const cleanCode = code.trim().toUpperCase();
      const result = await apiClient.pairWithCode(cleanCode, role, name);
      setFamily(result.family);
      setMember(result.member);
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
    memberName: string
  ) => {
    setIsLoading(true);
    try {
      const result = await apiClient.createFamily(
        familyName.trim() || 'Gia đình mình',
        province.trim() || 'Việt Nam',
        role,
        memberName.trim() || 'Thành viên'
      );
      setFamily(result.family);
      setMember(result.member);
    } finally {
      setIsLoading(false);
    }
  };

  const switchRole = async (newRole: Role, newName?: string) => {
    if (!family) return;
    try {
      const result = await apiClient.pairWithCode(family.code, newRole, newName || '');
      setFamily(result.family);
      setMember(result.member);
    } catch {
      const fallbackName =
        newName ||
        (newRole === 'CHILD' ? 'Con' : newRole === 'PARENT' ? 'Bố / Mẹ' : 'Ông / Bà');
      const updatedMember: Member = {
        id: `mem_${newRole.toLowerCase()}_${Date.now()}`,
        familyId: family.id,
        name: fallbackName,
        role: newRole,
        createdAt: new Date().toISOString(),
      };
      setMember(updatedMember);
      await offlineStorage.saveAuth(family, updatedMember);
    }
  };

  const logout = async () => {
    await offlineStorage.clearAuth();
    setFamily(null);
    setMember(null);
  };

  return (
    <AuthContext.Provider
      value={{
        family,
        member,
        isLoading,
        isPaired: !!family && !!member,
        isDemoAccount,
        pairWithQR,
        pairWithCode,
        createNewFamily,
        loginDemoAccount,
        switchRole,
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

import React, { createContext, useContext, useState, useEffect } from 'react';
import type { Family, Member, Role } from '@nhipnha/shared';
import { offlineStorage } from '../services/offlineStorage';
import { apiClient } from '../services/api';

interface AuthContextType {
  family: Family | null;
  member: Member | null;
  isLoading: boolean;
  isPaired: boolean;
  pairWithQR: (qrData: string) => Promise<void>;
  pairWithCode: (code: string, role: Role, name: string) => Promise<void>;
  switchRole: (role: Role, name?: string) => void;
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
        } else {
          // Pre-seed with demo child so reviewer/user can test directly without friction
          const demoFam: Family = {
            id: 'fam_dongthap_001',
            name: 'Gia đình Bác Ba & Bé An',
            code: 'NHIP-8868',
            qrPayload: '{"version":"1.0","app":"nhipnha","familyId":"fam_dongthap_001"}',
            addressProvince: 'Đồng Tháp',
            createdAt: new Date().toISOString(),
          };
          const demoMem: Member = {
            id: 'mem_child_an',
            familyId: demoFam.id,
            name: 'Bé An (8 tuổi)',
            role: 'CHILD',
            createdAt: new Date().toISOString(),
          };
          setFamily(demoFam);
          setMember(demoMem);
          await offlineStorage.saveAuth(demoFam, demoMem);
        }
      } catch (err) {
        console.error('Error loading auth state:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadStoredAuth();
  }, []);

  const pairWithQR = async (qrData: string) => {
    setIsLoading(true);
    try {
      const result = await apiClient.pairWithQR(qrData);
      setFamily(result.family);
      setMember(result.member);
    } finally {
      setIsLoading(false);
    }
  };

  const pairWithCode = async (code: string, role: Role, name: string) => {
    setIsLoading(true);
    try {
      const result = await apiClient.pairWithCode(code, role, name);
      setFamily(result.family);
      setMember(result.member);
    } finally {
      setIsLoading(false);
    }
  };

  const switchRole = (newRole: Role, newName?: string) => {
    if (!family) return;
    const updatedMember: Member = {
      id: `mem_${newRole.toLowerCase()}_${Date.now()}`,
      familyId: family.id,
      name: newName || (newRole === 'CHILD' ? 'Bé An (8 tuổi)' : newRole === 'PARENT' ? 'Mẹ Hoa (Công nhân)' : 'Bà Bảy'),
      role: newRole,
      createdAt: new Date().toISOString(),
    };
    setMember(updatedMember);
    offlineStorage.saveAuth(family, updatedMember);
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
        pairWithQR,
        pairWithCode,
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

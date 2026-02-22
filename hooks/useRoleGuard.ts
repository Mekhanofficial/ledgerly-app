import { useEffect } from 'react';
import { router } from 'expo-router';
import { useUser } from '@/context/UserContext';
import { hasRole, normalizeRole } from '@/utils/roleAccess';

export const useRoleGuard = (allowedRoles: string[], fallback = '/(tabs)/more') => {
  const { user, loading } = useUser();
  const role = normalizeRole(user?.role);
  const canAccess = hasRole(role, allowedRoles);

  useEffect(() => {
    if (loading) return;
    if (!canAccess) {
      router.replace(fallback as any);
    }
  }, [loading, canAccess, fallback]);

  return { canAccess, role, loading };
};

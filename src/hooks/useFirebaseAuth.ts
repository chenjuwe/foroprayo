import { useContext } from 'react';
import { FirebaseAuthContext } from '@/contexts/FirebaseAuthContext';

// 創建自定義鉤子
export const useFirebaseAuth = () => {
  const context = useContext(FirebaseAuthContext);
  if (context === undefined) {
    throw new Error('useFirebaseAuth must be used within a FirebaseAuthProvider');
  }
  return context;
}; 
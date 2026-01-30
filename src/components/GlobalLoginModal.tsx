'use client';

import { useAuth } from '@/contexts/AuthContext';
import LoginModal from './LoginModal';
import { getAuthUser } from '@/services/auth';

export default function GlobalLoginModal() {
  const { showLoginModal, setShowLoginModal, loginRedirectMessage, login } = useAuth();

  const handleSuccess = (isNewUser: boolean) => {
    const user = getAuthUser();
    if (user) {
      login(user);
    }
    if (isNewUser) {
      // 可以在这里显示欢迎消息
    }
  };

  return (
    <LoginModal
      isOpen={showLoginModal}
      onClose={() => setShowLoginModal(false)}
      onSuccess={handleSuccess}
      redirectMessage={loginRedirectMessage}
    />
  );
}

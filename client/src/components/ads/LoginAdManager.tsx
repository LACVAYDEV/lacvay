import { useEffect, useRef, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { LoginPopupAd } from '@/components/ads/LoginPopupAd';

export function LoginAdManager() {
  const { user } = useAuth();
  const [showLoginAd, setShowLoginAd] = useState(false);
  const userIdRef = useRef<string | null>(null);
  const hasShownAdRef = useRef(false);

  useEffect(() => {
    if (user && user.id !== userIdRef.current && !hasShownAdRef.current) {
      userIdRef.current = user.id;
      
      const timer = setTimeout(() => {
        setShowLoginAd(true);
        hasShownAdRef.current = true;
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [user]);

  const handleClose = () => {
    setShowLoginAd(false);
  };

  return (
    <LoginPopupAd isOpen={showLoginAd} onClose={handleClose} />
  );
}

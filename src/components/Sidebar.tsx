'use client';

import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { 
  FaUserShield, 
  FaStar, 
  FaGift, 
  FaSignOutAlt,
  FaTimes
} from 'react-icons/fa';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const router = useRouter();
  const { user, profile, signOut } = useAuth();

  const handleNavigation = (path: string) => {
    router.push(path);
    onClose();
  };

  const handleSignOut = async () => {
    await signOut();
    onClose();
    router.push('/');
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.5)',
          zIndex: 1000,
          backdropFilter: 'blur(4px)',
        }}
      />

      {/* Sidebar */}
      <div style={{
        position: 'fixed',
        top: 0,
        right: 0,
        width: '300px',
        height: '100vh',
        background: 'linear-gradient(180deg, #1e1b4b 0%, #312e81 100%)',
        boxShadow: '-4px 0 20px rgba(0,0,0,0.3)',
        zIndex: 1001,
        padding: '80px 24px 24px',
        transform: isOpen ? 'translateX(0)' : 'translateX(100%)',
        transition: 'transform 0.3s ease-in-out',
      }}>
        {/* Botón cerrar */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '20px',
            right: '20px',
            width: '40px',
            height: '40px',
            background: 'rgba(255,255,255,0.1)',
            border: 'none',
            borderRadius: '8px',
            color: 'white',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <FaTimes />
        </button>

        {/* Menú */}
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {user && profile && (
            <button
              onClick={() => handleNavigation('/panel')}
              style={{
                padding: '16px 20px',
                background: 'rgba(255,255,255,0.1)',
                border: 'none',
                borderRadius: '12px',
                color: 'white',
                fontSize: '16px',
                fontWeight: '600',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                textAlign: 'left',
                transition: 'all 0.3s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.2)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
              }}
            >
              <FaUserShield /> Panel Admin
            </button>
          )}

          <button
            onClick={() => handleNavigation('/opiniones')}
            style={{
              padding: '16px 20px',
              background: 'rgba(255,255,255,0.1)',
              border: 'none',
              borderRadius: '12px',
              color: 'white',
              fontSize: '16px',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              textAlign: 'left',
              transition: 'all 0.3s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.2)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
            }}
          >
            <FaStar /> Opiniones
          </button>

          <button
            onClick={() => handleNavigation('/sorteos')}
            style={{
              padding: '16px 20px',
              background: 'rgba(255,255,255,0.1)',
              border: 'none',
              borderRadius: '12px',
              color: 'white',
              fontSize: '16px',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              textAlign: 'left',
              transition: 'all 0.3s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.2)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
            }}
          >
            <FaGift /> Sorteos
          </button>

          {user && (
            <button
              onClick={handleSignOut}
              style={{
                padding: '16px 20px',
                background: 'rgba(239, 68, 68, 0.2)',
                border: 'none',
                borderRadius: '12px',
                color: '#ef4444',
                fontSize: '16px',
                fontWeight: '600',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                textAlign: 'left',
                marginTop: '24px',
                transition: 'all 0.3s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(239, 68, 68, 0.3)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)';
              }}
            >
              <FaSignOutAlt /> Cerrar Sesión
            </button>
          )}
        </nav>

        {/* Info de usuario */}
        {user && profile && (
          <div style={{
            position: 'absolute',
            bottom: '24px',
            left: '24px',
            right: '24px',
            padding: '16px',
            background: 'rgba(255,255,255,0.1)',
            borderRadius: '12px',
          }}>
            <p style={{ margin: 0, fontSize: '14px', fontWeight: '600', color: 'white' }}>
              {profile.nombre} {profile.apellido}
            </p>
            <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: 'rgba(255,255,255,0.7)' }}>
              {profile.rol}
            </p>
          </div>
        )}
      </div>
    </>
  );
}
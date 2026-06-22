'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { FaShoppingCart, FaBars, FaTimes } from 'react-icons/fa';

interface NavbarProps {
  onMenuToggle: () => void;
  isMenuOpen: boolean;
  cartCount?: number;
}

export default function Navbar({ onMenuToggle, isMenuOpen, cartCount = 0 }: NavbarProps) {
  const router = useRouter();
  const { toggleTheme, mode } = useTheme();
  const { user } = useAuth();
  
  // ✅ CORREGIDO: Usar useRef en lugar de useState para los clicks
  const logoClicksRef = useRef(0);
  const logoClickTimer = useRef<NodeJS.Timeout | null>(null);

  const handleLogoClick = () => {
    // Incrementar el contador
    logoClicksRef.current += 1;
    const currentClicks = logoClicksRef.current;

    // Limpiar timer anterior
    if (logoClickTimer.current) {
      clearTimeout(logoClickTimer.current);
    }

    // Resetear después de 2 segundos
    logoClickTimer.current = setTimeout(() => {
      logoClicksRef.current = 0;
    }, 2000);

    // Si llega a 5 clicks, redirigir
    if (currentClicks >= 5) {
      logoClicksRef.current = 0;
      if (user) {
        router.push('/admin/productos');
      } else {
        router.push('/auth/login');
      }
    }
  };

  return (
    <header
      style={{
        background: 'linear-gradient(135deg, #7c3aed 0%, #a855f7 50%, #ec4899 100%)',
        padding: '12px 0',
        boxShadow: '0 4px 20px rgba(139, 92, 246, 0.3)',
        position: 'sticky',
        top: 0,
        zIndex: 100,
      }}
    >
      <div
        style={{
          maxWidth: '1400px',
          margin: '0 auto',
          padding: '0 20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
        }}
      >
        {/* IZQUIERDA: Logo + Nombre - CON EL HANDLER CORREGIDO */}
        <div
          onClick={handleLogoClick}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            cursor: 'pointer',
            userSelect: 'none',
          }}
        >
          <div
            style={{
              width: '45px',
              height: '45px',
              background: 'rgba(255,255,255,0.2)',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backdropFilter: 'blur(10px)',
              transition: 'transform 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'scale(1.05)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
            }}
            title="VoltechStore.ve"
          >
            <span style={{ fontSize: '24px', fontWeight: 'bold', color: 'white' }}>V</span>
          </div>
          <div>
            <h1 style={{ fontSize: '20px', fontWeight: '700', margin: 0, color: 'white' }}>
              VOLTECHSTORE.VE
            </h1>
            <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.8)', margin: 0 }}>
              Tecnología a tu alcance
            </p>
          </div>
        </div>

        {/* CENTRO: Enlaces estilizados como botones */}
        <nav style={{ display: 'flex', gap: '12px' }}>
          <button
            onClick={() => router.push('/')}
            style={{
              background: 'rgba(255,255,255,0.15)',
              border: '1px solid rgba(255,255,255,0.25)',
              color: 'white',
              fontSize: '15px',
              fontWeight: '600',
              cursor: 'pointer',
              padding: '10px 20px',
              borderRadius: '12px',
              backdropFilter: 'blur(10px)',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'all 0.3s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.25)';
              e.currentTarget.style.transform = 'translateY(-2px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.15)';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            🛍️ Productos
          </button>

          <button
            onClick={() => router.push('/streaming')}
            style={{
              background: 'rgba(255,255,255,0.15)',
              border: '1px solid rgba(255,255,255,0.25)',
              color: 'white',
              fontSize: '15px',
              fontWeight: '600',
              cursor: 'pointer',
              padding: '10px 20px',
              borderRadius: '12px',
              backdropFilter: 'blur(10px)',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'all 0.3s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.25)';
              e.currentTarget.style.transform = 'translateY(-2px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.15)';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            📺 Streaming
          </button>
        </nav>

        {/* DERECHA: Carrito, Tema, Hamburguesa */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {/* Carrito */}
          <div
            style={{
              position: 'relative',
              width: '45px',
              height: '45px',
              background: 'rgba(255,255,255,0.2)',
              border: '1px solid rgba(255,255,255,0.3)',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              backdropFilter: 'blur(10px)',
              transition: 'all 0.3s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.3)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.2)';
            }}
          >
            <FaShoppingCart style={{ fontSize: '20px', color: 'white' }} />
            {cartCount > 0 && (
              <span
                style={{
                  position: 'absolute',
                  top: '-5px',
                  right: '-5px',
                  background: '#ef4444',
                  color: 'white',
                  fontSize: '11px',
                  fontWeight: '700',
                  width: '22px',
                  height: '22px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '2px solid #7c3aed',
                }}
              >
                {cartCount}
              </span>
            )}
          </div>

          {/* Toggle Tema */}
          <button
            onClick={toggleTheme}
            style={{
              width: '45px',
              height: '45px',
              background: 'rgba(255,255,255,0.2)',
              border: '1px solid rgba(255,255,255,0.3)',
              borderRadius: '50%',
              color: 'white',
              fontSize: '18px',
              cursor: 'pointer',
              backdropFilter: 'blur(10px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.3s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.3)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.2)';
            }}
          >
            {mode === 'dark' ? '☀️' : '🌙'}
          </button>

          {/* Menú Hamburguesa */}
          <button
            onClick={onMenuToggle}
            style={{
              width: '45px',
              height: '45px',
              background: 'rgba(255,255,255,0.2)',
              border: '1px solid rgba(255,255,255,0.3)',
              borderRadius: '12px',
              color: 'white',
              fontSize: '20px',
              cursor: 'pointer',
              backdropFilter: 'blur(10px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.3s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.3)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.2)';
            }}
          >
            {isMenuOpen ? <FaTimes /> : <FaBars />}
          </button>
        </div>
      </div>
    </header>
  );
}
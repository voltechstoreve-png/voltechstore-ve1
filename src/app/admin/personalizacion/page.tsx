'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useTheme } from '@/contexts/ThemeContext';
import BrandSection from './components/BrandSection';
import ColorsSection from './components/ColorsSection';
import LayoutSection from './components/LayoutSection';
import ContentSection from './components/ContentSection';
import TypographySection from './components/TypographySection';
import PreviewPanel from './components/PreviewPanel';
import { FaArrowLeft } from 'react-icons/fa';
import { ConfigItem } from '@/types/config';  

export default function PersonalizacionPage() {
  const router = useRouter();
  const { theme, mode } = useTheme();
  const [config, setConfig] = useState<ConfigItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('brand');
  const [showPreview, setShowPreview] = useState(true);

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      const { data, error } = await supabase
        .from('configuracion_visual')
        .select('*')
        .order('categoria', { ascending: true })
        .order('orden', { ascending: true });

      if (error) {
        console.error('Error fetching config:', error);
        alert('Error al cargar configuración: ' + error.message);
      } else {
        console.log('Configuración cargada:', data);
        setConfig(data || []);
      }
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const updateConfig = (clave: string, valor: string) => {
    console.log('Actualizando:', clave, valor);
    setConfig(prev =>
      prev.map(item =>
        item.clave === clave ? { ...item, valor } : item
      )
    );
  };

  const handleSave = async () => {
    setSaving(true);
    
    try {
      const updates = config.map(item => ({
        clave: item.clave,
        valor: item.valor,
        updated_at: new Date().toISOString(),
      }));

      const { error } = await supabase
        .from('configuracion_visual')
        .upsert(updates, { onConflict: 'clave' });

      if (error) {
        console.error('Error saving:', error);
        alert('Error al guardar: ' + error.message);
      } else {
        alert('✅ Configuración guardada correctamente');
        fetchConfig(); // Recargar datos
      }
    } catch (err) {
      console.error('Error:', err);
      alert('Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  const tabs = [
    { id: 'brand', label: '🏷️ Marca', icon: '️' },
    { id: 'colors', label: '🎨 Colores', icon: '🎨' },
    { id: 'layout', label: '📐 Layout', icon: '📐' },
    { id: 'content', label: '📝 Contenido', icon: '📝' },
    { id: 'typography', label: '🔤 Tipografía', icon: '🔤' },
  ];

  const renderSection = () => {
    const props = { config, onUpdate: updateConfig };
    
    switch (activeTab) {
      case 'brand':
        return <BrandSection {...props} />;
      case 'colors':
        return <ColorsSection {...props} />;
      case 'layout':
        return <LayoutSection {...props} />;
      case 'content':
        return <ContentSection {...props} />;
      case 'typography':
        return <TypographySection {...props} />;
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '32px', textAlign: 'center' }}>
        Cargando configuración...
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        background: theme.colors.background.primary,
        color: theme.colors.text.primary,
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '24px 32px',
          borderBottom: `1px solid ${theme.colors.border.default}`,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          {/* ✅ Botón Volver */}
          <button
            onClick={() => router.push('/panel')}
            style={{
              width: '40px',
              height: '40px',
              background: theme.colors.background.tertiary,
              border: `1px solid ${theme.colors.border.default}`,
              borderRadius: '8px',
              color: theme.colors.text.primary,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '16px',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = theme.colors.background.elevated;
              e.currentTarget.style.transform = 'translateX(-2px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = theme.colors.background.tertiary;
              e.currentTarget.style.transform = 'translateX(0)';
            }}
            title="Volver al Panel"
          >
            <FaArrowLeft />
          </button>
          
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: '700', margin: 0 }}>
               Personalización
            </h1>
            <p style={{ color: theme.colors.text.secondary, fontSize: '14px', margin: '4px 0 0 0' }}>
              Personaliza la apariencia de tu tienda
            </p>
          </div>
        </div>
        
        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            onClick={() => setShowPreview(!showPreview)}
            style={{
              padding: '10px 20px',
              background: theme.colors.background.tertiary,
              border: `1px solid ${theme.colors.border.default}`,
              borderRadius: '8px',
              color: theme.colors.text.primary,
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = theme.colors.background.elevated;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = theme.colors.background.tertiary;
            }}
          >
            {showPreview ? 'Ocultar' : 'Mostrar'} Vista Previa
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            style={{
              padding: '10px 20px',
              background: saving 
                ? 'linear-gradient(135deg, #6b7280, #4b5563)'
                : 'linear-gradient(135deg, #8b5cf6, #ec4899)',
              border: 'none',
              borderRadius: '8px',
              color: 'white',
              fontSize: '14px',
              fontWeight: '600',
              cursor: saving ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s',
              opacity: saving ? 0.6 : 1,
            }}
            onMouseEnter={(e) => {
              if (!saving) {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(139, 92, 246, 0.4)';
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            {saving ? 'Guardando...' : '💾 Guardar Cambios'}
          </button>
        </div>
      </div>

      {/* Contenido */}
      <div style={{ display: 'flex', height: 'calc(100vh - 100px)' }}>
        {/* Panel de Configuración */}
        <div
          style={{
            flex: showPreview ? '0 0 50%' : '1',
            padding: '24px 32px',
            overflow: 'auto',
            borderRight: showPreview ? `1px solid ${theme.colors.border.default}` : 'none',
          }}
        >
          {/* Tabs */}
          <div
            style={{
              display: 'flex',
              gap: '8px',
              marginBottom: '24px',
              borderBottom: `1px solid ${theme.colors.border.default}`,
              paddingBottom: '16px',
            }}
          >
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  padding: '10px 16px',
                  background: activeTab === tab.id ? theme.colors.accent.primary : 'transparent',
                  border: 'none',
                  borderRadius: '8px',
                  color: activeTab === tab.id ? 'white' : theme.colors.text.secondary,
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => {
                  if (activeTab !== tab.id) {
                    e.currentTarget.style.background = theme.colors.background.tertiary;
                  }
                }}
                onMouseLeave={(e) => {
                  if (activeTab !== tab.id) {
                    e.currentTarget.style.background = 'transparent';
                  }
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Debug info */}
          <div style={{ 
            padding: '12px', 
            background: 'rgba(245, 158, 11, 0.1)', 
            border: '1px solid rgba(245, 158, 11, 0.3)',
            borderRadius: '8px',
            marginBottom: '20px',
            fontSize: '12px',
            color: '#f59e0b'
          }}>
            <strong>Debug:</strong> {config.length} items cargados | 
            Tab activa: {activeTab} | 
            Items en esta categoría: {config.filter(i => i.categoria === activeTab).length}
          </div>

          {/* Sección Activa */}
          {renderSection()}
          
          {config.length === 0 && (
            <div style={{ 
              padding: '40px', 
              textAlign: 'center',
              background: theme.colors.background.secondary,
              borderRadius: '12px',
              marginTop: '20px'
            }}>
              <p style={{ fontSize: '48px', marginBottom: '16px' }}>⚠️</p>
              <h3 style={{ marginBottom: '8px' }}>No hay configuración cargada</h3>
              <p style={{ color: theme.colors.text.secondary, marginBottom: '16px' }}>
                La tabla 'configuracion_visual' está vacía o no existe
              </p>
              <button
                onClick={fetchConfig}
                style={{
                  padding: '10px 20px',
                  background: theme.colors.accent.primary,
                  border: 'none',
                  borderRadius: '8px',
                  color: 'white',
                  cursor: 'pointer',
                }}
              >
                🔄 Reintentar Carga
              </button>
            </div>
          )}
        </div>

        {/* Panel de Vista Previa */}
        {showPreview && (
          <div
            style={{
              flex: 1,
              padding: '24px',
              overflow: 'auto',
              background: theme.colors.background.secondary,
            }}
          >
            <h3 style={{ marginBottom: '16px', fontSize: '16px', fontWeight: '600' }}>
               Vista Previa en Tiempo Real
            </h3>
            <PreviewPanel config={config} mode={mode} />
          </div>
        )}
      </div>
    </div>
  );
}
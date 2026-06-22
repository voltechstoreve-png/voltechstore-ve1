'use client';

import { useTheme } from '@/contexts/ThemeContext';

interface ConfigItem {
  clave: string;
  valor: string;
  label: string;
  descripcion?: string;
}

interface BrandSectionProps {
  config: ConfigItem[];
  onUpdate: (clave: string, valor: string) => void;
}

export default function BrandSection({ config, onUpdate }: BrandSectionProps) {
  const { theme } = useTheme();

  const getConfig = (clave: string) => config.find(c => c.clave === clave);

  return (
    <div>
      <h2 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '24px' }}>
        🏷️ Marca e Identidad
      </h2>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {/* Nombre de la Tienda */}
        <div>
          <label style={{ color: theme.colors.text.secondary, fontSize: '12px', fontWeight: '500', marginBottom: '6px', display: 'block' }}>
            {getConfig('nombre_tienda')?.label || 'Nombre de la Tienda'} *
          </label>
          <input
            type="text"
            value={getConfig('nombre_tienda')?.valor || ''}
            onChange={(e) => onUpdate('nombre_tienda', e.target.value)}
            style={{
              width: '100%',
              padding: '10px 12px',
              background: theme.colors.input.bg,
              border: `1px solid ${theme.colors.input.border}`,
              borderRadius: '8px',
              color: theme.colors.input.text,
              fontSize: '14px',
              boxSizing: 'border-box',
            }}
          />
          <p style={{ color: theme.colors.text.muted, fontSize: '11px', marginTop: '4px' }}>
            {getConfig('nombre_tienda')?.descripcion || 'Nombre que aparece en el header'}
          </p>
        </div>

        {/* Slogan */}
        <div>
          <label style={{ color: theme.colors.text.secondary, fontSize: '12px', fontWeight: '500', marginBottom: '6px', display: 'block' }}>
            {getConfig('slogan')?.label || 'Slogan'}
          </label>
          <input
            type="text"
            value={getConfig('slogan')?.valor || ''}
            onChange={(e) => onUpdate('slogan', e.target.value)}
            style={{
              width: '100%',
              padding: '10px 12px',
              background: theme.colors.input.bg,
              border: `1px solid ${theme.colors.input.border}`,
              borderRadius: '8px',
              color: theme.colors.input.text,
              fontSize: '14px',
              boxSizing: 'border-box',
            }}
          />
        </div>

        {/* Logo */}
        <div>
          <label style={{ color: theme.colors.text.secondary, fontSize: '12px', fontWeight: '500', marginBottom: '6px', display: 'block' }}>
            {getConfig('logo_url')?.label || 'Logo'}
          </label>
          <input
            type="url"
            value={getConfig('logo_url')?.valor || ''}
            onChange={(e) => onUpdate('logo_url', e.target.value)}
            placeholder="https://ejemplo.com/logo.png"
            style={{
              width: '100%',
              padding: '10px 12px',
              background: theme.colors.input.bg,
              border: `1px solid ${theme.colors.input.border}`,
              borderRadius: '8px',
              color: theme.colors.input.text,
              fontSize: '14px',
              boxSizing: 'border-box',
            }}
          />
          {getConfig('logo_url')?.valor && (
            <img
              src={getConfig('logo_url')!.valor}
              alt="Logo preview"
              style={{ marginTop: '12px', maxWidth: '200px', borderRadius: '8px', border: `1px solid ${theme.colors.border.default}` }}
            />
          )}
        </div>

        {/* Favicon */}
        <div>
          <label style={{ color: theme.colors.text.secondary, fontSize: '12px', fontWeight: '500', marginBottom: '6px', display: 'block' }}>
            {getConfig('favicon_url')?.label || 'Favicon'}
          </label>
          <input
            type="url"
            value={getConfig('favicon_url')?.valor || ''}
            onChange={(e) => onUpdate('favicon_url', e.target.value)}
            placeholder="https://ejemplo.com/favicon.ico"
            style={{
              width: '100%',
              padding: '10px 12px',
              background: theme.colors.input.bg,
              border: `1px solid ${theme.colors.input.border}`,
              borderRadius: '8px',
              color: theme.colors.input.text,
              fontSize: '14px',
              boxSizing: 'border-box',
            }}
          />
        </div>
      </div>
    </div>
  );
}
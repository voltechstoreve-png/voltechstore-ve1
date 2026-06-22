'use client';

import { useTheme } from '@/contexts/ThemeContext';

interface ConfigItem {
  clave: string;
  valor: string;
  label: string;
  descripcion?: string;
}

interface ColorsSectionProps {
  config: ConfigItem[];
  onUpdate: (clave: string, valor: string) => void;
}

export default function ColorsSection({ config, onUpdate }: ColorsSectionProps) {
  const { theme } = useTheme();

  const getConfig = (clave: string) => config.find(c => c.clave === clave);

  return (
    <div>
      <h2 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '24px' }}>
        🎨 Colores del Tema
      </h2>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '20px' }}>
        {config
          .filter(c => c.categoria === 'colors')
          .map(item => (
            <div
              key={item.clave}
              style={{
                padding: '16px',
                background: theme.colors.background.tertiary,
                borderRadius: '8px',
                border: `1px solid ${theme.colors.border.default}`,
              }}
            >
              <label style={{ color: theme.colors.text.secondary, fontSize: '12px', fontWeight: '500', marginBottom: '8px', display: 'block' }}>
                {item.label}
              </label>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                <input
                  type="color"
                  value={item.valor}
                  onChange={(e) => onUpdate(item.clave, e.target.value)}
                  style={{
                    width: '50px',
                    height: '50px',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    background: 'transparent',
                  }}
                />
                <input
                  type="text"
                  value={item.valor}
                  onChange={(e) => onUpdate(item.clave, e.target.value)}
                  style={{
                    flex: 1,
                    padding: '10px 12px',
                    background: theme.colors.input.bg,
                    border: `1px solid ${theme.colors.input.border}`,
                    borderRadius: '8px',
                    color: theme.colors.input.text,
                    fontSize: '14px',
                    fontFamily: 'monospace',
                  }}
                />
              </div>
              {item.descripcion && (
                <p style={{ color: theme.colors.text.muted, fontSize: '11px', marginTop: '8px' }}>
                  {item.descripcion}
                </p>
              )}
            </div>
          ))}
      </div>
    </div>
  );
}
'use client';

interface ConfigItem {
  clave: string;
  valor: string;
}

interface PreviewPanelProps {
  config: ConfigItem[];
  mode: 'dark' | 'light';
}

export default function PreviewPanel({ config, mode }: PreviewPanelProps) {
  const getConfig = (clave: string) => config.find(c => c.clave === clave)?.valor || '';

  const nombreTienda = getConfig('nombre_tienda') || 'VoltechStore.ve';
  const slogan = getConfig('slogan') || 'Tecnología a tu alcance';
  const logoUrl = getConfig('logo_url');
  const colorPrimary = getConfig('color_primary') || '#3b82f6';

  return (
    <div
      style={{
        background: mode === 'dark' ? '#0a0e1a' : '#ffffff',
        borderRadius: '12px',
        padding: '24px',
        border: `1px solid ${mode === 'dark' ? '#1e293b' : '#e2e8f0'}`,
      }}
    >
      {/* Header Preview */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          marginBottom: '24px',
          paddingBottom: '16px',
          borderBottom: `1px solid ${mode === 'dark' ? '#1e293b' : '#e2e8f0'}`,
        }}
      >
        {logoUrl ? (
          <img src={logoUrl} alt="Logo" style={{ height: '40px' }} />
        ) : (
          <div
            style={{
              width: '40px',
              height: '40px',
              background: colorPrimary,
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontWeight: 'bold',
            }}
          >
            V
          </div>
        )}
        <div>
          <h3 style={{ color: mode === 'dark' ? '#ffffff' : '#0f172a', margin: 0, fontSize: '18px' }}>
            {nombreTienda}
          </h3>
          <p style={{ color: mode === 'dark' ? '#94a3b8' : '#64748b', margin: 0, fontSize: '12px' }}>
            {slogan}
          </p>
        </div>
      </div>

      {/* Contenido Preview */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <button
          style={{
            padding: '12px 24px',
            background: colorPrimary,
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: '600',
            cursor: 'pointer',
          }}
        >
          Botón Primario
        </button>

        <input
          type="text"
          placeholder="Campo de texto"
          style={{
            padding: '10px 12px',
            background: mode === 'dark' ? '#1e293b' : '#f1f5f9',
            border: `1px solid ${mode === 'dark' ? '#334155' : '#cbd5e1'}`,
            borderRadius: '8px',
            color: mode === 'dark' ? '#ffffff' : '#0f172a',
          }}
        />
      </div>
    </div>
  );
}
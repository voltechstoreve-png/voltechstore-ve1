'use client';

interface ConfigItem {
  clave: string;
  valor: string;
  categoria: string;
  tipo: string;
  label: string;
  descripcion?: string;
}

interface TypographySectionProps {
  config: ConfigItem[];
  onUpdate: (clave: string, valor: string) => void;
}

export default function TypographySection({ config, onUpdate }: TypographySectionProps) {
  const typographyConfig = config.filter(item => item.categoria === 'typography');

  return (
    <div>
      <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '20px' }}>
        🔤 Configuración de Tipografía
      </h2>
      
      <div style={{ display: 'grid', gap: '16px' }}>
        {typographyConfig.map(item => (
          <div key={item.clave}>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '6px' }}>
              {item.label}
            </label>
            {item.tipo === 'select' ? (
              <select
                value={item.valor}
                onChange={(e) => onUpdate(item.clave, e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  background: 'rgba(15, 23, 42, 0.6)',
                  border: '1px solid rgba(139, 92, 246, 0.3)',
                  borderRadius: '6px',
                  color: 'white',
                  fontSize: '14px',
                }}
              >
                <option value="Inter">Inter</option>
                <option value="Roboto">Roboto</option>
                <option value="Poppins">Poppins</option>
                <option value="Montserrat">Montserrat</option>
                <option value="Open Sans">Open Sans</option>
              </select>
            ) : (
              <input
                type="text"
                value={item.valor}
                onChange={(e) => onUpdate(item.clave, e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  background: 'rgba(15, 23, 42, 0.6)',
                  border: '1px solid rgba(139, 92, 246, 0.3)',
                  borderRadius: '6px',
                  color: 'white',
                  fontSize: '14px',
                }}
              />
            )}
            {item.descripcion && (
              <p style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>
                {item.descripcion}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
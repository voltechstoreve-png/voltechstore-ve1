'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useTheme } from '@/contexts/ThemeContext';
import { FaInstagram, FaBox, FaCopy, FaCheck, FaRedo, FaWhatsapp } from 'react-icons/fa';

interface Producto {
  id: string;
  nombre: string;
  descripcion?: string;
  precio_venta_usd: number;
  precio_oferta_usd?: number;
  imagen_url: string;
  categoria: string;
  marca: string;
}

const BLOQUE_CORPORATIVO = `Somos tienda online en Caracas 🇻🇪
Envíos nacionales y Delivery 🏍️
Síguenos en nuestras redes sociales
Contáctanos al WhatsApp: +58 412-1234567
Catálogo Público: https://voltechstore.ve`;

const ESTILOS = [
  { id: 'persuasivo', label: '🔥 Persuasivo', emoji: '🔥' },
  { id: 'minimalista', label: '✨ Minimalista', emoji: '✨' },
  { id: 'urgente', label: '⏰ Urgente', emoji: '⏰' },
  { id: 'emocional', label: '💝 Emocional', emoji: '💝' },
];

export default function CopysPage() {
  const { theme } = useTheme();
  const [productos, setProductos] = useState<Producto[]>([]);
  const [productoSeleccionado, setProductoSeleccionado] = useState<Producto | null>(null);
  const [estilo, setEstilo] = useState('persuasivo');
  const [copysGenerados, setCopysGenerados] = useState<string[]>([]);
  const [copiado, setCopiado] = useState<number | null>(null);

  useEffect(() => {
    cargarProductos();
  }, []);

  const cargarProductos = async () => {
    const { data } = await supabase
      .from('productos')
      .select('*')
      .eq('estado', 'publicado')
      .order('nombre');
    setProductos(data || []);
  };

  const generarCopys = () => {
    if (!productoSeleccionado) {
      alert('⚠️ Selecciona un producto');
      return;
    }

    const p = productoSeleccionado;
    const tieneOferta = p.precio_oferta_usd && p.precio_oferta_usd < p.precio_venta_usd;
    const precio = tieneOferta ? p.precio_oferta_usd : p.precio_venta_usd;
    const descuento = tieneOferta
      ? Math.round(((p.precio_venta_usd - p.precio_oferta_usd!) / p.precio_venta_usd) * 100)
      : 0;

    const copys: string[] = [];

    // COPY 1: Persuasivo
    copys.push(`${ESTILOS[0].emoji} ¡${p.nombre.toUpperCase()} AL MEJOR PRECIO! ${ESTILOS[0].emoji}

${p.descripcion || 'Calidad garantizada que no te puedes perder'}

💰 ${tieneOferta ? `ANTES: $${p.precio_venta_usd}\n✅ AHORA: *$${precio}* (Ahorras ${descuento}%!)` : `Solo: *$${precio}*`}

🏷️ Marca: ${p.marca || 'Premium'}
📦 Categoría: ${p.categoria}

${BLOQUE_CORPORATIVO}

#VoltechStore #Tecnologia #Oferta #Caracas #Delivery`);

    // COPY 2: Minimalista
    copys.push(`${p.nombre}

${p.descripcion || 'Calidad premium'}

💵 $${precio}

${BLOQUE_CORPORATIVO}

#VoltechStore #Tech`);

    // COPY 3: Urgente
    copys.push(`⏰ ¡OFERTA POR TIEMPO LIMITADO! ⏰

${p.nombre} ${tieneOferta ? `con ${descuento}% OFF` : ''}

${p.descripcion || 'Producto exclusivo'}

💰 ${tieneOferta ? `De $${p.precio_venta_usd} a *$${precio}*` : `$${precio}`}

⚡ Stock limitado
🚚 Delivery disponible

${BLOQUE_CORPORATIVO}

#Oferta #TiempoLimitado #VoltechStore`);

    // COPY 4: Emocional
    copys.push(`✨ Imagina tener ${p.nombre} en tus manos...

${p.descripcion || 'La calidad que mereces'}

💖 Solo $${precio}

Porque tú mereces lo mejor, en VoltechStore lo hacemos posible.

${BLOQUE_CORPORATIVO}

#MerecesLoMejor #VoltechStore #Tecnologia`);

    setCopysGenerados(copys);
  };

  const copiarAlPortapapeles = async (texto: string, index: number) => {
    try {
      await navigator.clipboard.writeText(texto);
      setCopiado(index);
      setTimeout(() => setCopiado(null), 2000);
    } catch (error) {
      alert('❌ Error al copiar');
    }
  };

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
          <div style={{
            width: '48px',
            height: '48px',
            background: 'rgba(225, 48, 108, 0.15)',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#E1306C',
            fontSize: '22px',
          }}>
            <FaInstagram />
          </div>
          <div>
            <h1 style={{ fontSize: '28px', fontWeight: '700', margin: 0, color: theme.colors.text.primary }}>
              Generador de Copys
            </h1>
            <p style={{ fontSize: '14px', color: theme.colors.text.secondary, margin: 0 }}>
              Textos persuasivos para redes sociales en 1 clic
            </p>
          </div>
        </div>
      </div>

      {/* Configuración */}
      <div style={{
        background: theme.colors.background.secondary,
        border: `1px solid ${theme.colors.border.default}`,
        borderRadius: '16px',
        padding: '24px',
        marginBottom: '24px',
      }}>
        <h2 style={{ fontSize: '18px', fontWeight: '700', margin: '0 0 20px 0', color: theme.colors.text.primary }}>
          🎨 Configurar Copy
        </h2>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '12px', color: theme.colors.text.secondary, marginBottom: '6px' }}>
              <FaBox style={{ marginRight: '6px' }} /> Producto
            </label>
            <select
              value={productoSeleccionado?.id || ''}
              onChange={(e) => {
                const p = productos.find(p => p.id === e.target.value);
                setProductoSeleccionado(p || null);
              }}
              style={{
                width: '100%',
                padding: '10px 12px',
                background: theme.colors.background.tertiary,
                border: `1px solid ${theme.colors.border.default}`,
                borderRadius: '8px',
                color: theme.colors.text.primary,
                fontSize: '14px',
              }}
            >
              <option value="">Seleccionar producto...</option>
              {productos.map(p => (
                <option key={p.id} value={p.id}>{p.nombre}</option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', color: theme.colors.text.secondary, marginBottom: '6px' }}>
              Estilo de copy
            </label>
            <select
              value={estilo}
              onChange={(e) => setEstilo(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 12px',
                background: theme.colors.background.tertiary,
                border: `1px solid ${theme.colors.border.default}`,
                borderRadius: '8px',
                color: theme.colors.text.primary,
                fontSize: '14px',
              }}
            >
              {ESTILOS.map(e => (
                <option key={e.id} value={e.id}>{e.label}</option>
              ))}
            </select>
          </div>
        </div>

        <button
          onClick={generarCopys}
          disabled={!productoSeleccionado}
          style={{
            padding: '12px 24px',
            background: !productoSeleccionado ? theme.colors.background.elevated : 'linear-gradient(135deg, #E1306C, #833AB4)',
            border: 'none',
            borderRadius: '8px',
            color: 'white',
            fontWeight: '600',
            fontSize: '14px',
            cursor: !productoSeleccionado ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <FaRedo /> Generar 4 Copys
        </button>
      </div>

      {/* Copys Generados */}
      {copysGenerados.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: '700', margin: 0, color: theme.colors.text.primary }}>
            📝 Copys Generados
          </h2>

          {copysGenerados.map((copy, index) => (
            <div
              key={index}
              style={{
                background: theme.colors.background.secondary,
                border: `1px solid ${theme.colors.border.default}`,
                borderRadius: '16px',
                padding: '20px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <h3 style={{ fontSize: '14px', fontWeight: '700', margin: 0, color: theme.colors.text.primary }}>
                  {ESTILOS[index]?.label || `Copy ${index + 1}`}
                </h3>
                <button
                  onClick={() => copiarAlPortapapeles(copy, index)}
                  style={{
                    padding: '8px 16px',
                    background: copiado === index ? 'rgba(34, 197, 94, 0.2)' : 'rgba(225, 48, 108, 0.15)',
                    border: `1px solid ${copiado === index ? 'rgba(34, 197, 94, 0.3)' : 'rgba(225, 48, 108, 0.3)'}`,
                    borderRadius: '8px',
                    color: copiado === index ? '#22c55e' : '#E1306C',
                    fontSize: '12px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    transition: 'all 0.2s',
                  }}
                >
                  {copiado === index ? <><FaCheck /> ¡Copiado!</> : <><FaCopy /> Copiar</>}
                </button>
              </div>
              <pre style={{
                margin: 0,
                padding: '16px',
                background: theme.colors.background.tertiary,
                border: `1px solid ${theme.colors.border.default}`,
                borderRadius: '8px',
                color: theme.colors.text.primary,
                fontSize: '13px',
                whiteSpace: 'pre-wrap',
                fontFamily: 'inherit',
                lineHeight: '1.6',
              }}>
                {copy}
              </pre>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
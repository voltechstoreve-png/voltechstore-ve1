require('dotenv').config();
const { Client, LocalAuth } = require('whatsapp-web.js');
const { createClient } = require('@supabase/supabase-js');
const qrcode = require('qrcode-terminal');
const cron = require('node-cron');

// ============================================
// CONFIGURACIÓN
// ============================================
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY // ⚠️ Usa SERVICE KEY en el backend
);

// ============================================
// CLIENTE WHATSAPP CON SESIÓN PERSISTENTE
// ============================================
const client = new Client({
  authStrategy: new LocalAuth({
    dataPath: './.wwebjs_auth' // Sesión persistente en disco
  }),
  puppeteer: {
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--no-first-run',
      '--no-zygote',
      '--single-process',
      '--disable-gpu'
    ]
  },
  webVersionCache: {
    type: 'local',
    path: './.wwebjs_cache'
  }
});

// ============================================
// EVENTOS DE CONEXIÓN
// ============================================
client.on('qr', (qr) => {
  console.log('\n========================================');
  console.log('🔐 ESCANEA ESTE QR CON TU WHATSAPP:');
  console.log('========================================\n');
  qrcode.generate(qr, { small: true });
  console.log('\n⚠️  IMPORTANTE:');
  console.log('1. Abre WhatsApp en tu teléfono');
  console.log('2. Ve a Dispositivos vinculados');
  console.log('3. Escanea el código QR');
  console.log('4. La sesión se guardará automáticamente\n');
});

client.on('ready', () => {
  console.log('✅ WhatsApp Worker listo y conectado');
  console.log('📱 Número:', client.info.wid.user);
  iniciarCola();
});

client.on('authenticated', () => {
  console.log('✅ Sesión autenticada (persistente)');
});

client.on('auth_failure', (msg) => {
  console.error('❌ Error de autenticación:', msg);
});

client.on('disconnected', (reason) => {
  console.warn('⚠️  Cliente desconectado:', reason);
  // Intentar reconectar
  setTimeout(() => client.initialize(), 5000);
});

// ============================================
// FUNCIÓN: ENVIAR MENSAJE CON DELAY HUMANO
// ============================================
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const getRandomDelay = () => {
  // Delay aleatorio entre 60 y 120 segundos (simula humano)
  return Math.floor(Math.random() * (120000 - 60000 + 1)) + 60000;
};

async function enviarMensaje(mensaje) {
  try {
    // Marcar como enviando
    await supabase
      .from('cola_difusion')
      .update({ estado: 'enviando' })
      .eq('id', mensaje.id);

    // Formatear número (quitar espacios, agregar código país si falta)
    let telefono = mensaje.telefono.replace(/\D/g, '');
    if (!telefono.startsWith('58')) {
      telefono = '58' + telefono;
    }
    const numeroFormateado = `${telefono}@c.us`;

    // Enviar mensaje
    await client.sendMessage(numeroFormateado, mensaje.mensaje_texto);

    // Si tiene imagen, enviarla también
    if (mensaje.imagen_url) {
      // Opcional: enviar imagen con caption
      // const media = await MessageMedia.fromUrl(mensaje.imagen_url);
      // await client.sendMessage(numeroFormateado, media);
    }

    // Marcar como enviado
    await supabase
      .from('cola_difusion')
      .update({
        estado: 'enviado',
        enviado_en: new Date().toISOString()
      })
      .eq('id', mensaje.id);

    // Actualizar contador de campaña
    if (mensaje.campana_id) {
      await supabase.rpc('incrementar_enviados', { campana_id: mensaje.campana_id });
    }

    console.log(`✅ Enviado a ${mensaje.cliente_nombre} (${mensaje.telefono})`);
    return true;

  } catch (error) {
    console.error(`❌ Error enviando a ${mensaje.cliente_nombre}:`, error.message);

    // Actualizar intentos
    const nuevosIntentos = (mensaje.intentos || 0) + 1;
    const nuevoEstado = nuevosIntentos >= 3 ? 'fallido' : 'pendiente';

    await supabase
      .from('cola_difusion')
      .update({
        estado: nuevoEstado,
        intentos: nuevosIntentos,
        error_log: error.message
      })
      .eq('id', mensaje.id);

    return false;
  }
}

// ============================================
// PROCESADOR DE COLA (Loop infinito)
// ============================================
async function iniciarCola() {
  console.log('🔄 Iniciando procesador de cola...');

  while (true) {
    try {
      // Buscar siguiente mensaje pendiente
      const { data: mensajes, error } = await supabase
        .from('cola_difusion')
        .select('*')
        .eq('estado', 'pendiente')
        .lte('fecha_programada', new Date().toISOString())
        .order('fecha_programada', { ascending: true })
        .limit(1);

      if (error) {
        console.error('Error consultando cola:', error);
        await delay(30000);
        continue;
      }

      if (!mensajes || mensajes.length === 0) {
        console.log('⏳ Cola vacía, esperando 60s...');
        await delay(60000);
        continue;
      }

      const mensaje = mensajes[0];
      console.log(`📨 Procesando: ${mensaje.cliente_nombre}`);

      // Enviar mensaje
      await enviarMensaje(mensaje);

      // Delay humano antes del siguiente
      const delayMs = getRandomDelay();
      console.log(`💤 Esperando ${delayMs / 1000}s antes del siguiente...`);
      await delay(delayMs);

    } catch (error) {
      console.error('Error en loop principal:', error);
      await delay(30000);
    }
  }
}

// ============================================
// CRON: LIMPIEZA DE MENSAJES ANTIGUOS (diario)
// ============================================
cron.schedule('0 3 * * *', async () => {
  console.log('🧹 Ejecutando limpieza diaria...');
  const fechaLimite = new Date();
  fechaLimite.setDate(fechaLimite.getDate() - 30);

  await supabase
    .from('cola_difusion')
    .delete()
    .lt('creado_en', fechaLimite.toISOString())
    .in('estado', ['enviado', 'fallido']);
});

// ============================================
// INICIAR CLIENTE
// ============================================
console.log('🚀 Iniciando WhatsApp Worker...');
client.initialize();
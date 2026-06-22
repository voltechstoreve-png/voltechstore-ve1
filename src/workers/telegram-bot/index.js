require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');
const { createClient } = require('@supabase/supabase-js');
const cron = require('node-cron');

// ============================================
// CONFIGURACIÓN
// ============================================
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, { polling: true });
const CHAT_ID = process.env.TELEGRAM_CHAT_ID; // Tu chat ID personal

console.log('🤖 Bot de Telegram iniciado');

// ============================================
// FUNCIÓN: ENVIAR MENSAJE A TELEGRAM
// ============================================
async function enviarTelegram(mensaje, parseMode = 'HTML') {
  try {
    await bot.sendMessage(CHAT_ID, mensaje, { parse_mode: parseMode });
    console.log('✅ Telegram enviado:', mensaje.substring(0, 50));
    return true;
  } catch (error) {
    console.error('❌ Error Telegram:', error.message);
    return false;
  }
}

// ============================================
// FUNCIÓN: DISPARAR ALERTA POR TIPO
// ============================================
async function dispararAlerta(tipo, datos) {
  const { data: config } = await supabase
    .from('telegram_alertas')
    .select('*')
    .eq('tipo', tipo)
    .eq('activo', true)
    .single();

  if (!config) {
    console.log(`⚠️  Alerta ${tipo} no está activa`);
    return;
  }

  // Reemplazar variables en la plantilla
  let mensaje = config.mensaje_plantilla;
  Object.keys(datos).forEach(key => {
    mensaje = mensaje.replace(new RegExp(`{{${key}}}`, 'g'), datos[key]);
  });

  await enviarTelegram(mensaje);

  // Registrar envío
  await supabase
    .from('telegram_alertas')
    .insert([{
      tipo,
      activo: true,
      mensaje_plantilla: config.mensaje_plantilla,
      estado: 'enviado',
      enviado_en: new Date().toISOString()
    }]);
}

// ============================================
// CRON: COBROS STREAMING (diario 9am)
// ============================================
cron.schedule('0 9 * * *', async () => {
  console.log('💳 Revisando cobros de streaming...');

  const fechaLimite = new Date();
  fechaLimite.setDate(fechaLimite.getDate() + 2); // 2 días antes

  const { data: cuentas } = await supabase
    .from('streaming_cuentas')
    .select('*')
    .eq('estado', 'activa')
    .lte('fecha_vencimiento', fechaLimite.toISOString())
    .gt('fecha_vencimiento', new Date().toISOString());

  if (cuentas && cuentas.length > 0) {
    for (const cuenta of cuentas) {
      await dispararAlerta('cobro_streaming', {
        cliente: cuenta.cliente_nombre,
        streaming: cuenta.plataforma,
      });
    }
  }
});

// ============================================
// CRON: COBROS PRODUCTOS (diario 10am)
// ============================================
cron.schedule('0 10 * * *', async () => {
  console.log('💸 Revisando cobros de productos...');

  const hoy = new Date().toISOString().split('T')[0];

  const { data: facturas } = await supabase
    .from('facturas')
    .select('*')
    .eq('estado', 'pendiente')
    .eq('fecha_pago_estimada', hoy);

  if (facturas && facturas.length > 0) {
    for (const factura of facturas) {
      await dispararAlerta('cobro_producto', {
        cliente: factura.cliente_nombre,
        producto: factura.producto_nombre,
      });
    }
  }
});

// ============================================
// LISTENERS EN TIEMPO REAL (Supabase Realtime)
// ============================================
// Opiniones nuevas
supabase
  .channel('opiniones-channel')
  .on('postgres_changes',
    { event: 'INSERT', schema: 'public', table: 'opiniones' },
    async (payload) => {
      const opinion = payload.new;
      await dispararAlerta('opinion', {
        cliente: opinion.cliente_nombre || 'Anónimo',
        producto: opinion.producto_nombre || 'Producto',
      });
    }
  )
  .subscribe();

// Registros de sorteos
supabase
  .channel('sorteos-channel')
  .on('postgres_changes',
    { event: 'INSERT', schema: 'public', table: 'sorteos_participaciones' },
    async (payload) => {
      const participacion = payload.new;
      await dispararAlerta('sorteo', {
        nombre: participacion.nombre,
        telefono: participacion.telefono,
      });
    }
  )
  .subscribe();

// ============================================
// COMANDOS DEL BOT
// ============================================
bot.onText(/\/stats/, async (msg) => {
  const { count: pendientes } = await supabase
    .from('cola_difusion')
    .select('*', { count: 'exact', head: true })
    .eq('estado', 'pendiente');

  const { count: enviados } = await supabase
    .from('cola_difusion')
    .select('*', { count: 'exact', head: true })
    .eq('estado', 'enviado');

  bot.sendMessage(msg.chat.id,
    `📊 <b>ESTADÍSTICAS</b>\n\n` +
    `⏳ Pendientes: ${pendientes || 0}\n` +
    `✅ Enviados: ${enviados || 0}`,
    { parse_mode: 'HTML' }
  );
});

bot.onText(/\/help/, (msg) => {
  bot.sendMessage(msg.chat.id,
    `🤖 <b>COMANDOS DISPONIBLES</b>\n\n` +
    `/stats - Ver estadísticas\n` +
    `/help - Esta ayuda`,
    { parse_mode: 'HTML' }
  );
});

console.log('✅ Bot escuchando comandos y eventos en tiempo real');
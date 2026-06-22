import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { tipo } = await request.json();

    const response = await fetch(
      `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: process.env.TELEGRAM_CHAT_ID,
          text: `🧪 <b>MENSAJE DE PRUEBA</b>\n\nTipo: ${tipo}\nHora: ${new Date().toLocaleString('es-VE')}\n\n✅ El bot está funcionando correctamente`,
          parse_mode: 'HTML'
        })
      }
    );

    if (!response.ok) throw new Error('Error enviando a Telegram');

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
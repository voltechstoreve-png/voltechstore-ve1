import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export const enviarEmailBienvenida = async (
  emailPersonal: string,
  nombre: string,
  emailCorporativo: string,
  password: string
) => {
  const { data, error } = await resend.emails.send({
    from: 'VoltechStore <noreply@voltechstore.ve>',
    to: emailPersonal,
    subject: '¡Bienvenido a VoltechStore.ve!',
    html: `
      <h1>¡Hola ${nombre}!</h1>
      <p>Tu cuenta ha sido creada exitosamente.</p>
      <p><strong>Tu correo corporativo:</strong> ${emailCorporativo}</p>
      <p><strong>Tu contraseña:</strong> ${password}</p>
      <p>Usa estas credenciales para iniciar sesión en el sistema.</p>
      <p>Tu cuenta está pendiente de aprobación por el administrador.</p>
    `,
  });

  if (error) throw error;
  return data;
};
const nodemailer = require('nodemailer');
const Notificacion = require('../models/Notificacion');

// Configurar transporte de email
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
});

// Función para enviar notificaciones por email (RF10)
const enviarNotificacion = async ({ 
  destinatario, 
  asunto, 
  mensaje, 
  usuarioId, 
  expedienteId, 
  tipo = 'MENSAJE',
  prioridad = 'NORMAL'
}) => {
  try {
    console.log('🔔 Iniciando envío de notificación...');
    console.log('   - Usuario ID:', usuarioId);
    console.log('   - Expediente ID:', expedienteId);
    console.log('   - Tipo:', tipo);
    console.log('   - Asunto:', asunto);

    // 1. Guardar notificación en la base de datos
    if (usuarioId) {
      try {
        const notificacionGuardada = await Notificacion.create({
          usuario: usuarioId,
          tipo,
          asunto,
          mensaje,
          expediente: expedienteId || null,
          prioridad
        });
        console.log('✓ Notificación guardada en BD con ID:', notificacionGuardada._id);
      } catch (errorBD) {
        console.error('❌ Error al guardar notificación en BD:', errorBD);
        throw errorBD;
      }
    } else {
      console.warn('⚠️ No se proporcionó usuarioId, no se guardó en BD');
    }

    // 2. Enviar email
    // En desarrollo, solo loguear
    if (process.env.NODE_ENV === 'development') {
      console.log('📧 Email (desarrollo):', { destinatario, asunto });
      return;
    }

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: destinatario,
      subject: asunto,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #2c3e50; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background-color: #f9f9f9; }
            .footer { padding: 10px; text-align: center; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h2>Sistema de Licencias de Construcción</h2>
            </div>
            <div class="content">
              <p>${mensaje.replace(/\n/g, '<br>')}</p>
            </div>
            <div class="footer">
              <p>Este es un correo automático, por favor no responder.</p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log('✓ Email enviado a:', destinatario);
  } catch (error) {
    console.error('Error al enviar notificación:', error);
    throw error;
  }
};

// Función para enviar SMS (opcional)
const enviarSMS = async (telefono, mensaje) => {
  try {
    // Implementar integración con proveedor de SMS
    console.log('📱 SMS (no implementado):', { telefono, mensaje });
  } catch (error) {
    console.error('Error al enviar SMS:', error);
  }
};

module.exports = { enviarNotificacion, enviarSMS };

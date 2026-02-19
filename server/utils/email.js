const nodemailer = require('nodemailer');

// Configurar transporter
const crearTransporter = () => {
  const port = parseInt(process.env.EMAIL_PORT) || 465;
  
  // Usar Gmail tanto en desarrollo como producción
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: port,
    secure: port === 465, // true para port 465, false para otros puertos
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD
    },
    tls: {
      rejectUnauthorized: false
    }
  });
};

const enviarEmailVerificacion = async (usuario, token) => {
  const transporter = crearTransporter();
  
  const urlVerificacion = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/verificar-email/${token}`;
  
  const mailOptions = {
    from: `"Sistema de Licencias" <${process.env.EMAIL_FROM || 'noreply@licencias.com'}>`,
    to: usuario.email,
    subject: '✅ Verifica tu cuenta - Sistema de Licencias de Construcción',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8f9fa; border-radius: 8px;">
        <div style="background-color: #D91E18; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
          <h1 style="margin: 0;">🏗️ Sistema de Licencias</h1>
          <p style="margin: 10px 0 0 0;">Municipalidad de Lurigancho</p>
        </div>
        
        <div style="background-color: white; padding: 30px; border-radius: 0 0 8px 8px;">
          <h2 style="color: #2c3e50; margin-top: 0;">¡Hola ${usuario.nombres} ${usuario.apellidos}!</h2>
          
          <p style="color: #555; font-size: 16px; line-height: 1.6;">
            Gracias por registrarte en nuestro sistema. Para completar tu registro y poder iniciar sesión, 
            necesitas verificar tu dirección de correo electrónico.
          </p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${urlVerificacion}" 
               style="background-color: #D91E18; color: white; padding: 15px 40px; text-decoration: none; 
                      border-radius: 5px; font-size: 16px; font-weight: bold; display: inline-block;">
              Verificar mi cuenta
            </a>
          </div>
          
          <p style="color: #777; font-size: 14px; line-height: 1.6;">
            O copia y pega este enlace en tu navegador:<br>
            <a href="${urlVerificacion}" style="color: #D91E18; word-break: break-all;">${urlVerificacion}</a>
          </p>
          
          <div style="background-color: #fff3e0; border-left: 4px solid #f39c12; padding: 15px; margin: 20px 0;">
            <p style="margin: 0; color: #f57c00; font-size: 14px;">
              <strong>⚠️ Importante:</strong> Este enlace expirará en 24 horas.
            </p>
          </div>
          
          <p style="color: #777; font-size: 13px; margin-top: 30px;">
            Si no creaste esta cuenta, puedes ignorar este mensaje.
          </p>
        </div>
        
        <div style="text-align: center; margin-top: 20px; padding: 20px; color: #999; font-size: 12px;">
          <p style="margin: 5px 0;">© 2025 Juan Diego Ttito Valenzuela</p>
          <p style="margin: 5px 0;">Todos los derechos reservados</p>
          <p style="margin: 5px 0;">Contacto: 948 225 929</p>
        </div>
      </div>
    `
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    
    if (process.env.NODE_ENV !== 'production') {
      console.log('\n📧 Email de verificación enviado (desarrollo):');
      console.log('Preview URL:', nodemailer.getTestMessageUrl(info));
      console.log('Token de verificación:', token);
      console.log('URL de verificación:', urlVerificacion);
    }
    
    return { success: true, info };
  } catch (error) {
    console.error('Error al enviar email:', error);
    return { success: false, error: error.message };
  }
};

// Generar código numérico de 6 dígitos
const generarCodigoNumerico = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Enviar código para cambio de contraseña
const enviarCodigoCambioContrasena = async (usuario, codigo) => {
  const transporter = crearTransporter();
  
  // Mostrar en consola SIEMPRE (útil para desarrollo)
  console.log('\n📧 ========================================');
  console.log('📧 CÓDIGO CAMBIO DE CONTRASEÑA');
  console.log('📧 ========================================');
  console.log('📧 Usuario:', usuario.email);
  console.log('📧 Nombres:', usuario.nombres);
  console.log('📧 CÓDIGO:', codigo);
  console.log('📧 ========================================\n');
  
  const mailOptions = {
    from: `"Sistema de Licencias" <${process.env.EMAIL_FROM || 'noreply@licencias.com'}>`,
    to: usuario.email,
    subject: '🔐 Código de verificación para cambio de contraseña',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8f9fa; border-radius: 8px;">
        <div style="background-color: #D91E18; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
          <h1 style="margin: 0;">🔐 Cambio de Contraseña</h1>
          <p style="margin: 10px 0 0 0;">Sistema de Licencias de Construcción</p>
        </div>
        
        <div style="background-color: white; padding: 30px; border-radius: 0 0 8px 8px;">
          <h2 style="color: #2c3e50; margin-top: 0;">¡Hola ${usuario.nombres}!</h2>
          
          <p style="color: #555; font-size: 16px; line-height: 1.6;">
            Recibimos una solicitud para cambiar tu contraseña. Usa el siguiente código de verificación:
          </p>
          
          <div style="text-align: center; margin: 30px 0;">
            <div style="background-color: #f0f0f0; border: 2px dashed #D91E18; padding: 20px; 
                        border-radius: 8px; display: inline-block;">
              <span style="font-size: 36px; font-weight: bold; color: #D91E18; letter-spacing: 8px;">
                ${codigo}
              </span>
            </div>
          </div>
          
          <div style="background-color: #fff3e0; border-left: 4px solid #f39c12; padding: 15px; margin: 20px 0;">
            <p style="margin: 0; color: #f57c00; font-size: 14px;">
              <strong>⚠️ Importante:</strong> Este código expirará en 10 minutos.
            </p>
          </div>
          
          <div style="background-color: #ffebee; border-left: 4px solid #D91E18; padding: 15px; margin: 20px 0;">
            <p style="margin: 0; color: #c62828; font-size: 14px;">
              <strong>🔒 Seguridad:</strong> Si no solicitaste este cambio, ignora este mensaje y 
              tu contraseña permanecerá segura.
            </p>
          </div>
        </div>
        
        <div style="text-align: center; margin-top: 20px; padding: 20px; color: #999; font-size: 12px;">
          <p style="margin: 5px 0;">© 2025 Juan Diego Ttito Valenzuela</p>
          <p style="margin: 5px 0;">Contacto: 948 225 929</p>
        </div>
      </div>
    `
  };

  try {
    // Enviar email real (solo en producción)
    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Email enviado exitosamente a:', usuario.email);
    return { success: true, info };
  } catch (error) {
    console.error('❌ Error al enviar email:', error.message);
    return { success: false, error: error.message };
  }
};

// Enviar código para registro de usuario
const enviarCodigoRegistro = async (email, nombres, codigo) => {
  const transporter = crearTransporter();
  
  // Mostrar en consola SIEMPRE (útil para desarrollo y producción)
  console.log('\n📧 ========================================');
  console.log('📧 CÓDIGO DE REGISTRO');
  console.log('📧 ========================================');
  console.log('📧 Para:', email);
  console.log('📧 Nombres:', nombres);
  console.log('📧 CÓDIGO:', codigo);
  console.log('📧 ========================================\n');
  
  const mailOptions = {
    from: `"Sistema de Licencias" <${process.env.EMAIL_FROM || 'noreply@licencias.com'}>`,
    to: email,
    subject: '✅ Código de verificación para registro',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8f9fa; border-radius: 8px;">
        <div style="background-color: #D91E18; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
          <h1 style="margin: 0;">✅ Registro de Usuario</h1>
          <p style="margin: 10px 0 0 0;">Sistema de Licencias de Construcción</p>
        </div>
        
        <div style="background-color: white; padding: 30px; border-radius: 0 0 8px 8px;">
          <h2 style="color: #2c3e50; margin-top: 0;">¡Hola ${nombres}!</h2>
          
          <p style="color: #555; font-size: 16px; line-height: 1.6;">
            Gracias por registrarte en nuestro sistema. Para completar tu registro, 
            usa el siguiente código de verificación:
          </p>
          
          <div style="text-align: center; margin: 30px 0;">
            <div style="background-color: #f0f0f0; border: 2px dashed #D91E18; padding: 20px; 
                        border-radius: 8px; display: inline-block;">
              <span style="font-size: 36px; font-weight: bold; color: #D91E18; letter-spacing: 8px;">
                ${codigo}
              </span>
            </div>
          </div>
          
          <div style="background-color: #fff3e0; border-left: 4px solid #f39c12; padding: 15px; margin: 20px 0;">
            <p style="margin: 0; color: #f57c00; font-size: 14px;">
              <strong>⚠️ Importante:</strong> Este código expirará en 10 minutos.
            </p>
          </div>
          
          <p style="color: #777; font-size: 13px; margin-top: 30px;">
            Si no solicitaste este registro, puedes ignorar este mensaje.
          </p>
        </div>
        
        <div style="text-align: center; margin-top: 20px; padding: 20px; color: #999; font-size: 12px;">
          <p style="margin: 5px 0;">© 2025 Juan Diego Ttito Valenzuela</p>
          <p style="margin: 5px 0;">Contacto: 948 225 929</p>
        </div>
      </div>
    `
  };

  try {
    // Enviar email real (solo en producción)
    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Email enviado exitosamente a:', email);
    return { success: true, info };
  } catch (error) {
    console.error('❌ Error al enviar email:', error.message);
    return { success: false, error: error.message };
  }
};

// Enviar mensaje personalizado al usuario sobre su expediente
const enviarMensajeExpediente = async (usuario, expediente, asunto, mensaje) => {
  const transporter = crearTransporter();
  
  const mailOptions = {
    from: `"Sistema de Licencias" <${process.env.EMAIL_FROM || 'noreply@licencias.com'}>`,
    to: usuario.email,
    subject: asunto,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8f9fa; border-radius: 8px;">
        <div style="background-color: #D91E18; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
          <h1 style="margin: 0;">🏗️ Sistema de Licencias</h1>
          <p style="margin: 10px 0 0 0;">Municipalidad de Lurigancho</p>
        </div>
        
        <div style="background-color: white; padding: 30px; border-radius: 0 0 8px 8px;">
          <h2 style="color: #2c3e50; margin-top: 0;">Hola ${usuario.nombres} ${usuario.apellidos}</h2>
          
          <div style="background-color: #e3f2fd; border-left: 4px solid #2196f3; padding: 15px; margin: 20px 0;">
            <p style="margin: 0; color: #1976d2; font-weight: bold;">
              📋 Expediente N° ${expediente.numeroExpediente}
            </p>
          </div>
          
          <div style="color: #555; font-size: 16px; line-height: 1.8; white-space: pre-wrap;">
${mensaje}
          </div>
          
          <div style="background-color: #f5f5f5; padding: 20px; margin: 30px 0; border-radius: 8px;">
            <h3 style="color: #2c3e50; margin-top: 0; font-size: 16px;">Detalles de tu Expediente:</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; color: #666; width: 40%;">Número de Expediente:</td>
                <td style="padding: 8px 0; color: #333; font-weight: bold;">${expediente.numeroExpediente}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #666;">Tipo de Obra:</td>
                <td style="padding: 8px 0; color: #333;">${expediente.proyecto?.tipoObra || 'N/A'}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #666;">Dirección:</td>
                <td style="padding: 8px 0; color: #333;">${expediente.proyecto?.ubicacion?.direccion || 'N/A'}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #666;">Estado:</td>
                <td style="padding: 8px 0; color: #333; font-weight: bold;">${expediente.estado}</td>
              </tr>
            </table>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/expediente/${expediente._id}" 
               style="background-color: #D91E18; color: white; padding: 15px 40px; text-decoration: none; 
                      border-radius: 5px; font-size: 16px; font-weight: bold; display: inline-block;">
              Ver Mi Expediente
            </a>
          </div>
          
          <div style="background-color: #fff3e0; border-left: 4px solid #f39c12; padding: 15px; margin: 20px 0;">
            <p style="margin: 0; color: #f57c00; font-size: 14px;">
              <strong>📞 Contacto:</strong> Si tienes alguna consulta, puedes comunicarte con nosotros al teléfono de la municipalidad.
            </p>
          </div>
        </div>
        
        <div style="text-align: center; margin-top: 20px; padding: 20px; color: #999; font-size: 12px;">
          <p style="margin: 5px 0;">© 2025 Juan Diego Ttito Valenzuela</p>
          <p style="margin: 5px 0;">Municipalidad de Lurigancho</p>
          <p style="margin: 5px 0;">Contacto: 948 225 929</p>
        </div>
      </div>
    `
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    
    if (process.env.NODE_ENV !== 'production') {
      console.log('\n📧 Mensaje de expediente enviado (desarrollo):');
      console.log('Preview URL:', nodemailer.getTestMessageUrl(info));
      console.log('Destinatario:', usuario.email);
      console.log('Asunto:', asunto);
    }
    
    return { success: true, info };
  } catch (error) {
    console.error('Error al enviar email:', error);
    return { success: false, error: error.message };
  }
};

// Enviar licencia de construcción al usuario
const enviarLicenciaAprobada = async (usuario, expediente, rutaLicencia) => {
  const transporter = crearTransporter();
  
  const mailOptions = {
    from: `"Sistema de Licencias" <${process.env.EMAIL_FROM || 'noreply@licencias.com'}>`,
    to: usuario.email,
    subject: '🎉 ¡Licencia de Construcción Aprobada! - Expediente N° ' + expediente.numeroExpediente,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8f9fa; border-radius: 8px;">
        <div style="background-color: #27ae60; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
          <h1 style="margin: 0;">🎉 ¡FELICITACIONES!</h1>
          <p style="margin: 10px 0 0 0; font-size: 18px;">Tu Licencia de Construcción ha sido Aprobada</p>
        </div>
        
        <div style="background-color: white; padding: 30px; border-radius: 0 0 8px 8px;">
          <h2 style="color: #2c3e50; margin-top: 0;">Estimado(a) ${usuario.nombres} ${usuario.apellidos}</h2>
          
          <p style="color: #555; font-size: 16px; line-height: 1.6;">
            Nos complace informarle que su expediente N° <strong>${expediente.numeroExpediente}</strong> 
            ha sido <strong style="color: #27ae60;">APROBADO</strong> exitosamente.
          </p>
          
          <div style="background-color: #e8f5e9; border-left: 4px solid #27ae60; padding: 20px; margin: 30px 0; border-radius: 4px;">
            <h3 style="margin: 0 0 15px 0; color: #27ae60; font-size: 18px;">✅ Su Licencia de Construcción está adjunta</h3>
            <p style="margin: 0; color: #2e7d32; font-size: 14px;">
              Encontrará su licencia oficial como archivo adjunto en este correo electrónico.
            </p>
          </div>
          
          <div style="background-color: #f5f5f5; padding: 20px; margin: 30px 0; border-radius: 8px;">
            <h3 style="color: #2c3e50; margin-top: 0; font-size: 16px;">📋 Detalles del Proyecto:</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; color: #666; width: 45%;">Expediente:</td>
                <td style="padding: 8px 0; color: #333; font-weight: bold;">${expediente.numeroExpediente}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #666;">Proyecto:</td>
                <td style="padding: 8px 0; color: #333;">${expediente.proyecto?.nombreProyecto || 'N/A'}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #666;">Dirección:</td>
                <td style="padding: 8px 0; color: #333;">${expediente.proyecto?.ubicacion?.direccion || expediente.proyecto?.direccionProyecto || 'N/A'}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #666;">Tipo de Obra:</td>
                <td style="padding: 8px 0; color: #333;">${expediente.proyecto?.tipoObra || 'N/A'}</td>
              </tr>
            </table>
          </div>
          
          <div style="background-color: #fff3e0; border-left: 4px solid #f39c12; padding: 20px; margin: 30px 0;">
            <h3 style="margin: 0 0 12px 0; color: #f57c00; font-size: 16px;">⚠️ Importante:</h3>
            <ul style="margin: 0; padding-left: 20px; color: #f57c00; line-height: 1.8;">
              <li>Conserve este documento en lugar seguro</li>
              <li>Debe tener una copia física en el lugar de la obra</li>
              <li>La licencia debe estar visible durante toda la construcción</li>
              <li>Respete las especificaciones técnicas aprobadas</li>
              <li>Cualquier modificación requiere nueva aprobación</li>
            </ul>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/expediente/${expediente._id}" 
               style="background-color: #27ae60; color: white; padding: 15px 40px; text-decoration: none; 
                      border-radius: 5px; font-size: 16px; font-weight: bold; display: inline-block;">
              Ver Mi Expediente
            </a>
          </div>
          
          <div style="background-color: #e3f2fd; border-left: 4px solid #2196f3; padding: 15px; margin: 20px 0;">
            <p style="margin: 0; color: #1976d2; font-size: 14px;">
              <strong>📞 Consultas:</strong> Si tiene alguna pregunta, puede comunicarse con la 
              Municipalidad de Lurigancho en nuestro horario de atención.
            </p>
          </div>
          
          <p style="color: #555; font-size: 14px; margin-top: 30px; text-align: center;">
            ¡Le deseamos éxito en su proyecto de construcción!
          </p>
        </div>
        
        <div style="text-align: center; margin-top: 20px; padding: 20px; color: #999; font-size: 12px;">
          <p style="margin: 5px 0;">© 2025 Juan Diego Ttito Valenzuela</p>
          <p style="margin: 5px 0;">Municipalidad de Lurigancho</p>
          <p style="margin: 5px 0;">Sistema de Licencias de Construcción</p>
          <p style="margin: 5px 0;">Contacto: 948 225 929</p>
        </div>
      </div>
    `,
    attachments: [
      {
        filename: expediente.licenciaFinal?.nombre || 'Licencia_de_Construccion.pdf',
        path: rutaLicencia
      }
    ]
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    
    if (process.env.NODE_ENV !== 'production') {
      console.log('\n📧 Licencia de construcción enviada (desarrollo):');
      console.log('Preview URL:', nodemailer.getTestMessageUrl(info));
      console.log('Destinatario:', usuario.email);
      console.log('Archivo adjunto:', rutaLicencia);
    }
    
    return { success: true, info };
  } catch (error) {
    console.error('Error al enviar licencia:', error);
    return { success: false, error: error.message };
  }
};

module.exports = {
  enviarEmailVerificacion,
  enviarCodigoCambioContrasena,
  enviarCodigoRegistro,
  generarCodigoNumerico,
  enviarMensajeExpediente,
  enviarLicenciaAprobada
};

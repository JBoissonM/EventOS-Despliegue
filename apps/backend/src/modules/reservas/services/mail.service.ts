import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import PDFDocument from 'pdfkit';

export interface DatosCorreoBoleto {
  destinatario: string;
  nombreAsistente: string;
  idBoleto: number;
  nombreEvento: string;
  nombreSubEvento: string;
  fecha: string;
  horaInicio: string;
  horaFin: string;
  nombreRecinto: string;
  asiento?: { fila: string; numero: number } | null;
  qrBase64?: string;
}

@Injectable()
export class MailService {
  private transporter: nodemailer.Transporter;
  private readonly logger = new Logger(MailService.name);

  constructor() {
    const port = Number(process.env.SMTP_PORT) || 465;
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port,
      secure: port === 465,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  // Generación del PDF con diseño idéntico al HTML
  private async generarPDFBoleto(datos: DatosCorreoBoleto): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ size: 'LETTER', margin: 0 });
      const chunks: Buffer[] = [];

      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      const startX = 40;
      let y = 40;
      const width = 532; 


      const heightContenedor = datos.qrBase64 ? 660 : 420;
      
      doc.save();
      doc.roundedRect(startX, y, width, heightContenedor, 12).clip();

      doc.rect(startX, y, width, 70).fill('#6b1d2f');
      doc.font('Helvetica-Bold').fontSize(22).fillColor('#ffffff');
      doc.text('Confirmación de Reserva - EventOS', startX, y + 25, { width: width, align: 'center' });

      doc.restore();
      doc.roundedRect(startX, y, width, heightContenedor, 12).lineWidth(1).strokeColor('#e2e8f0').stroke();

      y += 100;


      doc.font('Helvetica').fontSize(14).fillColor('#334155');
      doc.text(`Hola `, startX + 30, y, { continued: true })
         .font('Helvetica-Bold').text(`${datos.nombreAsistente},`);
      
      y += 25;
      doc.font('Helvetica').fontSize(12);
      doc.text('Tu lugar ha sido reservado exitosamente. A continuación encontrarás los detalles de tu boleto:', startX + 30, y, { width: width - 60 });

      y += 40;

      const tableY = y;
      doc.roundedRect(startX + 30, tableY, width - 60, 170, 8).fill('#f8fafc');
      
      y += 20;
      const col1X = startX + 45;
      const col2X = startX + 140;
      const rowHeight = 24;

      const textoAsiento = datos.asiento ? `Fila ${datos.asiento.fila}, Asiento ${datos.asiento.numero}` : 'Entrada General (Sin asiento numerado)';

      const fields = [
          { label: 'Folio:', value: `#${datos.idBoleto}` },
          { label: 'Evento:', value: datos.nombreEvento },
          { label: 'Actividad:', value: datos.nombreSubEvento },
          { label: 'Horario:', value: `${datos.fecha} (${datos.horaInicio} - ${datos.horaFin})` },
          { label: 'Recinto:', value: datos.nombreRecinto },
          { label: 'Lugar:', value: textoAsiento },
      ];

      fields.forEach(f => {
          doc.font('Helvetica-Bold').fillColor('#1e293b').text(f.label, col1X, y);
          doc.font('Helvetica').fillColor('#334155').text(f.value, col2X, y);
          y += rowHeight;
      });

      y = tableY + 170 + 30;


      if (datos.qrBase64) {
          doc.font('Helvetica-Bold').fillColor('#1e293b').text('Presenta este código QR en el acceso:', startX, y, { width: width, align: 'center' });
          y += 25;
          
          const base64Data = datos.qrBase64.replace(/^data:image\/png;base64,/, '');
          const imageBuffer = Buffer.from(base64Data, 'base64');
          const qrSize = 180;
          const qrX = startX + (width - qrSize) / 2;
          

          doc.rect(qrX - 5, y - 5, qrSize + 10, qrSize + 10).lineWidth(1).strokeColor('#e2e8f0').stroke();
          doc.image(imageBuffer, qrX, y, { width: qrSize, height: qrSize });
          
          y += qrSize + 40;
      } else {
          doc.font('Helvetica-Oblique').fillColor('#64748b')
             .text('Esta actividad es de acceso libre y no requiere presentar código QR en la entrada.', startX, y, { width: width, align: 'center' });
          y += 50;
      }


      doc.moveTo(startX + 30, y).lineTo(startX + width - 30, y).lineWidth(1).strokeColor('#e2e8f0').stroke();
      y += 15;
      doc.font('Helvetica').fontSize(10).fillColor('#64748b');
      doc.text('Si no puedes asistir, recuerda cancelar tu reservación desde la sección "Mis Boletos" en la plataforma.', startX + 30, y, { width: width - 60, align: 'center' });

      doc.end();
    });
  }

  async enviarCorreoConfirmacionReserva(datos: DatosCorreoBoleto): Promise<void> {
    const attachments: nodemailer.SendMailOptions['attachments'] = [];
    const timestamp = new Date().getTime();
    
    let seccionQrHtml = `
      <p style="color: #555; font-size: 14px; margin-top: 16px;">
        <em>Esta actividad es de acceso libre y no requiere presentar código QR en la entrada.</em>
      </p>
    `;


    if (datos.qrBase64) {
      const base64Data = datos.qrBase64.replace(/^data:image\/png;base64,/, '');
      const uniqueCid = `qr-${datos.idBoleto}-${timestamp}@eventos.escom`; 
      
      attachments.push({
        filename: `qr-acceso.png`,
        content: base64Data,
        encoding: 'base64',
        cid: uniqueCid,
        contentType: 'image/png',
        contentDisposition: 'inline'
      });

      seccionQrHtml = `
        <div style="text-align: center; margin: 24px 0;">
          <p style="margin-bottom: 8px; font-weight: bold; color: #1e293b;">Presenta este código QR en el acceso:</p>
          <img src="cid:${uniqueCid}" alt="Código QR del Boleto" style="width: 220px; height: 220px; border: 1px solid #e2e8f0; border-radius: 8px; padding: 8px;" />
        </div>
      `;
    }

    try {
      const pdfBuffer = await this.generarPDFBoleto(datos);
      attachments.push({
        filename: `Boleto_EventOS_${datos.idBoleto}.pdf`,
        content: pdfBuffer,
        contentType: 'application/pdf',
      });
    } catch (error) {
      this.logger.error('Error al generar el PDF del boleto', error);
    }

    const textoAsiento = datos.asiento
      ? `Fila ${datos.asiento.fila}, Asiento ${datos.asiento.numero}`
      : 'Entrada General (Sin asiento numerado)';

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
        <span style="display:none; color:transparent; font-size:1px;">Ref: ${timestamp}</span>
        
        <div style="background-color: #6b1d2f; color: #ffffff; padding: 20px; text-align: center;">
          <h2 style="margin: 0;">Confirmación de Reserva - EventOS</h2>
        </div>
        
        <div style="padding: 24px; color: #334155;">
          <p>Hola <strong>${datos.nombreAsistente}</strong>,</p>
          <p>Tu lugar ha sido reservado exitosamente. Hemos adjuntado a este correo tu boleto oficial en formato <strong>PDF</strong> para que puedas descargarlo.</p>
          
          <table style="width: 100%; border-collapse: collapse; margin-top: 16px; background-color: #f8fafc; border-radius: 8px; padding: 12px;">
            <tr><td style="padding: 8px 12px; font-weight: bold;">Folio:</td><td style="padding: 8px 12px;">#${datos.idBoleto}</td></tr>
            <tr><td style="padding: 8px 12px; font-weight: bold;">Evento:</td><td style="padding: 8px 12px;">${datos.nombreEvento}</td></tr>
            <tr><td style="padding: 8px 12px; font-weight: bold;">Actividad:</td><td style="padding: 8px 12px;">${datos.nombreSubEvento}</td></tr>
            <tr><td style="padding: 8px 12px; font-weight: bold;">Horario:</td><td style="padding: 8px 12px;">${datos.fecha} (${datos.horaInicio} - ${datos.horaFin})</td></tr>
            <tr><td style="padding: 8px 12px; font-weight: bold;">Recinto:</td><td style="padding: 8px 12px;">${datos.nombreRecinto}</td></tr>
            <tr><td style="padding: 8px 12px; font-weight: bold;">Lugar:</td><td style="padding: 8px 12px;">${textoAsiento}</td></tr>
          </table>

          ${seccionQrHtml}

          <p style="font-size: 12px; color: #64748b; margin-top: 24px; border-top: 1px solid #e2e8f0; padding-top: 12px;">
            ID Transacción: ${timestamp} <br>
            Si no puedes asistir, recuerda cancelar tu reservación desde la plataforma.
          </p>
        </div>
      </div>
    `;

    const randomSuffix = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    
    await this.transporter.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: datos.destinatario,
      subject: `Tu boleto: ${datos.nombreSubEvento} [Folio #${datos.idBoleto}-${randomSuffix}]`,
      html,
      attachments,
    });

    this.logger.log(`Correo con PDF enviado a ${datos.destinatario} (Boleto #${datos.idBoleto})`);
  }

  async enviarNotificacionCambioRecinto(datos: {
    destinatario: string;
    nombreAsistente: string;
    nombreEvento: string;
    nombreSubEvento: string;
    nuevoRecinto: string;
    fecha: string;
    horaInicio: string;
    horaFin: string;
  }): Promise<void> {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
        <div style="background-color: #6b1d2f; color: #ffffff; padding: 20px; text-align: center;">
          <h2 style="margin: 0;">Actualización de Recinto - EventOS</h2>
        </div>
        
        <div style="padding: 24px; color: #334155;">
          <p>Hola <strong>${datos.nombreAsistente}</strong>,</p>
          <p>Te informamos que la logística del evento <strong>${datos.nombreEvento}</strong> ha sido actualizada. La actividad en la que estás inscrito ha sido reubicada de espacio físico:</p>
          
          <table style="width: 100%; border-collapse: collapse; margin-top: 16px; background-color: #f8fafc; border-radius: 8px; padding: 12px;">
            <tr><td style="padding: 8px 12px; font-weight: bold;">Actividad:</td><td style="padding: 8px 12px;">${datos.nombreSubEvento}</td></tr>
            <tr><td style="padding: 8px 12px; font-weight: bold;">Nuevo Recinto:</td><td style="padding: 8px 12px;"><strong>${datos.nuevoRecinto}</strong></td></tr>
            <tr><td style="padding: 8px 12px; font-weight: bold;">Horario:</td><td style="padding: 8px 12px;">${datos.fecha} (${datos.horaInicio} - ${datos.horaFin})</td></tr>
            <tr><td style="padding: 8px 12px; font-weight: bold;">Modalidad:</td><td style="padding: 8px 12px;">Entrada General (Asiento libre al ingresar)</td></tr>
          </table>

          <p style="margin-top: 20px; padding: 12px; background-color: #eff6ff; border-left: 4px solid #3b82f6; border-radius: 4px; font-size: 14px; color: #1e40af;">
            <strong>Nota importante:</strong> Tu boleto digital continúa <strong>100% activo y válido</strong> con el mismo código QR. Debido a la reubicación, tu acceso será bajo la modalidad de admisión general sin butaca numerada específica.
          </p>

          <p style="font-size: 12px; color: #64748b; margin-top: 24px; border-top: 1px solid #e2e8f0; padding-top: 12px;">
            Puedes consultar tus boletos vigentes en la sección "Mis Boletos" dentro de EventOS.
          </p>
        </div>
      </div>
    `;

    try {
      await this.transporter.sendMail({
        from: process.env.SMTP_FROM || process.env.SMTP_USER,
        to: datos.destinatario,
        subject: `Reubicación de espacio: ${datos.nombreSubEvento} - EventOS`,
        html,
      });
      this.logger.log(`Aviso de cambio de recinto enviado a ${datos.destinatario}`);
    } catch (error) {
      this.logger.error(`Fallo al enviar notificación de cambio de recinto a ${datos.destinatario}`, error);
    }
  }

  async enviarInvitacionLogistica(datos: {
    destinatario: string;
    nombreEvento: string;
    organizador: string;
    enlaceActivacion: string;
  }): Promise<void> {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
        <div style="background-color: #6b1d2f; color: #ffffff; padding: 20px; text-align: center;">
          <h2 style="margin: 0;">Invitación a Personal de Logística - EventOS</h2>
        </div>
        
        <div style="padding: 24px; color: #334155;">
          <p>Hola,</p>
          <p>El organizador <strong>${datos.organizador}</strong> te ha invitado a formar parte del <strong>Personal de Logística</strong> para el evento institucional:</p>
          
          <div style="margin: 20px 0; padding: 16px; background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; text-align: center;">
            <h3 style="margin: 0; color: #6b1d2f; font-size: 18px;">${datos.nombreEvento}</h3>
          </div>

          <p>Como colaborador de logística, podrás validar los accesos de los asistentes mediante escaneo de código QR durante la realización de las actividades.</p>

          <div style="text-align: center; margin: 32px 0;">
            <a href="${datos.enlaceActivacion}" style="background-color: #6b1d2f; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; display: inline-block;">
              Activar mi cuenta y unirme al equipo
            </a>
          </div>

          <p style="font-size: 13px; color: #dc2626; text-align: center;">
            * Este enlace es de un solo uso y expirará en <strong>48 horas naturales</strong>.
          </p>

          <p style="font-size: 12px; color: #64748b; margin-top: 24px; border-top: 1px solid #e2e8f0; padding-top: 12px;">
            Si no reconoces esta invitación, puedes ignorar este mensaje con seguridad.
          </p>
        </div>
      </div>
    `;

    try {
      await this.transporter.sendMail({
        from: process.env.SMTP_FROM || process.env.SMTP_USER,
        to: datos.destinatario,
        subject: `Invitación al Personal de Logística: ${datos.nombreEvento} - EventOS`,
        html,
      });
      this.logger.log(`Invitación de logística enviada a ${datos.destinatario}`);
    } catch (error) {
      this.logger.error(`Fallo al enviar invitación de logística a ${datos.destinatario}`, error);
    }
  }

  async enviarConfirmacionAsignacionLogistica(datos: {
    destinatario: string;
    nombreUsuario: string;
    nombreEvento: string;
  }): Promise<void> {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
        <div style="background-color: #6b1d2f; color: #ffffff; padding: 20px; text-align: center;">
          <h2 style="margin: 0;">Asignación a Personal de Logística - EventOS</h2>
        </div>
        
        <div style="padding: 24px; color: #334155;">
          <p>Hola <strong>${datos.nombreUsuario}</strong>,</p>
          <p>Te confirmamos que has sido asignado como <strong>Personal de Logística</strong> para el evento:</p>
          
          <div style="margin: 20px 0; padding: 16px; background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; text-align: center;">
            <h3 style="margin: 0; color: #6b1d2f; font-size: 18px;">${datos.nombreEvento}</h3>
          </div>

          <p>Ya puedes consultar las actividades programadas en tu panel de eventos asignados y utilizar el escáner QR de acceso durante la fecha del evento.</p>

          <p style="font-size: 12px; color: #64748b; margin-top: 24px; border-top: 1px solid #e2e8f0; padding-top: 12px;">
            EventOS — Escuela Superior de Cómputo (IPN).
          </p>
        </div>
      </div>
    `;

    try {
      await this.transporter.sendMail({
        from: process.env.SMTP_FROM || process.env.SMTP_USER,
        to: datos.destinatario,
        subject: `Asignación a Personal de Logística: ${datos.nombreEvento} - EventOS`,
        html,
      });
      this.logger.log(`Confirmación de asignación enviada a ${datos.destinatario}`);
    } catch (error) {
      this.logger.error(`Fallo al enviar confirmación de asignación a ${datos.destinatario}`, error);
    }
  }

  async enviarNotificacionOrganizadorLogisticaAceptada(datos: {
    destinatario: string;
    nombreOrganizador: string;
    nombreColaborador: string;
    correoColaborador: string;
    nombreEvento: string;
  }): Promise<void> {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
        <div style="background-color: #6b1d2f; color: #ffffff; padding: 20px; text-align: center;">
          <h2 style="margin: 0;">Nuevo Integrante de Logística - EventOS</h2>
        </div>
        
        <div style="padding: 24px; color: #334155;">
          <p>Hola <strong>${datos.nombreOrganizador}</strong>,</p>
          <p>Te informamos que un colaborador ha aceptado la invitación y activado su cuenta como <strong>Personal de Logística</strong> para tu evento:</p>
          
          <div style="margin: 20px 0; padding: 16px; background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px;">
            <p style="margin: 0 0 8px 0;"><strong>Evento:</strong> ${datos.nombreEvento}</p>
            <p style="margin: 0 0 8px 0;"><strong>Colaborador:</strong> ${datos.nombreColaborador}</p>
            <p style="margin: 0;"><strong>Correo:</strong> ${datos.correoColaborador}</p>
          </div>

          <p>El colaborador ya cuenta con acceso para escanear boletos y validar entradas en las actividades programadas de tu evento.</p>

          <p style="font-size: 12px; color: #64748b; margin-top: 24px; border-top: 1px solid #e2e8f0; padding-top: 12px;">
            Puedes gestionar y consultar a tu equipo de logística en cualquier momento desde el panel de administración del evento.
          </p>
        </div>
      </div>
    `;

    try {
      await this.transporter.sendMail({
        from: process.env.SMTP_FROM || process.env.SMTP_USER,
        to: datos.destinatario,
        subject: `Nuevo integrante de logística confirmado: ${datos.nombreEvento} - EventOS`,
        html,
      });
      this.logger.log(`Notificación enviada al organizador ${datos.destinatario}`);
    } catch (error) {
      this.logger.error(`Fallo al enviar notificación al organizador ${datos.destinatario}`, error);
    }
  }
}
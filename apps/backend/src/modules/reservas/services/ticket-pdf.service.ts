import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EstadoBoleto } from '@eventos/shared';
import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from 'pdf-lib';
import { Repository } from 'typeorm';
import { UsuarioEntity } from '../../auth/entities/usuario.entity';
import { ReservationsService } from './reservations.service';

const safeText = (text: string) =>
  text.normalize('NFC').replace(/[^\u0020-\u007e\u00a0-\u00ff]/g, '?');

function drawLines(page: PDFPage, font: PDFFont, value: string, x: number, y: number, maxWidth: number, size: number, limit: number): number {
  const words = safeText(value).split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let current = '';
  for (const word of words) {
    const attempt = current ? `${current} ${word}` : word;
    if (font.widthOfTextAtSize(attempt, size) <= maxWidth) {
      current = attempt;
      continue;
    }
    if (current) lines.push(current);
    current = '';
    for (const char of word) {
      if (font.widthOfTextAtSize(current + char, size) > maxWidth && current) {
        lines.push(current);
        current = '';
      }
      current += char;
    }
  }
  if (current) lines.push(current);
  if (lines.length === 0) lines.push('-');
  const truncated = lines.length > limit;
  for (const [index, original] of lines.slice(0, limit).entries()) {
    let line = original;
    if (truncated && index === limit - 1) {
      while (font.widthOfTextAtSize(line + '...', size) > maxWidth && line) {
        line = line.slice(0, -1);
      }
      line += '...';
    }
    page.drawText(line, { x, y: y - index * (size + 4), size, font, color: rgb(0.14, 0.18, 0.23) });
  }
  return y - Math.min(lines.length, limit) * (size + 4);
}

@Injectable()
export class TicketPdfService {
  constructor(
    private readonly reservationsService: ReservationsService,
    @InjectRepository(UsuarioEntity)
    private readonly usuarioRepo: Repository<UsuarioEntity>,
  ) {}

  async generar(idUsuario: number, idBoleto: number): Promise<Uint8Array> {
    const detalle = await this.reservationsService.obtenerDetalleBoleto(idUsuario, idBoleto);
    if (detalle.estadoBoleto !== EstadoBoleto.VALIDO) {
      throw new ConflictException('Solo se pueden descargar boletos activos.');
    }

    const prefix = 'data:image/png;base64,';
    if (typeof detalle.qr !== 'string' || !detalle.qr.startsWith(prefix)) {
      throw new ConflictException('El boleto no tiene un código QR disponible.');
    }

    const usuario = await this.usuarioRepo.findOne({ where: { idUsuario } });
    if (!usuario) throw new NotFoundException('Usuario no encontrado.');
    const nombre = [usuario.nombre, usuario.apellidoPa, usuario.apellidoMa].filter(Boolean).join(' ');
    const fecha = detalle.subEvento.fecha.split('T')[0].split('-');
    const fechaVisible = fecha.length === 3 ? `${fecha[2]}/${fecha[1]}/${fecha[0]}` : detalle.subEvento.fecha;
    const horario = `${detalle.subEvento.horaInicio.slice(0, 5)} - ${detalle.subEvento.horaFin.slice(0, 5)} hrs`;
    const asignacion = detalle.asiento ? `Asiento ${detalle.asiento.fila}${detalle.asiento.numero}` : 'Acceso general';
    const documento = await PDFDocument.create();
    documento.setTitle(`EventOS - Boleto ${idBoleto}`);
    documento.setAuthor('EventOS');
    documento.setSubject('Boleto digital para evento');
    const pagina = documento.addPage([595, 842]);
    const fuente = await documento.embedFont(StandardFonts.Helvetica);
    const negrita = await documento.embedFont(StandardFonts.HelveticaBold);
    const guinda = rgb(0.38, 0.10, 0.23);
    const gris = rgb(0.35, 0.39, 0.43);
    pagina.drawRectangle({ x: 0, y: 768, width: 595, height: 74, color: guinda });
    pagina.drawText('Event-Os', { x: 42, y: 797, size: 23, font: negrita, color: rgb(1, 1, 1) });
    pagina.drawText('Boleto Digital', { x: 42, y: 709, size: 27, font: negrita, color: rgb(0.13, 0.15, 0.2) });
    pagina.drawRectangle({ x: 40, y: 238, width: 515, height: 425, borderColor: rgb(0.8, 0.82, 0.84), borderWidth: 1 });
    pagina.drawText(`Boleto #${idBoleto}`, { x: 59, y: 635, size: 11, font: fuente, color: gris });
    let y = 601;
    const field = (label: string, value: string, lineLimit: number = 2) => {
      pagina.drawText(label, { x: 59, y, size: 10, font: negrita, color: gris });
      y = drawLines(pagina, fuente, value, 59, y - 19, 246, 12, lineLimit) - 6;
    };
    field('Evento', detalle.evento.nombre);
    field('Actividad', detalle.subEvento.nombre);
    field('Asistente', nombre);
    field('Fecha', fechaVisible, 1);
    field('Horario', horario, 1);
    field('Recinto', detalle.recinto.nombre);
    field('Lugar asignado', asignacion, 1);
    const qr = await documento.embedPng(Buffer.from(detalle.qr.slice(prefix.length), 'base64'));
    pagina.drawImage(qr, { x: 331, y: 384, width: 205, height: 205 });
    pagina.drawText('Presenta este QR en el acceso', { x: 344, y: 366, size: 9, font: fuente, color: gris });
    pagina.drawText('ESTADO: ACTIVO', { x: 59, y: 250, size: 11, font: negrita, color: guinda });
    pagina.drawText('Válido únicamente para la actividad indicada. No compartas tu código de acceso.', {
      x: 42, y: 203, size: 9, font: fuente, color: gris,
    });
    return documento.save();
  }
}

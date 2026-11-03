import { Injectable, NotFoundException, ConflictException, ForbiddenException, BadRequestException, Logger } from '@nestjs/common';
import { QrService } from './qr.service';
import { MailService } from './mail.service';
import { CreateReservationDto } from '../dto/createReservation.dto';
import { Repository, In, DataSource } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';

import { DisponibilidadSubEvento, AsientoDisponible, EstadoRecinto, EstadoBoleto, EstadoSubEvento, ModalidadAcceso, AlcanceEvento } from '@eventos/shared';

import { BoletoEntity } from '../entities/boleto.entity';
import { AsistenteEventoEntity } from '../entities/asistenteEvento.entity';
import { ReservaHistorialEntity } from '../entities/reservaHistorial.entity';
import { SubEventoEntity } from '../../eventos/entities/subevento.entity';
import { RecintoEntity } from '../../recintos/entities/recinto.entity';
import { AsientoEntity } from '../entities/asiento.entity';
import { FechaEntity } from '../../eventos/entities/fecha.entity';
import { EventoEntity } from '../../eventos/entities/evento.entity';
import { EventoPersonalLogisticaEntity } from '../../eventos/entities/eventoPersonalLogistica.entity';
import { PonenteEntity } from '../../eventos/entities/ponente.entity';
import { UsuarioEntity } from '../../auth/entities/usuario.entity';
import { Mail } from 'nodemailer';

@Injectable()
export class ReservationsService {

    private readonly logger = new Logger(ReservationsService.name);
  
    constructor(
        private dataSource: DataSource,
        private readonly qrService: QrService,
        private readonly mailService : MailService, 
        @InjectRepository(UsuarioEntity) private usuarioRepo: Repository<UsuarioEntity>,
        @InjectRepository(EventoEntity) private eventoRepo: Repository<EventoEntity>,
        @InjectRepository(SubEventoEntity) private subEventoRepo: Repository<SubEventoEntity>,
        @InjectRepository(RecintoEntity) private recintoRepo: Repository<RecintoEntity>,
        @InjectRepository(AsientoEntity) private asientoRepo: Repository<AsientoEntity>,
        @InjectRepository(BoletoEntity) private boletoRepo: Repository<BoletoEntity>,
        @InjectRepository(AsistenteEventoEntity) private asistenteRepo: Repository<AsistenteEventoEntity>,
        @InjectRepository(ReservaHistorialEntity) private historialRepo: Repository<ReservaHistorialEntity>,
        @InjectRepository(FechaEntity) private fechaRepo: Repository<FechaEntity>,
        @InjectRepository(PonenteEntity) private ponenteRepo: Repository<PonenteEntity>,
        @InjectRepository(EventoPersonalLogisticaEntity) private logisticaRepo: Repository<EventoPersonalLogisticaEntity>,
    ) {}

    //CONSULTAR DISPONIBILIDAD

    async consultarDisponibilidad(idSubEvento: number): Promise<any> {
        const subEvento = await this.subEventoRepo.findOne({ 
            where: { idSubEvento: idSubEvento } 
        });
        
        if (!subEvento) {
            throw new NotFoundException('El subevento solicitado no existe.');
        }

        const evento = await this.eventoRepo.findOne({
            where: { idEvento: subEvento.idEvento }
        });

        if (!evento || evento.idAlcance === AlcanceEvento.PRIVADO) {
            throw new NotFoundException('El subevento solicitado no existe.');
        }

        const fechaEvento = await this.fechaRepo.findOne({
            where: { idFecha: subEvento.idFecha }
        });

        const recinto = await this.recintoRepo.findOne({ 
            where: { idRecinto: subEvento.idRecinto } 
        });

        if (!recinto) {
            throw new ConflictException('El subevento no tiene un recinto asignado en la base de datos.');
        }

        if (recinto.idEstadoRecinto !== EstadoRecinto.HABILITADO) {
            throw new ConflictException('El recinto asignado a este evento no se encuentra habilitado.');
        }

        const asistentes = await this.asistenteRepo.find({ 
            where: { idSubEvento: idSubEvento } 
        });
        
        const idsBoleto = asistentes.map(a => a.idBoleto).filter(id => id !== null);

        let lugaresOcupados = 0;
        const idsAsientosOcupados = new Set<number>();

        if (idsBoleto.length > 0) {
            const boletos = await this.boletoRepo.findBy({ idBoleto: In(idsBoleto) });

            for (const boleto of boletos) {
                if (boleto.idEstadoBoleto === EstadoBoleto.VALIDO || boleto.idEstadoBoleto === EstadoBoleto.UTILIZADO) {
                    lugaresOcupados++;
                    if (boleto.idAsiento !== null) {
                        idsAsientosOcupados.add(boleto.idAsiento);
                    }
                }
            }
        }

        // Verificar si la actividad permite reservaciones (Evento Aceptado = 2, SubEvento Aceptado y Fecha futura)
        const limiteReserva = fechaEvento ? new Date(`${fechaEvento.fecha}T${fechaEvento.horaInicio}`) : new Date(0);
        const eventoActivo = evento && evento.idEstadoEvento === 2 && subEvento.estado === EstadoSubEvento.ACEPTADO && new Date() <= limiteReserva;

        const asientosBD = await this.asientoRepo.find({
            where: { idRecinto: recinto.idRecinto }
        });

        const requiereSeleccionAsiento = asientosBD.length > 0;
        const cuposPorAforo = Math.max(0, recinto.aforo - lugaresOcupados);
        const asientosLibres = asientosBD.filter(
            (asiento) => !idsAsientosOcupados.has(asiento.idAsiento),
        ).length;
        const lugaresDisponibles = eventoActivo
            ? requiereSeleccionAsiento
                ? Math.min(cuposPorAforo, asientosLibres)
                : cuposPorAforo
            : 0;

        const asientos: AsientoDisponible[] = asientosBD.map(a => ({
            idAsiento: a.idAsiento,
            fila: a.fila,
            numero: a.numero,
            ocupado: !eventoActivo ? true : idsAsientosOcupados.has(a.idAsiento),
        }));

        return {
            idSubEvento: subEvento.idSubEvento,
            recinto: recinto,
            lugaresDisponibles,
            permiteReservar: Boolean(eventoActivo && lugaresDisponibles > 0 && subEvento.modalidadAcceso === ModalidadAcceso.CON_RESERVACION),
            requiereSeleccionAsiento,
            asientos,
        };
    }


    //CREAR RESERVA

    //logica de negocio para crear reserva

    async crearReserva(idUsuario: number, dto: CreateReservationDto): Promise<{ mensaje: string, boleto: any, qr?: string }>{
        // Obtener datos del usuario
        const usuario = await this.usuarioRepo.findOne({ where: { idUsuario } });
        if (!usuario) {
            throw new NotFoundException('El usuario especificado no existe.');
        }

        // Transaccion atómica
        const resultado = await this.dataSource.transaction(async (manager) => {
            
            // Verificar existencia y cierre de registro 
            const subEvento = await manager.findOne(SubEventoEntity, { 
                where: { idSubEvento: dto.idSubEvento },
                lock: { mode: 'pessimistic_write' } 
            });
            
            if (!subEvento) {
                throw new NotFoundException('El subevento no existe');
            }

            if (subEvento.modalidadAcceso === ModalidadAcceso.ENTRADA_LIBRE) {
                throw new ConflictException('Esta actividad es de entrada libre y no necesita reservación.');
            }

            if (subEvento.estado !== EstadoSubEvento.ACEPTADO) {
                throw new ConflictException('El registro para este evento se encuentra cerrado o cancelado');
            }

            const eventoPrincipal = await manager.findOne(EventoEntity, {
                where: { idEvento: subEvento.idEvento }
            });

            if (!eventoPrincipal || eventoPrincipal.idEstadoEvento !== 2) {
                throw new ConflictException('El evento principal no se encuentra autorizado o activo para reservaciones.');
            }

            if (eventoPrincipal.idAlcance === AlcanceEvento.PRIVADO) {
                throw new ForbiddenException('Este evento requiere una invitación válida para reservar.');
            }

            const fechaEvento = await manager.findOne(FechaEntity, { 
                where: { idFecha: subEvento.idFecha } 
            });
            
            if (!fechaEvento) {
                throw new ConflictException('El evento no tiene una fecha asignada en la base de datos.');
            }

            const limiteReserva = new Date(`${fechaEvento.fecha}T${fechaEvento.horaInicio}`);
            
            if (new Date() > limiteReserva) {
                throw new ConflictException('El tiempo límite para registrarse a este evento ha terminado.');
            }

            // Verificar que el usuario no sea Personal de Logistica
            const esLogistica = await manager.findOne(EventoPersonalLogisticaEntity, {
                where: { idEvento: subEvento.idEvento, idUsuario: idUsuario }
            });
            
            if (esLogistica) {
                throw new ForbiddenException('El personal de logística asignado no puede reservar boletos como asistente.');
            }

            // Verificar que no exista reserva activa previa
            const reservasEvento = await manager.find(AsistenteEventoEntity, {
                where: { idSubEvento: dto.idSubEvento, idUsuario: idUsuario }
            });

            for (const reserva of reservasEvento) {
                if (reserva.idBoleto) {
                    const boletoAsociado = await manager.findOne(BoletoEntity, { 
                        where: { idBoleto: reserva.idBoleto } 
                    });
                    
                    if (boletoAsociado && (boletoAsociado.idEstadoBoleto === EstadoBoleto.VALIDO || boletoAsociado.idEstadoBoleto === EstadoBoleto.UTILIZADO)) {
                        throw new ConflictException('Ya cuentas con una reserva activa para este evento.');
                    }
                }
            }

            // Verificar Aforo y Butaca
            const recinto = await manager.findOne(RecintoEntity, { 
                where: { idRecinto: subEvento.idRecinto } 
            });
            
            if (!recinto || recinto.idEstadoRecinto !== EstadoRecinto.HABILITADO) {
                throw new ConflictException('El recinto del evento no está disponible.');
            }
            
            const asientosDelRecinto = await manager.find(AsientoEntity, {
                where: { idRecinto: recinto.idRecinto }
            });
            const requiereAsiento = asientosDelRecinto.length > 0;

            if (requiereAsiento && !dto.idAsiento) {
                throw new BadRequestException('Esta actividad requiere que selecciones un asiento.');
            }

            if (!requiereAsiento && dto.idAsiento) {
                throw new BadRequestException('Esta actividad es de entrada general y no utiliza asientos numerados.');
            }

            
            let asientoSeleccionado = null;
            if (dto.idAsiento) {
                asientoSeleccionado = asientosDelRecinto.find(a => a.idAsiento === dto.idAsiento);
                if (!asientoSeleccionado) {
                    throw new BadRequestException('El asiento seleccionado no pertenece al recinto asignado a este subevento.');
                }
            }

            // Verificar Aforo y Ocupación de Butaca solo en este SubEvento
            const asistentesAct = await manager.find(AsistenteEventoEntity, { 
                where: { idSubEvento: dto.idSubEvento } 
            });
            
            let lugaresOcupados = 0;
            const idsBoleto = asistentesAct.map(a => a.idBoleto).filter(id => id !== null);

            if (idsBoleto.length > 0) {
                const boletos = await manager.find(BoletoEntity, { 
                    where: { idBoleto: In(idsBoleto) } 
                });
                
                for (const b of boletos) {
                    if (b.idEstadoBoleto === EstadoBoleto.VALIDO || b.idEstadoBoleto === EstadoBoleto.UTILIZADO) {
                        lugaresOcupados++;
                        // Comprobación de asiento por subevento considerando VALIDO y UTILIZADO
                        if (dto.idAsiento && b.idAsiento === dto.idAsiento) {
                            throw new ConflictException('El asiento seleccionado ya se encuentra ocupado en esta actividad.');
                        }
                    }
                }
            }

            if (lugaresOcupados >= recinto.aforo) {
                throw new ConflictException('El aforo para este evento se ha agotado.');
            }

            // GENERACION DE QR Y GUARDADO
            const fechaFinEvento = new Date(`${fechaEvento.fecha}T${fechaEvento.horaFin}`);

            const boletoNuevoObj = manager.create(BoletoEntity, {
                tokenQr: '', 
                idAsiento: dto.idAsiento || null,
                idEstadoBoleto: EstadoBoleto.VALIDO
            });
            
            const boletoGuardado = await manager.save(BoletoEntity, boletoNuevoObj);

            const reservaExistente = await manager.findOne(AsistenteEventoEntity, {
                where: { idSubEvento: dto.idSubEvento, idUsuario: idUsuario }
            });

            if (reservaExistente) {
                reservaExistente.idBoleto = boletoGuardado.idBoleto;
                await manager.save(AsistenteEventoEntity, reservaExistente);
            } else {
                const intermedia = manager.create(AsistenteEventoEntity, {
                    idSubEvento: dto.idSubEvento,
                    idUsuario: idUsuario,
                    idBoleto: boletoGuardado.idBoleto
                });
                await manager.save(AsistenteEventoEntity, intermedia);
            }

            await manager.insert(ReservaHistorialEntity, {
                idBoleto: boletoGuardado.idBoleto,
                idSubEvento: dto.idSubEvento,
                idUsuario,
            });

            let qrBase64Data: string | undefined = undefined;

            if (subEvento.accesoQR) {
                const infoBoleto = {
                    idBoleto: boletoGuardado.idBoleto,
                    idEvento: subEvento.idEvento,
                    idUsuario: idUsuario
                };

                const { token, qrBase64 } = await this.qrService.generateQrCode(infoBoleto, fechaFinEvento);

                boletoGuardado.tokenQr = token;
                await manager.save(BoletoEntity, boletoGuardado);
                qrBase64Data = qrBase64;
            }

            // Empaquetado de la información requerida por Nodemailer y el controlador
            return {
                boleto: boletoGuardado,
                qrBase64: qrBase64Data,
                datosCorreo: {
                    idBoleto: boletoGuardado.idBoleto,
                    nombreEvento: eventoPrincipal.nombre,
                    nombreSubEvento: subEvento.nombre,
                    fecha: String(fechaEvento.fecha),
                    horaInicio: fechaEvento.horaInicio,
                    horaFin: fechaEvento.horaFin,
                    nombreRecinto: recinto.nombre,
                    asiento: asientoSeleccionado ? { fila: asientoSeleccionado.fila, numero: asientoSeleccionado.numero } : null,
                    qrBase64: qrBase64Data
                }
            };
        }); 

        // Envío del correo
        try {
            const nombreCompleto = `${usuario.nombre} ${usuario.apellidoPa}${usuario.apellidoMa ? ' ' + usuario.apellidoMa : ''}`;
            await this.mailService.enviarCorreoConfirmacionReserva({
                destinatario: usuario.correo,
                nombreAsistente: nombreCompleto,
                ...resultado.datosCorreo
            });
        } catch (error) {
            this.logger.error(`La reserva #${resultado.boleto.idBoleto} se guardó, pero falló el envío del correo:`, error);
        }

        // Retorno HTTP original para el Frontend
        if (resultado.qrBase64) {
            return {
                mensaje: 'Reserva creada exitosamente',
                boleto: resultado.boleto,
                qr: resultado.qrBase64 
            };
        }

        return {
            mensaje: 'Reserva creada exitosamente sin necesidad de QR',
            boleto: resultado.boleto,
        };
    }

    //CONSULTAR MIS EVENTOS

    async obtenerMisBoletos(idUsuario: number) {
        const reservas = await this.historialRepo.find({
            where: { idUsuario },
            order: { idBoleto: 'DESC' },
        });

        const idsSubEventos = [...new Set(reservas.map((reserva) => reserva.idSubEvento))];
        const ponentes = idsSubEventos.length > 0
            ? await this.ponenteRepo.find({ where: { idSubEvento: In(idsSubEventos) } })
            : [];
        const ponentesPorActividad = new Map<number, string[]>();
        for (const ponente of ponentes) {
            const nombreCompleto = [ponente.nombre, ponente.apellidoPa, ponente.apellidoMa]
                .filter(Boolean)
                .join(' ');
            const lista = ponentesPorActividad.get(ponente.idSubEvento) ?? [];
            lista.push(nombreCompleto);
            ponentesPorActividad.set(ponente.idSubEvento, lista);
        }
        const misBoletos = [];

        for (const reserva of reservas) {
            if (!reserva.idBoleto) continue;

            const boleto = await this.boletoRepo.findOne({ where: { idBoleto: reserva.idBoleto } });
            if (!boleto) continue;

            const subEvento = await this.subEventoRepo.findOne({ where: { idSubEvento: reserva.idSubEvento } });
            if (!subEvento) continue; 

            const fechaEvento = await this.fechaRepo.findOne({ where: { idFecha: subEvento.idFecha } });
            if (!fechaEvento) continue; 
            
            const limiteTerminoEvento = new Date(`${fechaEvento.fecha}T${fechaEvento.horaFin}`);
            
            if (new Date() > limiteTerminoEvento && boleto.idEstadoBoleto === EstadoBoleto.VALIDO) {
                boleto.idEstadoBoleto = EstadoBoleto.CANCELADO;
                await this.boletoRepo.save(boleto);
            }

            const evento = await this.eventoRepo.findOne({ where: { idEvento: subEvento.idEvento } });
            const recinto = await this.recintoRepo.findOne({ where: { idRecinto: subEvento.idRecinto } });

            misBoletos.push({
                idBoleto: boleto.idBoleto,
                idSubEvento: subEvento.idSubEvento,
                idEvento: subEvento.idEvento,
                nombreEvento: evento ? evento.nombre : '',
                poster: evento?.poster ?? null,
                idAlcance: evento?.idAlcance ?? null,
                nombreSubEvento: subEvento.nombre,
                ponentes: ponentesPorActividad.get(subEvento.idSubEvento) ?? [],
                accesoQR: subEvento.accesoQR,
                estadoBoleto: boleto.idEstadoBoleto,
                fecha: fechaEvento.fecha,
                horaInicio: fechaEvento.horaInicio,
                horaFin: fechaEvento.horaFin,
                recinto: recinto ? recinto.nombre : '',
            });
        }

        return misBoletos;
    }

    //DETALLE DEL BOLETO Y QR

    async obtenerDetalleBoleto(idUsuario: number, idBoleto: number) {
        const reserva = await this.historialRepo.findOne({
            where: { idUsuario, idBoleto },
        });

        if (!reserva) {
            throw new NotFoundException('No se encontró una reserva asociada a este boleto para el usuario actual.');
        }

        const boleto = await this.boletoRepo.findOne({ where: { idBoleto: idBoleto } });
        if (!boleto) throw new NotFoundException('Boleto no encontrado.');

        const subEvento = await this.subEventoRepo.findOne({ where: { idSubEvento: reserva.idSubEvento } });
        if (!subEvento) throw new NotFoundException('SubEvento asociado no encontrado.'); 

        const fechaEvento = await this.fechaRepo.findOne({ where: { idFecha: subEvento.idFecha } });
        if (!fechaEvento) throw new NotFoundException('Fecha del evento no encontrada.'); 

        const recinto = await this.recintoRepo.findOne({ where: { idRecinto: subEvento.idRecinto } });
        if (!recinto) throw new NotFoundException('Recinto no encontrado.'); 

        const limiteTerminoEvento = new Date(`${fechaEvento.fecha}T${fechaEvento.horaFin}`);
        if (new Date() > limiteTerminoEvento && boleto.idEstadoBoleto === EstadoBoleto.VALIDO) {
            boleto.idEstadoBoleto = EstadoBoleto.CANCELADO;
            await this.boletoRepo.save(boleto);
        }

        let qrBase64 = null;
        if (boleto.tokenQr && boleto.tokenQr !== '') {
            qrBase64 = await this.qrService.generateImageFromToken(boleto.tokenQr);
        }

        let asientoDetalle = null;
        if (boleto.idAsiento) {
            const asiento = await this.asientoRepo.findOne({ where: { idAsiento: boleto.idAsiento } });
            if (asiento) {
                asientoDetalle = { fila: asiento.fila, numero: asiento.numero };
            }
        }

        const evento = await this.eventoRepo.findOne({ where: { idEvento: subEvento.idEvento } });

        return {
            idBoleto: boleto.idBoleto,
            estadoBoleto: boleto.idEstadoBoleto,
            qr: qrBase64,
            asiento: asientoDetalle,
            evento: {
                idEvento: subEvento.idEvento,
                nombre: evento ? evento.nombre : '',
            },
            subEvento: {
                idSubEvento: subEvento.idSubEvento,
                idEvento: subEvento.idEvento,
                nombre: subEvento.nombre,
                descripcion: subEvento.descripcion,
                accesoQR: subEvento.accesoQR,
                fecha: fechaEvento.fecha,
                horaInicio: fechaEvento.horaInicio,
                horaFin: fechaEvento.horaFin,
            },
            recinto: {
                idRecinto: recinto.idRecinto,
                nombre: recinto.nombre,
            }
        };
    }

    //CANCELACION LOGICA Y LIBERACION DEL LUGAR

    async cancelarReserva(idUsuario: number, idBoleto: number) {
        return this.dataSource.transaction(async (manager) => {
            const reservaReferencia = await manager.findOne(ReservaHistorialEntity, {
                where: { idUsuario, idBoleto },
            });

            if (!reservaReferencia) {
                throw new NotFoundException('No se encontró la reserva o no pertenece al usuario actual.');
            }

            const subEvento = await manager.findOne(SubEventoEntity, {
                where: { idSubEvento: reservaReferencia.idSubEvento },
                lock: { mode: 'pessimistic_write' },
            });

            if (!subEvento) {
                throw new NotFoundException('No se encontró la actividad asociada al boleto.');
            }

            const boleto = await manager.findOne(BoletoEntity, {
                where: { idBoleto },
                lock: { mode: 'pessimistic_write' },
            });

            if (!boleto) {
                throw new NotFoundException('El boleto no existe.');
            }

            if (boleto.idEstadoBoleto === EstadoBoleto.CANCELADO) {
                throw new ConflictException('Esta reserva ya se encontraba cancelada.');
            }

            if (boleto.idEstadoBoleto === EstadoBoleto.UTILIZADO) {
                throw new ConflictException('No puedes cancelar un boleto que ya fue escaneado en la entrada.');
            }

            const fechaEvento = await manager.findOne(FechaEntity, {
                where: { idFecha: subEvento.idFecha },
            });

            if (!fechaEvento) {
                throw new ConflictException('No se encontró la fecha de la actividad.');
            }

            const limiteCancelacion = new Date(`${fechaEvento.fecha}T${fechaEvento.horaInicio}`);
            if (new Date() > limiteCancelacion) {
                throw new ConflictException('El evento ya comenzó, el periodo de cancelación ha finalizado.');
            }

            boleto.idEstadoBoleto = EstadoBoleto.CANCELADO;
            await manager.save(BoletoEntity, boleto);

            return {
                mensaje: 'Reserva cancelada exitosamente. Tu lugar ha sido liberado.',
                boleto,
            };
        });
    }


}
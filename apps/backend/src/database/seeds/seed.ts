import pg from 'pg';
import bcrypt from 'bcrypt';
import {
  AlcanceEvento,
  EstadoEvento,
  EstadoSubEvento,
  EstadoVerificacion,
  RecintoId,
  TipoCuentaUsuario,
} from '@eventos/shared';

const { Client } = pg;

export async function runSeed() {
  const client = new Client({
    host: process.env.DB_HOST ?? 'localhost',
    port: Number(process.env.DB_PORT ?? 5433),
    user: process.env.DB_USER ?? 'postgres',
    password: process.env.DB_PASSWORD ?? 'postgres',
    database: process.env.DB_NAME ?? 'eventos',
  });

  try {
    await client.connect();
    console.log(`Conectado a PostgreSQL (${client.database}) para sembrar datos de prueba...`);

    const saltRounds = 10;
    const passwordHash = await bcrypt.hash('Admin123!', saltRounds);

    console.log('Creando usuarios de prueba...');

    // 1. Usuarios del sistema
    const usuarios = [
      {
        nombre: 'Claudia',
        apellidoPa: 'Mendoza',
        apellidoMa: 'García',
        correo: 'subdireccion@ipn.mx',
        contrasena: passwordHash,
        estatus: true,
        esVerificado: EstadoVerificacion.VERIFICADO,
        tipoCuenta: TipoCuentaUsuario.SUBDIRECCION,
        esJefeAcademia: false,
      },
      {
        nombre: 'Carlos',
        apellidoPa: 'Ramírez',
        apellidoMa: 'Hernández',
        correo: 'admin@ipn.mx',
        contrasena: passwordHash,
        estatus: true,
        esVerificado: EstadoVerificacion.VERIFICADO,
        tipoCuenta: TipoCuentaUsuario.ADMINISTRADOR,
        esJefeAcademia: false,
      },
      {
        nombre: 'Víctor',
        apellidoPa: 'Pérez',
        apellidoMa: 'López',
        correo: 'organizador@ipn.mx',
        contrasena: passwordHash,
        estatus: true,
        esVerificado: EstadoVerificacion.VERIFICADO,
        tipoCuenta: TipoCuentaUsuario.INTERNO,
        esJefeAcademia: false,
      },
      {
        nombre: 'Mariana',
        apellidoPa: 'Torres',
        apellidoMa: 'Salazar',
        correo: 'logistica1@ipn.mx',
        contrasena: passwordHash,
        estatus: true,
        esVerificado: EstadoVerificacion.VERIFICADO,
        tipoCuenta: TipoCuentaUsuario.INTERNO,
        esJefeAcademia: false,
      },
      {
        nombre: 'Jorge Alberto',
        apellidoPa: 'Rivas',
        apellidoMa: 'Cruz',
        correo: 'logistica2@ipn.mx',
        contrasena: passwordHash,
        estatus: true,
        esVerificado: EstadoVerificacion.VERIFICADO,
        tipoCuenta: TipoCuentaUsuario.INTERNO,
        esJefeAcademia: false,
      },
      {
        nombre: 'Ana Paula',
        apellidoPa: 'Gómez',
        apellidoMa: 'Luna',
        correo: 'estudiante@ipn.mx',
        contrasena: passwordHash,
        estatus: true,
        esVerificado: EstadoVerificacion.VERIFICADO,
        tipoCuenta: TipoCuentaUsuario.INTERNO,
        esJefeAcademia: false,
      },
      {
        nombre: 'Juan',
        apellidoPa: 'Pérez',
        apellidoMa: 'NoVerificado',
        correo: 'noverificado@ipn.mx',
        contrasena: passwordHash,
        estatus: true,
        esVerificado: EstadoVerificacion.NO_VERIFICADO,
        tipoCuenta: TipoCuentaUsuario.INTERNO,
        esJefeAcademia: false,
      },
    ];

    const idsUsuarios: Record<string, number> = {};

    for (const u of usuarios) {
      const res = await client.query(
        `INSERT INTO usuario (nombre, "apellidoPa", "apellidoMa", correo, contrasena, estatus, "esVerificado", "tipoCuenta", "esJefeAcademia")
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         ON CONFLICT (correo) DO UPDATE 
         SET contrasena = EXCLUDED.contrasena, 
             "tipoCuenta" = EXCLUDED."tipoCuenta", 
             "esVerificado" = EXCLUDED."esVerificado",
             estatus = EXCLUDED.estatus
         RETURNING "idUsuario", correo;`,
        [
          u.nombre,
          u.apellidoPa,
          u.apellidoMa,
          u.correo,
          u.contrasena,
          u.estatus,
          u.esVerificado,
          u.tipoCuenta,
          u.esJefeAcademia,
        ],
      );
      idsUsuarios[res.rows[0].correo] = res.rows[0].idUsuario;
      console.log(`   Usuario listo: ${u.correo} (ID: ${res.rows[0].idUsuario}, Rol: ${u.tipoCuenta})`);
    }

    // 2. Recintos Iniciales de ESCOM
    console.log('Creando recintos iniciales...');
    const recintos = [
      { id: 1, nombre: 'Auditorio Principal', aforo: 242, idEstadoRecinto: 1 },
      { id: 2, nombre: 'Laboratorio 2104', aforo: 36, idEstadoRecinto: 1 },
      { id: 3, nombre: 'Laboratorio 2105', aforo: 36, idEstadoRecinto: 1 },
      { id: 4, nombre: 'Sala 14', aforo: 50, idEstadoRecinto: 1 },
      { id: 5, nombre: 'Laboratorio 2106', aforo: 36, idEstadoRecinto: 1 },
      { id: 6, nombre: 'Laboratorio 2107', aforo: 36, idEstadoRecinto: 1 },
    ];

    for (const r of recintos) {
      await client.query(
        `INSERT INTO recinto ("idRecinto", nombre, aforo, "idEstadoRecinto")
         OVERRIDING SYSTEM VALUE
         VALUES ($1, $2, $3, $4)
         ON CONFLICT ("idRecinto") DO UPDATE 
         SET nombre = EXCLUDED.nombre, aforo = EXCLUDED.aforo;`,
        [r.id, r.nombre, r.aforo, r.idEstadoRecinto],
      );
    }

    console.log('Poblando asientos del Auditorio Principal (242 butacas)...');
    await client.query(`
      INSERT INTO asiento (fila, numero, "idRecinto")
      SELECT filas.fila, numeros.numero, 1
      FROM (VALUES ('A'),('B'),('C'),('D'),('E'),('F'),('G'),('H'),('I'),('J'),('K')) AS filas(fila)
      CROSS JOIN generate_series(1, 23) AS numeros(numero)
      WHERE (
        (filas.fila = 'A' AND numeros.numero IN (4, 5, 6, 9, 10, 11, 12, 13, 14, 15, 16, 18, 19, 20))
        OR (filas.fila = 'B' AND numeros.numero BETWEEN 2 AND 22)
        OR filas.fila NOT IN ('A', 'B')
      )
      AND NOT EXISTS (
        SELECT 1 FROM asiento a
        WHERE a."idRecinto" = 1 AND a.fila = filas.fila AND a.numero = numeros.numero
      );
    `);

    console.log('Poblando equipos/computadoras en estadoEquipo...');
    const laboratoriosIds = [2, 3, 5, 6];

    for (const recintoId of laboratoriosIds) {
      await client.query(`DELETE FROM "estadoEquipo" WHERE "idRecinto" = $1;`, [recintoId]);

      for (let i = 1; i <= 36; i++) {
        await client.query(
          `INSERT INTO "estadoEquipo" ("numeroEquipo", estado, "idRecinto") VALUES ($1, $2, $3);`,
          [i, true, recintoId],
        );
      }
      console.log(`   36 computadoras agregadas al recinto ID: ${recintoId}`);
    }

    // 3. Limpieza de eventos previos para mantener una semilla limpia e idempotente
    console.log('Limpiando eventos previos...');
    await client.query(`
      DELETE FROM "solicitudModificacion";
      DELETE FROM "eventoPersonalLogistica";
      DELETE FROM ponente;
      DELETE FROM "asistenteEvento";
      DELETE FROM "bitacoraEvento";
      DELETE FROM "subEvento";
      DELETE FROM fecha;
      DELETE FROM evento;
    `);

    // 4. Creación de Eventos de prueba completos
    console.log('Creando solicitudes y eventos de prueba con datos enriquecidos...');
    const organizadorId = idsUsuarios['organizador@ipn.mx'];

    interface PonenteSeed {
      nombre: string;
      apellidoPa: string;
      apellidoMa?: string;
      correo: string;
    }

    interface SubeventoSeed {
      nombre: string;
      descripcion: string;
      accesoQR: boolean;
      estado: EstadoSubEvento;
      idRecinto: number;
      fecha: string;
      horaInicio: string;
      horaFin: string;
      ponentes?: PonenteSeed[];
    }

    interface EventoSeed {
      nombre: string;
      descripcion: string;
      poster: string;
      justificacion: string;
      esUrgente: boolean;
      motivoUrgencia: string | null;
      motivoRechazo?: string | null;
      idAlcance: AlcanceEvento;
      idEstadoEvento: EstadoEvento;
      personalLogistica?: string[];
      solicitudModificacionPendiente?: {
        motivoModificacion: string;
        cambiosEnSubeventoIndice: number;
        nuevoRecinto: number;
        nuevaFecha: string;
        nuevaHoraInicio: string;
        nuevaHoraFin: string;
      };
      subeventos: SubeventoSeed[];
    }

    const eventosSeed: EventoSeed[] = [
      {
        nombre: 'Semana de la Inteligencia Artificial 2026',
        descripcion:
          'Ciclo de conferencias magistrales y talleres prácticos sobre IA generativa, redes neuronales profundas y robótica autónoma aplicada a la industria.',
        poster:
          'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=1200',
        justificacion:
          'Acercar las últimas innovaciones tecnológicas en Inteligencia Artificial a la comunidad estudiantil y docente de la ESCOM, fortaleciendo las competencias prácticas del nuevo plan de estudios.',
        esUrgente: false,
        motivoUrgencia: null,
        motivoRechazo: null,
        idAlcance: AlcanceEvento.PUBLICO,
        idEstadoEvento: EstadoEvento.ENPROCESO,
        personalLogistica: ['logistica1@ipn.mx', 'logistica2@ipn.mx'],
        subeventos: [
          {
            nombre: 'Conferencia Magistral: Modelos Fundacionales y Agentes Autónomos',
            descripcion:
              'Charla de apertura con investigadores invitados sobre arquitecturas Transformer y sistemas multi-agente.',
            accesoQR: true,
            estado: EstadoSubEvento.EN_PROCESO,
            idRecinto: RecintoId.AUDITORIO,
            fecha: '2026-11-25',
            horaInicio: '10:00:00',
            horaFin: '12:00:00',
            ponentes: [
              {
                nombre: 'Enrique',
                apellidoPa: 'Flores',
                apellidoMa: 'García',
                correo: 'efloresg@ipn.mx',
              },
              {
                nombre: 'Sofía',
                apellidoPa: 'Morales',
                apellidoMa: 'Garza',
                correo: 'smoralesg@unam.mx',
              },
            ],
          },
          {
            nombre: 'Taller Práctico: Fine-Tuning de LLMs en PyTorch',
            descripcion:
              'Sesión práctica de laboratorio para entrenar y optimizar modelos de lenguaje con LoRA y QLoRA.',
            accesoQR: true,
            estado: EstadoSubEvento.EN_PROCESO,
            idRecinto: RecintoId.LABORATORIO_A,
            fecha: '2026-11-26',
            horaInicio: '12:00:00',
            horaFin: '14:00:00',
            ponentes: [
              {
                nombre: 'Alejandro',
                apellidoPa: 'Durán',
                apellidoMa: 'Ruiz',
                correo: 'aduranr@ipn.mx',
              },
            ],
          },
          {
            nombre: 'Mesa Redonda: Ética, Regulación y Futuro de la IA en México',
            descripcion:
              'Debate abierto entre especialistas académicos e industriales sobre el impacto social de la IA.',
            accesoQR: false,
            estado: EstadoSubEvento.EN_PROCESO,
            idRecinto: RecintoId.SALA_14,
            fecha: '2026-11-27',
            horaInicio: '15:00:00',
            horaFin: '17:00:00',
            ponentes: [
              {
                nombre: 'Valeria',
                apellidoPa: 'Sánchez',
                apellidoMa: 'Molina',
                correo: 'vsanchez@cinvestav.mx',
              },
            ],
          },
        ],
      },
      {
        nombre: 'Simposio de Ciberseguridad y Criptografía Post-Cuántica',
        descripcion:
          'Encuentro especializado en seguridad ofensiva, análisis forense digital y preparación ante amenazas de cómputo cuántico en infraestructuras críticas.',
        poster:
          'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=1200',
        justificacion:
          'Fomentar la cultura de ciberseguridad y actualización técnica en protocolos criptográficos modernos para alumnos de Ingeniería en Sistemas Computacionales.',
        esUrgente: true,
        motivoUrgencia:
          'Se confirmó de último momento la visita internacional de los investigadores invitados del NIST y OWASP, quienes únicamente estarán en la Ciudad de México durante la próxima semana.',
        motivoRechazo: null,
        idAlcance: AlcanceEvento.PUBLICO,
        idEstadoEvento: EstadoEvento.ENPROCESO,
        personalLogistica: ['logistica1@ipn.mx'],
        subeventos: [
          {
            nombre: 'Keynote: Estándares de Criptografía Post-Cuántica (NIST)',
            descripcion:
              'Presentación de los nuevos algoritmos estandarizados basados en retículos y firmas digitales resistentes a cómputo cuántico.',
            accesoQR: true,
            estado: EstadoSubEvento.EN_PROCESO,
            idRecinto: RecintoId.AUDITORIO,
            fecha: '2026-11-12',
            horaInicio: '09:00:00',
            horaFin: '11:00:00',
            ponentes: [
              {
                nombre: 'Laura Elena',
                apellidoPa: 'Cárdenas',
                apellidoMa: 'Reyes',
                correo: 'lcardenas@owasp.org',
              },
            ],
          },
          {
            nombre: 'Laboratorio CTF: Pentesting y Explotación de Vulnerabilidades Web',
            descripcion:
              'Reto práctico tipo Capture The Flag enfocado en auditoría de aplicaciones y mitigación de OWASP Top 10.',
            accesoQR: true,
            estado: EstadoSubEvento.EN_PROCESO,
            idRecinto: RecintoId.LABORATORIO_B,
            fecha: '2026-11-13',
            horaInicio: '11:00:00',
            horaFin: '14:00:00',
            ponentes: [
              {
                nombre: 'Mauricio',
                apellidoPa: 'Zepeda',
                apellidoMa: 'Ortiz',
                correo: 'mzepeda@ipn.mx',
              },
            ],
          },
        ],
      },
      {
        nombre: 'Taller Intensivo de Compiladores con LLVM y Rust',
        descripcion:
          'Curso práctico intensivo sobre diseño de lenguajes de programación, generación de código intermedio (LLVM IR) y memoria segura con Rust.',
        poster:
          'https://images.unsplash.com/photo-1515879218367-8466d910aaa4?w=1200',
        justificacion:
          'Reforzar los conocimientos de las unidades de aprendizaje de Compiladores y Paradigmas de Programación mediante herramientas utilizadas en la industria.',
        esUrgente: false,
        motivoUrgencia: null,
        motivoRechazo: null,
        idAlcance: AlcanceEvento.INTERNO,
        idEstadoEvento: EstadoEvento.ACEPTADO,
        personalLogistica: ['logistica2@ipn.mx'],
        subeventos: [
          {
            nombre: 'Construcción de un Frontend Léxico/Sintáctico y Emisión de LLVM IR',
            descripcion:
              'Implementación paso a paso de un compilador funcional desde el análisis sintáctico hasta la optimización de código máquina.',
            accesoQR: true,
            estado: EstadoSubEvento.ACEPTADO,
            idRecinto: RecintoId.LABORATORIO_A,
            fecha: '2026-11-16',
            horaInicio: '10:00:00',
            horaFin: '13:00:00',
            ponentes: [
              {
                nombre: 'Roberto',
                apellidoPa: 'Galindo',
                apellidoMa: 'Vera',
                correo: 'rgalindov@ipn.mx',
              },
            ],
          },
        ],
      },
      {
        nombre: 'Jornada de Desarrollo de Videojuegos y Gráficos por Computadora',
        descripcion:
          'Exposición de proyectos estudiantiles, talleres de motores gráficos modernos y conferencias sobre shaders, ray tracing y física en tiempo real.',
        poster:
          'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=1200',
        justificacion:
          'Impulsar el desarrollo de software interactivo, simulación gráfica y trabajo multidisciplinario entre los estudiantes del Instituto Politécnico Nacional.',
        esUrgente: false,
        motivoUrgencia: null,
        motivoRechazo: null,
        idAlcance: AlcanceEvento.PUBLICO,
        idEstadoEvento: EstadoEvento.ACEPTADO,
        personalLogistica: ['logistica1@ipn.mx', 'logistica2@ipn.mx'],
        subeventos: [
          {
            nombre: 'Arquitectura de Motores Gráficos y Render Pipelines Modernos',
            descripcion:
              'Análisis técnico de Vulkan, DirectX 12 y técnicas de iluminación global en tiempo real.',
            accesoQR: true,
            estado: EstadoSubEvento.ACEPTADO,
            idRecinto: RecintoId.AUDITORIO,
            fecha: '2026-12-02',
            horaInicio: '13:00:00',
            horaFin: '15:00:00',
            ponentes: [
              {
                nombre: 'Héctor',
                apellidoPa: 'Navarro',
                apellidoMa: 'Puga',
                correo: 'hnavarrop@ipn.mx',
              },
            ],
          },
          {
            nombre: 'Taller de Programación de Shaders en GLSL y Unreal Engine',
            descripcion:
              'Creación de materiales procedurales y efectos visuales de post-procesamiento en laboratorio.',
            accesoQR: true,
            estado: EstadoSubEvento.ACEPTADO,
            idRecinto: RecintoId.LABORATORIO_B,
            fecha: '2026-12-03',
            horaInicio: '10:00:00',
            horaFin: '13:00:00',
            ponentes: [
              {
                nombre: 'Brenda',
                apellidoPa: 'Castillo',
                apellidoMa: 'Ramos',
                correo: 'bcastillor@ipn.mx',
              },
            ],
          },
          {
            nombre: 'Showcase y Demostración de Prototipos Indie Politécnicos',
            descripcion:
              'Sesión abierta de prueba de videojuegos desarrollados por alumnos y retroalimentación de estudios invitados.',
            accesoQR: false,
            estado: EstadoSubEvento.ACEPTADO,
            idRecinto: RecintoId.SALA_14,
            fecha: '2026-12-04',
            horaInicio: '14:00:00',
            horaFin: '17:00:00',
            ponentes: [
              {
                nombre: 'Héctor',
                apellidoPa: 'Navarro',
                apellidoMa: 'Puga',
                correo: 'hnavarrop@ipn.mx',
              },
            ],
          },
        ],
      },
      {
        nombre: 'Encuentro Politécnico de Ciencia de Datos y Big Data',
        descripcion:
          'Seminario sobre ingeniería de datos a gran escala, arquitecturas Lakehouse, procesamiento distribuido con Apache Spark y visualización avanzada.',
        poster:
          'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1200',
        justificacion:
          'Vincular a la comunidad politécnica con casos reales de ciencia de datos aplicada a finanzas, salud pública y movilidad urbana.',
        esUrgente: false,
        motivoUrgencia: null,
        motivoRechazo: null,
        idAlcance: AlcanceEvento.INTERNO,
        idEstadoEvento: EstadoEvento.ACEPTADO,
        personalLogistica: ['logistica1@ipn.mx'],
        solicitudModificacionPendiente: {
          motivoModificacion:
            'Se solicita cambio de horario y ampliación de recinto para el Taller de MLOps por confirmación de asistencia de delegaciones foráneas del IPN.',
          cambiosEnSubeventoIndice: 1,
          nuevoRecinto: RecintoId.AUDITORIO,
          nuevaFecha: '2026-12-09',
          nuevaHoraInicio: '14:00:00',
          nuevaHoraFin: '17:00:00',
        },
        subeventos: [
          {
            nombre: 'Pipelines de Datos en Tiempo Real con Kafka y Spark Streaming',
            descripcion:
              'Diseño de arquitecturas tolerantes a fallos para ingesta y análisis de millones de eventos por segundo.',
            accesoQR: true,
            estado: EstadoSubEvento.ACEPTADO,
            idRecinto: RecintoId.AUDITORIO,
            fecha: '2026-12-08',
            horaInicio: '11:00:00',
            horaFin: '13:00:00',
            ponentes: [
              {
                nombre: 'Guillermo',
                apellidoPa: 'Bautista',
                apellidoMa: 'Santana',
                correo: 'gbautistas@ipn.mx',
              },
            ],
          },
          {
            nombre: 'Taller de Modelado Predictivo y MLOps en la Nube',
            descripcion:
              'Automatización del ciclo de vida de modelos predictivos, versionado de datos y monitoreo en producción.',
            accesoQR: true,
            estado: EstadoSubEvento.ACEPTADO,
            idRecinto: RecintoId.SALA_14,
            fecha: '2026-12-09',
            horaInicio: '12:00:00',
            horaFin: '14:00:00',
            ponentes: [
              {
                nombre: 'Claudia',
                apellidoPa: 'Peralta',
                apellidoMa: 'Reyes',
                correo: 'cperaltar@ipn.mx',
              },
            ],
          },
        ],
      },
      {
        nombre: 'Congreso Metropolitano de Robótica y Automatización 2026',
        descripcion:
          'Encuentro intercolegial con demostraciones de robots velocistas, combate en arena y robots cooperativos industriales.',
        poster:
          'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=1200',
        justificacion:
          'Fomentar el desarrollo de prototipos mecatrónicos y sistemas de control embebido en los estudiantes de ingeniería.',
        esUrgente: false,
        motivoUrgencia: null,
        motivoRechazo:
          'Se rechaza la solicitud de espacio debido a que el Auditorio Principal y los laboratorios seleccionados ya se encuentran reservados por la Dirección para la aplicación del Examen Institucional CENEVAL.',
        idAlcance: AlcanceEvento.PUBLICO,
        idEstadoEvento: EstadoEvento.RECHAZADO,
        subeventos: [
          {
            nombre: 'Conferencia Inaugural: Avances en Cinemática Inversa y Robótica Burocrática',
            descripcion:
              'Demostración de algoritmos de navegación autónoma SLAM y control adaptativo en manipuladores industriales.',
            accesoQR: true,
            estado: EstadoSubEvento.RECHAZADO,
            idRecinto: RecintoId.AUDITORIO,
            fecha: '2026-11-20',
            horaInicio: '09:00:00',
            horaFin: '11:00:00',
            ponentes: [
              {
                nombre: 'Dr. Fernando',
                apellidoPa: 'Arámbula',
                apellidoMa: 'Cosío',
                correo: 'farambula@ipn.mx',
              },
            ],
          },
          {
            nombre: 'Torneo Abierto de Mini-Sumo y Guerra de Robots 1lb',
            descripcion:
              'Competencia abierta de combate robótico en arena homologada con jueces de la Federación Mexicana de Robótica.',
            accesoQR: false,
            estado: EstadoSubEvento.RECHAZADO,
            idRecinto: RecintoId.SALA_14,
            fecha: '2026-11-20',
            horaInicio: '12:00:00',
            horaFin: '16:00:00',
          },
        ],
      },
    ];

    for (const ev of eventosSeed) {
      const resEvento = await client.query(
        `INSERT INTO evento (nombre, descripcion, poster, justificacion, "esUrgente", "motivoUrgencia", "motivoRechazo", "idAlcance", "idEstadoEvento", "idOrganizador")
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
         RETURNING "idEvento";`,
        [
          ev.nombre,
          ev.descripcion,
          ev.poster,
          ev.justificacion,
          ev.esUrgente,
          ev.motivoUrgencia,
          ev.motivoRechazo ?? null,
          ev.idAlcance,
          ev.idEstadoEvento,
          organizadorId,
        ],
      );

      const idEvento = resEvento.rows[0].idEvento;
      console.log(
        `   Evento creado: "${ev.nombre}" (ID: ${idEvento}, Urgente: ${ev.esUrgente}, Estado: ${ev.idEstadoEvento}, Subeventos: ${ev.subeventos.length})`,
      );

      // Asignar personal de logística al evento
      if (ev.personalLogistica && ev.personalLogistica.length > 0) {
        for (const correoLogistica of ev.personalLogistica) {
          const idPersonal = idsUsuarios[correoLogistica];
          if (idPersonal) {
            await client.query(
              `INSERT INTO "eventoPersonalLogistica" ("idEvento", "idUsuario")
               VALUES ($1, $2)
               ON CONFLICT DO NOTHING;`,
              [idEvento, idPersonal],
            );
            console.log(`      -> Personal de logística asignado: ${correoLogistica} (ID Usuario: ${idPersonal})`);
          }
        }
      }

      const subeventosCreados: {
        idSubEvento: number;
        nombre: string;
        descripcion: string;
        idRecinto: number;
        accesoQR: boolean;
        fecha: string;
        horaInicio: string;
        horaFin: string;
      }[] = [];

      for (const sub of ev.subeventos) {
        const resFecha = await client.query(
          `INSERT INTO fecha (fecha, "horaInicio", "horaFin")
           VALUES ($1, $2, $3)
           RETURNING "idFecha";`,
          [sub.fecha, sub.horaInicio, sub.horaFin],
        );
        const idFecha = resFecha.rows[0].idFecha;

        const resSub = await client.query(
          `INSERT INTO "subEvento" ("accesoQR", estado, nombre, descripcion, "idEvento", "idRecinto", "idFecha")
           VALUES ($1, $2, $3, $4, $5, $6, $7)
           RETURNING "idSubEvento";`,
          [
            sub.accesoQR,
            sub.estado,
            sub.nombre,
            sub.descripcion,
            idEvento,
            sub.idRecinto,
            idFecha,
          ],
        );
        const idSubEvento = resSub.rows[0].idSubEvento;
        console.log(
          `      -> Subevento creado: "${sub.nombre}" (ID: ${idSubEvento}, Fecha: ${sub.fecha})`,
        );

        subeventosCreados.push({
          idSubEvento,
          nombre: sub.nombre,
          descripcion: sub.descripcion,
          idRecinto: sub.idRecinto,
          accesoQR: sub.accesoQR,
          fecha: sub.fecha,
          horaInicio: sub.horaInicio,
          horaFin: sub.horaFin,
        });

        // Registrar ponentes si están definidos
        if (sub.ponentes && sub.ponentes.length > 0) {
          for (const ponente of sub.ponentes) {
            await client.query(
              `INSERT INTO ponente (nombre, "apellidoPa", "apellidoMa", correo, "idSubEvento")
               VALUES ($1, $2, $3, $4, $5);`,
              [
                ponente.nombre,
                ponente.apellidoPa,
                ponente.apellidoMa ?? null,
                ponente.correo,
                idSubEvento,
              ],
            );
            console.log(
              `         -> Ponente: ${ponente.nombre} ${ponente.apellidoPa} (${ponente.correo})`,
            );
          }
        }
      }

      // Crear solicitud de modificación pendiente si fue configurada para el evento
      if (ev.solicitudModificacionPendiente && subeventosCreados.length > 0) {
        const configMod = ev.solicitudModificacionPendiente;
        const subeventosPropuestos = subeventosCreados.map((item, idx) => {
          if (idx === configMod.cambiosEnSubeventoIndice) {
            return {
              ...item,
              idRecinto: configMod.nuevoRecinto,
              fecha: configMod.nuevaFecha,
              horaInicio: configMod.nuevaHoraInicio,
              horaFin: configMod.nuevaHoraFin,
            };
          }
          return item;
        });

        await client.query(
          `INSERT INTO "solicitudModificacion" ("idEvento", "motivoModificacion", "subeventosPropuestos", estado)
           VALUES ($1, $2, $3, 'Pendiente');`,
          [
            idEvento,
            configMod.motivoModificacion,
            JSON.stringify(subeventosPropuestos),
          ],
        );
        console.log(
          `      -> Solicitud de Modificación Pendiente generada para el evento ID: ${idEvento}`,
        );
      }
    }

    console.log('\nSemillas de prueba insertadas con éxito.');
  } catch (error) {
    console.error('Error al sembrar datos de prueba:', error);
  } finally {
    await client.end();
  }
}

if (import.meta.main) {
  runSeed();
}

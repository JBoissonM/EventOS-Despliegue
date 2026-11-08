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

    // 1. Usuarios
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

    // 2. Recintos Iniciales de ESCOM (Actualizado sin computadoras disponibles)
    console.log('Creando recintos iniciales...');
    const recintos = [
      { id: 1, nombre: 'Auditorio Principal', aforo: 242, idEstadoRecinto: 1 },
      { id: 2, nombre: 'Laboratorio de Cómputo A', aforo: 36, idEstadoRecinto: 1 },
      { id: 3, nombre: 'Laboratorio de Cómputo B', aforo: 36, idEstadoRecinto: 1 },
      { id: 4, nombre: 'Sala 14', aforo: 50, idEstadoRecinto: 1 },
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
    const laboratoriosIds = [2, 3];

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

    // 3. Eventos de prueba (Pendientes con y sin urgencia, y Aprobados con múltiples subeventos)
    console.log('Creando solicitudes de eventos de prueba...');
    const organizadorId = idsUsuarios['organizador@ipn.mx'];

    const eventosSeed = [
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
        idAlcance: AlcanceEvento.PUBLICO,
        idEstadoEvento: EstadoEvento.ENPROCESO,
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
        idAlcance: AlcanceEvento.PUBLICO,
        idEstadoEvento: EstadoEvento.ENPROCESO,
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
        esUrgente: true,
        motivoUrgencia:
          'El taller sirve como preparación directa para la delegación representativa de ESCOM en el Hackatón Nacional de Sistemas, cuya fecha clasificatoria fue adelantada para este mes.',
        idAlcance: AlcanceEvento.INTERNO,
        idEstadoEvento: EstadoEvento.ENPROCESO,
        subeventos: [
          {
            nombre: 'Construcción de un Frontend Léxico/Sintáctico y Emisión de LLVM IR',
            descripcion:
              'Implementación paso a paso de un compilador funcional desde el análisis sintáctico hasta la optimización de código máquina.',
            accesoQR: true,
            estado: EstadoSubEvento.EN_PROCESO,
            idRecinto: RecintoId.LABORATORIO_A,
            fecha: '2026-11-16',
            horaInicio: '10:00:00',
            horaFin: '13:00:00',
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
        idAlcance: AlcanceEvento.PUBLICO,
        idEstadoEvento: EstadoEvento.ACEPTADO,
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
        idAlcance: AlcanceEvento.INTERNO,
        idEstadoEvento: EstadoEvento.ACEPTADO,
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
          },
        ],
      },
    ];

    for (const ev of eventosSeed) {
      const resEvento = await client.query(
        `INSERT INTO evento (nombre, descripcion, poster, justificacion, "esUrgente", "motivoUrgencia", "idAlcance", "idEstadoEvento", "idOrganizador")
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         RETURNING "idEvento";`,
        [
          ev.nombre,
          ev.descripcion,
          ev.poster,
          ev.justificacion,
          ev.esUrgente,
          ev.motivoUrgencia,
          ev.idAlcance,
          ev.idEstadoEvento,
          organizadorId,
        ],
      );

      const idEvento = resEvento.rows[0].idEvento;
      console.log(
        `   Evento creado: "${ev.nombre}" (ID: ${idEvento}, Urgente: ${ev.esUrgente}, Estado: ${ev.idEstadoEvento}, Subeventos: ${ev.subeventos.length})`,
      );

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
        console.log(
          `      -> Subevento creado: "${sub.nombre}" (ID: ${resSub.rows[0].idSubEvento}, Fecha: ${sub.fecha})`,
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

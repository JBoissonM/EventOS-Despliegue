import { describe, expect, it } from 'bun:test';
import {
  construirFechaEnCdmx,
  haAlcanzadoFechaHoraCdmx,
} from './fecha-cdmx.util';

describe('fecha-cdmx.util - Comparación explícita en America/Mexico_City e inicio inclusivo (>=)', () => {
  const ZONAS_PRUEBA = [
    'UTC',
    'America/Mexico_City',
    'America/New_York',
    'America/Los_Angeles',
    'Europe/Madrid',
    'Asia/Tokyo',
  ];

  it('interpreta YYYY-MM-DD y HH:mm:ss en America/Mexico_City sin importar process.env.TZ', () => {
    const tzOriginal = process.env.TZ;
    try {
      for (const tz of ZONAS_PRUEBA) {
        process.env.TZ = tz;
        const fechaCdmx = construirFechaEnCdmx('2026-11-16', '14:00:00');
        // 14:00:00 en America/Mexico_City (UTC-06:00) equivale exactamente a 20:00:00.000Z
        expect(fechaCdmx.toISOString()).toBe('2026-11-16T20:00:00.000Z');
      }
    } finally {
      if (tzOriginal === undefined) {
        delete process.env.TZ;
      } else {
        process.env.TZ = tzOriginal;
      }
    }
  });

  it('aplica bloqueo inclusivo (>=) en igualdad exacta y resultados deterministas en zonas distintas', () => {
    const tzOriginal = process.env.TZ;
    const instanteAntes = new Date('2026-11-16T13:59:59.999-06:00');
    const instanteExacto = new Date('2026-11-16T14:00:00.000-06:00');
    const instanteDespues = new Date('2026-11-16T14:00:00.001-06:00');

    try {
      for (const tz of ZONAS_PRUEBA) {
        process.env.TZ = tz;

        // 1 ms antes del inicio -> aún NO ha iniciado (false)
        expect(
          haAlcanzadoFechaHoraCdmx('2026-11-16', '14:00:00', instanteAntes),
        ).toBe(false);

        // Exactamente en horaInicio -> SÍ ha iniciado por regla inclusiva >= (true)
        expect(
          haAlcanzadoFechaHoraCdmx('2026-11-16', '14:00:00', instanteExacto),
        ).toBe(true);

        // 1 ms después del inicio -> SÍ ha iniciado (true)
        expect(
          haAlcanzadoFechaHoraCdmx('2026-11-16', '14:00:00', instanteDespues),
        ).toBe(true);
      }
    } finally {
      if (tzOriginal === undefined) {
        delete process.env.TZ;
      } else {
        process.env.TZ = tzOriginal;
      }
    }
  });

  it('normaliza horas en formato HH:mm (sin segundos) al evaluar en America/Mexico_City', () => {
    const instanteExacto = new Date('2026-11-16T09:30:00.000-06:00');
    const instantePrevio = new Date('2026-11-16T09:29:59.000-06:00');

    expect(
      haAlcanzadoFechaHoraCdmx('2026-11-16', '09:30', instantePrevio),
    ).toBe(false);
    expect(
      haAlcanzadoFechaHoraCdmx('2026-11-16', '09:30', instanteExacto),
    ).toBe(true);
  });
});

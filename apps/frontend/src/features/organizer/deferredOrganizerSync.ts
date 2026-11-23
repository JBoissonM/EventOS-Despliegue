import type {
  InvitadoEventoItem,
  PersonalLogisticaItem,
} from "@eventos/shared";
import { apiRequest } from "../../lib/apiClient";
import type { TablaInvitados as TablaInvitadosModal } from "./organism/ModalInvitados";

export function normalizarCorreo(correo: string): string {
  return correo.trim().toLowerCase();
}

export function agregarInvitadosLocales(
  actuales: InvitadoEventoItem[],
  nuevos: TablaInvitadosModal[],
  idSubEvento = 0,
): InvitadoEventoItem[] {
  const existentes = new Set(actuales.map((i) => normalizarCorreo(i.correo)));
  const agregados: InvitadoEventoItem[] = [];
  let offset = 0;

  for (const inv of nuevos) {
    const correo = normalizarCorreo(inv.correo);
    if (!correo || existentes.has(correo)) continue;
    existentes.add(correo);
    offset += 1;
    agregados.push({
      idInvitacionEvento: 0,
      idSubEvento,
      idUsuario: -(Date.now() + offset),
      nombreCompleto: "",
      correo,
      fechaUltimoEnvio: "",
      puedeReenviar: false,
      horasRestantesCooldown: 8,
    });
  }

  return agregados.length > 0 ? [...actuales, ...agregados] : actuales;
}

export function tienenCambiosInvitados(
  actuales: InvitadoEventoItem[],
  iniciales: InvitadoEventoItem[],
): boolean {
  if (actuales.length !== iniciales.length) return true;
  const setInicial = new Set(iniciales.map((i) => normalizarCorreo(i.correo)));
  return actuales.some((i) => !setInicial.has(normalizarCorreo(i.correo)));
}

export function tienenCambiosPersonalLogistica(
  actuales: PersonalLogisticaItem[],
  iniciales: PersonalLogisticaItem[],
): boolean {
  if (actuales.length !== iniciales.length) return true;
  const idsIniciales = new Set(iniciales.map((p) => p.idUsuario));
  return actuales.some((p) => !idsIniciales.has(p.idUsuario));
}

export async function sincronizarInvitadosYLogistica(params: {
  idEvento: string;
  idSubEvento?: number | string;
  invitadosActuales: InvitadoEventoItem[];
  invitadosIniciales: InvitadoEventoItem[];
  personalActual: PersonalLogisticaItem[];
  personalInicial: PersonalLogisticaItem[];
}): Promise<{
  huboCambiosAplicados: boolean;
  errores: string[];
  invitadosNuevosFallidos: InvitadoEventoItem[];
}> {
  const {
    idEvento,
    idSubEvento,
    invitadosActuales,
    invitadosIniciales,
    personalActual,
    personalInicial,
  } = params;

  const correosIniciales = new Set(
    invitadosIniciales.map((i) => normalizarCorreo(i.correo)),
  );
  const correosActuales = new Set(
    invitadosActuales.map((i) => normalizarCorreo(i.correo)),
  );
  const idsPersonalActual = new Set(personalActual.map((p) => p.idUsuario));

  const invitadosNuevos = invitadosActuales.filter(
    (inv) => !correosIniciales.has(normalizarCorreo(inv.correo)),
  );
  const invitadosEliminados = invitadosIniciales.filter(
    (ini) => !correosActuales.has(normalizarCorreo(ini.correo)),
  );
  const personalEliminado = personalInicial.filter(
    (ini) => !idsPersonalActual.has(ini.idUsuario),
  );

  const errores: string[] = [];
  const invitadosNuevosFallidos: InvitadoEventoItem[] = [];
  let huboCambiosAplicados = false;

  for (const inv of invitadosNuevos) {
    const subEventoId =
      inv.idSubEvento && inv.idSubEvento > 0 ? inv.idSubEvento : idSubEvento;
    if (!subEventoId) {
      errores.push(`${inv.correo}: No se pudo determinar el subevento.`);
      invitadosNuevosFallidos.push(inv);
      continue;
    }
    try {
      await apiRequest(
        `eventos/${idEvento}/subeventos/${subEventoId}/invitados`,
        {
          method: "POST",
          body: JSON.stringify({ correo: normalizarCorreo(inv.correo) }),
        },
      );
      huboCambiosAplicados = true;
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Ocurrió un error inesperado.";
      errores.push(`${inv.correo}: ${msg}`);
      invitadosNuevosFallidos.push(inv);
    }
  }

  for (const inv of invitadosEliminados) {
    const subEventoId =
      inv.idSubEvento && inv.idSubEvento > 0 ? inv.idSubEvento : idSubEvento;
    if (!subEventoId) {
      errores.push(`${inv.correo}: No se pudo determinar el subevento.`);
      invitadosNuevosFallidos.push(inv);
      continue;
    }
    if (!inv.idInvitacionEvento) continue;
    try {
      await apiRequest(
        `eventos/${idEvento}/subeventos/${subEventoId}/invitados/${inv.idInvitacionEvento}`,
        { method: "DELETE" },
      );
      huboCambiosAplicados = true;
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Ocurrió un error inesperado.";
      errores.push(`${inv.correo}: ${msg}`);
    }
  }

  for (const personal of personalEliminado) {
    try {
      await apiRequest(
        `eventos/${idEvento}/personal-logistica/${personal.idUsuario}`,
        { method: "DELETE" },
      );
      huboCambiosAplicados = true;
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Ocurrió un error inesperado.";
      errores.push(`${personal.correo}: ${msg}`);
    }
  }

  return { huboCambiosAplicados, errores, invitadosNuevosFallidos };
}

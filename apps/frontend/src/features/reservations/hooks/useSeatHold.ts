import { useCallback, useEffect, useRef, useState } from "react";
import type { RetencionAsientoActiva } from "@eventos/shared";
import { ApiError } from "../../../lib/apiClient";
import {
  reservationsService,
  type CreateReservationResponse,
} from "../services/reservations.service";

type HoldAction = "acquiring" | "changing" | "releasing" | "confirming";
type HoldSyncStatus = "loading" | "ready" | "error";

const EXPIRED_MESSAGE = "Se agotaron los cinco minutos para confirmar tu asiento. Selecciona uno disponible.";
const LOST_MESSAGE = "El asiento que habías apartado ya no está disponible. Selecciona otro.";

const messagesByCode: Record<string, string> = {
  ASIENTO_RETENIDO: "Ese asiento está apartado temporalmente por otra persona.",
  ASIENTO_OCUPADO: "Ese asiento ya está ocupado. Selecciona otro.",
  RETENCION_PROPIA_EXISTENTE: "Ya tienes un asiento apartado en esta actividad.",
  AFORO_AGOTADO: "No quedan lugares disponibles para esta actividad.",
  RETENCION_EXPIRADA: EXPIRED_MESSAGE,
  RETENCION_NO_ENCONTRADA: LOST_MESSAGE,
  RETENCION_ASIENTO_NO_COINCIDE: "El asiento apartado cambió en otra pestaña. Revisa tu selección.",
  RETENCION_REQUERIDA: "Selecciona un asiento antes de confirmar la reservación.",
  ASIENTO_INVALIDO: "El asiento ya no pertenece al recinto de esta actividad.",
  MODALIDAD_SIN_ASIENTOS: "Esta actividad no permite seleccionar asientos.",
};

export function getSeatHoldErrorMessage(cause: unknown): string {
  if (cause instanceof ApiError) {
    if (cause.codigo && messagesByCode[cause.codigo]) {
      return messagesByCode[cause.codigo];
    }
    if (cause.status === 429) {
      return "Has realizado demasiadas solicitudes. Espera un momento antes de volver a intentarlo.";
    }
    if (cause.status === 401 || cause.status === 403) {
      return "No fue posible validar tu sesión o los permisos para reservar.";
    }
    return cause.message || "No fue posible completar la operación.";
  }
  if (cause instanceof Error && !(cause instanceof TypeError)) {
    return cause.message;
  }
  return "No se pudo completar la operación. Comprueba tu conexión e inténtalo nuevamente.";
}

function isLostHold(cause: unknown): boolean {
  return cause instanceof ApiError &&
    (cause.codigo === "RETENCION_EXPIRADA" || cause.codigo === "RETENCION_NO_ENCONTRADA");
}

export function useSeatHold(idSubEvento: number, onAvailabilityChange: () => void) {
  const [hold, setHold] = useState<RetencionAsientoActiva | null>(null);
  const [expiresAt, setExpiresAt] = useState<number | null>(null);
  const [syncStatus, setSyncStatus] = useState<HoldSyncStatus>("loading");
  const [pendingAction, setPendingAction] = useState<HoldAction | null>(null);
  const [pendingSeatId, setPendingSeatId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const mountedRef = useRef(false);
  const holdRef = useRef<RetencionAsientoActiva | null>(null);
  const expiresAtRef = useRef<number | null>(null);
  const statusRef = useRef<HoldSyncStatus>("loading");
  const pendingRef = useRef<HoldAction | null>(null);
  const readControllerRef = useRef<AbortController | null>(null);

  const updateStatus = useCallback((next: HoldSyncStatus) => {
    statusRef.current = next;
    if (mountedRef.current) setSyncStatus(next);
  }, []);

  const rememberHold = useCallback((next: RetencionAsientoActiva | null) => {
    if (!mountedRef.current) return;
    const active = next && next.segundosRestantes > 0 ? next : null;
    const deadline = active ? Date.now() + active.segundosRestantes * 1000 : null;
    holdRef.current = active;
    expiresAtRef.current = deadline;
    setHold(active);
    setExpiresAt(deadline);
  }, []);

  const refreshAvailability = useCallback(() => {
    if (mountedRef.current) onAvailabilityChange();
  }, [onAvailabilityChange]);

  const synchronize = useCallback(async () => {
    if (!mountedRef.current || pendingRef.current !== null) return;
    readControllerRef.current?.abort();
    const controller = new AbortController();
    readControllerRef.current = controller;
    updateStatus("loading");

    try {
      const response = await reservationsService.getCurrentHold(idSubEvento, controller.signal);
      if (controller.signal.aborted || !mountedRef.current) return;
      const previous = holdRef.current;
      rememberHold(response.retencion);
      setError((current) => {
        if (previous && !response.retencion) return LOST_MESSAGE;
        if (response.retencion) return null;
        return current === EXPIRED_MESSAGE || current === LOST_MESSAGE ? current : null;
      });
      updateStatus("ready");
    } catch (cause: unknown) {
      if (controller.signal.aborted || !mountedRef.current) return;
      setError(getSeatHoldErrorMessage(cause));
      updateStatus("error");
    } finally {
      if (readControllerRef.current === controller) {
        readControllerRef.current = null;
      }
    }
  }, [idSubEvento, rememberHold, updateStatus]);

  useEffect(() => {
    mountedRef.current = true;
    let lastRefresh = Date.now();
    void synchronize();

    const handleReturn = () => {
      if (document.visibilityState !== "visible") return;
      const now = Date.now();
      if (now - lastRefresh < 1000) return;
      lastRefresh = now;
      void synchronize();
    };

    document.addEventListener("visibilitychange", handleReturn);
    window.addEventListener("focus", handleReturn);

    return () => {
      mountedRef.current = false;
      readControllerRef.current?.abort();
      document.removeEventListener("visibilitychange", handleReturn);
      window.removeEventListener("focus", handleReturn);
    };
  }, [synchronize]);

  const reconcileAfterAction = useCallback(async (): Promise<boolean> => {
    try {
      const response = await reservationsService.getCurrentHold(idSubEvento);
      if (!mountedRef.current) return false;
      const previous = holdRef.current;
      rememberHold(response.retencion);
      if (previous && !response.retencion) setError(LOST_MESSAGE);
      return true;
    } catch {
      return false;
    }
  }, [idSubEvento, rememberHold]);

  const expireHold = useCallback(() => {
    if (pendingRef.current !== null || holdRef.current === null) return;
    if (expiresAtRef.current !== null && Date.now() < expiresAtRef.current) return;
    rememberHold(null);
    setError(EXPIRED_MESSAGE);
    refreshAvailability();
  }, [rememberHold, refreshAvailability]);

  const selectSeat = useCallback(async (idAsiento: number) => {
    if (!Number.isSafeInteger(idAsiento) || idAsiento <= 0) return;
    if (pendingRef.current !== null || statusRef.current !== "ready") return;

    const current = holdRef.current;
    if (current && expiresAtRef.current !== null && Date.now() >= expiresAtRef.current) {
      expireHold();
      return;
    }

    const action: HoldAction = current
      ? current.idAsiento === idAsiento ? "releasing" : "changing"
      : "acquiring";
    readControllerRef.current?.abort();
    pendingRef.current = action;
    setPendingAction(action);
    setPendingSeatId(idAsiento);
    setError(null);

    try {
      if (action === "releasing" && current) {
        await reservationsService.releaseHold(current.idRetencionAsiento);
        rememberHold(null);
      } else {
        let next: RetencionAsientoActiva;
        if (current) {
          next = await reservationsService.changeHoldSeat(current.idRetencionAsiento, idAsiento);
        } else {
          try {
            next = await reservationsService.acquireHold(idSubEvento, idAsiento);
          } catch (cause: unknown) {
            if (!(cause instanceof ApiError) || cause.codigo !== "RETENCION_PROPIA_EXISTENTE") {
              throw cause;
            }
            const response = await reservationsService.getCurrentHold(idSubEvento);
            const recovered = response.retencion;
            rememberHold(recovered);
            if (!recovered) throw cause;
            next = recovered.idAsiento === idAsiento
              ? recovered
              : await reservationsService.changeHoldSeat(recovered.idRetencionAsiento, idAsiento);
          }
        }
        rememberHold(next);
        await reconcileAfterAction();
      }
      refreshAvailability();
    } catch (cause: unknown) {
      if (isLostHold(cause)) {
        rememberHold(null);
      } else if (!(cause instanceof ApiError) || cause.status >= 500) {
        const recovered = await reconcileAfterAction();
        if (recovered && (action === "releasing"
          ? holdRef.current === null
          : holdRef.current?.idAsiento === idAsiento)) {
          setError(null);
          refreshAvailability();
          return;
        }
      }
      if (mountedRef.current) setError(getSeatHoldErrorMessage(cause));
      refreshAvailability();
    } finally {
      pendingRef.current = null;
      if (mountedRef.current) {
        setPendingAction(null);
        setPendingSeatId(null);
      }
      expireHold();
    }
  }, [expireHold, idSubEvento, reconcileAfterAction, refreshAvailability, rememberHold]);

  const releaseSeat = useCallback(async () => {
    const current = holdRef.current;
    if (current) await selectSeat(current.idAsiento);
  }, [selectSeat]);

  const confirmHold = useCallback(async (expectedSeatId: number): Promise<CreateReservationResponse> => {
    if (pendingRef.current !== null || statusRef.current !== "ready") {
      throw new Error("Espera a que termine la actualización de tu asiento.");
    }

    const current = holdRef.current;
    if (!current) throw new Error("Selecciona un asiento antes de confirmar.");
    if (current.idAsiento !== expectedSeatId) {
      throw new Error("El asiento que ibas a confirmar cambió. Revisa tu selección.");
    }
    if (expiresAtRef.current !== null && Date.now() >= expiresAtRef.current) {
      expireHold();
      throw new Error(EXPIRED_MESSAGE);
    }

    pendingRef.current = "confirming";
    setPendingAction("confirming");
    setError(null);
    readControllerRef.current?.abort();

    try {
      const result = await reservationsService.createReservation({
        idSubEvento,
        idRetencionAsiento: current.idRetencionAsiento,
        idAsiento: current.idAsiento,
      });
      rememberHold(null);
      refreshAvailability();
      return result;
    } catch (cause: unknown) {
      if (isLostHold(cause)) {
        rememberHold(null);
      } else if (cause instanceof ApiError && cause.codigo === "RETENCION_ASIENTO_NO_COINCIDE") {
        await reconcileAfterAction();
      } else if (!(cause instanceof ApiError)) {
        await reconcileAfterAction();
      }
      if (mountedRef.current) setError(getSeatHoldErrorMessage(cause));
      refreshAvailability();
      throw cause;
    } finally {
      pendingRef.current = null;
      if (mountedRef.current) setPendingAction(null);
    }
  }, [expireHold, idSubEvento, reconcileAfterAction, refreshAvailability, rememberHold]);

  const clearError = useCallback(() => setError(null), []);

  return {
    hold,
    expiresAt,
    syncStatus,
    pendingAction,
    pendingSeatId,
    error,
    selectSeat,
    releaseSeat,
    confirmHold,
    syncHold: synchronize,
    expireHold,
    clearError,
  };
}

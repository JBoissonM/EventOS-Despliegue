import { useEffect, useState } from "react";
import type { ComponentProps } from "react";

import { EstadoBoleto, ModalidadAcceso } from "@eventos/shared";
import { useLocation, useNavigate } from "react-router";

import { ApiError } from "../../../../lib/apiClient";

import { ticketsService } from "../../../tickets/services/tickets.service";

import type {
  ReservationUserStatus,
} from "../../types/eventDetails.types";

import { ReservationInfoCard } from "./ReservationInfoCard";

type ActivityReservationCardProps =
  ComponentProps<typeof ReservationInfoCard>;

export function ActivityReservationCard(
  props: ActivityReservationCardProps,
) {
  const { activity } = props;
  const navigate = useNavigate();
  const location = useLocation();
  const isGuest = !localStorage.getItem("token");

  const [reservationStatus, setReservationStatus] =
    useState<ReservationUserStatus>("no-consultado");

  const [verificationError, setVerificationError] =
    useState<string | null>(null);

  const [retryCount, setRetryCount] = useState(0);
  const [sessionError, setSessionError] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token || activity.modalidadAcceso === ModalidadAcceso.ENTRADA_LIBRE) {
      setReservationStatus("sin-reserva");
      setVerificationError(null);
      setSessionError(false);
      return;
    }

    let active = true;

    setReservationStatus("no-consultado");
    setVerificationError(null);
    setSessionError(false);

    void ticketsService
      .getMyTickets()
      .then((tickets) => {
        if (!active) {
          return;
        }

        const hasReservation = tickets.some(
          (ticket) =>
            ticket.idSubEvento === activity.idSubEvento &&
            (
              ticket.estadoBoleto === EstadoBoleto.VALIDO ||
              ticket.estadoBoleto === EstadoBoleto.UTILIZADO
            ),
        );

        setReservationStatus(
          hasReservation ? "reservado" : "sin-reserva",
        );
      })
      .catch((cause: unknown) => {
        if (!active) {
          return;
        }

        setSessionError(
          cause instanceof ApiError &&
          (cause.status === 401 || cause.status === 403),
        );

        setVerificationError(
          cause instanceof Error
            ? cause.message
            : "No fue posible verificar tus reservaciones.",
        );
        setReservationStatus("error");
      });

    return () => {
      active = false;
    };
  }, [activity.idSubEvento, activity.modalidadAcceso, retryCount]);

  const handleLogin = () => {
    navigate("/login", {
      state: { returnUrl: location.pathname },
    });
  };

  return (
    <ReservationInfoCard
      {...props}
      activity={{
        ...activity,
        estadoReservaUsuario: reservationStatus,
      }}
      error={verificationError ?? props.error}
      authenticationState={
        sessionError ? "session-error" : isGuest ? "guest" : "authenticated"
      }
      onLogin={handleLogin}
      onRetryAvailability={
        verificationError
          ? () => setRetryCount((current) => current + 1)
          : props.onRetryAvailability
      }
    />
  );
}
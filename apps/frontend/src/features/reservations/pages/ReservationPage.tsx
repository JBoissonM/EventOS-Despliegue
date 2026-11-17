import type { ModalidadAcceso } from "@eventos/shared";
import { ModalidadAccesoHelp } from "../../../components/molecules/ModalidadAccesoHelp";
import type { CreateReservationResponse } from "../services/reservations.service";
import { ReservationPanel } from "../components/organisms/ReservationPanel";
import { AutomaticReservationPanel } from "../components/organisms/AutomaticReservationPanel";
import type { SeatMapItem } from "../components/organisms/SeatMap";
import { PageHeader } from "../../../components/organisms/PageHeader/PageHeader";
import { ReservationAvailabilityIndicator } from "../components/molecules/ReservationAvailabilityIndicator";

interface ReservationDetails {
  eventName: string;
  parentEventName?: string;
  date: string;
  startTime: string;
  endTime: string;
  venue: string;
  idModalidadAcceso?: ModalidadAcceso;
  canReserve?: boolean;
  availableSeats: number;
  capacity: number;
  isRefreshing?: boolean;
}

interface ManualReservationProps extends ReservationDetails {
  mode: "manual";
  seats: SeatMapItem[];
  aisleAfter?: number[];
  onReserve: (idAsiento: number) => Promise<CreateReservationResponse | void>;
}

interface AutomaticReservationProps extends ReservationDetails {
  mode: "automatic";
  onReserve: () => Promise<CreateReservationResponse | void>;
}

export type ReservationPageProps = ManualReservationProps | AutomaticReservationProps;

export function ReservationPage(props: ReservationPageProps) {
  return (
    <main
      className={`w-full min-w-0 space-y-6 pb-6 pt-4 ${
        props.mode === "automatic" ? "mx-auto max-w-6xl" : ""
      }`}
    >
      <header className="space-y-3">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <PageHeader title="Reservar lugar" />

          <div className={props.mode === "manual" ? "xl:hidden" : ""}>
            <ReservationAvailabilityIndicator
              availableSeats={props.availableSeats}
              capacity={props.capacity}
              isRefreshing={props.isRefreshing}
            />
          </div>
        </div>

        <p className="text-xl font-semibold text-eventos-secondary">
          {props.eventName}
        </p>

        {props.idModalidadAcceso && (
          <ModalidadAccesoHelp
            idModalidadAcceso={props.idModalidadAcceso}
          />
        )}
      </header>
      {props.mode === "manual" ? (
        <ReservationPanel
          eventName={props.eventName}
          parentEventName={props.parentEventName}
          date={props.date}
          startTime={props.startTime}
          endTime={props.endTime}
          venue={props.venue}
          seats={props.seats}
          aisleAfter={props.aisleAfter}
          availableSeats={props.availableSeats}
          capacity={props.capacity}
          isRefreshing={props.isRefreshing}
          canReserve={props.canReserve}
          onReserve={props.onReserve}
        />
      ) : (
        <AutomaticReservationPanel
          eventName={props.eventName}
          parentEventName={props.parentEventName}
          date={props.date}
          startTime={props.startTime}
          endTime={props.endTime}
          venue={props.venue}
          idModalidadAcceso={props.idModalidadAcceso}
          canReserve={props.canReserve}
          onReserve={props.onReserve}
        />
      )}
    </main>
  );
}

export default ReservationPage;

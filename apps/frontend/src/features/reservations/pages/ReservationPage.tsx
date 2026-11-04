import type { CreateReservationResponse } from "../services/reservations.service";
import { ReservationPanel } from "../components/organisms/ReservationPanel";
import { AutomaticReservationPanel } from "../components/organisms/AutomaticReservationPanel";
import type { SeatMapItem } from "../components/organisms/SeatMap";

interface ReservationDetails {
  eventName: string;
  parentEventName?: string;
  date: string;
  startTime: string;
  endTime: string;
  venue: string;
  canReserve?: boolean;
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
    <main className={`mx-auto w-full space-y-6 px-2 py-8 font-merriweather sm:px-4 ${props.mode === "manual" ? "max-w-7xl" : "max-w-6xl"}`}>
      <header className="space-y-2">
        <h1 className="text-3xl font-bold text-eventos-ink">Reservar lugar</h1>
        <p className="text-xl font-semibold text-eventos-secondary">{props.eventName}</p>
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
          canReserve={props.canReserve}
          onReserve={props.onReserve}
        />
      )}
    </main>
  );
}

export default ReservationPage;

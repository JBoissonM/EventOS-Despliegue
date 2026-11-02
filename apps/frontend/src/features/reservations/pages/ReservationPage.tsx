import { ReservationPanel } from "../components/organisms/ReservationPanel";
import { AutomaticReservationPanel } from "../components/organisms/AutomaticReservationPanel";
import type { SeatMapItem } from "../components/organisms/SeatMap";

interface ReservationDetails {
  eventName: string;
  date: string;
  startTime: string;
  endTime: string;
  venue: string;
  availableSeats?: number;
  onViewTicket?: (idBoleto: number) => void;
}

interface ManualReservationProps extends ReservationDetails {
  mode: "manual";
  seats: SeatMapItem[];
  aisleAfter?: number[];
  onReserve: (idAsiento: number) => Promise<number | void>;
}

interface AutomaticReservationProps extends ReservationDetails {
  mode: "automatic";
  onReserve: () => Promise<number | void>;
}

export type ReservationPageProps =
  | ManualReservationProps
  | AutomaticReservationProps;

export function ReservationPage(props: ReservationPageProps) {
  return (
    <div className="mx-auto max-w-[1600px] space-y-6 px-4 py-8">
      <header className="space-y-2">
        <h1 className="font-merriweather text-3xl font-bold">
          Reservar lugar
        </h1>

        <p className="text-lg text-gray-700">
          {props.eventName}
        </p>
      </header>

      {props.mode === "manual" ? (
        <ReservationPanel
          eventName={props.eventName}
          date={props.date}
          startTime={props.startTime}
          endTime={props.endTime}
          venue={props.venue}
          availableSeats={props.availableSeats}
          onViewTicket={props.onViewTicket}
          seats={props.seats}
          aisleAfter={props.aisleAfter}
          onReserve={props.onReserve}
        />
      ) : (
        <AutomaticReservationPanel
          eventName={props.eventName}
          date={props.date}
          startTime={props.startTime}
          endTime={props.endTime}
          venue={props.venue}
          availableSeats={props.availableSeats}
          onViewTicket={props.onViewTicket}
          onReserve={props.onReserve}
        />
      )}
    </div>
  );
}

export default ReservationPage;
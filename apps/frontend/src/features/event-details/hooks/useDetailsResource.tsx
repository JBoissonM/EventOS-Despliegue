import {
  useCallback,
  useEffect,
  useState,
} from "react";

export type DetailsStatus =
  | "idle"
  | "loading"
  | "success"
  | "not-found"
  | "error";

export type DetailsLoader<T> = (
  id: number,
  signal: AbortSignal,
) => Promise<T>;

function isNotFoundError(error: unknown): boolean {
  if (typeof error !== "object" || error === null) {
    return false;
  }

  const httpError = error as {
    status?: number;
    statusCode?: number;
    response?: {
      status?: number;
    };
  };

  return (
    httpError.status === 404 ||
    httpError.statusCode === 404 ||
    httpError.response?.status === 404
  );
}

export function useDetailsResource<T>(
  id: number | null,
  loader: DetailsLoader<T>,
) {
  const [data, setData] = useState<T | null>(null);

  const [status, setStatus] =
    useState<DetailsStatus>("idle");

  const [error, setError] =
    useState<string | null>(null);

  const [retryCount, setRetryCount] = useState(0);

  const retry = useCallback(() => {
    setRetryCount((current) => current + 1);
  }, []);

  useEffect(() => {
    if (
      id === null ||
      !Number.isSafeInteger(id) ||
      id <= 0
    ) {
      setData(null);
      setStatus("idle");
      setError(null);
      return;
    }

    const controller = new AbortController();

    setData(null);
    setStatus("loading");
    setError(null);

    Promise.resolve()
      .then(() => loader(id, controller.signal))
      .then((result) => {
        if (controller.signal.aborted) return;

        setData(result);
        setStatus("success");
      })
      .catch((caughtError: unknown) => {
        if (controller.signal.aborted) return;

        if (isNotFoundError(caughtError)) {
          setStatus("not-found");
          setError("El recurso solicitado no existe.");
        } else {
          setStatus("error");
          setError(
            "No fue posible obtener la información.",
          );
        }
      });

    return () => {
      controller.abort();
    };
  }, [id, loader, retryCount]);

  return {
    data,
    status,
    error,
    retry,
  };
}
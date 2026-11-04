import { Input } from "../atoms/Input/Input";

import type { ChangeEventHandler, FormEventHandler } from "react";

export interface SearchBarProps {
  value: string;
  texto: string;
  handle: FormEventHandler<HTMLFormElement>;
  onChangeEvent: ChangeEventHandler<HTMLInputElement>;
  classname?: string;
}

export function SearchBar({
  value,
  texto,
  onChangeEvent,
  handle,
  classname
}: SearchBarProps) {
  return (
    <div
      id="contenedorSearchBar"
      className={`flex flex-col md:flex-row md:items-center md:justify-between gap-4 ${classname}`}>
      <form className="w-full min-w-0" onSubmit={handle}>
        <div className="flex items-center border border-gray-300 rounded-md bg-white px-3 py-2 shadow-sm">
          <Input
            type="text"
            placeholder={texto}
            value={value}
            onChange={onChangeEvent}
            className="border-none p-0 text-sm w-full outline-none bg-transparent focus:ring-0 focus:ring-transparent"
          />
          <button
            type="submit"
            className="text-gray-500 hover:text-gray-700 ml-2 shrink-0"
            aria-label={texto}>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
              className="lucide lucide-search preview-icon">
              <path d="m21 21-4.34-4.34" />
              <circle cx="11" cy="11" r="8" />
            </svg>
          </button>
        </div>
      </form>
    </div>
  );
}

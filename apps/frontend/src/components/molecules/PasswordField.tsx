import React, { useState } from "react";
import { Label } from "../atoms/Label/Label";
import { Input } from "../atoms/Input/Input";
import { FieldMessage } from "../atoms/FieldMessage/FieldMessage";
import { Eye, EyeOff } from "lucide-react";

interface PasswordFieldProps {
  id: string;
  name: string;
  required?: boolean;
  label: string;
  value: string;
  placeholder?: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  error?: string;
}

export function PasswordField({
  id,
  name,
  label,
  value,
  placeholder,
  onChange,
  required = false,
  error,
}: PasswordFieldProps) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="flex -mt-1 min-w-0 flex-col justify-end gap-1 font-merriweather text-[16px]">
      <Label htmlFor={id} required={required}>{label}</Label>
      <div className="relative">
        <Input
          id={id}
          type={showPassword ? "text" : "password"}
          name={name}
          value={value}
          placeholder={placeholder}
          onChange={onChange}
          hasError={!!error}
          aria-describedby={`${id}-error`}
          className="pr-10"/>
        <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none" aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}>
          {showPassword ? (<EyeOff className="w-5 h-5" />) : (<Eye className="w-5 h-5" />)}
        </button>
      </div>
      {error && (
        <FieldMessage id={`${id}-error`} variant="error" className="mt-1">
          {error}
        </FieldMessage>
      )}
    </div>
  );
}

export default PasswordField;
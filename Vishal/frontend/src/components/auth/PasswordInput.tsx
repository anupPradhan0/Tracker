import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { PASSWORD_MAX } from "@/constants/auth";
import { cn } from "@/lib/utils";

interface PasswordInputProps {
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  disabled?: boolean;
  id?: string;
  error?: string;
  showCounter?: boolean;
}

export function PasswordInput({
  value,
  onChange,
  onBlur,
  disabled,
  id,
  error,
  showCounter = false,
}: PasswordInputProps) {
  const [visible, setVisible] = useState(false);
  const length = value.length;

  const handleChange = (next: string) => {
    if (next.length <= PASSWORD_MAX) {
      onChange(next);
    }
  };

  return (
    <div className="space-y-2">
      <div className="relative">
        <Input
          id={id}
          type={visible ? "text" : "password"}
          value={value}
          onChange={(e) => handleChange(e.target.value)}
          onBlur={onBlur}
          disabled={disabled}
          maxLength={PASSWORD_MAX}
          autoComplete="current-password"
          className="pr-10"
        />
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="absolute right-0 top-0 h-10 w-10 rounded-xl text-slate-500 hover:bg-indigo-50/80 hover:text-indigo-700"
          onClick={() => setVisible((v) => !v)}
          tabIndex={-1}
          aria-label={visible ? "Hide password" : "Show password"}
        >
          {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </Button>
      </div>
      {showCounter && (
        <p className="text-xs text-slate-500 transition-opacity">
          {length}/{PASSWORD_MAX} characters
        </p>
      )}
      {error && (
        <p className={cn("animate-fade-in text-sm text-red-600")}>{error}</p>
      )}
    </div>
  );
}

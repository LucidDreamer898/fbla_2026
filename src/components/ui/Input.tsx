import React from 'react';
import { cn } from '@/lib/utils';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = 'text', label, error, id, ...props }, ref) => {
    const [inputId] = React.useState(() => id || `input-${Math.random().toString(36).substr(2, 9)}`);

    return (
      <div className="space-y-2">
        {label && (
          <label
            htmlFor={inputId}
            className="text-foreground text-sm font-medium"
          >
            {label}
          </label>
        )}
        <input
          type={type}
          id={inputId}
          className={cn(
            'bg-[#111111] border border-zinc-700 text-foreground placeholder:text-muted focus:ring-2 focus:ring-primary focus:outline-none disabled:cursor-not-allowed disabled:opacity-50 flex h-12 w-full rounded-lg border px-4 py-3 text-sm transition-all duration-200 hover:border-zinc-600 hover:bg-[#1a1a1a] focus:border-primary/50 focus:bg-[#0f0f0f] focus:shadow-lg focus:shadow-primary/10',
            error && 'border-red-500 focus:ring-red-500 focus:border-red-500/50 focus:shadow-red-500/10',
            className
          )}
          ref={ref}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={error ? `${inputId}-error` : undefined}
          {...props}
        />
        {error && (
          <p
            id={`${inputId}-error`}
            className="text-sm text-red-500"
            role="alert"
          >
            {error}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export { Input };

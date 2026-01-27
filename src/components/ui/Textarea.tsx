import React from 'react';
import { cn } from '@/lib/utils';

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, id, ...props }, ref) => {
    const [textareaId] = React.useState(() => id || `textarea-${Math.random().toString(36).substr(2, 9)}`);

    return (
      <div className="space-y-2">
        {label && (
          <label
            htmlFor={textareaId}
            className="text-foreground text-sm font-medium"
          >
            {label}
          </label>
        )}
        <textarea
          id={textareaId}
          className={cn(
            'bg-[#111111] border border-zinc-700 text-foreground placeholder:text-muted focus:ring-2 focus:ring-primary focus:outline-none disabled:cursor-not-allowed disabled:opacity-50 flex min-h-[120px] w-full rounded-lg border px-4 py-3 text-sm transition-all duration-200 hover:border-zinc-600 hover:bg-[#1a1a1a] focus:border-primary/50 focus:bg-[#0f0f0f] focus:shadow-lg focus:shadow-primary/10 resize-none',
            error && 'border-red-500 focus:ring-red-500 focus:border-red-500/50 focus:shadow-red-500/10',
            className
          )}
          ref={ref}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={error ? `${textareaId}-error` : undefined}
          {...props}
        />
        {error && (
          <p
            id={`${textareaId}-error`}
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

Textarea.displayName = 'Textarea';

export { Textarea };

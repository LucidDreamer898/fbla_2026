import React from 'react';
import { cn } from '@/lib/utils';

interface TagProps {
  children: React.ReactNode;
  onRemove?: () => void;
  className?: string;
}

const Tag = React.forwardRef<HTMLDivElement, TagProps>(
  ({ className, children, onRemove, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'inline-flex items-center gap-1 bg-zinc-800 text-zinc-300 px-2 py-1 rounded-md text-sm',
          className
        )}
        {...props}
      >
        <span>{children}</span>
        {onRemove && (
          <button
            type="button"
            onClick={onRemove}
            className="ml-1 hover:text-white transition-colors"
          >
            ×
          </button>
        )}
      </div>
    );
  }
);

Tag.displayName = 'Tag';

export { Tag };

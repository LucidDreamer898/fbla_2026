import React from 'react';
import { cn } from '@/lib/utils';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'solid' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'solid',
      size = 'md',
      children,
      asChild = false,
      ...props
    },
    ref
  ) => {
    const baseStyles =
      'inline-flex items-center justify-center rounded-lg font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50';

    const variants = {
      solid:
        'bg-white text-black shadow-lg hover:bg-gray-100',
      outline:
        'bg-background text-foreground hover:bg-primary/10',
      ghost: 'text-foreground hover:bg-muted/10',
    };

    const sizes = {
      sm: 'h-8 px-6 text-sm min-w-24',
      md: 'h-9 px-8 text-sm min-w-32',
      lg: 'h-10 px-10 text-sm min-w-40',
    };

    const buttonStyle = variant === 'outline' ? {
      // Gradient border using box-shadow technique
      background: '#0b0b0c',
      border: '2px solid transparent',
      backgroundImage: 'linear-gradient(#0b0b0c, #0b0b0c), linear-gradient(135deg, #8e4ec6, #ff0080)',
      backgroundOrigin: 'border-box',
      backgroundClip: 'padding-box, border-box',
      boxShadow: '0 0 35px rgba(255, 0, 128, 0.4)',
    } : {};

    if (asChild) {
      return React.cloneElement(children as React.ReactElement, {
        className: cn(baseStyles, variants[variant], sizes[size], className),
        style: buttonStyle,
        ref,
        ...props,
      } as any);
    }

    return (
      <button
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        style={buttonStyle}
        ref={ref}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';

export { Button };

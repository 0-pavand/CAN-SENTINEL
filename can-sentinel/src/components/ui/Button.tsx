import * as React from "react"
import { cn } from "../../utils"

const Button = React.forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'default' | 'outline' | 'ghost', size?: 'default' | 'sm' | 'lg' | 'icon' }>(
  ({ className, variant = 'default', size = 'default', ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center whitespace-nowrap rounded-2xl text-xs font-black uppercase tracking-widest ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#38bdf8] focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]",
          {
            'bg-[#38bdf8] text-white dark:text-[#0c0d10] hover:bg-[#38bdf8]/90 shadow-[0_0_15px_rgba(56,189,248,0.2)]': variant === 'default',
            'border-2 border-slate-300 dark:border-slate-700 bg-transparent hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-900 dark:text-slate-100': variant === 'outline',
            'hover:bg-slate-200 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100 text-slate-600 dark:text-slate-300': variant === 'ghost',
            'h-12 px-6 py-2': size === 'default',
            'h-9 rounded-xl px-4': size === 'sm',
            'h-14 rounded-2xl px-8 text-sm': size === 'lg',
            'h-12 w-12': size === 'icon',
          },
          className
        )}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button }

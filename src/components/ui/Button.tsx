import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "../../lib/utils"

const buttonVariants = cva(
    "inline-flex items-center justify-center whitespace-nowrap rounded-lg text-lg font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 tracking-widest",
    {
        variants: {
            variant: {
                default: "bg-accent text-primary hover:bg-yellow-300 shadow-lg shadow-yellow-900/20 font-bold",
                outline: "border border-accent text-accent hover:bg-accent hover:text-primary",
                ghost: "hover:bg-white/10 text-accent",
                link: "text-accent underline-offset-4 hover:underline",
            },
            size: {
                default: "h-12 px-8 py-2",
                sm: "h-9 rounded-md px-3",
                lg: "h-14 rounded-md px-10 text-xl",
                icon: "h-10 w-10",
            },
        },
        defaultVariants: {
            variant: "default",
            size: "default",
        },
    }
)

export interface ButtonProps
    extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> { }

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant, size, ...props }, ref) => {
        return (
            <button
                className={cn(buttonVariants({ variant, size, className }))}
                ref={ref}
                {...props}
            />
        )
    }
)
Button.displayName = "Button"

export { Button, buttonVariants }

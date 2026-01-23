import React from 'react';
import { cn } from '../../lib/utils';
import { ChevronDown } from 'lucide-react';

interface SelectOption {
    value: string;
    label: string;
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
    options: SelectOption[];
    placeholder?: string;
}

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
    ({ className, options, placeholder, ...props }, ref) => {
        return (
            <div className="relative w-full">
                <select
                    ref={ref}
                    className={cn(
                        "appearance-none flex h-12 w-full rounded-lg border border-accent/30 bg-black/20 px-4 py-2 pr-10 text-lg text-white focus:border-accent focus:bg-black/40 focus:outline-none focus:ring-1 focus:ring-accent disabled:cursor-not-allowed disabled:opacity-50 transition-all font-serif",
                        "invalid:text-white/40",
                        className
                    )}
                    {...props}
                >
                    {placeholder && <option value="" disabled selected>{placeholder}</option>}
                    {options.map((option) => (
                        <option key={option.value} value={option.value} className="bg-primary text-white">
                            {option.label}
                        </option>
                    ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-accent pointer-events-none" />
            </div>
        );
    }
);

Select.displayName = 'Select';

export { Select };

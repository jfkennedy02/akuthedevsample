import React from 'react';
import clsx from 'clsx';
import { Loader2 } from 'lucide-react';
import '../../styles/components.css'; // We will create this

export const Button = ({
    children,
    variant = 'primary', // primary, secondary, danger, outline
    size = 'md', // sm, md, lg
    className,
    isLoading,
    disabled,
    ...props
}) => {
    return (
        <button
            className={clsx(
                'btn',
                `btn-${variant}`,
                `btn-${size}`,
                className
            )}
            disabled={isLoading || disabled}
            {...props}
        >
            {isLoading && <Loader2 className="animate-spin mr-2" size={18} />}
            {children}
        </button>
    );
};

import React from 'react';
import clsx from 'clsx';

export const Card = ({ children, className, ...props }) => {
    return (
        <div className={clsx('card', className)} {...props}>
            {children}
        </div>
    );
};

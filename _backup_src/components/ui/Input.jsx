import React from 'react';
import clsx from 'clsx';

export const Input = ({ label, error, className, ...props }) => {
    return (
        <div className={clsx('form-group', className)}>
            {label && <label className="form-label">{label}</label>}
            <input
                className={clsx('form-input', error && 'has-error')}
                {...props}
            />
            {error && <span className="form-error">{error}</span>}
        </div>
    );
};

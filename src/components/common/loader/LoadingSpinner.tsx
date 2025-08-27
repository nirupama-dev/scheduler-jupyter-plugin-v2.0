import { CircularProgress } from '@mui/material';
import React from 'react';
import { ILoaderProps } from '../../../interfaces/CommonInterface';

const LoadingSpinner: React.FC<ILoaderProps> = ({
  message,
  iconClassName,
  parentTagClassName,
  messageClassName
}) => {
  return (
    <div className={`${parentTagClassName} horizontal-element-wrapper`}>
      <CircularProgress
        className={iconClassName}
        size={18}
        aria-label="Loading Spinner"
        data-testid="loader"
      />
      <div className={messageClassName}>{message ? message : ''}</div>
    </div>
  );
};

export default LoadingSpinner;

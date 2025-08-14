import { CircularProgress } from '@mui/material';
import React from 'react';
import { LoaderProps } from '../../../interfaces/CommonInterface';

const Loader: React.FC<LoaderProps> = ({
  message,
  iconClassName,
  parentTagClassName
}) => {
  return (
    <div className={parentTagClassName}>
      <CircularProgress
        className={iconClassName}
        size={18}
        aria-label="Loading Spinner"
        data-testid="loader"
      />
      {message || ''}
    </div>
  );
};

export default Loader;

 
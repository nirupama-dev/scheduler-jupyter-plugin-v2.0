
import { CircularProgress } from '@mui/material';
import React from 'react';
import { LoaderProps } from '../../../interfaces/CommonInterface';

const Loader: React.FC<LoaderProps> = ({ message }) => {
  return (
    <div className="spin-loader-main spin-loader-listing">
      <CircularProgress
        className="spin-loader-custom-style"
        size={18}
        aria-label="Loading Spinner"
        data-testid="loader"
      />
      {message}
    </div>
  );
};

export default Loader;
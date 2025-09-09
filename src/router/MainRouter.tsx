import React from 'react';
import { SchedulerRoutes } from './SchedulerRoutes';
import { ISchedulerRoutesProps } from '../interfaces/CommonInterface';
import { SchedulerProvider } from '../context/vertex/SchedulerProvider';

export const MainRouter: React.FC<
  ISchedulerRoutesProps
> = schedulerRouteProps => {
  return (
    <SchedulerProvider>
      <SchedulerRoutes {...schedulerRouteProps} />
    </SchedulerProvider>
  );
};

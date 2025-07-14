import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { IThemeManager } from '@jupyterlab/apputils';
import { SchedulerRoutes } from '../../router/SchedulerRoutes';
import { SchedulerWidget } from '../common/widget/SchedulerWidget';
 
export class NotebookScheduler extends SchedulerWidget {
  private initialRoute: string;
 
  constructor(themeManager: IThemeManager, initialRoute: string = '/list') {
    super(themeManager);
    this.initialRoute = initialRoute;
  }
 
  protected renderInternal(): React.ReactElement {
    return (
      <MemoryRouter initialEntries={[this.initialRoute]}>
        <SchedulerRoutes />
      </MemoryRouter>
    );
  }
}
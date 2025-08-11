/**
 * @license
 * Copyright 2025 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * React component that defines the Notebook Scheduler widget.
 * It uses MemoryRouter to handle routing within the JupyterLab environment.
 * I wraps the SchedulerRoutes component to provide the necessary routing context.
 */

import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { ISessionContext, IThemeManager } from '@jupyterlab/apputils';
import { SchedulerRoutes } from '../../router/SchedulerRoutes';
import { SchedulerWidget } from '../common/widget/SchedulerWidget';
import { JupyterLab } from '@jupyterlab/application';
import { INotebookKernalSchdulerDefaults } from '../../interfaces/CommonInterface';

export class NotebookScheduler extends SchedulerWidget {
  private app: JupyterLab;
  private initialRoute: string;
  private sessionContext?: ISessionContext | undefined | null;
  private initialKernalSchedulerDetails?:
    | INotebookKernalSchdulerDefaults
    | null
    | undefined;

  constructor(
    themeManager: IThemeManager,
    app: JupyterLab,
    initialRoute: string = '/list',
    sessionContext?: ISessionContext | undefined | null,
    initialKernalSchedulerDetails?:
      | INotebookKernalSchdulerDefaults
      | null
      | undefined
  ) {
    super(themeManager);
    this.initialRoute = initialRoute;
    this.app = app;
    this.sessionContext = sessionContext;
    this.initialKernalSchedulerDetails =
      initialKernalSchedulerDetails || null || undefined;
  }
  protected renderInternal(): React.ReactElement {
    return (
      <MemoryRouter initialEntries={[this.initialRoute]}>
        <SchedulerRoutes
          app={this.app}
          sessionContext={this.sessionContext}
          initialKernalSchedulerDetails={this.initialKernalSchedulerDetails}
        />
      </MemoryRouter>
    );
  }
}

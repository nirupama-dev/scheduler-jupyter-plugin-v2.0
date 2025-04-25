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

import {
  JupyterFrontEnd,
  JupyterFrontEndPlugin,
  JupyterLab
} from '@jupyterlab/application';

import { ISettingRegistry } from '@jupyterlab/settingregistry';
import { MainAreaWidget, IThemeManager } from '@jupyterlab/apputils';
import { ILauncher } from '@jupyterlab/launcher';
import { iconCluster, iconScheduledNotebooks } from './utils/Icons';
import { AuthLogin } from './login/AuthLogin';
import { NotebookScheduler } from './scheduler/NotebookScheduler';
import { NotebookButtonExtension } from './controls/NotebookButtonExtension';
import { TITLE_LAUNCHER_CATEGORY } from './utils/Const';

/**
 * Initialization data for the scheduler-jupyter-plugin extension.
 */
const plugin: JupyterFrontEndPlugin<void> = {
  id: 'scheduler-jupyter-plugin:plugin',
  description: 'A JupyterLab extension.',
  autoStart: true,
  optional: [ISettingRegistry, IThemeManager, ILauncher],
  activate: async (
    app: JupyterFrontEnd,
    settingRegistry: ISettingRegistry | null,
    themeManager: IThemeManager,
    launcher: ILauncher
  ) => {
    console.log('JupyterLab extension scheduler-jupyter-plugin is activated!');

    const { commands } = app;

    const createAuthLoginComponentCommand =
      'cloud-scheduler-settings:configure';
    commands.addCommand(createAuthLoginComponentCommand, {
      label: 'Google Scheduler Settings',
      execute: () => {
        const content = new AuthLogin(
          app as JupyterLab,
          launcher as ILauncher,
          settingRegistry as ISettingRegistry,
          themeManager
        );
        const widget = new MainAreaWidget<AuthLogin>({ content });
        widget.title.label = 'Config Setup';
        widget.title.icon = iconCluster;
        app.shell.add(widget, 'main');
      }
    });

    const createNotebookJobsComponentCommand = 'create-notebook-jobs-component';
    commands.addCommand(createNotebookJobsComponentCommand, {
      caption: 'Scheduled Jobs',
      label: 'Scheduled Jobs',
      icon: iconScheduledNotebooks,
      execute: () => {
        const content = new NotebookScheduler(
          app as JupyterLab,
          themeManager,
          settingRegistry as ISettingRegistry,
          ''
        );
        const widget = new MainAreaWidget<NotebookScheduler>({ content });
        widget.title.label = 'Scheduled Jobs';
        widget.title.icon = iconScheduledNotebooks;
        app.shell.add(widget, 'main');
      }
    });

    app.docRegistry.addWidgetExtension(
      'Notebook',
      new NotebookButtonExtension(
        app as JupyterLab,
        settingRegistry as ISettingRegistry,
        launcher,
        themeManager
      )
    );

    if (launcher) {
      launcher.add({
        command: createNotebookJobsComponentCommand,
        category: TITLE_LAUNCHER_CATEGORY,
        rank: 4
      });
    }
  }
};

export default plugin;

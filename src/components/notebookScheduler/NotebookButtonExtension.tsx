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

import { JupyterLab } from '@jupyterlab/application';
// import { ISettingRegistry } from '@jupyterlab/settingregistry';
// import { ILauncher } from '@jupyterlab/launcher';
import { IThemeManager, MainAreaWidget } from '@jupyterlab/apputils';
import { NotebookPanel, INotebookModel } from '@jupyterlab/notebook';
import { DocumentRegistry } from '@jupyterlab/docregistry';
import { IDisposable } from '@lumino/disposable';
import { ToolbarButton } from '@jupyterlab/apputils';
import { NotebookScheduler } from './NotebookScheduler';

export class NotebookButtonExtension
  implements DocumentRegistry.IWidgetExtension<NotebookPanel, INotebookModel>
{
  constructor(
    private app: JupyterLab,
    // private settingRegistry: ISettingRegistry,
    // private launcher: ILauncher,
    private themeManager: IThemeManager
  ) {}

  createNew(
    panel: NotebookPanel,
    context: DocumentRegistry.IContext<INotebookModel>
  ): IDisposable {
    const button = new ToolbarButton({
      label: 'Schedule Job',
      onClick: () => {
        const content = new NotebookScheduler(this.themeManager, '/create');
        const widget = new MainAreaWidget({ content });
        widget.title.label = 'Create Scheduled Job';
        this.app.shell.add(widget, 'main');
      },
      tooltip: 'Schedule this notebook as a job'
    });
    panel.toolbar.insertItem(1000, 'notebookScheduler', button);
    return button;
  }
}

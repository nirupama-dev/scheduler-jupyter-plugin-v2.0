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

import { ISessionContext, IThemeManager, MainAreaWidget } from '@jupyterlab/apputils';
import { NotebookPanel, INotebookModel } from '@jupyterlab/notebook';
import { DocumentRegistry } from '@jupyterlab/docregistry';
import { IDisposable } from '@lumino/disposable';
import { ToolbarButton } from '@jupyterlab/apputils';
import { NotebookScheduler } from './NotebookScheduler';
import { iconNotebookScheduler } from '../../utils/Icons';
import {
  showDialog, 
  Dialog 
} from '@jupyterlab/apputils';
import { getDefaultSchedulerTypeOnLoad } from '../../utils/SchedulerKernalUtil';
import { INotebookKernalSchdulerDefaults } from '../../interfaces/CommonInterface'; 


export class NotebookButtonExtension
  implements DocumentRegistry.IWidgetExtension<NotebookPanel, INotebookModel>
{
  constructor(
    private app: JupyterLab,
    private themeManager: IThemeManager,
    private schedulerButton: ToolbarButton | null  // Store a reference to the button
  ) {
    this.app = app;
    this.themeManager = themeManager;
    this.schedulerButton= schedulerButton
  }

  createNew(
    panel: NotebookPanel,
    context: DocumentRegistry.IContext<INotebookModel>
  ): IDisposable {
    const button = new ToolbarButton({
      icon: iconNotebookScheduler,
      onClick: async () => { // Make onClick async to await onNotebookSchedulerButtonClick
        // Ensure the button reference is available before proceeding
        if (!this.schedulerButton) {
            console.error('Scheduler button reference not found in onClick. This should not happen after assignment.');
            return;
        }
        await this.onNotebookSchedulerButtonClick(context.sessionContext)
    
      },
      tooltip: 'Schedule this notebook as a job'
    });
    panel.toolbar.insertItem(1000, 'notebookScheduler', button);
    this.schedulerButton = button; // Store the reference to the button
    return button;
  }

 // Pass sessionContext as an argument because `this.context` is not available in this class directly
 private onNotebookSchedulerButtonClick = async (sessionContext: ISessionContext): Promise<void> => {
    // Ensure the button is present before attempting to modify it
    if (!this.schedulerButton) {
      console.error('Scheduler button not initialized.');
      return;
    }
    
    let initialKernalSchedulerDetails: INotebookKernalSchdulerDefaults | null = null;
    let hasError = false;

    try {
      // Pre-fetch the initial kernel details
      initialKernalSchedulerDetails = (await getDefaultSchedulerTypeOnLoad(sessionContext)).kernalAndSchedulerDetails;
      console.log('Prefetched Initial Scheduler Details for button:', initialKernalSchedulerDetails);

    } catch (error) {
      console.error('Failed to pre-fetch initial scheduler details:', error);
      hasError = true;
      // Show an error dialog to the user
      await showDialog({
        title: 'Error Scheduling Notebook',
        body: `Failed to load scheduler configurations. Please check your network connection and permissions. Error: ${error}`,
        buttons: [Dialog.okButton()]
      });
    } finally {
      // 3. Revert button state regardless of success or failure
      this.schedulerButton.title.icon = iconNotebookScheduler;
      this.schedulerButton.title.iconClass = '';
      this.schedulerButton.node.classList.remove('jp-mod-inprogress');
      this.schedulerButton.enabled = true;
    }

    // 4. Only proceed to open the form if successful
    if (initialKernalSchedulerDetails && !hasError) {
      const content = new NotebookScheduler(
        this.themeManager,
        this.app,
        '/create',
        sessionContext, // Pass sessionContext
        initialKernalSchedulerDetails // Pass the pre-fetched data
      );
      const widget = new MainAreaWidget({ content });
      widget.title.label = 'Create Scheduled Job';
      widget.title.icon = iconNotebookScheduler;
      this.app.shell.add(widget, 'main');
    }
  }
}
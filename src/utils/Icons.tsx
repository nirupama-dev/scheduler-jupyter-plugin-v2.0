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

import { LabIcon } from '@jupyterlab/ui-components';
import LeftArrowIcon from '../../style/icons/left_arrow_icon.svg';
import notebookSchedulerIcon from '../../style/icons/scheduler_calendar_month.svg';
import ScheduledNotebooksIcon from '../../style/icons/scheduled_notebooks_icon.svg';
import playIcon from '../../style/icons/scheduler_play.svg';
import pauseIcon from '../../style/icons/scheduler_pause.svg';
import triggerIcon from '../../style/icons/scheduler_trigger.svg';
import EditIconDisable from '../../style/icons/scheduler_edit_dag.svg';
import deleteIcon from '../../style/icons/scheduler_delete.svg';
import EditNotebookIcon from '../../style/icons/scheduler_edit_calendar.svg';

export const iconLeftArrow = new LabIcon({
  name: 'launcher:left-arrow-icon',
  svgstr: LeftArrowIcon
});

export const iconNotebookScheduler = new LabIcon({
  name: 'launcher:notebook-scheduler-icon',
  svgstr: notebookSchedulerIcon
});

export const iconScheduledNotebooks = new LabIcon({
  name: 'launcher:scheduled-notebooks-icon',
  svgstr: ScheduledNotebooksIcon
});

export const iconPlay = new LabIcon({
  name: 'launcher:play-icon',
  svgstr: playIcon
});

export const iconPause = new LabIcon({
  name: 'launcher:pause-icon',
  svgstr: pauseIcon
});

export const iconTrigger = new LabIcon({
  name: 'launcher:trigger-icon',
  svgstr: triggerIcon
});

export const iconEditDag = new LabIcon({
  name: 'launcher:edit-disable-icon',
  svgstr: EditIconDisable
});

export const iconDelete = new LabIcon({
  name: 'launcher:delete-icon',
  svgstr: deleteIcon
});

export const iconEditNotebook = new LabIcon({
  name: 'launcher:edit-notebook-icon',
  svgstr: EditNotebookIcon
});

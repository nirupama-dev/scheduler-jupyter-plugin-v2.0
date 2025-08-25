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
import PlayIcon from '../../style/icons/scheduler_play.svg';
import PauseIcon from '../../style/icons/scheduler_pause.svg';
import TriggerIcon from '../../style/icons/scheduler_trigger.svg';
import EditIconDisable from '../../style/icons/scheduler_edit_dag.svg';
import DeleteIconLarge from '../../style/icons/scheduler_delete.svg';
import EditNotebookIcon from '../../style/icons/scheduler_edit_calendar.svg';
import ErrorIcon from '../../style/icons/error_icon.svg';
import DashIcon from '../../style/icons/dash_icon_jupyter.svg';
import CompletedIcon from '../../style/icons/dag_task_success_icon.svg';
import FailedIcon from '../../style/icons/list_error_icon.svg';
import pendingIcon from '../../style/icons/pending_icon.svg';
import ActiveIcon from '../../style/icons/list_active_icon.svg';
import ListPauseIcon from '../../style/icons/list_pause_icon.svg';
import ListCompleteWithErrorIcon from '../../style/icons/list_completed_with_error.svg';
import DeleteIconSmall from '../../style/icons/delete_icon.svg';
import PreviousIcon from '../../style/icons/previous_page.svg';
import NextIcon from '../../style/icons/next_page.svg';
import expandLessIcon from '../../style/icons/expand_less.svg';
import expandMoreIcon from '../../style/icons/expand_more.svg';
import createClusterIcon from '../../style/icons/create_cluster_icon.svg';
import SuccessCircleIcon from '../../style/icons/success-circle-icon.svg';
import FailedCircleIcon from '../../style/icons/failed-circle-icon.svg';
import OrangeCircle from '../../style/icons/orange_icon.svg';
import GreyCircle from '../../style/icons/grey_icon.svg';
import downloadIcon from '../../style/icons/scheduler_download.svg';

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
  svgstr: PlayIcon
});

export const iconPause = new LabIcon({
  name: 'launcher:pause-icon',
  svgstr: PauseIcon
});

export const iconTrigger = new LabIcon({
  name: 'launcher:trigger-icon',
  svgstr: TriggerIcon
});

export const iconEditDag = new LabIcon({
  name: 'launcher:edit-disable-icon',
  svgstr: EditIconDisable
});

export const iconDeleteAction = new LabIcon({
  name: 'launcher:delete-icon',
  svgstr: DeleteIconLarge
});

export const iconEditNotebook = new LabIcon({
  name: 'launcher:edit-notebook-icon',
  svgstr: EditNotebookIcon
});

export const iconError = new LabIcon({
  name: 'launcher:error-icon',
  svgstr: ErrorIcon
});

export const iconDash = new LabIcon({
  name: 'launcher:dash-icon',
  svgstr: DashIcon
});

export const iconSuccess = new LabIcon({
  name: 'launcher:success-icon',
  svgstr: CompletedIcon
});

export const iconFailed = new LabIcon({
  name: 'launcher:failed-icon',
  svgstr: FailedIcon
});

export const iconPending = new LabIcon({
  name: 'launcher:pending-icon',
  svgstr: pendingIcon
});

export const iconActive = new LabIcon({
  name: 'launcher:active-icon',
  svgstr: ActiveIcon
});

export const iconListPause = new LabIcon({
  name: 'launcher:list-pause-icon',
  svgstr: ListPauseIcon
});

export const iconListCompleteWithError = new LabIcon({
  name: 'launcher:list-complete-icon',
  svgstr: ListCompleteWithErrorIcon
});

export const iconDeleteProperty = new LabIcon({
  name: 'launcher:delete-icon',
  svgstr: DeleteIconSmall
});

export const iconPrevious = new LabIcon({
  name: 'launcher:previous-icon',
  svgstr: PreviousIcon
});

export const iconNext = new LabIcon({
  name: 'launcher:next-icon',
  svgstr: NextIcon
});

export const iconExpandLess = new LabIcon({
  name: 'launcher:expand-less-icon',
  svgstr: expandLessIcon
});

export const iconExpandMore = new LabIcon({
  name: 'launcher:expand-more-icon',
  svgstr: expandMoreIcon
});

export const iconCreateCluster = new LabIcon({
  name: 'launcher:create-cluster-icon',
  svgstr: createClusterIcon
});

export const IconSuccessCircle = new LabIcon({
  name: 'launcher:success-circle-icon',
  svgstr: SuccessCircleIcon
});

export const IconFailedCircle = new LabIcon({
  name: 'launcher:failed-circle-icon',
  svgstr: FailedCircleIcon
});

export const IconOrangeCircle = new LabIcon({
  name: 'launcher:orange-circle-icon',
  svgstr: OrangeCircle
});

export const IconGreyCircle = new LabIcon({
  name: 'launcher:grey-circle-icon',
  svgstr: GreyCircle
});

export const iconDownload = new LabIcon({
  name: 'launcher:download-icon',
  svgstr: downloadIcon
});

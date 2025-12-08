/**
 * @license
 * Copyright 2023 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
/**
 * Pagination View component for tables.
 */
import React from 'react';
import { Select } from './MuiWrappedSelect';
import { ActionButton } from '../button/ActionButton';
import { iconNext, iconPrevious } from '../../../utils/Icons';
import { IDagRunList } from '../../../interfaces/ComposerInterface';

interface ITemplate {
  title: string;
  category: string;
  description: string;
}

interface IDagList {
  jobid: string;
  notebookname: string;
  schedule: string;
  scheduleInterval: string;
}

interface IVertexDagList {
  displayName: string;
  schedule: string;
  status: string;
}

interface IPaginationViewProps {
  pageSize: number;
  setPageSize: (value: number) => void;
  pageIndex: number;
  allData: ITemplate[] | IDagList[] | IVertexDagList[] | IDagRunList[];
  previousPage: () => void;
  nextPage: () => void;
  canPreviousPage: boolean;
  canNextPage: boolean;
  scheduleSelected?: string;
}

export const PaginationView = ({
  pageSize,
  setPageSize,
  pageIndex,
  allData,
  previousPage,
  nextPage,
  canPreviousPage,
  canNextPage,
  scheduleSelected
}: IPaginationViewProps) => {
  return (
    <div className="pagination-parent-view">
      {!scheduleSelected && (
        <>
          <div>Rows per page: </div>
          <Select
            className="page-size-selection"
            value={pageSize.toString()}
            onChange={(e, { value }) => {
              const selectedPageSize = parseInt(value as string, 10);
              setPageSize(selectedPageSize);
            }}
            options={[
              { key: '50', value: '50', text: '50' },
              { key: '100', value: '100', text: '100' },
              { key: '200', value: '200', text: '200' }
            ]}
          />
        </>
      )}

      {(pageIndex + 1) * pageSize > allData.length ? (
        <div className="page-display-part">
          {pageIndex * pageSize + 1} - {allData.length} of {allData.length}
        </div>
      ) : (
        <div className="page-display-part">
          {pageIndex * pageSize + 1} - {(pageIndex + 1) * pageSize} of{' '}
          {allData.length}
        </div>
      )}

      <ActionButton
        title="Previous Page"
        onClick={() => previousPage()}
        icon={iconPrevious}
        disabled={!canPreviousPage}
        className="page-move-button"
      />
      <ActionButton
        title="Next Page"
        onClick={() => nextPage()}
        icon={iconNext}
        disabled={!canNextPage}
        className="page-move-button"
      />
    </div>
  );
};

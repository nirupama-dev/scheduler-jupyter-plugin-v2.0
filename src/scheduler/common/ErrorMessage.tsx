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
import React from 'react';
import { iconError } from '../../utils/Icons';

interface IErrorMessageInterface {
  message: string;
  showIcon?: boolean;
  errorWidth?: boolean;
}

const ErrorMessage: React.FC<IErrorMessageInterface> = ({
  message,
  showIcon = true,
  errorWidth = false
}) => {
  return (
    <div
      className={
        errorWidth ? 'error-key-parent error-key-wrapper' : 'error-key-parent'
      }
    >
      {showIcon && (
        <iconError.react tag="div" className="logo-alignment-style" />
      )}
      <div className="error-key-missing">{message}</div>
    </div>
  );
};

export default ErrorMessage;

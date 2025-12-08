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
 * Component to render JupyterLab LabIcon instances.
 */

import React, { FC } from 'react';
import { LabIcon } from '@jupyterlab/ui-components';

interface ILabIconComponentProps {
  icon: LabIcon;
  className?: string;
  tag?: 'div' | 'span';
}

export const LabIconComponent: FC<ILabIconComponentProps> = ({
  icon,
  className,
  tag = 'div'
}) => {
  // Check for the existence of the icon and its SVG string
  if (!icon || !icon.svgstr) {
    console.error(
      'Invalid LabIcon instance provided: Missing icon object or svgstr',
      icon
    );
    return null;
  }

  // Final Solution: Render the SVG string directly.
  // This bypasses the problematic `.react()` method call.
  return (
    <div
      className={className}
      dangerouslySetInnerHTML={{ __html: icon.svgstr }}
    />
  );
};

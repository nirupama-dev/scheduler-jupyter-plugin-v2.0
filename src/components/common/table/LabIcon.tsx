import React, { FC } from 'react';
import { LabIcon } from '@jupyterlab/ui-components';

interface LabIconComponentProps {
  icon: LabIcon;
  className?: string;
  tag?: 'div' | 'span';
}

export const LabIconComponent: FC<LabIconComponentProps> = ({
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
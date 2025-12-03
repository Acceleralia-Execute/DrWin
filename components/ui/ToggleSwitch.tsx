import React, { useState } from 'react';
import { cn } from '../../lib/utils';

interface ToggleSwitchProps {
    checked?: boolean;
    onCheckedChange?: (checked: boolean) => void;
    defaultChecked?: boolean;
}

export const ToggleSwitch: React.FC<ToggleSwitchProps> = ({ checked, onCheckedChange, defaultChecked = false }) => {
  const [internalChecked, setInternalChecked] = useState(defaultChecked);

  const isControlled = checked !== undefined;
  const currentChecked = isControlled ? checked : internalChecked;

  const handleClick = () => {
    const newChecked = !currentChecked;
    if (isControlled) {
      onCheckedChange?.(newChecked);
    } else {
      setInternalChecked(newChecked);
      onCheckedChange?.(newChecked);
    }
  };

  return (
    <button
      type="button"
      role="switch"
      aria-checked={currentChecked}
      onClick={handleClick}
      className={cn(
        'relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
        currentChecked ? 'bg-primary' : 'bg-input'
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          'pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out',
          currentChecked ? 'translate-x-5' : 'translate-x-0'
        )}
      />
    </button>
  );
};

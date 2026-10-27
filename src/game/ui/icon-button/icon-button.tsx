'use client';

import {
  forwardRef,
  type ButtonHTMLAttributes,
  type ReactNode,
  type Ref,
} from 'react';

import type { GameButtonSize, GameButtonVariant } from '../button/button';
import '../button/button.style.css';
import './icon-button.style.css';

export type IconButtonProps = Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  'children'
> & {
  /** The icon element rendered inside the square button. */
  icon: ReactNode;
  /** Required accessible name for icon-only controls. */
  label: string;
  variant?: GameButtonVariant;
  size?: GameButtonSize;
};

export const IconButton = forwardRef(function IconButton(
  {
    className,
    icon,
    label,
    size = 'medium',
    variant = 'primary',
    type = 'button',
    ...props
  }: IconButtonProps,
  ref: Ref<HTMLButtonElement>,
) {
  return (
    <button
      {...props}
      ref={ref}
      aria-label={label}
      className={[
        'game-button',
        'game-icon-button',
        `game-button--${variant}`,
        `game-button--${size}`,
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      type={type}
    >
      <span aria-hidden="true" className="game-icon-button__icon">
        {icon}
      </span>
    </button>
  );
});

IconButton.displayName = 'GameIconButton';

export default IconButton;

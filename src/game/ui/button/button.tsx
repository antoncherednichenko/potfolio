'use client';

import { forwardRef, type ButtonHTMLAttributes, type Ref } from 'react';

import './button.style.css';

export type GameButtonVariant = 'primary' | 'secondary' | 'ghost';
export type GameButtonSize = 'small' | 'medium' | 'large';

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  /** Visual treatment from the game palette. */
  variant?: GameButtonVariant;
  /** Pixel spacing preset. */
  size?: GameButtonSize;
  /** Makes the button fill its parent width. */
  fullWidth?: boolean;
};

function joinClasses(...classes: Array<string | false | undefined>) {
  return classes.filter(Boolean).join(' ');
}

export const Button = forwardRef(function Button(
  {
    children,
    className,
    variant = 'primary',
    size = 'medium',
    fullWidth = false,
    type = 'button',
    ...props
  }: ButtonProps,
  ref: Ref<HTMLButtonElement>,
) {
  return (
    <button
      {...props}
      ref={ref}
      type={type}
      className={joinClasses(
        'game-button',
        `game-button--${variant}`,
        `game-button--${size}`,
        fullWidth && 'game-button--full-width',
        className,
      )}
    >
      <span className="game-button__label">{children}</span>
    </button>
  );
});

Button.displayName = 'GameButton';

export default Button;

import type { ButtonHTMLAttributes } from 'react'
import './Button.css'

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'ghost'
}

export function Button({ variant = 'primary', className = '', ...rest }: ButtonProps) {
  return <button className={`btn btn--${variant} ${className}`} {...rest} />
}

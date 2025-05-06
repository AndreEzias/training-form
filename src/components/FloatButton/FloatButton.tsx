import React, { ReactNode } from 'react';
import './FloatButton.css';

interface FloatButtonProps {
  onClick?: () => void;
  children: ReactNode;
  backgroundColor?: string;
  color?: string;
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  order?: number; // Nova propriedade para controlar a ordem dos bot�es
}

const FloatButton: React.FC<FloatButtonProps> = ({
  onClick,
  children,
  backgroundColor = '#007bff',
  color = 'white',
  size = 'medium',
  disabled = false,
  order = 0 // Valor padrão para order
}) => {
  const sizeMap = {
    small: 40,
    medium: 56,
    large: 64
  };

  const buttonSize = sizeMap[size];

  const topOffset = order > 0 ? (order * buttonSize) - 20  : 0;

  return (
    <button
      className="float-button"
      onClick={onClick}
      disabled={disabled}
      style={{
        backgroundColor,
        color,
        width: `${buttonSize}px`,
        height: `${buttonSize}px`,
        bottom: `${topOffset}px`
      }}
    >
      {children}
    </button>
  );
};

export default FloatButton;

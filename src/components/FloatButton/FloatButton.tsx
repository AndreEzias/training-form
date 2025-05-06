import React, { ReactNode } from 'react';
import './FloatButton.css';

interface FloatButtonProps {
  onClick?: () => void;
  children: ReactNode;
  backgroundColor?: string;
  color?: string;
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
}

const FloatButton: React.FC<FloatButtonProps> = ({
  onClick,
  children,
  backgroundColor = '#007bff',
  color = 'white',
  size = 'medium',
  disabled = false
}) => {
  const sizeMap = {
    small: '40px',
    medium: '56px',
    large: '64px'
  };

  const buttonSize = sizeMap[size];

  return (
    <button
      className="float-button"
      onClick={onClick}
      disabled={disabled}
      style={{
        backgroundColor,
        color,
        width: buttonSize,
        height: buttonSize
      }}
    >
      {children}
    </button>
  );
};

export default FloatButton;

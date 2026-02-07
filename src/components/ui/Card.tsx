import React from 'react';

interface CardProps {
  children: React.ReactNode;
  title?: string;
  className?: string;
  onClick?: () => void;
}

const Card: React.FC<CardProps> = ({
  children,
  title,
  className = '',
  onClick
}) => {
  const baseClasses = 'card';
  const clickableClass = onClick ? 'card-clickable' : '';

  return (
    <div
      className={`${baseClasses} ${clickableClass} ${className}`}
      onClick={onClick}
    >
      {title && <div className="card-title">{title}</div>}
      <div className="card-content">{children}</div>
    </div>
  );
};

export default Card;
import React from 'react';
import { useDrop } from 'react-dnd';

export interface DropZoneProps {
  target: string;
  onDrop: (target: string) => void;
  children: React.ReactNode;
}

const DropZone: React.FC<DropZoneProps> = ({ target, onDrop, children }) => {
  const [{ isOver }, drop] = useDrop({
    accept: 'WORD',
    drop: () => {
      onDrop(target);
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
    }),
  });

  // const backgroundColor = isOver ? '#b0e0a8' : 'transparent';

  return (
    <div
      ref={drop}
      className={`option-circle ${target === 'dontknow' ? 'dont-know' : ''} ${isOver ? 'hovered' : ''}`}
    >
      {children}
    </div>
  );
};

export default DropZone;

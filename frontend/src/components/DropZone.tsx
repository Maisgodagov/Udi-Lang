import React from 'react';
import { useDrop } from 'react-dnd';

export interface DropZoneProps {
  target: string;  // текст, который соответствует варианту ответа либо "dontknow"
  onDrop: (target: string) => void;
  children: React.ReactNode;
}

const DropZone: React.FC<DropZoneProps> = ({ target, onDrop, children }) => {
  const [{ isOver, canDrop }, drop] = useDrop({
    accept: 'WORD',
    drop: () => {
      onDrop(target);
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
      canDrop: monitor.canDrop(),
    }),
  });

  const backgroundColor = isOver
    ? '#b0e0a8'
    : '#a4c3b2';

  return (
    <div
      ref={drop}
      className={`option-circle ${target === 'dontknow' ? 'dont-know' : ''}`}
      style={{ backgroundColor }}
    >
      {children}
    </div>
  );
};

export default DropZone;

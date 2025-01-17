import React from 'react';
import { useDrag } from 'react-dnd';

export interface DraggableWordProps {
  word: string;
}

const DraggableWord: React.FC<DraggableWordProps> = ({ word }) => {
  const [{ isDragging }, drag] = useDrag({
    type: 'WORD',
    item: { word },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  return (
    <div
      ref={drag}
      className="center-circle"
      style={{ opacity: isDragging ? 0.5 : 1 }}
    >
      {word}
    </div>
  );
};

export default DraggableWord;

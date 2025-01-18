import React from 'react';
import { useDrag } from 'react-dnd';

interface DraggableWordProps {
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
      style={{
        opacity: isDragging ? 0.6 : 1,
        transform: isDragging ? 'scale(1.1)' : 'none',
        transition: 'transform 0.2s, opacity 0.2s'
      }}
    >
      {word}
    </div>
  );
};

export default DraggableWord;

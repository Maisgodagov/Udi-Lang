// DraggableWord.tsx
import React, { useEffect } from 'react';
import { useDrag } from 'react-dnd';
import { getEmptyImage } from 'react-dnd-html5-backend';

interface DraggableWordProps {
  word: string;
}

const DraggableWord: React.FC<DraggableWordProps> = ({ word }) => {
  const [{ isDragging }, drag, preview] = useDrag({
    type: 'WORD',
    item: { word },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  // useEffect(() => {
  //   // Задаем пустой preview, чтобы скрыть стандартный ghost image
  //   preview(getEmptyImage(), { captureDraggingState: true });
  // }, [preview]);

  return (
    <div
      ref={drag}
      className="center-circle"
      style={{ opacity: isDragging ? 0 : 1 }}  // полностью скрываем исходный элемент при drag
    >
      {word}
    </div>
  );
};

export default DraggableWord;

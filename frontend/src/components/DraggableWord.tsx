import React, { useRef } from 'react';
import { useDrag } from 'react-dnd';

interface DraggableWordProps {
  word: string;
  setInitialRect: (rect: DOMRect) => void;
}

const DraggableWord: React.FC<DraggableWordProps> = ({ word, setInitialRect }) => {
  const ref = useRef<HTMLDivElement>(null);

  const [{ isDragging }, drag] = useDrag({
    type: 'WORD',
    // Функция item получает monitor, и мы вычисляем dragOffset,
    // который показывает, где относительно элемента пользователь схватил его
    item: (monitor) => {
      if (ref.current) {
        const rect = ref.current.getBoundingClientRect();
        setInitialRect(rect);
        const initialClientOffset = monitor.getInitialClientOffset();
        let dragOffset = { x: rect.width / 2, y: rect.height / 2 }; // значение по умолчанию
        if (initialClientOffset) {
          dragOffset = {
            x: initialClientOffset.x - rect.left,
            y: initialClientOffset.y - rect.top,
          };
        }
        return { word, dragOffset };
      }
      return { word, dragOffset: { x: 0, y: 0 } };
    },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  return (
    <div ref={drag} className="center-circle" style={{ opacity: isDragging ? 0 : 1 }}>
      {word}
    </div>
  );
};

export default DraggableWord;

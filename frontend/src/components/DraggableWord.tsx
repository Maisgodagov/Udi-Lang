import React, { useRef, useEffect } from 'react';
import { useDrag } from 'react-dnd';

interface DraggableWordProps {
  word: string;
  setInitialRect: (rect: DOMRect) => void;
}

const DraggableWord: React.FC<DraggableWordProps> = ({ word, setInitialRect }) => {
  const ref = useRef<HTMLDivElement>(null);
  const [{ isDragging }, drag] = useDrag({
    type: 'WORD',
    item: { word },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  useEffect(() => {
    if (ref.current) {
      setInitialRect(ref.current.getBoundingClientRect());
    }
  }, [ref, setInitialRect]);

  return (
    <div ref={drag} className="center-circle" style={{ opacity: isDragging ? 0 : 1 }}>
      {word}
    </div>
  );
};

export default DraggableWord;

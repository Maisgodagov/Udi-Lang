import React, { useEffect } from 'react';
import { useDragLayer } from 'react-dnd';

const layerStyles: React.CSSProperties = {
  position: 'fixed',
  pointerEvents: 'none',
  zIndex: 100,
  left: 0,
  top: 0,
  width: '100%',
  height: '100%',
};

interface CustomDragLayerProps {
  initialRect: DOMRect | null;
}

function getItemStyles(
  currentOffset: { x: number; y: number } | null,
  dragOffset: { x: number; y: number } | undefined
) {
  if (!currentOffset || !dragOffset) {
    return { display: 'none' };
  }

  // Здесь currentOffset уже находится в координатах viewport.
  // Смещаем ghost относительно курсора, используя сохранённый dragOffset.
  const x = currentOffset.x - dragOffset.x;
  const y = currentOffset.y - dragOffset.y;

  const transform = `translate3d(${x-280}px, ${y}px, 0)`;
  return {
    transform,
    WebkitTransform: transform,
  };
}

const CustomDragLayer: React.FC<CustomDragLayerProps> = ({ initialRect }) => {
  const { itemType, isDragging, item, currentOffset } = useDragLayer((monitor) => ({
    item: monitor.getItem(),
    itemType: monitor.getItemType(),
    // Используем getClientOffset – позиция курсора относительно viewport
    currentOffset: monitor.getClientOffset(),
    isDragging: monitor.isDragging(),
  }));

  useEffect(() => {
    console.log('CustomDragLayer state:', { isDragging, itemType, currentOffset, item, initialRect });
  }, [isDragging, itemType, currentOffset, item, initialRect]);

  if (!isDragging || itemType !== 'WORD') {
    return null;
  }

  return (
    <div style={layerStyles}>
      <div style={getItemStyles(currentOffset, item?.dragOffset)}>
        <div className="center-circle custom-drag-layer">
          {item.word}
        </div>
      </div>
    </div>
  );
};

export default CustomDragLayer;

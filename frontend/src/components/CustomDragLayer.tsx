import React, { useEffect, useState } from 'react';
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

function getItemStyles(initialRect: DOMRect | null, currentOffset: { x: number; y: number } | null) {
  if (!initialRect || !currentOffset) {
    return { display: 'none' };
  }
  const ghostHalfWidth = initialRect.width / 2;
  const ghostHalfHeight = initialRect.height / 2;
  // Здесь currentOffset – это верхний левый угол перетаскиваемого элемента.
  const transform = `translate(${currentOffset.x - ghostHalfWidth}px, ${currentOffset.y - ghostHalfHeight}px)`;
  return {
    transform,
    WebkitTransform: transform,
  };
}

interface CustomDragLayerProps {
  initialRect: DOMRect | null;
}

const CustomDragLayer: React.FC<CustomDragLayerProps> = ({ initialRect }) => {
  const { itemType, isDragging, item, currentOffset } = useDragLayer(monitor => ({
    item: monitor.getItem(),
    itemType: monitor.getItemType(),
    currentOffset: monitor.getSourceClientOffset(),
    isDragging: monitor.isDragging(),
  }));

  if (!isDragging || itemType !== 'WORD') {
    return null;
  }

  return (
    <div style={layerStyles}>
      <div style={getItemStyles(initialRect, currentOffset)}>
        <div className="center-circle custom-drag-layer">
          {item.word}
        </div>
      </div>
    </div>
  );
};

export default CustomDragLayer;

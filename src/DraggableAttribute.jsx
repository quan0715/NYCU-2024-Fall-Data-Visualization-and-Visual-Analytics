import React from "react";
import { useDrag, useDrop } from "react-dnd";
import { LuGripVertical } from "react-icons/lu";
export const ItemTypes = {
  ATTRIBUTE: "attribute",
};

function DraggableAttribute({ attribute, index, moveAttribute }) {
  const ref = React.useRef(null);

  const [, drop] = useDrop({
    accept: ItemTypes.ATTRIBUTE,
    hover(item, monitor) {
      if (!ref.current) return;

      const dragIndex = item.index;
      const hoverIndex = index;

      // Don't replace items with themselves
      if (dragIndex === hoverIndex) return;

      // Determine rectangle on screen
      const hoverBoundingRect = ref.current.getBoundingClientRect();

      // Get horizontal middle
      const hoverMiddleX =
        (hoverBoundingRect.right - hoverBoundingRect.left) / 2;

      // Determine mouse position
      const clientOffset = monitor.getClientOffset();

      // Get pixels to the left
      const hoverClientX = clientOffset.x - hoverBoundingRect.left;

      // Only perform the move when the mouse has crossed half of the item's width
      // Dragging right
      if (dragIndex < hoverIndex && hoverClientX < hoverMiddleX) return;

      // Dragging left
      if (dragIndex > hoverIndex && hoverClientX > hoverMiddleX) return;

      // Perform the move
      moveAttribute(dragIndex, hoverIndex);

      // Mutate the item index
      item.index = hoverIndex;
    },
  });

  const [{ isDragging }, drag] = useDrag({
    type: ItemTypes.ATTRIBUTE,
    item: { type: ItemTypes.ATTRIBUTE, attribute, index },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  drag(drop(ref));

  const opacity = isDragging ? 0.5 : 1;

  return (
    <div
      ref={ref}
      style={{
        display: "flex",
        alignItems: "center",
        padding: "8px 12px",
        backgroundColor: "#f0f0f0",
        borderRadius: "8px",
        cursor: "move",
        userSelect: "none",
        opacity,
        marginRight: "12px",
        fontSize: "14px",
        fontWeight: "bold",
        textTransform: "capitalize",
      }}
    >
      <LuGripVertical />
      {attribute}
    </div>
  );
}

export default DraggableAttribute;

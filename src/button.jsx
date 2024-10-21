import React, { useState, useRef, useEffect } from "react";
export function ChartButton({
  text,
  onClick,
  disabled,
  className,
  style,
  type,
  icon,
  iconPosition,
  iconStyle,
  iconClassName,
  children,
  ...props
}) {
  const [isHover, setHoverState] = useState(false);
  return (
    <button
      //   ref={ref}
      style={{
        border: "none",
        color: "black",
        padding: "4px 12px",
        borderRadius: "12px",
        textAlign: "center",
        textDecoration: "none",
        display: "inline-block",
        cursor: isHover ? "pointer" : "default",
        border: !isHover ? "none" : "1px solid #ccc",
      }}
      onMouseEnter={() => setHoverState(true)}
      onMouseLeave={() => setHoverState(false)}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

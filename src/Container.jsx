import React, {
  useContext,
  createContext,
  useRef,
  forwardRef,
  useEffect,
} from "react";
import * as d3 from "d3";

const ContainerContext = createContext();

export function useContainerSize() {
  const { width, height, margin } = useContext(ContainerContext);

  if (!width || !height || !margin) {
    throw new Error("Container size must be provided");
  }

  return {
    width,
    height,
    margin,
  };
}

function axisDirection(direction) {
  switch (direction) {
    case "top":
      return d3.axisTop;
    case "bottom":
      return d3.axisBottom;
    case "left":
      return d3.axisLeft;
    case "right":
      return d3.axisRight;
    default:
      return d3.axisBottom;
  }
}

export const XAxis = forwardRef(function XAxis({ scale, ...props }, ref) {
  const { width, height, margin } = useContainerSize();
  const direction = props.direction || "bottom";
  const axisRef = useRef();

  useEffect(() => {
    d3.select(axisRef.current).call(axisDirection(direction)(scale));
  }, [scale]);

  function horizontalTransform(direction) {
    switch (direction) {
      case "top":
        return `translate(${margin.left}, ${margin.top})`;
      case "bottom":
        return `translate(${margin.left}, ${height - margin.bottom})`;
      default:
        return `translate(${margin.left}, ${height - margin.bottom})`;
    }
  }

  return (
    <g ref={axisRef} transform={horizontalTransform(direction)} {...props} />
  );
});

export const YAxis = forwardRef(function YAxis({ scale, ...props }, ref) {
  const { width, height, margin } = useContainerSize();
  const direction = props.direction || "left";
  const axisRef = useRef();

  useEffect(() => {
    d3.select(axisRef.current).call(axisDirection(direction)(scale));
  }, [scale]);

  function verticalTransform(direction) {
    switch (direction) {
      case "left":
        return `translate(${margin.left}, ${margin.top})`;
      case "right":
        return `translate(${width - margin.right}, ${margin.top})`;
      default:
        return `translate(${margin.left}, ${margin.top})`;
    }
  }

  return (
    <g ref={axisRef} transform={verticalTransform(direction)} {...props} />
  );
});

export const SVGContainer = forwardRef(function SVGContainer(
  {
    width = 1000,
    height = 800,
    margin = {
      top: 20,
      right: 20,
      bottom: 20,
      left: 20,
    },
    children,
  },
  ref
) {
  return (
    <ContainerContext.Provider value={{ width, height, margin }}>
      <svg
        ref={ref}
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        style={{
          maxWidth: "100%",
          height: "auto",
          font: "12px sans-serif",
        }}
      >
        {children}
      </svg>
    </ContainerContext.Provider>
  );
});

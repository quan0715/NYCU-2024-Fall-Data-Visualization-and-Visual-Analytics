import React, { useRef, useEffect } from "react";
import * as d3 from "d3";
import { computeCorrelationMatrix } from "./correlation";

export function CorrelationMatrices({ data }) {
  const width = 500;
  const height = 500;
  const attributes = [
    "Length",
    "Diameter",
    "Height",
    "Whole_weight",
    "Shucked_weight",
    "Viscera_weight",
    "Shell_weight",
    "Rings",
  ];
  const { _, matrix } = computeCorrelationMatrix(attributes, data);
  const margin = { top: 20, right: 60, bottom: 80, left: 80 }; // Adjusted right margin for legend
  const svgRef = useRef();

  const gridSize = Math.min(
    (width - margin.left - margin.right) / attributes.length,
    (height - margin.top - margin.bottom) / attributes.length
  );

  const xScale = d3
    .scaleBand()
    .range([0, width - margin.left - margin.right])
    .domain(attributes);
  const yScale = d3
    .scaleBand()
    .range([0, height - margin.top - margin.bottom])
    .domain(attributes);

  // Create color scale
  const colorScale = d3
    .scaleSequential()
    .domain([0, 1])
    .interpolator(d3.interpolateRdBu);

  const sizeScale = d3
    .scaleLinear()
    .domain([0, 1])
    .range([0, (gridSize - 10) / 2]);

  useEffect(() => {
    const svg = d3.select(svgRef.current);

    // Add x-axis
    svg
      .append("g")
      .attr("transform", `translate(${margin.left}, ${height - margin.bottom})`)
      .call(d3.axisBottom(xScale))
      .selectAll("text")
      .style("text-anchor", "end")
      .attr("dx", "-.8em")
      .attr("dy", ".15em")
      .attr("transform", "rotate(-45)");

    // Add y-axis
    svg
      .append("g")
      .attr("transform", `translate(${margin.left}, ${margin.top})`)
      .call(d3.axisLeft(yScale));
  }, [
    xScale,
    yScale,
    margin.left,
    margin.top,
    margin.bottom,
    margin.right,
    height,
    width,
    colorScale,
  ]);

  return (
    <div
      style={{
        position: "relative",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <svg
        ref={svgRef}
        width={width}
        height={height}
        className={"bg-background"}
      >
        <g transform={`translate(${margin.left}, ${margin.top})`}>
          {matrix.map((row, i) => {
            return row.map((col, j) => {
              const isUpperTriangle = j > i;
              return (
                <g
                  key={`${col.x}-${col.y}`}
                  transform={`translate(${xScale(col.x)}, ${yScale(col.y)})`}
                >
                  <rect
                    fill="#FFFFFF"
                    stroke="#1D1D1D"
                    width={gridSize}
                    height={gridSize}
                  ></rect>
                  {isUpperTriangle ? (
                    // Right half: Display circles
                    <circle
                      cx={gridSize / 2}
                      cy={gridSize / 2}
                      r={sizeScale(Math.abs(col.value))}
                      fill={colorScale(col.value)}
                      stroke="#1D1D1D"
                    />
                  ) : (
                    // Left half: Display text
                    <text
                      x={gridSize / 2}
                      y={gridSize / 2}
                      textAnchor="middle"
                      dy=".35em"
                      style={{
                        fill: colorScale(col.value),
                        fontSize: "12px",
                        fontWeight: "bold",
                      }}
                    >
                      {col.x === col.y ? "." : col.value.toFixed(2)}
                    </text>
                  )}
                </g>
              );
            });
          })}
        </g>
      </svg>
    </div>
  );
}

function Tooltip({ content, position, visible }) {
  const tooltipStyle = {
    position: "absolute",
    left: position.x,
    top: position.y,
    opacity: visible ? 1 : 0,
    pointerEvents: "none",
    backgroundColor: "rgba(0, 0, 0, 0.75)",
    color: "white",
    padding: "8px",
    borderRadius: "3px",
    fontSize: "12px",
    transition: "opacity 0.2s",
    whiteSpace: "nowrap",
  };

  return <div style={tooltipStyle}>{content}</div>;
}

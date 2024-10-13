import React, { useState, useRef, useEffect } from "react";
import * as d3 from "d3";

function calculateChartSize(
  outerPadding = 0,
  innerPadding = 0,
  gridSize,
  numCols
) {
  return {
    width: outerPadding * 2 + gridSize * numCols + innerPadding * (numCols - 1),
    height:
      outerPadding * 2 + gridSize * numCols + innerPadding * (numCols - 1),
  };
}

export function ScatterPlotMatrix({ data }) {
  const outerPadding = 80;
  const innerPadding = 30;
  const size = 200;
  const columns = [
    "sepal length",
    "sepal width",
    "petal length",
    "petal width",
  ];
  const numCols = columns.length;
  const { width, height } = calculateChartSize(
    outerPadding,
    innerPadding,
    size,
    numCols
  );

  const [selectedData, setSelectedData] = useState(null);
  const [activeBrushCell, setActiveBrushCell] = useState(null); // 追踪当前活动的刷子
  const cellRefs = useRef(
    Array.from({ length: numCols }, () =>
      Array.from({ length: numCols }, () => React.createRef())
    )
  );

  // 定义比例尺
  const xScales = columns.map(
    (col) =>
      d3
        .scaleLinear()
        .domain(d3.extent(data, (d) => d[col]))
        .range([0, size])
        .nice() // 將定義範圍中的無窮小數捨去至合理的範圍，用以資料集當 domain 範圍時若遇到無窮小數需要整理時可使用此函數。
  );

  const yScales = columns.map((col) =>
    d3
      .scaleLinear()
      .domain(d3.extent(data, (d) => d[col]))
      .range([size, 0])
      .nice()
  );

  const classes = [...new Set(data.map((d) => d["class"]))];

  const colorScale = d3
    .scaleOrdinal()
    .domain(classes)
    .range(d3.schemeCategory10);

  // brush initialization
  useEffect(() => {
    for (let row = 0; row < numCols; row++) {
      for (let col = 0; col < numCols; col++) {
        const cellRef = cellRefs.current[row][col];
        const svg = d3.select(cellRef.current);

        svg.select(".brush").remove();

        const brush = d3
          .brush()
          .extent([
            [0, 0],
            [size, size],
          ])
          .on("start", () => brushStart(row, col))
          .on("brush end", (event) => brushed(event, row, col));

        svg.append("g").attr("class", "brush").call(brush);
      }
    }
  }, [data]);

  const brushStart = (row, col) => {
    if (activeBrushCell) {
      const [prevRow, prevCol] = activeBrushCell;
      if (prevRow !== row || prevCol !== col) {
        const prevCell = d3.select(cellRefs.current[prevRow][prevCol].current);
        prevCell.select(".brush").call(d3.brush().clear);
      }
    }
    setActiveBrushCell([row, col]);
  };

  const brushed = (event, row, col) => {
    const selection = event.selection;
    if (selection === null) {
      setSelectedData(null);
      setActiveBrushCell(null);
      return;
    }

    const [[x0, y0], [x1, y1]] = selection;
    const xScale = xScales[col];
    const yScale = yScales[row];

    const selected = data.filter((d) => {
      const x = xScale(d[columns[col]]);
      const y = yScale(d[columns[row]]);
      return x0 <= x && x <= x1 && y0 <= y && y <= y1;
    });

    setSelectedData(selected);
  };

  const renderCells = () => {
    const cells = [];
    for (let row = 0; row < numCols; row++) {
      for (let col = 0; col < numCols; col++) {
        const xScale = xScales[col];
        const yScale = yScales[row];
        const cellData = data.map((d) => ({
          x: xScale(d[columns[col]]),
          y: yScale(d[columns[row]]),
          color: colorScale(d["class"]),
        }));

        cells.push(
          <g
            key={`cell-${row}-${col}`}
            ref={cellRefs.current[row][col]}
            transform={`translate(${
              outerPadding + col * (size + innerPadding)
            }, ${outerPadding + row * (size + innerPadding)})`}
          >
            {/* 绘制单元格边框 */}
            <rect
              x={0}
              y={0}
              width={size}
              height={size}
              fill="none"
              stroke="#aaa"
            />
            {renderGridLines(xScale, yScale)}
            {cellData.map((point, index) => {
              const isSelected =
                selectedData === null || selectedData.includes(data[index]);
              return (
                <circle
                  key={index}
                  cx={point.x}
                  cy={point.y}
                  r={3}
                  fill={point.color}
                  opacity={isSelected ? 1 : 0.1}
                />
              );
            })}
            {row === numCols - 1 && (
              <g>
                {xScale.ticks(5).map((tickValue, i) => (
                  <g
                    key={`x-tick-${i}`}
                    transform={`translate(${xScale(tickValue)}, ${size})`}
                  >
                    <line y2={6} stroke="#000" />
                    <text y={9} dy=".71em" textAnchor="middle" fontSize="10">
                      {tickValue}
                    </text>
                  </g>
                ))}
                <text
                  x={size / 2}
                  y={size + 35}
                  textAnchor="middle"
                  fontSize="12"
                  fontWeight="bold"
                >
                  {columns[col]}
                </text>
              </g>
            )}
            {/* Y 轴刻度和标签 */}
            {col === 0 && (
              <g>
                {yScale.ticks(5).map((tickValue, i) => (
                  <g
                    key={`y-tick-${i}`}
                    transform={`translate(-6, ${yScale(tickValue)})`}
                  >
                    <line x2={6} stroke="#000" />
                    <text x={-9} dy=".32em" textAnchor="end" fontSize="10">
                      {tickValue}
                    </text>
                  </g>
                ))}
                <text
                  x={-45}
                  y={size / 2}
                  transform={`rotate(-90, -45, ${size / 2})`}
                  textAnchor="middle"
                  fontSize="12"
                  fontWeight="bold"
                >
                  {columns[row]}
                </text>
              </g>
            )}
          </g>
        );
      }
    }
    return cells;
  };

  const renderGridLines = (xScale, yScale) => {
    const xTicks = xScale.ticks(10);
    const yTicks = yScale.ticks(10);

    return (
      <g>
        {/* Draw Vertical Grid Line*/}
        {xTicks.map((tickValue, i) => (
          <line
            key={`v-grid-${i}`}
            x1={xScale(tickValue)}
            y1={0}
            x2={xScale(tickValue)}
            y2={size}
            stroke="#ddd"
          />
        ))}
        {/* Draw Horizontal Grid Line */}
        {yTicks.map((tickValue, i) => (
          <line
            key={`h-grid-${i}`}
            x1={0}
            y1={yScale(tickValue)}
            x2={size}
            y2={yScale(tickValue)}
            stroke="#ddd"
          />
        ))}
      </g>
    );
  };

  const Legend = ({ classes, colorScale }) => (
    <g transform={`translate(${width - outerPadding + 20}, ${outerPadding})`}>
      {classes.map((cls, i) => (
        <g key={cls} transform={`translate(0, ${i * 20})`}>
          <rect width={15} height={15} fill={colorScale(cls)} />
          <text x={20} y={12} fontSize="12">
            {cls}
          </text>
        </g>
      ))}
    </g>
  );

  return (
    <div
      style={{
        position: "relative",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <svg
        width={width + 200}
        height={height}
        style={{
          backgroundColor: "#fff",
        }}
      >
        {renderCells()}
        <Legend classes={classes} colorScale={colorScale} />
      </svg>
    </div>
  );
}

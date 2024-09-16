import React, { useState, useEffect, useRef, useTransition } from "react";
import * as d3 from "d3";
import Papa from "papaparse";

function useCSVFile(fileName) {
  const [isLoading, startFetchingData] = useTransition();
  const [csvData, setCsvData] = useState([]);

  useEffect(() => {
    startFetchingData(async () => {
      const response = await fetch(fileName); // Fetch CSV from public folder
      const reader = response.body.getReader();
      const decoder = new TextDecoder("utf-8");
      let result = "";
      let done = false;

      while (!done) {
        const { value, done: readerDone } = await reader.read();
        done = readerDone;
        result += decoder.decode(value, { stream: true });
      }
      // Parse the CSV
      Papa.parse(result, {
        header: true,
        skipEmptyLines: true,
        complete: function (results) {
          setCsvData(results.data); // Set parsed CSV data
        },
      });
    });
  }, [fileName]);

  return { csvData, isLoading };
}

export function ScatterChart({ csvData, xAttribute, yAttribute }) {
  const width = 600;
  const height = 450;
  const margin = { top: 20, right: 30, bottom: 80, left: 50 };
  const gx = useRef();
  const gy = useRef();
  const svgRef = useRef();
  const [tooltipContent, setTooltipContent] = useState("");
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const [tooltipVisible, setTooltipVisible] = useState(false);
  const xValue = (d) => +d[xAttribute];
  const yValue = (d) => +d[yAttribute];
  const categories = [...new Set(csvData.map((d) => d.class))];
  const xScale = d3
    .scaleLinear()
    .domain(d3.extent(csvData, xValue))
    .range([margin.left, width - margin.right]);
  const yScale = d3
    .scaleLinear()
    .domain(d3.extent(csvData, yValue))
    .range([height - margin.bottom, margin.top]);
  const colorScale = d3.scaleOrdinal(d3.schemeTableau10).domain(categories);

  const handleMouseOver = (event, d) => {
    // const svgRect = svgRef.current.getBoundingClientRect();
    const [x, y] = d3.pointer(event, svgRef.current);
    setTooltipContent(
      <>
        <div>Data: {csvData.indexOf(d)}</div>
        <div>Class: {d.class}</div>
        <div>
          {xAttribute}: {xValue(d)}
        </div>
        <div>
          {yAttribute}: {yValue(d)}
        </div>
      </>
    );
    setTooltipPosition({
      x: x + 10,
      y: y - 28,
    });
    setTooltipVisible(true);
  };

  const handleMouseMove = (event) => {
    // const svgRect = svgRef.current.getBoundingClientRect();
    const [x, y] = d3.pointer(event, svgRef.current);

    setTooltipPosition({
      x: x + 10,
      y: y - 28,
    });
  };

  const handleMouseOut = () => {
    setTooltipVisible(false);
  };

  useEffect(
    () => void d3.select(gx.current).call(d3.axisBottom(xScale)),
    [gx, xScale]
  );
  useEffect(
    () => void d3.select(gy.current).call(d3.axisLeft(yScale)),
    [gy, yScale]
  );

  const labelStyle = {
    textAnchor: "middle",
    fill: "black",
    style: {
      fontSize: "12px",
      fontWeight: "bold",
    },
  };

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
      <Tooltip
        content={tooltipContent}
        position={tooltipPosition}
        visible={tooltipVisible}
      ></Tooltip>
      <svg
        ref={svgRef}
        width={width}
        height={height}
        className={"bg-background"}
      >
        <g
          ref={gx}
          transform={`translate(0,${height - margin.bottom})`}
          text={xAttribute}
          textAnchor={"middle"}
        >
          <text x={width / 2} y={40} {...labelStyle}>
            {xAttribute}
          </text>
        </g>
        <g ref={gy} transform={`translate(${margin.left},0)`} text={yAttribute}>
          <text
            x={-height / 2}
            y={-40}
            transform={"rotate(-90)"}
            {...labelStyle}
          >
            {yAttribute}
          </text>
        </g>
        <g>
          {csvData.map((d, i) => (
            <circle
              key={i}
              cx={xScale(xValue(d))}
              cy={yScale(yValue(d))}
              r="4.5"
              fill={colorScale(d.class)}
              opacity={0.8}
              onMouseOver={(event) => handleMouseOver(event, d)}
              onMouseMove={handleMouseMove}
              onMouseOut={handleMouseOut}
            />
          ))}
        </g>
        <g
          name={"legend"}
          transform={`translate(${(width - categories.length * 100) / 2},${
            height - 20
          })`}
        >
          {categories.map((category, i) => (
            <g key={i} transform={`translate(${i * 100}, 0)`}>
              <rect width="10" height="10" fill={colorScale(category)} />
              <text x="15" y="10" width="10" fontSize="12" textAnchor="start">
                {category}
              </text>
            </g>
          ))}
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
    rounded: "12px",
  };

  return <div style={tooltipStyle}>{content}</div>;
}

function Label({ children }) {
  return (
    <label
      style={{
        fontSize: "14px",
        fontWeight: "bold",
      }}
    >
      {children}
    </label>
  );
}

function Select({ label, options, value, onChange }) {
  return (
    <div
      style={{
        width: "100%",
        borderRadius: "8px",
      }}
    >
      <Label>{label}:</Label>
      <select
        style={{
          width: "100%",
          fontSize: "12px",
          padding: "8px",
          borderRadius: "8px",
          border: "1px solid #ccc",
        }}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        {options.map((option, i) => (
          <option key={i} value={option}>
            {option}
          </option>
        ))}
      </select>
    </div>
  );
}

function App() {
  const dataSources = "http://vis.lab.djosix.com:2024/data/iris.csv";
  const { csvData, isLoading } = useCSVFile(dataSources);

  const attributes = [
    "sepal length",
    "sepal width",
    "petal length",
    "petal width",
  ];
  const [xAttribute, setXAttribute] = useState(attributes[0]);
  const [yAttribute, setYAttribute] = useState(attributes[1]);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        height: "100vh",
        width: "100vw",
      }}
    >
      <h3>Scatter Plot of Iris Dataset</h3>
      <div
        style={{
          display: "flex",
          gap: "12px",
          width: "600px",
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: "20px",
        }}
      >
        <Select
          label={"X-axis"}
          options={attributes}
          value={xAttribute}
          onChange={setXAttribute}
        />
        <Select
          label={"Y-axis"}
          options={attributes}
          value={yAttribute}
          onChange={setYAttribute}
        />
      </div>

      {!isLoading && (
        <ScatterChart
          csvData={csvData}
          xAttribute={xAttribute}
          yAttribute={yAttribute}
        />
      )}
    </div>
  );
}

export default App;

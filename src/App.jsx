import React, {
  useState,
  useEffect,
  useRef,
  useTransition,
  useCallback,
} from "react";
import * as d3 from "d3";
import Papa from "papaparse";
import DraggableAttribute from "./DraggableAttribute.jsx";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
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

export function ParallelCoordinates({ csvData, attributes }) {
  const width = 600;
  const height = 450;
  const margin = { top: 20, right: 30, bottom: 80, left: 50 };
  const gx = useRef();
  // const [Attributes, setAttributes] = useState(attributes);

  // const gy = useRef();
  const svgRef = useRef();

  // const attrRefs = Attributes.map(() => useRef());
  const attrRefs = useRef(null);
  function getMap() {
    if (!attrRefs.current) {
      // Initialize the Map on first usage.
      attrRefs.current = new Map();
    }
    return attrRefs.current;
  }
  const [tooltipContent, setTooltipContent] = useState("");
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const [tooltipVisible, setTooltipVisible] = useState(false);
  const categories = [...new Set(csvData.map((d) => d.class))];
  const yScales = {};
  attributes.forEach((attribute) => {
    yScales[attribute] = d3
      .scaleLinear()
      .domain(d3.extent(csvData, (d) => +d[attribute]))
      .range([height - margin.bottom, margin.top]); // Note the range is from bottom to top
  });
  const xScale = d3
    .scalePoint()
    .range([margin.left, width - margin.right])
    .domain(attributes);
  const colorScale = d3.scaleOrdinal(d3.schemeTableau10).domain(categories);

  const handleMouseOver = (event, d) => {
    // const svgRect = svgRef.current.getBoundingClientRect();
    const [x, y] = d3.pointer(event, svgRef.current);
    setTooltipContent(
      <>
        <div>Data: {csvData.indexOf(d)}</div>
        <div>Class: {d.class}</div>
        {attributes.map((attribute) => (
          <div key={attribute}>
            {attribute}: {d[attribute]}
          </div>
        ))}
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

  useEffect(() => {
    d3.select(gx.current).call(d3.axisBottom(xScale));

    attributes.map((attribute, i) => {
      let node = getMap().get(attribute);
      d3.select(node).call(d3.axisLeft().scale(yScales[attribute]));
    });
  }, [attrRefs, attributes, xScale, gx, yScales]);

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
        <g ref={gx} transform={`translate(0,${height - margin.bottom})`}>
          <text x={width / 2} y={40} style={labelStyle}>
            attributes
          </text>
        </g>
        {attributes.map((attribute, i) => (
          <g
            key={attribute}
            transform={"translate(" + xScale(attribute) + ",0 )"}
            // ref={(el) => (attrRefs.current[attribute] = el)}
            ref={(node) => {
              const map = getMap();
              if (node) {
                map.set(attribute, node);
              } else {
                map.delete(attribute);
              }
            }}
          >
            <text style={labelStyle}></text>
          </g>
        ))}
        <g>
          {csvData.map((d, i) => {
            const linePath = d3.line()(
              attributes.map((attribute) => [
                xScale(attribute),
                yScales[attribute](d[attribute]),
              ])
            );
            return (
              <path
                key={i}
                d={linePath}
                fill="none"
                stroke={colorScale(d.class)}
                strokeWidth={1}
                opacity={0.7}
                onMouseOver={(event) => handleMouseOver(event, d)}
                onMouseMove={handleMouseMove}
                onMouseOut={handleMouseOut}
              />
            );
          })}
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
  const [attributes, setAttributes] = useState([
    "petal length",
    "petal width",
    "sepal length",
    "sepal width",
  ]);
  const moveAttribute = (dragIndex, hoverIndex) => {
    const updatedAttributes = [...attributes];
    const [removed] = updatedAttributes.splice(dragIndex, 1);
    updatedAttributes.splice(hoverIndex, 0, removed);
    setAttributes(updatedAttributes);
  };
  return (
    <DndProvider backend={HTML5Backend}>
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
        <h3>LAB2:Parallel Coordinate Plots of Iris Dataset</h3>
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
        ></div>
        <div
          className="attributes-list"
          style={{
            display: "flex",
            marginBottom: "20px",
          }}
        >
          {attributes.map((attr, index) => (
            <DraggableAttribute
              key={attr}
              attribute={attr}
              index={index}
              moveAttribute={moveAttribute}
            />
          ))}
        </div>

        {!isLoading && (
          <ParallelCoordinates csvData={csvData} attributes={attributes} />
        )}
      </div>
    </DndProvider>
  );
}

export default App;

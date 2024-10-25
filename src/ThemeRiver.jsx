import React, { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import { DndProvider, useDrag, useDrop } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
const generateData = (data) => {
  let dataList = data.data
    .map((d) => {
      const [date, m, y] = d["saledate"].split("/");
      let type = `${d["type"]}_${d["bedrooms"]}`;
      return {
        date: new Date(y, m, date),
        MA: parseInt(d["MA"]),
        type: type,
      };
    })
    .sort((a, b) => a.date - b.date);
  return dataList;
};

const generateGroupData = (data) => {
  const groupData = d3.rollup(
    data,
    (v) => d3.sum(v, (d) => d.MA),
    (d) => d.date,
    (d) => d.type
  );

  let formattedData = [];
  groupData.forEach((value, key, map) => {
    const obj = { date: key };
    value.forEach((v, k) => {
      obj[k] = v;
    });
    formattedData.push(obj);
  });

  return formattedData;
};
const generateStackData = (data, keysOrder) => {
  const stack = d3
    .stack()
    .keys(keysOrder)
    .value((d, key) => d[key] || 0)
    .offset(d3.stackOffsetWiggle);
  return stack(data);
};

const LegendItem = ({
  keyItem,
  index,
  moveItem,
  visibility,
  handleVisibility,
  colorScale,
}) => {
  const ref = useRef(null);
  const [, drop] = useDrop({
    accept: "legendItem",
    hover(item) {
      if (!ref.current) {
        return;
      }
      const dragIndex = item.index;
      const hoverIndex = index;

      if (dragIndex === hoverIndex) {
        return;
      }

      moveItem(dragIndex, hoverIndex);

      item.index = hoverIndex;
    },
  });

  const [{ isDragging }, drag] = useDrag({
    type: "legendItem",
    item: { keyItem, index },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  drag(drop(ref));

  return (
    <div
      ref={ref}
      style={{
        display: "flex",
        alignItems: "center",
        cursor: "move",
        opacity: isDragging ? 0.5 : 1,
        marginBottom: "5px",
      }}
      onClick={() => handleVisibility(keyItem)}
    >
      <div
        style={{
          width: "15px",
          height: "15px",
          backgroundColor: colorScale(keyItem),
          opacity: visibility[keyItem] ? 1 : 0.5,
          marginRight: "5px",
        }}
      ></div>
      <span
        style={{
          fontSize: "12px",
          opacity: visibility[keyItem] ? 1 : 0.5,
        }}
      >
        {keyItem}
      </span>
    </div>
  );
};

export function ThemeRiver(data) {
  const svgRef = useRef();
  // Dimensions and margins
  const margin = { top: 40, right: 200, bottom: 30, left: 100 };
  const width = 1000;
  const height = 500;
  const chartWidth = width - margin.left - margin.right;
  const chartHeight = height - margin.top - margin.bottom;

  const dataList = generateData(data);
  const groupData = generateGroupData(dataList);
  const [keys, setKeys] = useState([]);
  const [keysOrder, setKeysOrder] = useState([]);
  const [tooltip, setTooltip] = useState({ display: false, data: {} });
  const [visibility, setVisibility] = useState({});
  const [stackedData, setStackedData] = useState(
    generateStackData(groupData, keysOrder)
  );

  const handleVisibility = (key) => {
    setVisibility((prev) => {
      return { ...prev, [key]: !prev[key] };
    });
  };

  useEffect(() => {
    // Update stacked data when visibility or keysOrder changes
    const visibleKeys = keysOrder.filter((key) => visibility[key]);
    const stacked = generateStackData(groupData, visibleKeys);
    setStackedData(stacked);
  }, [visibility, keysOrder, groupData]);

  useEffect(() => {
    const dataList = generateData(data);
    const keys = [...new Set(dataList.map((d) => d.type))];
    setKeys(keys);
    setKeysOrder(keys);
    setVisibility(Object.fromEntries(keys.map((key) => [key, true])));
    const groupData = generateGroupData(dataList);
    const stacked = generateStackData(groupData, keys);
    setStackedData(stacked);
  }, [data]);

  const moveItem = (dragIndex, hoverIndex) => {
    const newKeysOrder = [...keysOrder];
    const [movedItem] = newKeysOrder.splice(dragIndex, 1);
    newKeysOrder.splice(hoverIndex, 0, movedItem);
    setKeysOrder(newKeysOrder);
  };

  const [mouseX, setMouseX] = useState(null);

  const xScale = d3
    .scaleTime()
    .domain(d3.extent(groupData, (d) => d.date))
    .range([0, chartWidth]);

  const yScale = d3
    .scaleLinear()
    .domain([
      d3.min(stackedData, (layer) => d3.min(layer, (d) => d[0])),
      d3.max(stackedData, (layer) => d3.max(layer, (d) => d[1])),
    ])
    .range([chartHeight, 0]);

  const colorScale = d3.scaleOrdinal().domain(keys).range(d3.schemeTableau10);

  const areaGenerator = d3
    .area()
    .curve(d3.curveLinear)
    .x((d) => xScale(d.data.date))
    .y0((d) => yScale(d[0]))
    .y1((d) => yScale(d[1]));

  return (
    <div>
      <DndProvider backend={HTML5Backend}>
        <svg
          ref={svgRef}
          width={width}
          height={height}
          style={{
            display: "relative",
            margin: "auto",
          }}
        >
          <g
            transform={`translate(${margin.left}, ${height - margin.bottom})`}
            ref={(node) => {
              const axis = d3
                .axisBottom(xScale)
                .tickSizeOuter(0)
                .ticks(d3.utcYear.every(2))
                .tickFormat(d3.utcFormat("%B %d, %Y"));
              d3.select(node)
                .call(axis)
                .call((g) => g.select(".domain").remove());
            }}
          />
          <g
            transform={`translate(${margin.left}, ${margin.top})`}
            ref={(node) => {
              const axis = d3
                .axisLeft(yScale)
                .tickFormat((d) => Math.abs(d).toLocaleString("en-US"));
              d3.select(node)
                .call(axis)
                .call((g) => g.select(".domain").remove())
                .selectAll(".tick line")
                .remove()
                .selectAll(".tick line")
                .call((g) =>
                  g.clone().attr("x2", chartWidth).attr("stroke-opacity", 0.2)
                );
            }}
          >
            {yScale.ticks().map((d) => (
              <g key={d} transform={`translate(0, ${yScale(d)})`}>
                <line
                  x2={chartWidth}
                  stroke="currentColor"
                  strokeOpacity={0.2}
                />
              </g>
            ))}
            <text
              x={-margin.left}
              y={10}
              fill="currentColor"
              textAnchor="start"
            >
              ↑ Median Price
            </text>
          </g>
          <g transform={`translate(${margin.left}, ${margin.top})`}>
            {stackedData.map((layer, i) => (
              <path
                key={i}
                d={areaGenerator(layer)}
                fill={colorScale(layer.key)}
                opacity={0.6}
                onMouseMove={(event) => {
                  if (!svgRef.current) return;
                  const [mouseXPosition, mouseYPosition] = d3.pointer(event);
                  setMouseX(mouseXPosition);

                  const x0 = xScale.invert(mouseXPosition);

                  const bisectDate = d3.bisector((d) => d.date).left;
                  const index = bisectDate(groupData, x0, 1);
                  const d0 = groupData[index - 1];
                  const d1 = groupData[index];
                  let dData = null;
                  if (d1 && d0) {
                    dData = x0 - d0.date > d1.date - x0 ? d1 : d0;
                  } else {
                    dData = d0 || d1;
                  }

                  if (dData) {
                    const svgRect = svgRef.current.getBoundingClientRect();
                    const x = event.clientX - svgRect.left;
                    const y = event.clientY - svgRect.top;

                    const allSeriesData = keysOrder
                      .filter((key) => visibility[key])
                      .map((key) => ({
                        key: key,
                        value: dData[key] || 0,
                      }));

                    setTooltip({
                      display: true,
                      data: {
                        date: dData.date,
                        series: allSeriesData,
                      },
                      position: {
                        x: x,
                        y: y,
                      },
                    });
                  }
                }}
                onMouseOut={() => {
                  setTooltip({ display: false, data: {} });
                }}
              />
            ))}
            {mouseX !== null && (
              <line
                x1={mouseX}
                x2={mouseX}
                y1={0}
                y2={chartHeight}
                stroke="black"
                strokeWidth={1}
                strokeDasharray="4"
              />
            )}
          </g>
        </svg>
        <div
          style={{
            position: "absolute",
            top: margin.top + 200,
            left: chartWidth + margin.left + 100,
          }}
        >
          {keysOrder.map((keyItem, index) => (
            <LegendItem
              key={keyItem}
              keyItem={keyItem}
              index={index}
              moveItem={moveItem}
              visibility={visibility}
              handleVisibility={handleVisibility}
              colorScale={colorScale}
            />
          ))}
        </div>
        {tooltip.display && (
          <div
            style={{
              position: "absolute",
              left: margin.left + tooltip.position.x + 10,
              top: margin.top + tooltip.position.y + 10,
              backgroundColor: "white",
              border: "1px solid #ccc",
              padding: "5px",
              pointerEvents: "none",
              fontSize: "12px",
              maxHeight: "200px",
              overflowY: "auto",
            }}
          >
            <strong>Date: {tooltip.data.date.toLocaleDateString()}</strong>
            <br />
            {tooltip.data.series.map((seriesData) => (
              <div key={seriesData.key}>
                <span
                  style={{
                    display: "inline-block",
                    width: "10px",
                    height: "10px",
                    backgroundColor: colorScale(seriesData.key),
                    marginRight: "5px",
                  }}
                ></span>
                {seriesData.key}: {seriesData.value}
              </div>
            ))}
          </div>
        )}
      </DndProvider>
    </div>
  );
}

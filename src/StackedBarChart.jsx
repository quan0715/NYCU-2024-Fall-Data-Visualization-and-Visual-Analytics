import React, { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import { FaSortAmountDown, FaSortAmountUp } from "react-icons/fa";
import { ChartButton } from "./button";
import { Select } from "./select";
const getData = (data, attributes) => {
  return data.map((d) => {
    let attrs = attributes.map((attr) =>
      d[attr] === "n/a" ? 0.0 : parseFloat(d[attr])
    );
    let sum = d3.sum(attrs);
    return {
      total: sum,
      ...d,
    };
  });
};

export function StackedBarChart({ data }) {
  const attributes = [
    "scores_citations",
    "scores_research",
    "scores_teaching",
    "scores_industry_income",
    "scores_international_outlook",
  ];

  const [sortState, setSortState] = useState("desc");
  const [activeAttributes, setActiveAttributes] = useState([...attributes]);
  const [tooltip, setTooltip] = useState({ display: false, data: {} });
  const [locationFilter, setLocationFilter] = useState("All");

  const formattedData = getData(data, attributes)
    .filter((d) => d["total"] > 0)
    .filter((d) => locationFilter === "All" || d["location"] === locationFilter)
    .sort((a, b) =>
      sortState === "desc"
        ? d3.descending(a.total, b.total)
        : d3.ascending(a.total, b.total)
    )
    .slice(0, 30);

  const margin = { top: 10, right: 200, bottom: 50, left: 200 };
  const size = {
    width: 900,
    height: 600,
    c_width: 900 - margin.left - margin.right,
    c_height: 600 - margin.top - margin.bottom,
  };

  const xScale = d3
    .scaleLinear()
    .domain([0, activeAttributes.length * 100])
    .range([0, size.c_width]);

  const yScale = d3
    .scaleBand()
    .domain(formattedData.map((d) => d["name"]))
    .range([0, size.c_height])
    .padding(0.2);

  const colorScale = d3
    .scaleOrdinal()
    .domain(attributes)
    .range(d3.schemePaired);

  const xRef = useRef();
  const yRef = useRef();

  const toggleSort = () => {
    setSortState((prevSortState) =>
      prevSortState === "desc" ? "asc" : "desc"
    );
  };

  useEffect(() => {
    // Update X Axis
    d3.select(xRef.current)
      .attr(
        "transform",
        `translate(${margin.left}, ${size.c_height + margin.top})`
      )
      .call(d3.axisBottom(xScale).ticks(attributes.length));

    // Update Y Axis
    d3.select(yRef.current)
      .attr("transform", `translate(${margin.left}, ${margin.top})`)
      .call(d3.axisLeft(yScale));
  }, [formattedData]);

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
      <div
        style={{
          position: "relative",
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <ChartButton onClick={toggleSort}>
          <div
            style={{
              width: "150px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              height: "36px",
            }}
          >
            {sortState === "desc" ? (
              <FaSortAmountDown size={18} />
            ) : (
              <FaSortAmountUp size={18} />
            )}
            <p style={{ paddingLeft: "4px" }}>
              {sortState === "desc" ? "降序排列" : "升序排列"}
            </p>
          </div>
        </ChartButton>
        <Select
          options={[
            "All",
            ...new Set(data.map((d) => d["location"])).values(),
          ].sort()}
          value={locationFilter}
          onChange={(value) => {
            setLocationFilter(value);
          }}
          style={{
            paddingLeft: "8px",
          }}
        ></Select>
      </div>

      <svg
        viewBox={`0 0 ${size.width} ${size.height}`}
        width={size.width}
        height={size.height}
        style={{
          display: "block",
          margin: "auto",
        }}
      >
        <g ref={xRef}></g>
        <text
          x={margin.left + size.c_width / 2}
          y={size.c_height + margin.top + 40}
          textAnchor="middle"
          fontSize="16"
        >
          Total Score
        </text>
        <g ref={yRef}></g>
        {formattedData.map((d) => {
          let cumulative = 0;
          return (
            <g key={d["name"]}>
              {activeAttributes.map((attr) => {
                const val = d[attr] === "n/a" ? 0.0 : parseFloat(d[attr]);
                const xStart = xScale(cumulative);
                cumulative += val;
                const xEnd = xScale(cumulative);
                const width = xEnd - xStart;
                return (
                  <rect
                    key={attr}
                    x={margin.left + xStart}
                    y={margin.top + yScale(d["name"])}
                    width={width}
                    height={yScale.bandwidth()}
                    fill={colorScale(attr)}
                    onMouseEnter={(event) => {
                      setTooltip({
                        display: true,
                        data: {
                          university: d["name"],
                          attribute: attr,
                          value: val.toFixed(2),
                        },
                        pos: {
                          x: event.pageX,
                          y: event.pageY,
                        },
                      });
                    }}
                    onMouseLeave={() => {
                      setTooltip({ display: false, data: {} });
                    }}
                  />
                );
              })}
            </g>
          );
        })}
        {/* Tooltip */}
        {tooltip.display && (
          <foreignObject
            x={tooltip.pos.x - 100}
            y={tooltip.pos.y - 100}
            width="200"
            height="100"
            style={{ pointerEvents: "none" }}
          >
            <div
              xmlns="http://www.w3.org/1999/xhtml"
              style={{
                backgroundColor: "rgba(255,255,255,0.9)",
                border: "1px solid #ccc",
                padding: "10px",
                borderRadius: "4px",
                fontSize: "12px",
              }}
            >
              <strong>{tooltip.data.university}</strong>
              <br />
              {tooltip.data.attribute}: {tooltip.data.value}
            </div>
          </foreignObject>
        )}
        {/* Legend */}
        <g
          transform={`translate(${margin.left + size.c_width + 20}, ${
            margin.top
          })`}
        >
          {attributes.map((attr, index) => (
            <g
              key={attr}
              transform={`translate(0, ${index * 20})`}
              onClick={() => {
                const isActive = activeAttributes.includes(attr);
                setActiveAttributes((prev) =>
                  isActive ? prev.filter((a) => a !== attr) : [...prev, attr]
                );
              }}
              style={{
                cursor: "pointer",
                opacity: activeAttributes.includes(attr) ? 1 : 0.5,
              }}
            >
              <rect width="15" height="15" fill={colorScale(attr)} />
              <text x="20" y="12" fontSize="12">
                {attr}
              </text>
            </g>
          ))}
        </g>
      </svg>
    </div>
  );
}

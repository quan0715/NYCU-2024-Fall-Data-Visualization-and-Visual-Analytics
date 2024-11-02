import React, { useRef, useEffect, useState, useMemo } from "react";
import { SVGContainer, useContainerSize, XAxis, YAxis } from "./Container";
import * as d3 from "d3";
import { ChartButton } from "./button";
import { Mosaic } from "react-loading-indicators";
function getAirPollutionMeasurementData(csvData) {
  const originData = [];
  const measurements = ["SO2", "NO2", "O3", "CO", "PM10", "PM2.5"];
  const stationSet = new Set();
  const dateTimeSet = new Set();
  // prepare data
  csvData.forEach((d) => {
    const date = d["Measurement date"].split(" ")[0].trim();
    const [year, month, day] = date.split("-");
    const dateTime = new Date(year, month - 1, day);
    const station_name = d["Address"].split(",")[2].trim();
    stationSet.add(station_name);
    dateTimeSet.add(dateTime);
    originData.push(
      ...measurements.map((m) => {
        return {
          date: dateTime,
          year: parseInt(year, 10),
          label: station_name + "_" + d["Station code"] + "_" + m,
          station_name: station_name,
          type: m,
          value: Math.max(0, parseFloat(d[m])),
        };
      })
    );
  });

  originData.sort((a, b) => a["date"] - b["date"]);

  const aggregateData = d3.rollup(
    originData,
    (v) => d3.mean(v, (d) => d["value"]),
    (d) => d["label"],
    (d) => d["date"]
  );
  const labelList = Array.from(aggregateData.keys());
  labelList.sort((a, b) => {
    const aPollution = a.split("_")[2];
    const bPollution = b.split("_")[2];
    return measurements.indexOf(aPollution) - measurements.indexOf(bPollution);
  });
  console.log(aggregateData);

  return {
    originData,
    measurements,
    stationList: Array.from(stationSet),
    dateTimeList: Array.from(dateTimeSet),
    labelList,
    aggregateData,
  };
}

const colorMapper = (label) => {
  if (label.endsWith("SO2")) return d3.schemeBlues;
  if (label.endsWith("NO2")) return d3.schemeOranges;
  if (label.endsWith("O3")) return d3.schemeGreens;
  if (label.endsWith("CO")) return d3.schemePurples;
  if (label.endsWith("PM10")) return d3.schemeReds;
  if (label.endsWith("PM2.5")) return d3.schemePurples;
  return d3.schemeGreys;
};

function HorizonChart({ index, label, data, width, size = 30, bands = 3 }) {
  const dataArray = Array.from(data.entries());
  const smoothDataArray = dataArray.map((d, i, arr) => {
    const windowSize = 30; // 平滑窗口大小
    const start = Math.max(0, i - Math.floor(windowSize / 2));
    const end = Math.min(arr.length - 1, i + Math.floor(windowSize / 2));
    const window = arr.slice(start, end + 1);
    const avgY = d3.mean(window, (w) => w[1]);
    return [d[0], avgY];
  });

  const yMax = d3.max(smoothDataArray, (d) => Math.abs(d[1])) || 0;
  const xExtent = d3.extent(smoothDataArray, (d) => d[0]);

  const xScale = d3.scaleUtc().domain(xExtent).range([0, width]);
  const yScale = d3
    .scaleLinear()
    .domain([0, yMax])
    .range([size, size - bands * size]);

  // 使用平滑的曲線
  const area = d3
    .area()
    .curve(d3.curveMonotoneX)
    .x((d) => xScale(d[0]))
    .y0(size)
    .y1((d) => yScale(d[1]));

  const color = d3.scaleOrdinal(colorMapper(label)[bands]);

  // 定義區域路徑
  const areaPath = area(smoothDataArray);

  const bandArray = [];
  for (let i = 0; i < bands; i++) {
    bandArray.push(i);
  }

  const uid = Math.random().toString(16).slice(2);
  const pathId = `path-${uid}`;
  const clipId = `clip-${uid}`;

  return (
    <>
      <defs>
        <clipPath id={`${clipId}-${index}`}>
          <rect x="0" y="0" width={width} height={size} />
        </clipPath>
        <path id={`${pathId}-${index}`} d={areaPath} />
      </defs>
      <g style={{ cursor: "pointer" }} clipPath={`url(#${clipId}-${index})`}>
        {bandArray.map((i) => {
          return (
            <use
              key={i}
              href={`#${pathId}-${index}`}
              fill={color(i)}
              transform={`translate(0,${i * size})`}
              //   style={{ mixBlendMode: "multiply", opacity: 0.7 }}
            />
          );
        })}
      </g>
    </>
  );
}

export function AirPollutionHorizonChart({ csvData }) {
  const svgRef = useRef();
  const pollutionData = useMemo(
    () => getAirPollutionMeasurementData(csvData),
    [csvData]
  );

  const width = 1500;
  const gridHeight = 50;
  const margin = { top: 30, right: 20, bottom: 20, left: 150 };
  //   const yearFilter = 2019;
  const height =
    pollutionData.labelList.length * gridHeight + margin.top + margin.bottom;

  const [selectedYear, setSelectedYear] = useState("All");
  const [isParsing, setIsParsing] = useState(false);
  const filteredData = useMemo(() => {
    if (selectedYear === "All") {
      return pollutionData;
    }
    setIsParsing(true);
    const filteredOriginData = pollutionData.originData.filter(
      (d) => d.year === parseInt(selectedYear, 10)
    );

    // Re-process the filtered data
    const aggregateData = d3.rollup(
      filteredOriginData,
      (v) => d3.mean(v, (d) => d.value),
      (d) => d.label,
      (d) => d.date
    );
    setIsParsing(false);

    return {
      ...pollutionData,
      aggregateData,
      dateTimeList: Array.from(new Set(filteredOriginData.map((d) => d.date))),
    };
  }, [selectedYear, pollutionData]);

  const xScale = d3
    .scaleUtc()
    .domain(d3.extent(pollutionData.dateTimeList))
    .range([0, width - margin.right - margin.left]);

  const yScale = d3
    .scaleBand()
    .domain(pollutionData.labelList)
    .range([0, height - margin.bottom - margin.top]);
  const [bands, setBands] = useState(6);

  return (
    <div>
      <div style={{ marginBottom: "20px" }}>
        <label htmlFor="year-select" style={{ marginRight: "10px" }}>
          Select Year:
        </label>
        <select
          id="year-select"
          value={selectedYear}
          onChange={(e) => setSelectedYear(e.target.value)}
        >
          <option value="All">All</option>
          {["2017", "2018", "2019"].map((year) => (
            <option key={year} value={year}>
              {year}
            </option>
          ))}
        </select>
      </div>
      {isParsing ? (
        <Mosaic color={["#33CCCC", "#33CC36", "#B8CC33", "#FCCA00"]} />
      ) : (
        <SVGContainer
          width={width}
          height={height}
          margin={margin}
          ref={svgRef}
        >
          <XAxis direction="top" scale={xScale} />
          <YAxis direction="left" scale={yScale} />
          <g>
            {filteredData.labelList.map((label, index) => {
              return (
                <g
                  key={label}
                  transform={`translate(${margin.left},${
                    index * gridHeight + margin.top
                  })`}
                  fill="transparent"
                >
                  <HorizonChart
                    index={index}
                    label={label}
                    data={filteredData.aggregateData.get(label)}
                    width={width - margin.right - margin.left}
                    size={gridHeight}
                    bands={bands}
                  />
                </g>
              );
            })}
          </g>
        </SVGContainer>
      )}
    </div>
  );
}

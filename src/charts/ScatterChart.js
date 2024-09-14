"use client";
import React, { useState, useEffect, useRef } from "react";
import * as d3 from "d3";
import { useCSVFile } from "@/hooks/useCsvFile";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

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
        const svgRect = svgRef.current.getBoundingClientRect();
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
            </>,
        );
        setTooltipPosition({
            x: event.clientX - svgRect.left + 10,
            y: event.clientY - svgRect.top - 28,
        });
        setTooltipVisible(true);
    };

    const handleMouseMove = (event) => {
        const svgRect = svgRef.current.getBoundingClientRect();
        setTooltipPosition({
            x: event.clientX - svgRect.left + 10,
            y: event.clientY - svgRect.top - 28,
        });
    };

    const handleMouseOut = () => {
        setTooltipVisible(false);
    };

    useEffect(
        () => void d3.select(gx.current).call(d3.axisBottom(xScale)),
        [gx, xScale],
    );
    useEffect(
        () => void d3.select(gy.current).call(d3.axisLeft(yScale)),
        [gy, yScale],
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
        <div className="relative">
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
                <g
                    ref={gy}
                    transform={`translate(${margin.left},0)`}
                    text={yAttribute}
                >
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
                    transform={`translate(${(width - categories.length * 100) / 2},${height - 20})`}
                >
                    {categories.map((category, i) => (
                        <g key={i} transform={`translate(${i * 100}, 0)`}>
                            <rect
                                width="10"
                                height="10"
                                fill={colorScale(category)}
                            />
                            <text
                                x="15"
                                y="10"
                                width="10"
                                fontSize="12"
                                textAnchor="start"
                            >
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

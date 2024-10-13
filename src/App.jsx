import React from "react";
import { useCSVFile } from "./useCsvFile";
import { ScatterPlotMatrix } from "./ScatterPlotMatrix";

function App() {
  const dataSources = "http://vis.lab.djosix.com:2024/data/iris.csv";
  // const dataSources = "./iris.csv";
  const { csvData, isLoading } = useCSVFile(dataSources);
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
      <h3>LAB4:Brushable Scatter Plot Matrix</h3>
      <div
        style={{
          display: "flex",
          gap: "12px",
          width: "100%",
          height: "100%",
          overflow: "scroll",
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          padding: "10px",
          // marginBottom: "20px",
        }}
      >
        {isLoading ? (
          <div>Loading...</div>
        ) : (
          <ScatterPlotMatrix data={csvData} />
        )}
      </div>
    </div>
  );
}

export default App;

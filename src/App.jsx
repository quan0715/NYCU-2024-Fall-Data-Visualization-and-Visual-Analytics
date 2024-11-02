import React from "react";
import { useCSVFile } from "./useCsvFile";
import { AirPollutionHorizonChart } from "./AirPollutionHorizonChart";
import { Mosaic } from "react-loading-indicators";
function App() {
  // const dataSources = "./air-pollution.csv";
  const dataSources = "http://vis.lab.djosix.com:2024/data/air-pollution.csv";
  const { csvData, isLoading } = useCSVFile(dataSources);
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
        height: "100%",
        width: "100vw",
      }}
    >
      
      <h3>LAB7: Horizon Charts</h3>
      <div
        style={{
          display: "flex",
          gap: "12px",
          width: "100%",
          height: "100%",
          overflow: "auto",
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          padding: "10px",
        }}
      >
        {isLoading || !csvData || !csvData.length ? (
          <Mosaic color={["#33CCCC", "#33CC36", "#B8CC33", "#FCCA00"]} />
        ) : (
          <AirPollutionHorizonChart csvData={csvData} />
        )}
      </div>
    </div>
  );
}

export default App;

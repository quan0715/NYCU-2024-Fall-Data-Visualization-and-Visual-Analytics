import React from "react";
import { useCSVFile } from "./useCsvFile";
import { ThemeRiver } from "./ThemeRiver";
import { DndProvider } from "react-dnd";

function App() {
  const dataSources = "http://vis.lab.djosix.com:2024/data/ma_lga_12345.csv";
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
      <h3>LAB6: ThemeRiver Tutorial</h3>
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
        {isLoading ? <div>Loading...</div> : <ThemeRiver data={csvData} />}
      </div>
    </div>
  );
}

export default App;

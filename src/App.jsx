import React, { useState, useEffect, useTransition } from "react";
import Papa from "papaparse";
import { CorrelationMatrices } from "./D3Chart.jsx";
function useCSVFile(fileName, attribute) {
  const [isLoading, startFetchingData] = useTransition();
  const [csvData, setCsvData] = useState([]);

  useEffect(() => {
    startFetchingData(async () => {
      const response = await fetch(fileName); // Fetch CSV from public folder
      const reader = response.body.getReader();
      const decoder = new TextDecoder("utf-8");
      // if attribute, insert it at the front

      let result = attribute !== null ? attribute.join(",") + "\n" : "";
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

function App() {
  // const dataSources = "http://vis.lab.djosix.com:2024/data/iris.csv";
  const dataSources = "http://vis.lab.djosix.com:2024/data/abalone.data";
  const { csvData, isLoading } = useCSVFile(dataSources, [
    "Sex",
    "Length",
    "Diameter",
    "Height",
    "Whole_weight",
    "Shucked_weight",
    "Viscera_weight",
    "Shell_weight",
    "Rings",
  ]);
  // console.log(csvData);
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
      <h3>LAB3:Correlation matrices</h3>
      <div
        style={{
          display: "flex",
          gap: "12px",
          width: "100%",
          overflow: "scroll",
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "start",
          marginBottom: "20px",
        }}
      >
        {!isLoading && (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "start",
              justifyContent: "start",
            }}
          >
            <h3
              style={{
                fontSize: "20px",
              }}
            >
              Gender: Male
            </h3>
            <CorrelationMatrices
              data={csvData.filter((data) => data["Sex"] === "M")}
            />
          </div>
        )}
        {!isLoading && (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "start",
              justifyContent: "start",
            }}
          >
            <h3
              style={{
                fontSize: "20px",
              }}
            >
              Gender: Female
            </h3>
            <CorrelationMatrices
              data={csvData.filter((data) => data["Sex"] === "F")}
            />
          </div>
        )}
        {!isLoading && (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "start",
              justifyContent: "start",
            }}
          >
            <h3
              style={{
                fontSize: "20px",
              }}
            >
              Gender: Infant
            </h3>
            <CorrelationMatrices
              data={csvData.filter((data) => data["Sex"] === "I")}
            />
          </div>
        )}
      </div>
    </div>
  );
}

export default App;

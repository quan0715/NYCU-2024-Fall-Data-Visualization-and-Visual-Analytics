import { useState, useEffect, useTransition } from "react";
import Papa from "papaparse";
export function useCSVFile(fileName, attribute = null) {
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
          // console.log(results.data);
          setCsvData(results.data); // Set parsed CSV data
        },
      });
    });
  }, [fileName]);

  return { csvData, isLoading };
}

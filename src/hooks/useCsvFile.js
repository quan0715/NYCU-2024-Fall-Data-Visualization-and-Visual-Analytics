
import { useEffect, useState } from 'react';
import Papa from 'papaparse';
import { useTransition } from 'react'

export function useCSVFile(fileName){
    const [isLoading, startFetchingData] = useTransition();
    const [csvData, setCsvData] = useState([]);

    useEffect(() => {
        startFetchingData(
            async () => {
                const response = await fetch(fileName); // Fetch CSV from public folder
        const reader = response.body.getReader();
        const decoder = new TextDecoder('utf-8');
        let result = '';
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
            },
        );
    }, [fileName]);

    return { csvData, isLoading };
}


// pages/index.js
"use client";
import { useEffect, useState } from "react";
import Papa from "papaparse";
import { useCSVFile } from "@/hooks/useCsvFile";
import { ScatterChart } from "@/charts/ScatterChart";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

export default function Home() {
    const dataSources = "/data/iris.csv";
    // const dataSources = "http://vis.lab.djosix.com:2024/data/iris.csv";
    const { csvData, isLoading } = useCSVFile(dataSources);

    const attributes = [
        "sepal length",
        "sepal width",
        "petal length",
        "petal width",
    ];
    const [xAttribute, setXAttribute] = useState(attributes[0]);
    const [yAttribute, setYAttribute] = useState(attributes[1]);
    return (
        <div className={"h-svh w-ful"}>
            <div
                className={
                    "w-full h-full flex flex-row justify-center items-center "
                }
            >
                <div
                    className={
                        "w-fit h-fit flex flex-col justify-start items-center"
                    }
                >
                    {!isLoading && (
                        <ScatterChart
                            csvData={csvData}
                            xAttribute={xAttribute}
                            yAttribute={yAttribute}
                        />
                    )}
                </div>
                <div
                    className={
                        "w-[400px] flex flex-col justify-start items-start space-y-4"
                    }
                >
                    <h1 className="text-xl font-semibold">
                        Data Visualization Lab 1
                    </h1>
                    <Separator />
                    <div className={"w-full flex flex-col space-y-2"}>
                        <div
                            className={
                                "w-full flex flex-col justify-start items-start"
                            }
                        >
                            <Label>X 軸</Label>
                            <Select
                                defaultValue={xAttribute}
                                onValueChange={(value) => {
                                    setXAttribute(value);
                                }}
                            >
                                <SelectTrigger className="m-2 p-2 rounded-md">
                                    <SelectValue placeholder={"X軸"} />
                                </SelectTrigger>
                                <SelectContent>
                                    {attributes.map((attribute) => (
                                        <SelectItem
                                            key={attribute}
                                            value={attribute}
                                        >
                                            {attribute}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div
                            className={
                                "w-full flex flex-col justify-start items-start"
                            }
                        >
                            <Label>Y 軸</Label>
                            <Select
                                defaultValue={yAttribute}
                                onValueChange={(value) => {
                                    setYAttribute(value);
                                }}
                            >
                                <SelectTrigger className="m-2 p-2 rounded-md">
                                    <SelectValue placeholder={"Y軸"} />
                                </SelectTrigger>
                                <SelectContent>
                                    {attributes.map((attribute) => (
                                        <SelectItem
                                            key={attribute}
                                            value={attribute}
                                        >
                                            {attribute}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

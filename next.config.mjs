/** @type {import('next').NextConfig} */

const isProd = process.env.NODE_ENV === "production";

const nextConfig = {
    basePath: isProd
        ? "NYCU-2024-Fall-Data-Visualization-and-Visual-Analytics"
        : "",
    output: "export",
};

export default nextConfig;

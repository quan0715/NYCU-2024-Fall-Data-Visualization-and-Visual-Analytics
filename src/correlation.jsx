import * as d3 from "d3";

// Utility function to compute correlation matrix
export function computeCorrelationMatrix(attributes, data) {
  const matrix = [];

  attributes.forEach((attr1) => {
    const row = [];
    attributes.forEach((attr2) => {
      const correlation = pearsonCorrelation(
        data.map((d) => +d[attr1]),
        data.map((d) => +d[attr2])
      );
      row.push({ x: attr1, y: attr2, value: correlation });
    });
    matrix.push(row);
  });

  return { attributes, matrix };
}

// Pearson Correlation Function
function pearsonCorrelation(x, y) {
  const n = x.length;
  const [sumX, sumY] = [d3.sum(x), d3.sum(y)];
  const [meanX, meanY] = [sumX / n, sumY / n];

  // Calculate covariance
  const covariance = d3.sum(x.map((xi, i) => (xi - meanX) * (y[i] - meanY)));

  // Calculate standard deviations
  const stdDevX = Math.sqrt(d3.sum(x.map((xi) => (xi - meanX) ** 2)));
  const stdDevY = Math.sqrt(d3.sum(y.map((yi) => (yi - meanY) ** 2)));

  // Check for zero standard deviation to avoid division by zero
  if (stdDevX === 0 || stdDevY === 0) {
    return 0; // Return zero correlation if one of the variables has no variation
  }

  // Calculate and return Pearson correlation, bounded between -1 and 1
  const correlation = covariance / (stdDevX * stdDevY);
  return Math.max(-1, Math.min(1, correlation));
}

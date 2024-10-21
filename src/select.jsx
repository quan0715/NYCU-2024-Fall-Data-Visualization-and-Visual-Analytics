import React from "react";
function Label({ children }) {
  return (
    <label
      style={{
        fontSize: "14px",
        fontWeight: "bold",
      }}
    >
      {children}
    </label>
  );
}

export function Select({
  label = undefined,
  options,
  value = undefined,
  onChange,
  style,
}) {
  return (
    <div
      style={{
        width: "100%",
        borderRadius: "8px",
        ...style,
      }}
    >
      {label !== undefined ? <Label>{label}:</Label> : null}
      <select
        style={{
          width: "100%",
          fontSize: "12px",
          padding: "8px",
          borderRadius: "8px",
          border: "1px solid #ccc",
        }}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        {options.map((option, i) => (
          <option key={i} value={option}>
            {option}
          </option>
        ))}
      </select>
    </div>
  );
}

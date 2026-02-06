// Grid.tsx
import React from "react";
import { jsx } from "react/jsx-runtime";
var mapHorizontalAlignment = (alignment) => {
  switch (alignment) {
    case "left":
      return "start";
    case "center":
      return "center";
    case "right":
      return "end";
    case "stretch":
      return "stretch";
    default:
      return "stretch";
  }
};
var mapVerticalAlignment = (alignment) => {
  switch (alignment) {
    case "top":
      return "start";
    case "center":
      return "center";
    case "bottom":
      return "end";
    case "stretch":
      return "stretch";
    default:
      return "stretch";
  }
};
var Grid = ({
  columns = "1fr",
  rows = "auto",
  gap = 8,
  autoFlow = "row",
  children,
  style,
  ...restProps
}) => {
  const gridStyle = {
    display: "grid",
    gridTemplateColumns: typeof columns === "number" ? `repeat(${columns}, 1fr)` : columns,
    gridTemplateRows: rows,
    gap: typeof gap === "number" ? `${gap}px` : gap,
    gridAutoFlow: autoFlow,
    width: "100%",
    height: "100%",
    ...style
  };
  const processedChildren = React.Children.map(children, (child) => {
    if (!React.isValidElement(child)) return child;
    const childProps = child.props;
    const hasGridPosition = childProps.row !== void 0 || childProps.column !== void 0;
    const gridRow = childProps.rowSpan && childProps.row ? `${childProps.row} / span ${childProps.rowSpan}` : childProps.row?.toString();
    const gridColumn = childProps.columnSpan && childProps.column ? `${childProps.column} / span ${childProps.columnSpan}` : childProps.column?.toString();
    const childStyle = {
      ...childProps.style
    };
    if (!gridRow && !gridColumn) {
      childStyle.gridArea = "1 / 1 / 2 / 2";
    }
    if (gridRow) childStyle.gridRow = gridRow;
    if (gridColumn) childStyle.gridColumn = gridColumn;
    if (hasGridPosition || childProps.horizontalAlignment || childProps.verticalAlignment) {
      childStyle.justifySelf = mapHorizontalAlignment(childProps.horizontalAlignment ?? "stretch");
      childStyle.alignSelf = mapVerticalAlignment(childProps.verticalAlignment ?? "stretch");
    }
    return React.cloneElement(child, { style: childStyle });
  });
  return /* @__PURE__ */ jsx("div", { style: gridStyle, role: "grid", ...restProps, children: processedChildren });
};
var Grid_default = Grid;
export {
  Grid,
  Grid_default as default
};
//# sourceMappingURL=Grid.mjs.map
"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// Grid.tsx
var Grid_exports = {};
__export(Grid_exports, {
  Grid: () => Grid,
  default: () => Grid_default
});
module.exports = __toCommonJS(Grid_exports);
var import_react = __toESM(require("react"));
var import_jsx_runtime = require("react/jsx-runtime");
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
  style
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
  const processedChildren = import_react.default.Children.map(children, (child) => {
    if (!import_react.default.isValidElement(child)) return child;
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
    return import_react.default.cloneElement(child, { style: childStyle });
  });
  return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: gridStyle, role: "grid", children: processedChildren });
};
var Grid_default = Grid;
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  Grid
});
//# sourceMappingURL=Grid.js.map
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

// index.ts
var index_exports = {};
__export(index_exports, {
  DockPanel: () => DockPanel,
  Grid: () => Grid,
  Root: () => Root,
  ScrollViewer: () => ScrollViewer,
  StackPanel: () => StackPanel
});
module.exports = __toCommonJS(index_exports);

// Root.tsx
var import_jsx_runtime = require("react/jsx-runtime");
var Root = ({ children, fullScreen = true, style }) => {
  const rootStyle = {
    position: "relative",
    width: fullScreen ? "100%" : "100%",
    height: fullScreen ? "100%" : "100%",
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
    boxSizing: "border-box",
    ...style
  };
  return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: rootStyle, role: "main", children });
};

// StackPanel.tsx
var import_jsx_runtime2 = require("react/jsx-runtime");
var mapAlignmentToFlex = (alignment) => {
  switch (alignment) {
    case "start":
      return "flex-start";
    case "center":
      return "center";
    case "end":
      return "flex-end";
    case "stretch":
      return "stretch";
    default:
      return "stretch";
  }
};
var StackPanel = ({
  orientation = "vertical",
  spacing = 8,
  horizontalAlignment = "stretch",
  verticalAlignment = "start",
  children,
  style
}) => {
  const isHorizontal = orientation === "horizontal";
  const stackStyle = {
    display: "flex",
    flexDirection: isHorizontal ? "row" : "column",
    gap: typeof spacing === "number" ? `${spacing}px` : spacing,
    justifyContent: isHorizontal ? mapAlignmentToFlex(verticalAlignment) : mapAlignmentToFlex(horizontalAlignment),
    alignItems: isHorizontal ? mapAlignmentToFlex(horizontalAlignment) : mapAlignmentToFlex(verticalAlignment),
    width: horizontalAlignment === "stretch" ? "100%" : "auto",
    height: verticalAlignment === "stretch" ? "100%" : "auto",
    ...style
  };
  return /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { style: stackStyle, role: "region", children });
};

// Grid.tsx
var import_react = __toESM(require("react"));
var import_jsx_runtime3 = require("react/jsx-runtime");
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
  return /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("div", { style: gridStyle, role: "grid", children: processedChildren });
};

// DockPanel.tsx
var import_react2 = __toESM(require("react"));
var import_jsx_runtime4 = require("react/jsx-runtime");
var DockPanel = ({
  lastChildFill = true,
  children,
  style
}) => {
  const dockStyle = {
    display: "flex",
    flexDirection: "column",
    width: "100%",
    height: "100%",
    boxSizing: "border-box",
    ...style
  };
  const childrenArray = import_react2.default.Children.toArray(children);
  const topElements = [];
  const bottomElements = [];
  const leftElements = [];
  const rightElements = [];
  let fillElement = null;
  const middleElements = [];
  childrenArray.forEach((child, index) => {
    if (!import_react2.default.isValidElement(child)) return;
    const childProps = child.props;
    const isLastChild = index === childrenArray.length - 1;
    const hasDockProp = childProps.dock !== void 0;
    if (hasDockProp) {
      const dock = childProps.dock;
      const childStyle = { ...childProps.style };
      if (dock === "top" || dock === "bottom") {
        childStyle.width = "100%";
        childStyle.flexShrink = 0;
      } else {
        childStyle.flexShrink = 0;
      }
      const clonedChild = import_react2.default.cloneElement(child, { style: childStyle });
      if (dock === "top") topElements.push(clonedChild);
      else if (dock === "bottom") bottomElements.push(clonedChild);
      else if (dock === "left") leftElements.push(clonedChild);
      else if (dock === "right") rightElements.push(clonedChild);
    } else if (lastChildFill && isLastChild && !fillElement) {
      fillElement = import_react2.default.cloneElement(child, {
        style: { flex: 1, ...childProps.style }
      });
    } else {
      middleElements.push(child);
    }
  });
  const middleRowStyle = {
    display: "flex",
    flexDirection: "row",
    flex: 1,
    minHeight: 0
  };
  const centerStyle = {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    minWidth: 0
  };
  return /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { style: dockStyle, role: "region", children: [
    topElements,
    /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { style: middleRowStyle, children: [
      leftElements,
      /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { style: centerStyle, children: [
        middleElements,
        fillElement
      ] }),
      rightElements
    ] }),
    bottomElements
  ] });
};

// ScrollViewer.tsx
var import_jsx_runtime5 = require("react/jsx-runtime");
var mapVisibilityToOverflow = (visibility) => {
  switch (visibility) {
    case "visible":
      return "scroll";
    case "hidden":
      return "hidden";
    case "disabled":
      return "hidden";
    case "auto":
    default:
      return "auto";
  }
};
var ScrollViewer = ({
  verticalScrollBarVisibility = "auto",
  horizontalScrollBarVisibility = "disabled",
  children,
  style
}) => {
  const scrollViewerStyle = {
    overflowX: mapVisibilityToOverflow(horizontalScrollBarVisibility),
    overflowY: mapVisibilityToOverflow(verticalScrollBarVisibility),
    width: "100%",
    height: "100%",
    position: "relative",
    ...style
  };
  const contentStyle = {
    minWidth: "fit-content",
    minHeight: "fit-content"
  };
  return /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("div", { style: scrollViewerStyle, className: "scrollviewer", role: "region", "aria-label": "Scrollable content", children: [
    /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("div", { style: contentStyle, children }),
    /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("style", { children: `
        .scrollviewer::-webkit-scrollbar {
          width: 12px;
          height: 12px;
        }
        .scrollviewer::-webkit-scrollbar-track {
          background: #2d2d2d;
          border-radius: 6px;
        }
        .scrollviewer::-webkit-scrollbar-thumb {
          background: #5a5a5a;
          border-radius: 6px;
          border: 2px solid #2d2d2d;
        }
        .scrollviewer::-webkit-scrollbar-thumb:hover {
          background: #6a6a6a;
        }
        .scrollviewer::-webkit-scrollbar-corner {
          background: #2d2d2d;
        }
      ` })
  ] });
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  DockPanel,
  Grid,
  Root,
  ScrollViewer,
  StackPanel
});
//# sourceMappingURL=index.js.map
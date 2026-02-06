// Root.tsx
import { jsx } from "react/jsx-runtime";
var Root = ({ children, fullScreen = true, style, ...restProps }) => {
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
  return /* @__PURE__ */ jsx("div", { style: rootStyle, role: "main", ...restProps, children });
};

// StackPanel.tsx
import { jsx as jsx2 } from "react/jsx-runtime";
var mapAlignmentToFlex = (alignment) => {
  switch (alignment) {
    case "start":
    case "left":
    case "top":
      return "flex-start";
    case "center":
      return "center";
    case "end":
    case "right":
    case "bottom":
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
  verticalAlignment = "stretch",
  margin,
  children,
  style,
  ...restProps
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
    margin: typeof margin === "number" ? `${margin}px` : margin,
    ...style
  };
  return /* @__PURE__ */ jsx2("div", { style: stackStyle, role: "region", ...restProps, children });
};

// Grid.tsx
import React from "react";
import { jsx as jsx3 } from "react/jsx-runtime";
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
  return /* @__PURE__ */ jsx3("div", { style: gridStyle, role: "grid", ...restProps, children: processedChildren });
};

// DockPanel.tsx
import React2 from "react";
import { jsxs } from "react/jsx-runtime";
var DockPanel = ({
  lastChildFill = true,
  children,
  style,
  ...restProps
}) => {
  const dockStyle = {
    display: "flex",
    flexDirection: "column",
    width: "100%",
    height: "100%",
    boxSizing: "border-box",
    ...style
  };
  const childrenArray = React2.Children.toArray(children);
  const topElements = [];
  const bottomElements = [];
  const leftElements = [];
  const rightElements = [];
  let fillElement = null;
  const middleElements = [];
  childrenArray.forEach((child, index) => {
    if (!React2.isValidElement(child)) return;
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
      const clonedChild = React2.cloneElement(child, { style: childStyle });
      if (dock === "top") topElements.push(clonedChild);
      else if (dock === "bottom") bottomElements.push(clonedChild);
      else if (dock === "left") leftElements.push(clonedChild);
      else if (dock === "right") rightElements.push(clonedChild);
    } else if (lastChildFill && isLastChild && !fillElement) {
      fillElement = React2.cloneElement(child, {
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
  return /* @__PURE__ */ jsxs("div", { style: dockStyle, role: "region", ...restProps, children: [
    topElements,
    /* @__PURE__ */ jsxs("div", { style: middleRowStyle, children: [
      leftElements,
      /* @__PURE__ */ jsxs("div", { style: centerStyle, children: [
        middleElements,
        fillElement
      ] }),
      rightElements
    ] }),
    bottomElements
  ] });
};

// ScrollViewer.tsx
import { jsx as jsx4, jsxs as jsxs2 } from "react/jsx-runtime";
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
  style,
  ...restProps
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
  return /* @__PURE__ */ jsxs2("div", { style: scrollViewerStyle, className: "scrollviewer", role: "region", "aria-label": "Scrollable content", ...restProps, children: [
    /* @__PURE__ */ jsx4("div", { style: contentStyle, children }),
    /* @__PURE__ */ jsx4("style", { children: `
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

// types.ts
import React3 from "react";
function isDockableElement(element) {
  if (!React3.isValidElement(element)) return false;
  const props = element.props;
  return typeof props === "object" && props !== null && "dock" in props;
}
function isGridChildElement(element) {
  if (!React3.isValidElement(element)) return false;
  const props = element.props;
  return typeof props === "object" && props !== null && ("row" in props || "column" in props || "rowSpan" in props || "columnSpan" in props);
}
function isFrameworkElement(element) {
  if (!React3.isValidElement(element)) return false;
  const props = element.props;
  return typeof props === "object" && props !== null && ("horizontalAlignment" in props || "verticalAlignment" in props || "margin" in props);
}
export {
  DockPanel,
  Grid,
  Root,
  ScrollViewer,
  StackPanel,
  isDockableElement,
  isFrameworkElement,
  isGridChildElement
};
//# sourceMappingURL=index.mjs.map
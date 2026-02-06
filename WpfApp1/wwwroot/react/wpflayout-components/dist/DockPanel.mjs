// DockPanel.tsx
import React from "react";
import { jsxs } from "react/jsx-runtime";
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
  const childrenArray = React.Children.toArray(children);
  const topElements = [];
  const bottomElements = [];
  const leftElements = [];
  const rightElements = [];
  let fillElement = null;
  const middleElements = [];
  childrenArray.forEach((child, index) => {
    if (!React.isValidElement(child)) return;
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
      const clonedChild = React.cloneElement(child, { style: childStyle });
      if (dock === "top") topElements.push(clonedChild);
      else if (dock === "bottom") bottomElements.push(clonedChild);
      else if (dock === "left") leftElements.push(clonedChild);
      else if (dock === "right") rightElements.push(clonedChild);
    } else if (lastChildFill && isLastChild && !fillElement) {
      fillElement = React.cloneElement(child, {
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
  return /* @__PURE__ */ jsxs("div", { style: dockStyle, role: "region", children: [
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
var DockPanel_default = DockPanel;
export {
  DockPanel,
  DockPanel_default as default
};
//# sourceMappingURL=DockPanel.mjs.map
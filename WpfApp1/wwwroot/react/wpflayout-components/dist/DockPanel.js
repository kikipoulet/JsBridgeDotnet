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

// DockPanel.tsx
var DockPanel_exports = {};
__export(DockPanel_exports, {
  DockPanel: () => DockPanel,
  default: () => DockPanel_default
});
module.exports = __toCommonJS(DockPanel_exports);
var import_react = __toESM(require("react"));
var import_jsx_runtime = require("react/jsx-runtime");
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
  const childrenArray = import_react.default.Children.toArray(children);
  const topElements = [];
  const bottomElements = [];
  const leftElements = [];
  const rightElements = [];
  let fillElement = null;
  const middleElements = [];
  childrenArray.forEach((child, index) => {
    if (!import_react.default.isValidElement(child)) return;
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
      const clonedChild = import_react.default.cloneElement(child, { style: childStyle });
      if (dock === "top") topElements.push(clonedChild);
      else if (dock === "bottom") bottomElements.push(clonedChild);
      else if (dock === "left") leftElements.push(clonedChild);
      else if (dock === "right") rightElements.push(clonedChild);
    } else if (lastChildFill && isLastChild && !fillElement) {
      fillElement = import_react.default.cloneElement(child, {
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
  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: dockStyle, role: "region", children: [
    topElements,
    /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: middleRowStyle, children: [
      leftElements,
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: centerStyle, children: [
        middleElements,
        fillElement
      ] }),
      rightElements
    ] }),
    bottomElements
  ] });
};
var DockPanel_default = DockPanel;
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  DockPanel
});
//# sourceMappingURL=DockPanel.js.map
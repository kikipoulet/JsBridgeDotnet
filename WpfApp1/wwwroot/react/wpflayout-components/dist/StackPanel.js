"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
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
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// StackPanel.tsx
var StackPanel_exports = {};
__export(StackPanel_exports, {
  StackPanel: () => StackPanel,
  default: () => StackPanel_default
});
module.exports = __toCommonJS(StackPanel_exports);
var import_jsx_runtime = require("react/jsx-runtime");
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
  return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: stackStyle, role: "region", ...restProps, children });
};
var StackPanel_default = StackPanel;
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  StackPanel
});
//# sourceMappingURL=StackPanel.js.map
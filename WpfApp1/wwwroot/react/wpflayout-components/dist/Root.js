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

// Root.tsx
var Root_exports = {};
__export(Root_exports, {
  Root: () => Root,
  default: () => Root_default
});
module.exports = __toCommonJS(Root_exports);
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
var Root_default = Root;
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  Root
});
//# sourceMappingURL=Root.js.map
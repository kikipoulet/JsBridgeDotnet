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

// ScrollViewer.tsx
var ScrollViewer_exports = {};
__export(ScrollViewer_exports, {
  ScrollViewer: () => ScrollViewer,
  default: () => ScrollViewer_default
});
module.exports = __toCommonJS(ScrollViewer_exports);
var import_jsx_runtime = require("react/jsx-runtime");
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
  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: scrollViewerStyle, className: "scrollviewer", role: "region", "aria-label": "Scrollable content", children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: contentStyle, children }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("style", { children: `
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
var ScrollViewer_default = ScrollViewer;
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  ScrollViewer
});
//# sourceMappingURL=ScrollViewer.js.map
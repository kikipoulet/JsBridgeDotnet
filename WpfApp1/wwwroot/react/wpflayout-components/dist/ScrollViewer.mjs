// ScrollViewer.tsx
import { jsx, jsxs } from "react/jsx-runtime";
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
  return /* @__PURE__ */ jsxs("div", { style: scrollViewerStyle, className: "scrollviewer", role: "region", "aria-label": "Scrollable content", children: [
    /* @__PURE__ */ jsx("div", { style: contentStyle, children }),
    /* @__PURE__ */ jsx("style", { children: `
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
export {
  ScrollViewer,
  ScrollViewer_default as default
};
//# sourceMappingURL=ScrollViewer.mjs.map
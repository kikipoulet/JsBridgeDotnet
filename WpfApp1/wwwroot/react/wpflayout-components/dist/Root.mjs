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
var Root_default = Root;
export {
  Root,
  Root_default as default
};
//# sourceMappingURL=Root.mjs.map
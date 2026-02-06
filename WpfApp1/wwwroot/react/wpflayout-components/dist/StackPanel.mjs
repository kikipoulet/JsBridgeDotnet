// StackPanel.tsx
import { jsx } from "react/jsx-runtime";
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
  return /* @__PURE__ */ jsx("div", { style: stackStyle, role: "region", ...restProps, children });
};
var StackPanel_default = StackPanel;
export {
  StackPanel,
  StackPanel_default as default
};
//# sourceMappingURL=StackPanel.mjs.map
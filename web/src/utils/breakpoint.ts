export const getBreakpoint = function (domNode?: any) {
  const { width } = window.getComputedStyle(domNode || document.body);
  const widthNumber = parseInt(width);

  if (widthNumber <= 200) {
    return "xsmall";
  } else if (widthNumber <= 400) {
    return "small";
  } else if (widthNumber <= 600) {
    return "medium";
  } else if (widthNumber <= 800) {
    return "large";
  } else {
    return "xlarge";
  }
};

export const getBreakpointMarginWidth = (domNode?: any) => {
  const breakpoint = getBreakpoint(domNode);
  switch (breakpoint) {
    case "xsmall":
      return 16;
    case "small":
      return 24;
    case "medium":
      return 32;
    case "large":
      return 46;
    default:
      return 64;
  }
};

export function getCSSPath(element) {
  if (element.id) {
    return "#" + element.id
  } else {
    let path = []
    while (element.parentElement) {
      let tag = element.tagName.toLowerCase()
      let index =
        Array.prototype.indexOf.call(element.parentElement.children, element) +
        1
      let indexString = index > 1 ? `:nth-child(${index})` : ""
      path.unshift(tag + indexString)
      element = element.parentElement
    }
    return path.join(" > ")
  }
}

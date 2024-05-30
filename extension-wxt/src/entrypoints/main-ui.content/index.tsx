import ReactDOM from "react-dom/client";
import App from "./App";

export default defineContentScript({
  matches: ["<all_urls>"],
  // 2. Set cssInjectionMode
  cssInjectionMode: "ui",

  async main(ctx) {
    console.log("ctx", ctx);
    // 3. Define your UI
    const ui = await createShadowRootUi(ctx, {
      name: "refly-main-app",
      position: "inline",
      append: "before",
      onMount(container) {
        const elem = document.createElement("div");
        elem.id = "#refly-main-app";
        container.appendChild(elem);

        console.log("container", container);

        const root = ReactDOM.createRoot(elem);
        root.render(<App />);
        return root;
      },
      onRemove: (root) => {
        root?.unmount();
      },
    });

    // 4. Mount the UI
    ui.mount();
  },
});

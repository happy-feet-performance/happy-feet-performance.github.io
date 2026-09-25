import { createRoot } from "react-dom/client";

const registry = {};

let root = null;

function mount(name, container, props) {
  unmountAll();
  const Component = registry[name];
  if (!Component) {
    console.error(`HF_REACT: unknown component "${name}"`);
    return;
  }
  root = createRoot(container);
  root.render(<Component {...props} />);
}

function unmountAll() {
  if (root) {
    root.unmount();
    root = null;
  }
}

window.HF_REACT = { mount, unmountAll };

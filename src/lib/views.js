// Mounts a registered view component into the shell's #main-content
// (see src/react/mount.jsx), replacing whatever view was there.
export const showView = (name, props) => {
  if (window._stopConfetti) window._stopConfetti();
  const mc = document.getElementById("main-content");
  if (mc) window.HF_REACT.mount(name, mc, props);
};

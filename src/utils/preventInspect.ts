/**
 * Utility functions to prevent browser inspection and DevTools access
 */

export const preventInspect = () => {
  // Disable right-click context menu
  document.addEventListener("contextmenu", (e) => {
    e.preventDefault();
    return false;
  });

  // Disable common keyboard shortcuts for DevTools
  document.addEventListener("keydown", (e) => {
    // Disable F12 (DevTools)
    if (e.key === "F12") {
      e.preventDefault();
      return false;
    }

    // Disable Ctrl+Shift+I (DevTools)
    if (e.ctrlKey && e.shiftKey && e.key === "I") {
      e.preventDefault();
      return false;
    }

    // Disable Ctrl+Shift+J (Console)
    if (e.ctrlKey && e.shiftKey && e.key === "J") {
      e.preventDefault();
      return false;
    }

    // Disable Ctrl+Shift+C (Inspect Element)
    if (e.ctrlKey && e.shiftKey && e.key === "C") {
      e.preventDefault();
      return false;
    }

    // Disable Ctrl+U (View Source)
    if (e.ctrlKey && e.key === "u") {
      e.preventDefault();
      return false;
    }

    // Disable Ctrl+S (Save Page)
    if (e.ctrlKey && e.key === "s") {
      e.preventDefault();
      return false;
    }

    // Disable Ctrl+P (Print - can be used to view source)
    if (e.ctrlKey && e.key === "p") {
      e.preventDefault();
      return false;
    }

    // Disable Ctrl+Shift+Del (Clear browsing data)
    if (e.ctrlKey && e.shiftKey && e.key === "Delete") {
      e.preventDefault();
      return false;
    }
  });

  // Disable text selection (optional - comment out if you want users to select text)
  document.addEventListener("selectstart", (e) => {
    e.preventDefault();
    return false;
  });

  // Disable drag and drop (can sometimes be used to inspect)
  document.addEventListener("dragstart", (e) => {
    e.preventDefault();
    return false;
  });

  // Detect DevTools opening (basic detection)
  const devtools = {
    open: false,
    orientation: null as string | null,
  };
  const threshold = 160;

  setInterval(() => {
    if (
      window.outerHeight - window.innerHeight > threshold ||
      window.outerWidth - window.innerWidth > threshold
    ) {
      if (!devtools.open) {
        devtools.open = true;
        // Optionally redirect or show a message
        // window.location.href = "about:blank";
        // Or reload the page
        // window.location.reload();
      }
    } else {
      devtools.open = false;
    }
  }, 500);

  // Additional protection: Clear console
  const noop = () => {};
  const methods = [
    "log",
    "debug",
    "info",
    "warn",
    "error",
    "assert",
    "dir",
    "dirxml",
    "group",
    "groupEnd",
    "time",
    "timeEnd",
    "count",
    "trace",
    "profile",
    "profileEnd",
  ];

  methods.forEach((method) => {
    // @ts-expect-error - console is a global object
    console[method] = noop;
  });
};

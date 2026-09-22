"use client";

import { useEffect } from "react";

const BANNER = /^(development mode|secured by clerk)$/i;

export function HideClerkChrome() {
  useEffect(() => {
    const hide = () => {
      const nodes = document.querySelectorAll("a, span, p, div, footer");
      nodes.forEach((node) => {
        if (!(node instanceof HTMLElement)) return;
        const text = (node.innerText || "").trim();
        if (!BANNER.test(text)) return;
        node.style.setProperty("display", "none", "important");
      });
    };
    hide();
    const observer = new MutationObserver(hide);
    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, []);
  return null;
}

import { createElement as h } from "react";

export const SHARE_CARD_SIZE = { width: 1200, height: 630 };
export const SHARE_CARD_COLORS = {
  cream: "#F4F2EE", creamHi: "#FFFFFF", ink: "#141414", inkSoft: "#4A4A4A",
  violet: "#7C3AED", violetWash: "#EDE9FE", pop: "#7C3AED", line: "#E3DFD6", yellow: "#F6CE4A",
};

export function shareCardCopy({ title, sub = "", label = "Food guide" }) {
  const shorten = (value, limit) => {
    const text = String(value || "").replace(/\s+/g, " ").trim();
    if (text.length <= limit) return text;
    const cut = text.slice(0, limit - 1);
    const boundary = cut.lastIndexOf(" ");
    return `${boundary > limit * 0.6 ? cut.slice(0, boundary) : cut}…`;
  };
  const heading = shorten(title || "Explore Hyderabad Eats", 112);
  const length = heading.replace(/\*/g, "").length;
  const baseSize = length < 28 ? 84 : length < 50 ? 72 : length < 78 ? 62 : 52;
  const longestWord = Math.max(...heading.replace(/\*/g, "").split(/\s+/).map((word) => word.length));
  const fontSize = Math.min(baseSize, Math.floor(640 / (0.68 * longestWord)));
  return { title: heading, sub: shorten(sub, 122), label: shorten(label, 32), fontSize };
}

/** One reusable 1200×630 frame. Content changes; identity and hierarchy do not. */
export function shareCard({ title, sub, label, visual, image, brandIcon, landmark }) {
  const C = SHARE_CARD_COLORS;
  const copy = shareCardCopy({ title, sub, label });
  const heading = copy.title.split("*").flatMap((part, i) => part.split(/\s+/).filter(Boolean).map((word, j) =>
    h("span", { key: `${i}-${j}`, style: { color: i % 2 ? C.violet : C.ink, marginRight: 13 } }, word)));
  return h("div", { style: { ...SHARE_CARD_SIZE, display: "flex", position: "relative", overflow: "hidden", background: C.cream, fontFamily: "UI" } },
    h("div", { style: { display: "flex", position: "absolute", left: 0, right: 0, bottom: 0, height: 12, background: C.yellow } }),
    h("div", { style: { display: "flex", position: "absolute", top: 37, left: 48, right: 48, alignItems: "center", justifyContent: "space-between" } },
      h("div", { style: { display: "flex", alignItems: "center" } },
        brandIcon ? h("img", { src: brandIcon, width: 48, height: 48, style: { borderRadius: 12 } }) : null,
        h("div", { style: { display: "flex", marginLeft: brandIcon ? 13 : 0, fontFamily: "Display", fontSize: 31, color: C.ink } }, "Hyderabad Eats")),
      h("div", { style: { display: "flex", background: C.yellow, color: C.ink, border: `1px solid ${C.ink}`, padding: "10px 16px", borderRadius: 4, fontSize: 18, fontWeight: 700, letterSpacing: 1.4, transform: "rotate(-2deg)" } }, copy.label.toUpperCase())),
    h("div", { style: { display: "flex", position: "absolute", left: 52, top: 153, width: 665, height: 355, flexDirection: "column", justifyContent: "center" } },
      h("div", { style: { display: "flex", flexWrap: "wrap", fontFamily: "Display", fontSize: copy.fontSize, lineHeight: 1.04, letterSpacing: -1.7, color: C.ink, maxHeight: 268, overflow: "hidden" } }, ...heading),
      copy.sub ? h("div", { style: { display: "flex", marginTop: 20, fontSize: 25, color: C.inkSoft, lineHeight: 1.35, maxHeight: 102, overflow: "hidden" } }, copy.sub) : null),
    h("div", { style: { display: "flex", position: "absolute", right: 42, top: 141, width: 358, height: 367, borderRadius: 24, background: C.violetWash, border: `2px solid ${C.ink}`, boxShadow: `8px 8px 0 ${C.yellow}`, overflow: "hidden", alignItems: "center", justifyContent: "center" } },
      image ? h("img", { src: image, width: 358, height: 367, style: { objectFit: "cover" } })
        : visual || (landmark ? h("img", { src: landmark, width: 226, height: 342, style: { objectFit: "contain" } }) : null)),
    h("div", { style: { display: "flex", position: "absolute", left: 52, right: 48, bottom: 39, paddingTop: 15, borderTop: `1px solid ${C.line}`, alignItems: "center", justifyContent: "space-between", color: C.inkSoft } },
      h("span", { style: { fontSize: 23, fontWeight: 700 } }, "eats.mapmyhyd.com"),
      h("span", { style: { fontSize: 16, letterSpacing: 1.5, fontWeight: 700 } }, "MAPPING HYD.")));
}

import { describe, expect, it } from "vitest";
import { htmlToBlocks } from "@/lib/extract";

const para = (n: number) =>
  `Paragraph ${n} carries enough real words to count as article text for the reader view.`;

function page(body: string) {
  return `<html><head><script>var x = "<p>not this</p>";</script></head><body>
    <nav><p>${"Navigation link text that is long enough to pass the filter"}</p></nav>
    <article>${body}</article>
    <footer><p>Footer text that is long enough to pass the length filter too</p></footer>
  </body></html>`;
}

describe("htmlToBlocks", () => {
  it("keeps paragraphs and headings in order, inside <article> only", () => {
    const blocks = htmlToBlocks(
      page(`<p>${para(1)}</p><h2>Section</h2><p>${para(2)}</p>${[3, 4, 5, 6].map((n) => `<p>${para(n)}</p>`).join("")}`),
    );
    expect(blocks).not.toBeNull();
    expect(blocks![0]).toEqual({ t: "p", x: para(1) });
    expect(blocks![1]).toEqual({ t: "h", x: "Section" });
    expect(blocks!.some((b) => b.x.includes("Navigation") || b.x.includes("Footer"))).toBe(false);
  });

  it("strips inline tags and decodes entities", () => {
    const blocks = htmlToBlocks(
      page(`<p>Ben &amp; Jerry <a href="#">said</a> <strong>this</strong> &mdash; ${para(1)}</p>${[2, 3, 4, 5, 6].map((n) => `<p>${para(n)}</p>`).join("")}`),
    );
    expect(blocks![0].x.startsWith("Ben & Jerry said this")).toBe(true);
  });

  it("drops junk and very short paragraphs", () => {
    const blocks = htmlToBlocks(
      page(`<p>Advertisement</p><p>Short.</p><figure><figcaption>${para(0)}</figcaption></figure>${[1, 2, 3, 4, 5, 6].map((n) => `<p>${para(n)}</p>`).join("")}`),
    );
    expect(blocks!.map((b) => b.x)).toEqual([1, 2, 3, 4, 5, 6].map(para));
  });

  it("takes a blockquote once, without repeating its inner paragraphs", () => {
    const blocks = htmlToBlocks(
      page(`<blockquote><p>${para(9)}</p></blockquote>${[1, 2, 3, 4, 5, 6].map((n) => `<p>${para(n)}</p>`).join("")}`),
    );
    expect(blocks![0]).toEqual({ t: "q", x: para(9) });
    expect(blocks!.filter((b) => b.x === para(9))).toHaveLength(1);
  });

  it("returns null when there's too little text (JS app, paywall)", () => {
    expect(htmlToBlocks(page(`<p>${para(1)}</p><div id="root"></div>`))).toBeNull();
  });
});

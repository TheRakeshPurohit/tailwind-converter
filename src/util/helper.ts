import { convertAttributes } from "./converter";
import DOMPurify from "dompurify";

export const initialHTML = `<html lang="en">
<body>
  <div class="main">
    <h2>Welcome to Tailwind Converter!</h2>
    <p>Edit/paste HTML here and CSS into
      the editor below
    </p>
  </div>
</body>
</html>`;

export const initialCSS = `body {
  margin: 1rem;
  padding: 1rem;
}

.main {
  text-align: center;
}

h2 {
  font-size: 2rem;
  margin-bottom: 0.5rem;
  color: blue;
}`;

type CSSProperties = {
  [property: string]: string;
};

type CSSJson = {
  [selector: string]: CSSProperties;
};

export const cssToJson = (css: string): { [index: string]: string }[] => {
  const json: CSSJson = {};

  // Remove comments and normalize whitespace
  css = css
    .replace(/\/\*[\s\S]*?\*\//g, "") // Remove CSS comments
    .replace(/\s+/g, " ") // Normalize whitespace
    .trim(); // Remove leading/trailing whitespace

  // Process each CSS rule
  const regex = /([^{]+){([^}]+)}/g;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(css)) !== null) {
    const selector = match[1].trim();
    const style: CSSProperties = {};

    // Process declarations
    const declarations = match[2].split(";");
    declarations.forEach((declaration: string) => {
      const parts = declaration.split(":");
      if (parts.length === 2) {
        const property = parts[0].trim();
        const value = parts[1].trim();

        if (property && value) {
          style[property] = value;
        }
      }
    });

    // Only add non-empty style objects
    if (Object.keys(style).length > 0) {
      json[selector] = style;
    }
  }
  const result = [];
  for (const className in json) {
    const obj: { [index: string]: string } = {};
    obj[className] = convertAttributes(json[className]).join(" ");
    result.push(obj);
  }
  return result;
};

export const getClosestValue = (sizes: (string | number)[], value: number) => {
  return sizes.reduce(
    (prev: number, curr: string | number) => {
      const currNum = typeof curr === "string" ? parseFloat(curr) : curr;
      const prevNum = typeof prev === "string" ? parseFloat(prev) : prev;

      return Math.abs(currNum - value) < Math.abs(prevNum - value)
        ? currNum
        : prevNum;
    },
    typeof sizes[0] === "string" ? parseFloat(sizes[0]) : sizes[0]
  );
};

export const validValue = (value: string) => {
  return value.includes("px") || value.includes("rem") ? true : false;
};

interface ClassObject {
  [selector: string]: string;
}

export const parser = (html: string, classObjects: ClassObject[]) => {
  const sanitizedHtml = DOMPurify.sanitize(html);
  const parser = new DOMParser();
  const doc = parser.parseFromString(sanitizedHtml, "text/html");

  for (const classObject of classObjects) {
    for (const selector in classObject) {
      if (Object.hasOwn(classObject, selector)) {
        const tailwindClasses: string = classObject[selector];
        if (tailwindClasses !== "") {
          // does not handle media selectors
          const elements = doc.querySelectorAll(selector);

          if (elements) {
            elements.forEach((element) => {
              if (selector.startsWith(".")) {
                // Class-based selector: Replace specific class names
                const originalClasses = element.className.split(" ");
                const newClasses = originalClasses.map((cls) =>
                  cls === selector.substring(1) ? tailwindClasses : cls
                );
                element.className = newClasses.join(" ");
              } else {
                // Tag-based selector (e.g., "body", "h2"): Add classes
                element.className +=
                  (element.className ? " " : "") + tailwindClasses;
              }
            });
          }
        }
      }
    }
  }

  return doc.documentElement.outerHTML;
};

import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup
} from "@/components/ui/resizable";
import { Button } from "@/components/ui/button";
import CodeMirror from "@uiw/react-codemirror";
// import { oneDark } from "@codemirror/theme-one-dark";
import { html } from "@codemirror/lang-html";
import { css } from "@codemirror/lang-css";
import { Sun, Moon } from "lucide-react";
import { css_beautify, html_beautify } from "js-beautify";
import { initialHTML, initialCSS } from "./util/helper";
import { cssToJson } from "./util/helper";
import { injectClass } from "./util/helper";
import { useState, useEffect } from "react";

function App() {
  const [htmlText, setHtmlText] = useState("");
  const [cssText, setCssText] = useState("");
  const [tailwindText, setTailwindText] = useState("");

  const maxHeight = {
    maxHeight: "calc(100% - 5.25rem)"
  };

  useEffect(
    () => setCssText(localStorage.css ? localStorage.css : initialCSS),
    []
  );
  useEffect(
    () => setHtmlText(localStorage.html ? localStorage.html : initialHTML),
    []
  );

  const convertToTailwind = () => {
    setCssText(
      css_beautify(cssText, { indent_size: 2, max_preserve_newlines: 0 })
    );
    const cssAttributes = cssToJson(cssText);
    setTailwindText(
      html_beautify(
        injectClass(
          htmlText.replace(/=(?:')([^']+)'/g, '="$1"'), // converts single quotes to double
          cssAttributes
        ),
        {
          indent_size: 2,
          extra_liners: [],
          wrap_line_length: 70,
          max_preserve_newlines: 0
        }
      )
    );
  };

  return (
    <div className="h-screen">
      <header className="mb-4 border-b">
        <div className="flex items-center justify-between h-16 px-4">
          <h1 className="text-xl font-semibold">
            HTML/CSS to Tailwind Converter
          </h1>
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" aria-label="Toggle theme">
              <Sun className="w-5 h-5 transition-all scale-100 rotate-0 dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute w-5 h-5 transition-all scale-0 rotate-90 dark:rotate-0 dark:scale-100" />
            </Button>
          </div>
        </div>
      </header>
      <ResizablePanelGroup
        direction="horizontal"
        className="h-40 border"
        style={maxHeight}
      >
        <ResizablePanel className="min-w-60">
          <ResizablePanelGroup direction="vertical">
            <ResizablePanel className="min-h-40">
              <h2 className="p-4 text-lg font-medium">HTML Input</h2>
              <CodeMirror
                aria-label="html input"
                className="h-full text-sm"
                value={htmlText}
                height="100%"
                extensions={[html()]}
                onChange={(value) => {
                  setHtmlText(value);
                }}
              />
            </ResizablePanel>
            <ResizableHandle />
            <ResizablePanel className="min-h-40">
              <h2 className="p-4 text-lg font-medium">CSS Input</h2>
              <CodeMirror
                aria-label="css input"
                className="h-full text-sm"
                value={cssText}
                height="100%"
                extensions={[css()]}
                onChange={(value) => {
                  setCssText(value);
                }}
              />
            </ResizablePanel>
          </ResizablePanelGroup>
        </ResizablePanel>
        <ResizableHandle className="" />
        <ResizablePanel className="h-screen min-w-60">
          <div className="flex justify-between">
            <h2 className="p-4 text-lg font-medium">Tailwind Output</h2>
            <Button
              onClick={convertToTailwind}
              className="mr-4 mt-3.5 cursor-pointer"
            >
              Convert
            </Button>
          </div>
          <CodeMirror
            aria-label="tailwind html"
            className="h-full text-sm"
            value={tailwindText}
            readOnly={true}
            height="100%"
            extensions={[html()]}
          />
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}

export default App;

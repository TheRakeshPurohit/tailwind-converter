import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup
} from "@/components/ui/resizable";
import { ThemeProvider } from "@/components/theme-provider";
import { Button } from "@/components/ui/button";
import CodeMirror from "@uiw/react-codemirror";
import { oneDark } from "@codemirror/theme-one-dark";
import { html } from "@codemirror/lang-html";
import { css } from "@codemirror/lang-css";
import { css_beautify, html_beautify } from "js-beautify";
import { initialHTML, initialCSS } from "./util/helper";
import { cssToJson } from "./util/helper";
import { injectClass } from "./util/helper";
import { Header } from "./components/header";
import { Copy } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Toaster } from "sonner";

function App() {
  const [htmlText, setHtmlText] = useState("");
  const [cssText, setCssText] = useState("");
  const [tailwindText, setTailwindText] = useState("");
  const copyToClipboard = () => {
    toast("Copied to clipboard!", {
      duration: 2000
    });
    navigator.clipboard.writeText(tailwindText);
  };

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

  const codepenOriginal = JSON.stringify({
    title: "Original HTML/CSS",
    html: htmlText,
    css: cssText
  });
  const codepenTailwind = JSON.stringify({
    title: "Tailwind version",
    html: tailwindText,
    head: '<script src="https://cdn.tailwindcss.com"></script>'
  });

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
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <div className="h-screen">
        <Header />
        <ResizablePanelGroup
          direction="horizontal"
          className="h-40 border"
          style={maxHeight}
        >
          <ResizablePanel className="min-w-60">
            <ResizablePanelGroup direction="vertical">
              <ResizablePanel className="min-h-40">
                <div className="flex justify-between">
                  <h2 className="p-4 text-lg font-medium ">HTML Input</h2>
                  <form
                    action="https://codepen.io/pen/define"
                    method="POST"
                    target="_blank"
                  >
                    <input type="hidden" name="data" value={codepenOriginal} />
                    <Button
                      type="submit"
                      title="codepen preview"
                      value=""
                      className="mr-4 mt-3.5 cursor-pointer"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <polygon points="12 2 22 8.5 22 15.5 12 22 2 15.5 2 8.5 12 2" />
                        <line x1="12" x2="12" y1="22" y2="15.5" />
                        <polyline points="22 8.5 12 15.5 2 8.5" />
                        <polyline points="2 15.5 12 8.5 22 15.5" />
                        <line x1="12" x2="12" y1="2" y2="8.5" />
                      </svg>
                    </Button>
                  </form>
                </div>
                <CodeMirror
                  aria-label="html input"
                  className="relative h-full text-sm dark:hidden"
                  value={htmlText}
                  height="100%"
                  extensions={[html()]}
                  onChange={(value) => {
                    setHtmlText(value);
                  }}
                />
                <CodeMirror
                  aria-label="html input"
                  className="h-full text-sm"
                  theme={oneDark}
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
                  className="relative h-full text-sm dark:hidden"
                  value={cssText}
                  height="100%"
                  extensions={[css()]}
                  onChange={(value) => {
                    setCssText(value);
                  }}
                />
                <CodeMirror
                  aria-label="css input"
                  className="h-full text-sm"
                  theme={oneDark}
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
          <ResizablePanel className="h-screen min-w-80">
            <div className="flex justify-between">
              <div className="flex">
                <h2 className="p-4 text-lg font-medium">Tailwind Output</h2>
                <Button
                  onClick={() => copyToClipboard()}
                  variant="ghost"
                  size="icon"
                  className="mt-3 -ml-3 cursor-pointer"
                >
                  <Copy />
                </Button>
              </div>
              <div className="flex">
                <form
                  action="https://codepen.io/pen/define"
                  method="POST"
                  target="_blank"
                >
                  <input type="hidden" name="data" value={codepenTailwind} />
                  <Button
                    type="submit"
                    title="codepen preview"
                    value=""
                    className="mr-4 mt-3.5 cursor-pointer"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <polygon points="12 2 22 8.5 22 15.5 12 22 2 15.5 2 8.5 12 2" />
                      <line x1="12" x2="12" y1="22" y2="15.5" />
                      <polyline points="22 8.5 12 15.5 2 8.5" />
                      <polyline points="2 15.5 12 8.5 22 15.5" />
                      <line x1="12" x2="12" y1="2" y2="8.5" />
                    </svg>
                  </Button>
                </form>
                <Button
                  onClick={convertToTailwind}
                  className="mr-4 mt-3.5 cursor-pointer"
                >
                  Convert
                </Button>
              </div>
            </div>
            <CodeMirror
              aria-label="tailwind html"
              className="relative h-full text-sm dark:hidden"
              value={tailwindText}
              readOnly={true}
              height="100%"
              extensions={[html()]}
            />
            <CodeMirror
              aria-label="tailwind html"
              className="h-full text-sm"
              theme={oneDark}
              value={tailwindText}
              readOnly={true}
              height="100%"
              extensions={[html()]}
            />
          </ResizablePanel>
        </ResizablePanelGroup>
        <Toaster />
      </div>
    </ThemeProvider>
  );
}

export default App;

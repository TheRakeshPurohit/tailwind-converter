import type { ConversionMode } from "./converter";

export type SharedConversionState = {
  html: string;
  css: string;
  mode: ConversionMode;
};

const shareHashKey = "share";

const isConversionMode = (mode: unknown): mode is ConversionMode =>
  mode === "tokens" || mode === "exact";

const toBase64Url = (value: string) => {
  const bytes = new TextEncoder().encode(value);
  const binary = Array.from(bytes, (byte) => String.fromCharCode(byte)).join("");

  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
};

const fromBase64Url = (value: string) => {
  const padded = value.replace(/-/g, "+").replace(/_/g, "/").padEnd(
    Math.ceil(value.length / 4) * 4,
    "="
  );
  const binary = atob(padded);
  const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));

  return new TextDecoder().decode(bytes);
};

export const encodeShareState = (state: SharedConversionState) =>
  toBase64Url(JSON.stringify(state));

export const decodeShareState = (
  payload: string
): SharedConversionState | null => {
  try {
    const parsed = JSON.parse(fromBase64Url(payload)) as Partial<SharedConversionState>;

    if (
      typeof parsed.html !== "string" ||
      typeof parsed.css !== "string" ||
      !isConversionMode(parsed.mode)
    ) {
      return null;
    }

    return {
      html: parsed.html,
      css: parsed.css,
      mode: parsed.mode,
    };
  } catch {
    return null;
  }
};

export const readShareStateFromHash = (hash: string) => {
  const params = new URLSearchParams(hash.replace(/^#/, ""));
  const payload = params.get(shareHashKey);

  return payload ? decodeShareState(payload) : null;
};

export const buildShareUrl = (
  state: SharedConversionState,
  href = window.location.href
) => {
  const url = new URL(href);
  const params = new URLSearchParams();
  params.set(shareHashKey, encodeShareState(state));
  url.hash = params.toString();

  return url.toString();
};

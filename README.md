# Tailwind Converter

The goal of this project is to take plain HTML/CSS and convert it to a
single HTML file with [Tailwind](https://tailwindcss.com/) classes. Tracking supported
Tailwind classes [here](SupportedClasses.md).

**Note: This project is a work in progress. There may be bugs or incomplete features.**

Keep in mind that converting an existing project to use Tailwind CSS often involves more than just replacing classes. It may be best to restructure your HTML and/or adjust your design to match the available utility classes. Manual conversion would provide more control over the process and likely ensure a better end result.

## Run Locally

Clone the repo, install the dependencies and run in a local environment:

```bash
git clone https://github.com/kt474/tailwind-converter.git
cd tailwind-converter
npm install
npm run dev
```

## TODO
- [ ] Refactor conversion code and go over all tailwind classes again. Support as many as possible
- [ ] Support Tailwind V4
- [ ] Use Vitest to add testing module
- [ ] Add option to use exact dimensions
- [ ] Show user which css properties were not converted
- [ ] Support active states, css nesting, and media queries 

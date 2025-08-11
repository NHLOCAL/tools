# Project Overview

This project is a collection of lightweight, single-file HTML tools designed to solve small problems quickly, directly from the browser. The main page (`index.html`) is dynamically generated from the `README.md` file.

**Main Technologies:**

*   **Frontend:** HTML, CSS, JavaScript
*   **Build:** Python with the `markdown2` library
*   **APIs:** Some tools use the Gemini API.

**Architecture:**

*   The main page (`index.html`) serves as a directory for all the tools.
*   Each tool is a self-contained HTML file with its own CSS and JavaScript.
*   The project includes a dark/light theme switcher.

# Building and Running

**Building the project:**

To update the `index.html` file after modifying the `README.md` or the `template.html`, run the following command:

```sh
python build.py
```

**Running the project:**

Open the `index.html` file in a web browser to see the list of tools. Click on a tool to open it.

# Development Conventions

*   **Tool Development:** Each new tool should be created as a single, self-contained HTML file in the `tools/` directory.
*   **README:** To add a new tool to the main page, add it to the list in the `README.md` file, following the existing format.
*   **Styling:** The project uses a consistent styling for the main page and the tools, including a dark/light theme. The main page's design is based on the `template.html` file, and new tools should follow this styling.
*   **Dependencies:** The tools should have minimal external dependencies. If a library is used, it should be loaded from a CDN.

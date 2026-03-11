---
name: revealjs-slideshow-generator
description: Generates reveal.js HTML slideshow presentations. Use when user asks to create, generate, build, scaffold, or make a slide deck, presentation, or slideshow.
---

# reveal.js Slideshow Generator

Generate self-contained HTML presentations using [reveal.js](https://revealjs.com/).

## Critical Instructions

- **Output Format**: Always produce a single, self-contained `.html` file that can be opened directly in any browser — no build step, no local server required.
- **CDN Only**: Load all reveal.js assets from the jsDelivr CDN. Never reference local files.
- **Current Version**: Use reveal.js **5.2.1** via jsDelivr.
- **File Naming**: Name the output file descriptively based on the presentation topic (e.g., `intro-to-python.html`, `quarterly-review.html`). Default to `slideshow.html` if no topic is given.
- **Encoding**: Use `<meta charset="utf-8">` in the `<head>`.

## CDN Base URLs

Use these exact CDN URLs for all reveal.js resources:

```
https://cdn.jsdelivr.net/npm/reveal.js@5.2.1/dist/reveal.css
https://cdn.jsdelivr.net/npm/reveal.js@5.2.1/dist/theme/{THEME}.css
https://cdn.jsdelivr.net/npm/reveal.js@5.2.1/dist/reveal.esm.js
https://cdn.jsdelivr.net/npm/reveal.js@5.2.1/plugin/notes/notes.esm.js
https://cdn.jsdelivr.net/npm/reveal.js@5.2.1/plugin/markdown/markdown.esm.js
https://cdn.jsdelivr.net/npm/reveal.js@5.2.1/plugin/highlight/highlight.esm.js
https://cdn.jsdelivr.net/npm/reveal.js@5.2.1/plugin/highlight/monokai.css
https://cdn.jsdelivr.net/npm/reveal.js@5.2.1/plugin/math/math.esm.js
```

## HTML Template

Every generated presentation MUST follow this structure:

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>PRESENTATION TITLE</title>
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/reveal.js@5.2.1/dist/reveal.css" />
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/reveal.js@5.2.1/dist/theme/black.css" />
    <!-- Include highlight theme if code slides are present -->
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/reveal.js@5.2.1/plugin/highlight/monokai.css" />
    <!-- Custom styles — keep in an external file alongside the HTML -->
    <link rel="stylesheet" href="slides.css" />
    <link rel="icon" type="image/svg+xml" href="https://revealjs.com/images/favicon.svg">
  </head>
  <body>
    <div class="reveal">
      <div class="slides">
        <!-- Slides go here -->
        <section>Slide 1</section>
        <section>Slide 2</section>
      </div>
    </div>

    <!-- Initialization — keep in an external file alongside the HTML -->
    <script src="slides.js"></script>
  </body>
</html>
```

### Plugin Imports — Include Only When Needed

Only import the plugins that the presentation actually uses:

| Plugin | Import Path | When to Include |
|--------|-------------|-----------------|
| Notes | `plugin/notes/notes.esm.js` | Always include — enables speaker view via `S` key |
| Highlight | `plugin/highlight/highlight.esm.js` | When any slide contains `<pre><code>` blocks |
| Markdown | `plugin/markdown/markdown.esm.js` | When using `data-markdown` / `<textarea data-template>` slides |
| Math | `plugin/math/math.esm.js` | When using LaTeX math equations |

## Available Themes

Use the theme that best fits the presentation topic, or let the user specify one. Replace `{THEME}` in the CSS URL.

| Theme | Description |
|-------|-------------|
| `black` | Black background, white text, blue links (default) |
| `white` | White background, black text, blue links |
| `league` | Gray background, white text, blue links |
| `beige` | Beige background, dark text, brown links |
| `night` | Black background, thick white text, orange links |
| `serif` | Cappuccino background, gray text, brown links |
| `simple` | White background, black text, blue links |
| `solarized` | Cream-colored background, dark green text, blue links |
| `moon` | Dark blue background, thick grey text, blue links |
| `dracula` | Dark purple background, light text |
| `sky` | Blue background, thin dark text, blue links |
| `blood` | Dark background, thick white text, red links |

**Default theme**: `black` unless the user requests otherwise.

## Default Visual Style

When the `generate-slides` agent (`.github/agents/generate-slides.agent.md`) is used, the presentation should use the custom corporate tech visual style defined in that agent profile — dark navy background, gradient titles, stat blocks, card grids, and accent colors. The `black.css` theme is loaded as a base and fully overridden by custom CSS.

If a user explicitly requests a built-in theme or a different style, use that instead.

## Slide Authoring Rules

### Horizontal Slides

Each `<section>` at the top level is a horizontal slide.

```html
<section><h2>Slide 1</h2></section>
<section><h2>Slide 2</h2></section>
```

### Vertical Slides

Nest `<section>` elements inside a parent `<section>` for vertical (down) navigation.

```html
<section>
  <section><h2>Vertical 1 (top)</h2></section>
  <section><h2>Vertical 2</h2></section>
</section>
```

Use vertical slides to group sub-topics under a main topic slide.

### Title Slide

The first slide should always be a title slide. Use `<h1>` for the title and `<p>` for subtitle/author/date.

```html
<section>
  <h1>Presentation Title</h1>
  <p>Subtitle or Author Name</p>
  <p><small>Date</small></p>
</section>
```

### Content Slides

Follow these guidelines for content slides:

- Use `<h2>` for slide headings (reserve `<h1>` for the title slide only).
- Keep text concise — bullet points preferred over paragraphs.
- Use `<ul>` / `<ol>` for lists.
- Use semantic HTML (`<strong>`, `<em>`, `<code>`) for emphasis and inline code.
- Aim for **5–7 bullet points** maximum per slide. If content exceeds this, split across multiple slides.
- Every slide should have a heading unless it's purely visual (image/quote).

### Fragments (Incremental Reveal)

Use fragments to reveal content step-by-step within a slide:

```html
<ul>
  <li class="fragment">Appears first</li>
  <li class="fragment">Appears second</li>
  <li class="fragment">Appears third</li>
</ul>
```

Available fragment animations:
- `fragment` (default fade-in)
- `fragment fade-out`
- `fragment fade-up` / `fade-down` / `fade-left` / `fade-right`
- `fragment fade-in-then-out`
- `fragment fade-in-then-semi-out`
- `fragment highlight-red` / `highlight-green` / `highlight-blue`
- `fragment highlight-current-red` / `highlight-current-green` / `highlight-current-blue`
- `fragment grow` / `shrink`
- `fragment strike`
- `fragment semi-fade-out`
- `fragment current-visible`

Use fragments by default on bullet-point lists for a professional feel, unless the user requests otherwise.

### Code Blocks

Use `<pre><code>` with the `data-trim` attribute and a language class. Always include the Highlight plugin when code is present.

```html
<section>
  <h2>Code Example</h2>
  <pre><code data-trim class="language-javascript">
function greet(name) {
  return `Hello, ${name}!`;
}
  </code></pre>
</section>
```

#### Line Numbers and Highlights

Add `data-line-numbers` to enable line numbers. Specify highlighted lines:

```html
<pre><code data-trim data-line-numbers="2,4">
const a = 1;
const b = 2;  // highlighted
const c = 3;
const d = 4;  // highlighted
</code></pre>
```

#### Step-by-Step Code Highlights

Use `|` to step through highlights:

```html
<pre><code data-trim data-line-numbers="1|3|5-7">
// Step 1: this line highlighted first
...
// Step 2: this line next
...
// Step 3: these lines last
...
</code></pre>
```

#### HTML Entities in Code

If code contains HTML tags (`<`, `>`), wrap the content in `<script type="text/template">`:

```html
<pre><code data-trim><script type="text/template">
<div class="container">
  <p>HTML content that won't be parsed</p>
</div>
</script></code></pre>
```

### Speaker Notes

Add notes visible only in the speaker view (press `S`):

```html
<section>
  <h2>Slide Title</h2>
  <p>Visible content</p>
  <aside class="notes">
    These notes are only visible in speaker view.
    Remind audience about X before moving on.
  </aside>
</section>
```

### Slide Backgrounds

#### Color / Gradient Backgrounds

```html
<section data-background-color="#4d7e65">
  <h2>Colored background</h2>
</section>

<section data-background-gradient="linear-gradient(to bottom, #283b95, #17b2c3)">
  <h2>Gradient background</h2>
</section>
```

#### Image Backgrounds

```html
<section data-background-image="https://example.com/image.jpg"
         data-background-size="cover"
         data-background-opacity="0.5">
  <h2>Image background</h2>
</section>
```

### Layout Helpers

- **`r-fit-text`**: Makes text fill the slide. Great for emphasis slides.
  ```html
  <h2 class="r-fit-text">BIG IDEA</h2>
  ```

- **`r-stack`**: Stack elements on top of each other (use with fragments):
  ```html
  <div class="r-stack">
    <img class="fragment" src="img1.png" />
    <img class="fragment" src="img2.png" />
  </div>
  ```

- **`r-stretch`**: Make an element fill remaining vertical space:
  ```html
  <h2>Title</h2>
  <img class="r-stretch" src="diagram.png" />
  <p>Caption</p>
  ```

### Transitions

Set per-slide transitions with the `data-transition` attribute:

```html
<section data-transition="zoom">
  <h2>Zoom transition</h2>
</section>
```

Available values: `none`, `fade`, `slide`, `convex`, `concave`, `zoom`.

### Auto-Animate

Create smooth transitions between similar slides with `data-auto-animate`:

```html
<section data-auto-animate>
  <h2>Step 1</h2>
</section>
<section data-auto-animate>
  <h2>Step 1</h2>
  <p>More detail appears here.</p>
</section>
```

## Reveal.initialize() Configuration

Use these configuration options as needed:

```javascript
Reveal.initialize({
  hash: true,                    // Always include — allows linking to specific slides
  controls: true,                // Show navigation arrows
  progress: true,                // Show progress bar
  center: true,                  // Vertically center content
  transition: 'slide',           // Default transition: none/fade/slide/convex/concave/zoom
  slideNumber: false,            // Set to true or 'c/t' to show slide numbers
  plugins: [Notes, Highlight],   // Include required plugins
});
```

Only add configuration options that deviate from defaults or that the user specifically requests.

## Presentation Structure Best Practices

When generating a presentation from a topic description:

1. **Title Slide**: Always start with a title slide including the presentation title and optional subtitle/author.
2. **Agenda / Overview**: Add an agenda or table-of-contents slide for presentations with 5+ content slides.
3. **Content Slides**: Break the topic into logical sections. Each major point gets its own slide.
4. **Use Visually Varied Slides**: Mix bullets, code blocks, images, quotes, and emphasis slides to keep the audience engaged.
5. **Summary / Conclusion**: End with a summary or key-takeaways slide.
6. **Q&A / Thank You**: Optionally end with a "Questions?" or "Thank You" slide.

## Slide Count Guidelines

| Presentation Length | Suggested Slide Count |
|--------------------|-----------------------|
| Quick overview | 5–8 slides |
| Standard talk | 10–15 slides |
| In-depth / lecture | 15–25 slides |
| Workshop / tutorial | 20–30+ slides |

Default to **10–15 slides** unless the user specifies a length or topic depth.

## Markdown Slides (Alternative)

If the user prefers writing slide content in Markdown, use the Markdown plugin:

```html
<section data-markdown>
  <textarea data-template>
    ## Slide Heading
    - Point one
    - Point two

    ---

    ## Next Slide
    More content here
  </textarea>
</section>
```

- `---` separates horizontal slides.
- The Markdown plugin must be imported and registered.
- Fragments in Markdown use: `<!-- .element: class="fragment" -->` after the element.
- Slide attributes in Markdown use: `<!-- .slide: data-background="#ff0000" -->` at the start of a slide.

**Prefer raw HTML** over Markdown for most generated presentations, since it gives full control over layout, fragments, and styling.

## Custom Styling

Add custom CSS in the `<style>` block in `<head>` to fine-tune the presentation:

```html
<style>
  /* Example: custom title slide styling */
  .reveal h1 {
    text-transform: none;
  }
  /* Example: smaller code blocks */
  .reveal pre code {
    font-size: 0.85em;
    line-height: 1.4;
  }
  /* Example: two-column layout */
  .two-columns {
    display: flex;
    gap: 2em;
  }
  .two-columns > * {
    flex: 1;
  }
</style>
```

### Two-Column Layout Pattern

A commonly requested layout — use a flex container:

```html
<section>
  <h2>Comparison</h2>
  <div class="two-columns">
    <div>
      <h3>Option A</h3>
      <ul>
        <li>Pro 1</li>
        <li>Pro 2</li>
      </ul>
    </div>
    <div>
      <h3>Option B</h3>
      <ul>
        <li>Pro 1</li>
        <li>Pro 2</li>
      </ul>
    </div>
  </div>
</section>
```

Always include this CSS when two-column layouts are used:

```css
.two-columns {
  display: flex;
  gap: 2em;
}
.two-columns > * {
  flex: 1;
}
```

## Math Equations

If the presentation includes math, import the Math plugin and use LaTeX syntax:

```html
<!-- In head: no extra CSS needed -->

<!-- In script: -->
import Math from 'https://cdn.jsdelivr.net/npm/reveal.js@5.2.1/plugin/math/math.esm.js';
// Add Math to plugins array

<!-- In slides: -->
<section>
  <h2>Euler's Identity</h2>
  <p>$e^{i\pi} + 1 = 0$</p>
</section>
```

## Images

- Use absolute URLs for images (the presentation must be self-contained).
- If the user provides local image references, warn that images must be accessible from the HTML file's location or use absolute URLs.
- For placeholder/demo images, use `https://picsum.photos/{width}/{height}` or descriptive emoji as stand-ins.

## Accessibility

- Use semantic HTML elements.
- Add `alt` attributes to all `<img>` tags.
- Ensure sufficient color contrast between text and backgrounds.
- Use `lang` attribute on the `<html>` element.

## Checklist Before Delivering

Before delivering the generated HTML file, verify:

- [ ] Valid HTML5 document structure
- [ ] `<meta charset="utf-8">` present
- [ ] Title slide exists with `<h1>`
- [ ] All CDN URLs use version `5.2.1`
- [ ] All required plugins are imported and registered
- [ ] Code blocks use `data-trim` and appropriate language class
- [ ] Fragments are applied to lists by default
- [ ] The file is fully self-contained (no local file references)
- [ ] Custom `<style>` block is included for any custom layouts used
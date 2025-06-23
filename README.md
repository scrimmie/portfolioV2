# Portfolio V2

A modern, interactive portfolio website built with Astro, React, and TailwindCSS. This portfolio features a unique desktop-like experience with interactive browser windows that can be dragged, resized, minimized, and maximized.

## Technologies Used

- **[Astro](https://astro.build/)**: The core framework that provides static site generation with dynamic islands
- **[React](https://reactjs.org/)**: Used for interactive UI components
- **[TailwindCSS](https://tailwindcss.com/)**: Utility-first CSS framework for styling
- **[TypeScript](https://www.typescriptlang.org/)**: For type safety and better developer experience
- **[React Icons](https://react-icons.github.io/react-icons/)**: Icon library
- **[Framer Motion](https://www.framer.com/motion/)**: Animation library
- **[React Slick](https://react-slick.neostack.com/)**: Carousel component

## Project Structure

```
portfolioV2/
├── public/                  # Static assets served as-is
│   └── fonts/               # Custom fonts
├── src/
│   ├── assets/              # Dynamic assets processed by build
│   │   ├── backgrounds/     # Background images
│   │   ├── photos/          # Photography images
│   │   └── projects/        # Project images
│   ├── components/          # Reusable UI components
│   │   ├── BrowserWindow.astro  # Astro wrapper for the browser window
│   │   ├── BrowserWindow.tsx    # Interactive browser window component
│   │   └── Navigation.tsx       # Site navigation component
│   ├── content/             # Content collections
│   │   └── projects/        # Project markdown files
│   ├── layouts/             # Page layouts
│   │   ├── Layout.astro     # Main site layout
│   │   └── MarkdownProjectLayout.astro # Layout for markdown projects
│   └── pages/               # Page components
│       └── projects/        # Project pages
├── astro.config.mjs         # Astro configuration
├── package.json             # Dependencies and scripts
├── tailwind.config.mjs      # Tailwind configuration
└── tsconfig.json            # TypeScript configuration
```

## Setup and Installation

### Prerequisites

- Node.js (v16+)
- Yarn or npm

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/portfolioV2.git
   cd portfolioV2
   ```

2. Install dependencies:
   ```bash
   yarn install
   # or
   npm install
   ```

3. Start the development server:
   ```bash
   yarn dev
   # or
   npm run dev
   ```

4. Open your browser and navigate to `http://localhost:4321` to see the site.

## Running Locally

The project includes several scripts in the `package.json`:

- `dev` / `start`: Start the development server
- `build`: Build the production site
- `preview`: Preview the built site locally
- `astro`: Run Astro CLI commands

```bash
# Development server
yarn dev

# Build for production
yarn build

# Preview production build
yarn preview
```

## Key Features

### Interactive Browser Window

The portfolio features a custom browser window component that mimics desktop browser behavior:

- **Draggable**: Click and drag the top bar to move the window
- **Resizable**: Drag from the bottom corners to resize
- **Minimizable**: Click the minimize button to collapse into a draggable icon
- **Maximizable**: Click the maximize button to expand to viewport size
- **Closable**: Click the close button to return to the home page

This component is implemented in `src/components/BrowserWindow.tsx` and wrapped for Astro integration in `src/components/BrowserWindow.astro`.

### Implementation Details

The browser window component uses:

- React hooks for state management
- DOM references and event listeners for drag and resize operations
- Viewport constraints to ensure windows stay within visible area
- TailwindCSS for styling
- TypeScript for type safety

## Pages

The site includes several main sections:

- **Home**: Landing page
- **About Me**: Personal information and introduction
- **Development**: Programming projects and skills
- **Projects**: Featured projects with details
- **Photography**: Photography portfolio
- **Creative**: Creative works showcase
- **Contact**: Contact information

Each page uses the browser window component to display content in an interactive window.


## Development Guidelines

### Coding Style

- Use TypeScript for all new components
- Follow strict TypeScript settings for type safety
- Use TailwindCSS for styling, avoiding inline styles
- Create modular, reusable components
- Maintain clear separation of concerns

### Adding New Pages

1. Create a new `.astro` file in the `src/pages/` directory
2. Import the `Layout` component and `BrowserWindow` component
3. Structure your content inside the browser window

Example:
```astro
---
import Layout from "../layouts/Layout.astro";
import BrowserWindow from "../components/BrowserWindow.astro";
---

<Layout title="New Page">
  <div class="flex w-full h-full items-center justify-center">
    <BrowserWindow url="newpage.com">
      <!-- Your content here -->
    </BrowserWindow>
  </div>
</Layout>
```

## Browser Window Component Usage

To use the browser window component in your pages:

```astro
<BrowserWindow url="example.com">
  <!-- Content to display in the window -->
</BrowserWindow>
```

The `url` prop sets the URL displayed in the browser window's address bar.

## Acknowledgments

- Font used: JetBrains Mono
- Icons from React Icons

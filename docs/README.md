# Specifai Documentation Website

Specifai documentation website is built using [Docusaurus](https://docusaurus.io/), a modern static website generator. It features local search capabilities, Mermaid diagram support, and TypeScript integration.

## Prerequisites

- Node.js >= 18.0
- npm

## Features

- 🔍 Local search functionality
- 📊 Mermaid diagram support
- 🎨 Light/dark mode theme
- 📱 Responsive design
- ⚡️ Fast page loads
- 🔄 Live reload during development
- 📝 TypeScript support

## Installation

1. Install dependencies:
```bash
$ npm install
```

2. Verify the installation:
```bash
$ npm run typecheck
```

## Local Development

```bash
$ npm start
```

This command starts a local development server. Most changes are reflected live without having to restart the server. You can access the site by opening http://localhost:3001 in your browser.

### Development Guidelines

- **TypeScript**: The project uses TypeScript for type safety. Run `npm run typecheck` to verify types.
- **Documentation Location**: Add new documentation files in the `docs/docs/current/` directory.
- **Assets**: Place images in `docs/static/img/` and GIFs in `docs/static/gif/`.
- **Styling**: Custom CSS can be added in `src/styles/global.css`.

### Available Scripts

- `npm start` - Start the development server (without auto-opening browser)
- `npm run build` - Build the website
- `npm run serve` - Serve the built website
- `npm run clear` - Clear the build directory
- `npm run swizzle` - Customize Docusaurus components
- `npm run typecheck` - Run TypeScript type checking
- `npm run write-translations` - Extract translatable strings
- `npm run write-heading-ids` - Generate heading IDs
- `npm run docusaurus` - Run Docusaurus CLI commands

## Building for Production

```bash
$ npm run build
```

This command generates static content into the `build` directory and can be served using any static content hosting service.

To test the production build locally:
```bash
$ npm run serve
```

## Project Structure

```
docs/
├── docs/                    # Documentation files
│   └── current/            # Current version documentation
├── src/
│   ├── components/         # React components
│   ├── pages/             # Custom pages
│   └── styles/            # Global styles
├── static/                 # Static assets
│   ├── img/               # Images
│   └── gif/               # GIFs
├── docusaurus.config.js    # Docusaurus configuration
├── sidebars.js            # Sidebar configuration
└── tsconfig.json          # TypeScript configuration
```

## Troubleshooting

- **Node.js Version**: Ensure you're using Node.js 18 or higher
- **Build Errors**: Run `npm run clear` and try rebuilding
- **Type Errors**: Check `tsconfig.json` and run `npm run typecheck`
- **Search Issues**: Verify search plugin configuration in `docusaurus.config.js`

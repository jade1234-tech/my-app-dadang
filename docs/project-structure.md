# Project structure and file guide

This project is a TypeScript app built with Expo, React Native, and Expo Router. It targets Android, iOS, and web. The guide below describes the files currently in the project and what each one is for.

## How the app is organized

- `src/app/` contains routes (screens) and navigation layouts. Expo Router uses this folder to build navigation.
- `src/components/` contains reusable interface pieces that are not full routes.
- `src/hooks/` contains reusable React hooks, and `src/constants/` contains shared design values.
- `assets/` contains images and icon artwork used by the app.
- The root configuration files control Expo, TypeScript, dependencies, and editor tooling.

The app is configured for a static web export. Login and registration are client-only demo forms with no API or account persistence: login navigates to Home after both fields are filled, and registration returns to Login after validating its fields. The movie catalog uses hard-coded data with remote poster URLs.

## Folder and file reference

### Root files

| File | Purpose |
| --- | --- |
| `README.md` | Project introduction, basic start instructions, and link to this guide. |
| `AGENTS.md` | Workspace-specific development instructions for assistants and contributors. |
| `app.json` | Expo app configuration, including app identity, icons, orientation, platform settings, plugins, and Router experiments. |
| `package.json` | Project metadata, dependencies, and commands such as `start`, `android`, `ios`, `web`, and `lint`. |
| `package-lock.json` | Exact npm dependency resolution for repeatable installs. Commit this when dependencies change with npm. |
| `tsconfig.json` | TypeScript settings, strict checking, Expo base config, and `@/` import aliases. |
| `expo-env.d.ts` | Expo-generated TypeScript declarations. Do not edit; it is generated and ignored by Git. |
| `.gitignore` | Files and generated folders Git should not track, including dependencies, local environment files, and native build output. |
| `LICENSE` | License terms for the project. |

### `docs/`

| File | Purpose |
| --- | --- |
| `project-structure.md` | This guide to folders, files, routes, and the current app behavior. |

### `.vscode/`

| File | Purpose |
| --- | --- |
| `extensions.json` | Recommends the Expo Tools extension in VS Code. |
| `settings.json` | Configures selected editor actions, such as organize imports and fix-all on save. |

### `.claude/`

| File | Purpose |
| --- | --- |
| `settings.json` | Enables the configured Expo plugin for Claude Code. This is developer tooling, not app runtime configuration. |

### Generated and installed folders

| Folder | Purpose |
| --- | --- |
| `.expo/` | Local Expo development state and generated metadata. It is not application source and is ignored by Git. |
| `node_modules/` | Packages installed from `package.json` and `package-lock.json`. Do not edit or commit this generated dependency folder. |
| `.git/` | Git's internal repository metadata; use Git commands rather than editing its contents. |

### `scripts/`

| File | Purpose |
| --- | --- |
| `reset-project.js` | Optional starter-template reset script. It prompts to move or delete starter files and recreate a minimal `src/app`; review its effects carefully before running because it changes files. |

### `assets/`

Static artwork and branding used in app configuration or screens. Files in this folder are bundled into the app when referenced.

#### `assets/images/`

| File(s) | Purpose |
| --- | --- |
| `icon.png` | Main app icon referenced by `app.json`. |
| `android-icon-background.png`, `android-icon-foreground.png`, `android-icon-monochrome.png` | Layers and monochrome artwork for the Android adaptive icon. |
| `splash-icon.png` | Artwork shown on the splash screen. |
| `favicon.png` | Web app favicon. |
| `expo-logo.png`, `logo-glow.png` | Artwork used by the starter animated logo component. |
| `expo-badge.png`, `expo-badge-white.png` | Light/dark Expo badges shown by the starter web badge component. |
| `react-logo.png`, `react-logo@2x.png`, `react-logo@3x.png` | React logo examples at different display densities. |
| `tutorial-web.png` | Tutorial illustration displayed on the starter Explore screen. |
| `tabIcons/home.png`, `tabIcons/home@2x.png`, `tabIcons/home@3x.png` | Home tab icon assets at different display densities. |
| `tabIcons/explore.png`, `tabIcons/explore@2x.png`, `tabIcons/explore@3x.png` | Explore tab icon assets at different display densities. |

#### `assets/expo.icon/`

| File | Purpose |
| --- | --- |
| `icon.json` | Expo icon artwork metadata. |
| `Assets/expo-symbol 2.svg`, `Assets/grid.png` | Source artwork included with the Expo icon asset set. |

### `src/`

Application source code shared across supported platforms.

#### `src/app/` — routes and navigation

| File or folder | Purpose |
| --- | --- |
| `_layout.tsx` | Root Stack layout. Registers the application route group and hides the default headers. |
| `index.tsx` | Entry route; redirects to Login. |
| `explore.tsx` | Expo starter/demo Explore screen with examples of themed UI, links, images, and collapsible content. |
| `(unauthenticated)/login.tsx` | Client-only login form; accepts non-empty email and password, then opens Home. |
| `(unauthenticated)/register.tsx` | Client-only registration form; validates fields and then returns to Login without saving an account. |
| `(authenticated)/(tabs)/_layout.tsx` | Tab navigator for the Home and Profile screens. |
| `(authenticated)/(tabs)/home.tsx` | Movie discovery UI, search filtering, and featured/popular sections. Movie metadata is hard-coded; poster images are loaded from remote URLs. |
| `(authenticated)/(tabs)/profile.tsx` | Static sample profile screen. The edit action is a placeholder and profile values are not loaded from an account. |

Parentheses in route folder names create Expo Router route groups: they organize screens and navigation without adding the group name to the public URL. They do not automatically provide login protection.

#### `src/components/` — reusable UI

| File or folder | Purpose |
| --- | --- |
| `themed-text.tsx` | Text component with preset typography and theme-aware text colors. |
| `themed-view.tsx` | View component with a theme-aware background color. |
| `external-link.tsx` | Link helper that opens external destinations in an in-app browser on native platforms. |
| `hint-row.tsx` | Small starter-template row for displaying an instruction and highlighted hint. |
| `web-badge.tsx` | Starter-template Expo badge that adapts to the system color scheme and shows the Expo version. |
| `animated-icon.tsx` | Native starter animation examples for the Expo logo and splash overlay. |
| `animated-icon.web.tsx` | Web-specific version of the animated icon; the splash overlay is a no-op on web. |
| `animated-icon.module.css` | CSS gradient and dimensions used by the web animated icon. |
| `ui/collapsible.tsx` | Reusable animated, expandable section used by the starter Explore screen. |

#### `src/constants/`

| File | Purpose |
| --- | --- |
| `theme.ts` | Shared light/dark colors, font families, spacing values, content width, and platform-specific bottom-tab inset. Also imports the global CSS. |

#### `src/hooks/`

| File | Purpose |
| --- | --- |
| `use-color-scheme.ts` | Native hook that re-exports React Native's system color-scheme hook. |
| `use-color-scheme.web.ts` | Web-specific color-scheme hook that waits for client hydration to avoid static-rendering mismatch. |
| `use-theme.ts` | Resolves the current light/dark scheme to the shared color palette in `constants/theme.ts`. |

#### Other source files

| File | Purpose |
| --- | --- |
| `src/global.css` | Web font-family CSS variables used by the theme. |

## Navigation flow today

1. The root route (`src/app/index.tsx`) redirects to `/(unauthenticated)/login`.
2. Login accepts non-empty values and opens `/(authenticated)/(tabs)/home`; this is a demo flow and does not authenticate credentials.
3. Registration validates its fields, saves no account, and returns to `/(unauthenticated)/login`.
4. The tab layout switches between Home and Profile, and movie search and sections use local data.

## Useful commands

Run these from the project root:

```bash
npm install
npx expo start
npx expo lint
npx tsc --noEmit
```

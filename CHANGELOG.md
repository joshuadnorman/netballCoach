# Changelog

All notable changes to the Netball Coach Planner project.

## [Unreleased] - 2026-01-15

### Added
- **Settings Tab**: Replaced the "Exercises" tab with a new "Settings" tab.
  - Allows team name editing.
  - Data management (Export JSON, Copy Summary).
  - About section.
- **SVG Icons**: Implemented a custom SVG icon system (`components/ui/svg-icons.tsx`) to replace standard library icons for a unique look.
- **Drill Creator**: Complete UI refresh with better styling and layout.
- **Design System**:
  - Implemented a "Dark Mode" aesthetic with premium glassmorphism effects.
  - Updated color palette in `hooks/use-colors`.

### Changed
- **Navigation**: Updated `app/(tabs)/_layout.tsx` to include the Settings tab (`gearshape.fill` icon) and remove Exercises.
- **Modal Component**:
  - improved centering on screen.
  - Fixed left padding issues on titles and inputs for better readability.
- **App Layout**: General UI polish to ensure a consistent, premium feel across "Home", "Season", and "Settings".

### Deprecated
- `app/(tabs)/exercises.tsx` is no longer linked in the main tab navigation (replaced by Settings).

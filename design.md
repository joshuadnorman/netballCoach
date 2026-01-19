# Netball Coach Planner - Design Document

## Overview
A mobile app for netball coaches to plan seasons, build weekly programs, create drills with drawing tools, and track training statistics. The app features a navy blue background with a white netball court design.

## Target Platform
- Mobile portrait orientation (9:16)
- One-handed usage optimized
- iOS-first design following Apple Human Interface Guidelines

## Visual Design

### Color Scheme
- **Primary Background**: Navy Blue (#0A1F44)
- **Court Graphics**: White with opacity for background
- **Accent Color**: Bright teal/cyan for interactive elements
- **Text**: White/light gray on dark background
- **Cards/Surfaces**: Semi-transparent white overlays

### Background
- Navy blue base color
- White netball court illustration as watermark/background
- Court should be subtle (low opacity) to not interfere with content
- Court design includes: outer rectangle, thirds lines, center circle, goal circles

## Screen Structure

### 1. Home Screen
**Purpose**: Display team information and quick access to main features

**Content**:
- Editable team name (e.g., "Under 16 B")
- Welcome message
- Quick stats overview
- Navigation to main tabs

**Layout**:
- Header with team name input
- Card-based layout for quick access
- Prominent tab bar at bottom

### 2. Season Tab
**Purpose**: Annual planning and important dates

**Content**:
- Calendar view (January to November)
- Event types:
  - Games (with date/time)
  - Tournaments (multi-day events)
  - Player birthdays
  - Test schedule dates
- Color-coded event types
- Add/edit/delete events

**Layout**:
- Month-by-month scrollable calendar
- Event list below calendar
- Floating action button to add events
- Event cards with icons and colors

**User Flows**:
1. View calendar → Tap date → Add event
2. Tap existing event → View details → Edit/Delete

### 3. Week Tab
**Purpose**: Detailed weekly planning with 7-day view

**Content**:
- 7-day sheet (Monday-Sunday)
- Date display for each day
- Key focus areas per day:
  - TOURNAMENT
  - GAME
  - THROW IN
  - CENTRE PASS
  - DEFENSE (FULL, A 1/3, C 1/3, D 1/3)
  - ATTACK (FULL, A 1/3, C 1/3, D 1/3)
  - Shooting
  - AGILITY
  - SSG (Small Sided Games)
  - BALL PLACEMENT
- For each focus area:
  - Achievement checkbox/status
  - Time spent (minutes)
- Notes section per day
- Download/share weekly plan

**Layout**:
- Horizontal swipe between days
- Scrollable list of focus areas
- Time input fields
- Notes text area at bottom
- Share button in header

**User Flows**:
1. Select day → Add focus areas → Input time → Mark achieved
2. Add notes → Share/download plan

### 4. Today Tab (Session Builder)
**Purpose**: Build and manage training sessions

**Content**:
- Drawing canvas for drill diagrams
- Time allocation tool
- Program builder:
  - Select category (from focus areas list)
  - Choose drills from library
  - Arrange drills in session order
  - Set duration for each drill
- Drill creation:
  - Drawing tools (pen, shapes)
  - Cone placement (red, blue, yellow)
  - Save to category
  - Name and describe drill

**Layout**:
- Top: Time display and session duration
- Middle: Canvas/program builder area
- Bottom: Tool palette
- Tabs: "Build Program" | "Create Drill"

**User Flows**:
1. Build Program: Select category → Choose drills → Set times → Save session
2. Create Drill: Draw on canvas → Place cones → Name → Save to category

### 5. My Exercises Tab
**Purpose**: Library of all created and saved drills

**Content**:
- Searchable drill library
- Organized by category
- Drill cards showing:
  - Thumbnail of diagram
  - Name
  - Category
  - Last used date
- Edit/delete drills

**Layout**:
- Search bar at top
- Category filter chips
- Grid/list of drill cards
- Tap card to view full details

**User Flows**:
1. Browse by category → Select drill → View/Edit
2. Search drill → Select → Use in session

### 6. Stats Tab
**Purpose**: Analytics and insights on training focus

**Content**:
- Pie charts:
  - Time distribution across categories
  - Most/least used drills
  - Category usage frequency
- Bar charts:
  - Weekly time comparison
  - Category trends over time
- Key metrics:
  - Total sessions
  - Total training time
  - Most focused category
  - Least focused category
  - Most used drill
  - Least used drill

**Layout**:
- Scrollable dashboard
- Chart cards with titles
- Summary metrics at top
- Date range selector

## Key Design Principles

1. **Clarity**: Clear labels, obvious actions, no ambiguity
2. **Efficiency**: Quick access to common tasks
3. **Consistency**: Same patterns across all screens
4. **Feedback**: Visual confirmation of all actions
5. **Safety**: Confirm before deleting, easy undo where possible

## Navigation

- **Tab Bar** (bottom):
  - Home
  - Season (calendar icon)
  - Week (7-day icon)
  - Today (play/session icon)
  - Exercises (dumbbell icon)
  - Stats (chart icon)

## Data Storage

- Local storage using AsyncStorage
- No user authentication required
- All data stored on device
- Export/import functionality for backup

## Technical Considerations

- React Native with Expo
- NativeWind for styling
- React Native Reanimated for animations
- React Native Gesture Handler for drawing
- Recharts or Victory for statistics charts
- AsyncStorage for persistence

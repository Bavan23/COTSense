# COTSense Design Guidelines

## Design Approach

**Hybrid Approach**: Linear-inspired aesthetics combined with systematic data visualization principles for engineering productivity.

**Rationale**: COTSense is a utility-focused, information-dense engineering tool requiring both modern visual appeal and functional excellence. Linear's clean, technical aesthetic paired with robust data table patterns creates the optimal foundation for engineers and designers to efficiently discover components.

**Core Principles**:
- Precision over decoration
- Data clarity and scanability
- Purposeful micro-interactions
- Technical sophistication without complexity

---

## Core Design Elements

### A. Color Palette

**Dark Mode (Primary)**:
- Background: 220 15% 8% (deep slate)
- Surface: 220 13% 12% (elevated panels)
- Border: 220 10% 20% (subtle divisions)
- Text Primary: 220 8% 95%
- Text Secondary: 220 6% 65%
- Primary Brand: 250 80% 65% (electric violet-blue)
- Success/Match: 142 70% 55% (engineering green)
- Warning: 38 90% 60% (amber alerts)
- Accent: 190 85% 60% (technical cyan - sparingly for highlights)

**Light Mode**:
- Background: 220 15% 98%
- Surface: 0 0% 100%
- Border: 220 10% 88%
- Text Primary: 220 12% 12%
- Text Secondary: 220 8% 45%
- Primary Brand: 250 70% 55%
- Success/Match: 142 65% 45%

### B. Typography

**Font System**: Inter (primary) via Google Fonts for technical precision
- Headlines: 600 weight, tracking -0.02em
- Body: 400 weight, 16px base, 1.5 line-height
- Data Tables: 500 weight, 14px, monospace numerals
- Labels: 500 weight, 12px uppercase, tracking 0.05em, 70% opacity

**Type Scale**:
- Hero: text-6xl (60px)
- Page Title: text-4xl (36px)  
- Section: text-2xl (24px)
- Card Title: text-lg (18px)
- Body: text-base (16px)
- Caption: text-sm (14px)

### C. Layout System

**Spacing Primitives**: Tailwind units of 4, 6, 8, 12, 16 for consistency
- Component padding: p-6 or p-8
- Section spacing: my-12 to my-16
- Card gaps: gap-6
- Table cell padding: px-6 py-4

**Grid System**:
- Container: max-w-7xl mx-auto px-8
- Data tables: Full-width within container
- Card grids: grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6
- Dashboard sections: Single column for focus, avoid multi-column for data

### D. Component Library

**Navigation**:
- Top bar: Fixed, translucent backdrop-blur, 64px height
- Logo + search integration + mode toggle + admin link
- Breadcrumbs for deep navigation (Component → Details)

**Search Interface**:
- Prominent search bar: h-14, rounded-lg, subtle shadow
- Live suggestions dropdown with categorized results
- Search history pills below (max 5 recent)
- Loading state: skeleton shimmer animation

**Data Tables** (Primary Component):
- Header row: sticky, elevated background, 600 weight
- Alternating row backgrounds (5% opacity difference)
- Expandable rows: Smooth height transition, nested explanation panel
- Sort indicators: Minimal arrows, active state highlighted
- Hover states: Entire row lift with 2px border-left accent
- Action buttons: Icon-only, revealed on row hover

**Cards**:
- Component cards: rounded-xl, border, p-6, hover:shadow-lg transition
- Stat cards: Minimal with large numbers, small labels
- Comparison cards: Side-by-side with divider, synchronized scrolling

**Status Indicators**:
- Score badges: Rounded-full, px-3 py-1, colored by range (90+ green, 70-89 cyan, <70 amber)
- Stock status: Dot + text (In Stock green, Low amber, Out Of Stock red)
- Match confidence: Progress bar, 4px height, rounded-full

**Modals & Overlays**:
- Export modal: Centered, max-w-lg, backdrop-blur-sm background
- Comparison view: Slide-in panel from right, 40% viewport width
- AI explanation: Expandable panel within table row, bg-surface, border-l-4 accent

**Forms** (Admin):
- Upload zone: Dashed border, rounded-lg, min-h-48, drag-drop indicator
- Input fields: h-12, border focus:ring-2 focus:ring-primary
- Submit buttons: Primary fill, h-12, rounded-lg, 600 weight

### E. Animations

**Minimal, Purposeful Motion**:
- Page transitions: 200ms ease-out fade
- Table row expansion: 300ms ease-in-out height
- Button hover: 150ms scale-[1.02]
- Loading states: Shimmer gradient animation (2s loop)
- No scroll-triggered animations - maintain focus on data

---

## Images

**Hero Section** (Home Page):
- **Large Hero Image**: Abstract visualization of electronic components/circuit board patterns in dark blue/violet tones with subtle glow effects. Image should convey technical sophistication.
- Placement: Full-width, 70vh height, gradient overlay (bottom to top, 220 15% 8% to transparent)
- Purpose: Establish technical credibility while maintaining modern appeal

**Additional Imagery**:
- **Search Results**: No images - pure data focus
- **Component Details**: Placeholder for actual part images (150x150px thumbnails)
- **About Page**: Optional diagram illustrating FAISS search process, ML embeddings visualization

**Image Treatment**:
- Subtle blur on backgrounds when text overlays
- Monochromatic or duotone filtering to match color palette
- Sharp, high-contrast for component photography

---

## Page-Specific Layouts

**Home/Dashboard**:
- Hero: 70vh with search bar overlay (centered, max-w-3xl)
- Below hero: Recent searches (horizontal scroll pills) + trending queries (3-column grid)
- Quick stats section: 4-column grid showing total components, categories, avg response time

**Search Results**:
- Fixed filter sidebar (left, 280px) with category checkboxes, price range slider
- Main content: Data table (80% width), expandable rows
- Top bar: Results count + sort dropdown + export button
- Pagination: Bottom, minimal design with page numbers

**Component Details**:
- Two-column: Specs table (left 60%) + pricing/stock panel (right 40%)
- Sticky "Add to Compare" button (top-right)
- Tabs for: Specifications, Availability, History, Similar Components

**Admin**:
- Upload section: Centered card, max-w-2xl
- Status dashboard: Recent uploads table + FAISS rebuild status
- Single column layout for simplicity

This design creates a professional, data-first experience that engineers trust while maintaining the visual polish of modern web applications. The Linear-inspired aesthetic ensures it feels contemporary without sacrificing the functional clarity essential for technical decision-making.
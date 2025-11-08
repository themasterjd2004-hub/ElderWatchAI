# Elder Safety & Emergency Response System - Design Guidelines

## Design Approach

**Framework**: Material Design with medical dashboard inspiration (drawing from telemedicine platforms, hospital monitoring systems, and enterprise health applications)

**Rationale**: This is a utility-focused, information-dense application where clarity, reliability, and quick decision-making are critical. Medical-grade interfaces require consistency and immediate comprehension during emergencies.

---

## Typography

**Font Family**: 
- Primary: Inter or Roboto (via Google Fonts CDN)
- Monospace: Roboto Mono (for vitals, timestamps, medical IDs)

**Hierarchy**:
- Page Titles: text-3xl md:text-4xl font-bold
- Section Headers: text-xl md:text-2xl font-semibold
- Card Titles: text-lg font-semibold
- Body Text: text-base font-normal
- Supporting Text: text-sm font-normal
- Captions/Labels: text-xs font-medium uppercase tracking-wide
- Vitals Display: text-2xl md:text-3xl font-mono font-bold
- Emergency Alerts: text-xl md:text-2xl font-bold

---

## Layout System

**Spacing Primitives**: Use Tailwind units of **2, 4, 6, 8, 12, 16** for consistency
- Component padding: p-4, p-6, p-8
- Section gaps: gap-4, gap-6, gap-8
- Margins: m-2, m-4, m-8, m-12
- Grid gaps: gap-4 md:gap-6

**Container Widths**:
- Main app: max-w-7xl mx-auto
- Dashboard cards: Full-width within grid
- Forms: max-w-2xl mx-auto
- Modal dialogs: max-w-3xl

**Grid Patterns**:
- Dashboard: grid-cols-1 md:grid-cols-2 lg:grid-cols-3
- Monitoring view: Two-column split (video feed + vitals sidebar) on desktop
- Incident list: Single column cards with expandable details

---

## Component Library

### Navigation
- **Top App Bar**: Sticky navigation with app logo, user profile, notification bell (badge counter), emergency button
- **Tab Navigation**: Underline-style tabs for Dashboard / Monitoring / History / Settings
- Mobile: Bottom navigation bar with icons + labels

### Dashboard Components

**Parent Status Card**:
- Large card with parent photo/avatar (96x96 rounded-full)
- Name (text-xl font-semibold), Age, Last active timestamp
- Status badge (Active/Inactive/Alert) with dot indicator
- Quick actions row: Call Parent, View Camera, Emergency Settings
- Compact metrics grid: Heart Rate, Breathing, Motion status

**Monitoring Feed**:
- Full-screen or 16:9 aspect ratio viewport for skeletal feed
- Overlay controls: Recording indicator (pulse animation), timestamp, privacy mode badge
- Bottom toolbar: Screenshot, Audio toggle, Settings
- Sidebar (desktop): Real-time vitals with icon indicators (Heroicons: heart, activity, map-pin)

**Alert Cards**:
- Elevated card with urgent visual treatment (border accent)
- Header: Alert icon + timestamp + confidence score (percentage badge)
- Body: Skeletal snapshot thumbnail, vitals snapshot, audio transcript preview
- Action buttons (full-width on mobile): Send Emergency (primary), False Alarm (secondary), View Details (tertiary)
- Countdown timer (60s) with progress ring

### Forms & Inputs

**Registration Flow**:
- Multi-step form with progress indicator (steps: Account → Parent Details → Monitoring Setup → Privacy)
- Input fields: Consistent height (h-12), rounded-lg borders, focus rings
- Labels: text-sm font-medium above inputs
- Helper text: text-xs below inputs
- Error states: Red accent with icon, shake animation

**Parent Profile Form**:
- Two-column layout (desktop): Personal info | Medical info
- Medical conditions: Tag-style chips (removable)
- Monitoring mode: Radio cards with icons and descriptions
- Privacy toggles: Switch components with inline descriptions

### Data Display

**Vitals Panel**:
- Card grid: Each metric in separate card with icon, value (large mono font), unit, trend indicator
- Metrics: Heart rate (BPM), Breathing rate (per min), Motion intensity, GPS accuracy
- Mini sparkline charts for historical trends (optional enhancement)

**Incident History**:
- Timeline-style list with date separators
- Each incident: Collapsed card showing type, time, confidence, resolution status
- Expandable: Shows full details, skeletal snapshot, audio player, response time metrics
- Filter/sort controls at top

**Emergency Dashboard**:
- Split view: Map (60%) + Details sidebar (40%)
- Map: Simulated ambulance location with route line, hospital marker, parent location
- Details: Hospital card (name, phone, distance, ETA), ambulance status timeline
- Floating action button: Call Hospital (always accessible)

### Overlays & Modals

**Emergency Dispatch Modal**:
- Center modal with backdrop blur
- Header: Warning icon + "Confirm Emergency Dispatch"
- Body: Summary of data being sent, hospital details, ETA estimate
- Footer: Cancel (secondary) + Confirm Dispatch (destructive primary)

**Privacy Settings Panel**:
- Drawer-style slide-in from right
- Sections: Encryption status (locked icon + checkmarks), Data retention (countdown display), Recording mode (skeletal vs normal toggle), Hospital API permissions
- Each setting: Toggle/switch + explanation text

### Buttons & Actions

**Button Variants**:
- Primary: Solid fill, font-semibold, px-6 py-3, rounded-lg
- Secondary: Outline, font-semibold, px-6 py-3, rounded-lg
- Destructive: Red-themed primary for emergency actions
- Tertiary: Text-only, font-medium, underline on hover
- Icon buttons: p-2, rounded-md, hover background

**Emergency Button** (persistent):
- Floating action button (bottom-right on desktop, top-right on mobile)
- Large size (h-14 w-14), rounded-full, pulse animation on alert state
- Icon: Alert triangle or emergency icon (Heroicons)

### Status Indicators

- **Badges**: Rounded-full px-3 py-1 text-xs font-medium (Active/Monitoring/Alert/Resolved)
- **Pulse Dots**: Animated circle for live status
- **Progress Rings**: Circular countdown for timers
- **Confidence Meter**: Horizontal bar with percentage label

---

## Icons

**Library**: Heroicons (via CDN) - outline style for most UI, solid style for filled states

**Key Icons**:
- User, user-group, user-circle (profiles)
- Heart, activity, map-pin, phone (vitals/actions)
- Bell, exclamation-triangle, shield-check (alerts/security)
- Camera, microphone, lock-closed (monitoring/privacy)
- Clock, map, hospital (emergency/location)

---

## Responsive Behavior

**Breakpoints**:
- Mobile: Single column, bottom nav, full-width cards
- Tablet (md:): Two-column grids, side navigation appears
- Desktop (lg:): Three-column grids, sidebars always visible, split views

**Priority Stacking** (mobile):
1. Emergency actions always visible
2. Current status/vitals
3. Quick actions
4. Detailed information collapsible

---

## Accessibility

- WCAG AA contrast ratios for all text
- Focus visible states on all interactive elements (ring-2 ring-offset-2)
- ARIA labels for icon-only buttons
- Keyboard navigation for all flows
- Screen reader announcements for alert states
- High-contrast mode support for vitals display
- Large touch targets (min 44x44px) for emergency buttons

---

## Animation (Minimal)

- Alert cards: Subtle slide-in from top
- Countdown timer: Smooth progress ring animation
- Status changes: Gentle fade transitions
- Loading states: Skeleton screens for data fetch
- **No distracting animations** on monitoring feed or vitals

---

## Images

No hero images needed. This is a dashboard application focused on functional UI.

**User-Generated Images**:
- Parent profile photos: Circular avatars (96x96, 128x128)
- Skeletal feed: Real-time canvas/video element (16:9 or 4:3)
- Map view: Embedded map component with custom markers

---

## Special Considerations

**Emergency State Design**:
- Clear visual distinction between normal and alert states
- Critical actions always visible and accessible
- Reduced cognitive load during emergencies (fewer choices, clearer labels)
- Confirmation required for irreversible actions

**Privacy Indicators**:
- Visible encryption badges
- Recording mode clearly labeled
- Data retention countdown always visible
- Privacy mode toggle prominent in monitoring view

**Medical Context**:
- Professional, trustworthy aesthetic
- Clear, unambiguous labels (no jargon)
- Immediate understanding of system status
- Confidence-inspiring design for elderly care
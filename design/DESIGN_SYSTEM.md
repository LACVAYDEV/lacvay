# LACVAY — Retro Transit Poster Design System

## Design Philosophy
**"Mid-Century Travel Poster meets Jeepney Route Board"**

The LACVAY UI design draws inspiration from classic mid-century travel posters and vintage Philippine transit signage. This retro aesthetic directly connects to jeepneys, local tourism, and the golden age of travel communication.

---

## Color Palette: "Vibrant Transit"

| Color | Hex | Usage |
|-------|-----|-------|
| Cream | #FFF8DC | Background, cards, text containers |
| Coral | #FF6B35 | Primary action buttons, highlights |
| Gold | #FFB81C | Secondary actions, accents, gradients |
| Teal | #00A8B5 | Stats boxes, hero card base |
| Rust | #C1440E | Borders, dark accents |
| Navy | #0D2B3E | Text (ink), borders |
| Lime | #B4D61F | Accent gradients, secondary highlights |

---

## Visual Elements

### Typography
- **Display/Headlines**: Poppins Bold (800–900 weight)
  - Uppercase with negative letter-spacing
  - Example: "YOUR CITY, SIMPLIFIED."
  
- **Body/Navigation**: Poppins SemiBold (600–700 weight)
  - Uppercase, increased letter-spacing (0.05em)
  - Example: "FIND MY ROUTE", "ROUTES", "FARES"

### Borders & Shadows
- **Borders**: 3–4px solid navy (#0D2B3E)
- **Drop Shadow**: `3px 3px 0px rgba(13, 43, 62, 0.4)` — retro "offset" effect
- **Deep Shadow** (cards): `6px 6px 0px rgba(13, 43, 62, 0.6)`

### Gradients
- **Hero Card**: Teal → Gold (top-left to bottom-right)
- **AI Assistant Card**: Lime → Teal
- **Promo Card**: Coral → Gold
- **Button Gradients**: 135-degree angle for dynamic feel

### Corner Radius
- Large elements (cards): 8px
- Medium (icon badges): 6px
- Buttons/Pills: 999px (full-rounded)

### Decorative Elements
- **Sun Rays** (behind hero card): Multi-directional radial lines
- **Stars**: ⭐ on promo card
- **Stat Boxes**: Teal background with cream text
- **Icon Badges**: Coral circles with 3px border

---

## Component Styling

### Buttons
```css
Primary (Gradient): Coral → Gold gradient, cream text, navy border
Secondary (Glass): Teal background, cream text, navy border
Hover Effect: Slight downward translate (2px) with reduced shadow
```

### Cards
- Cream background OR gradient overlay
- 3–4px navy border
- Retro drop shadow (3px 3px 0px)
- Border radius: 4–8px (not fully rounded)

### Pills/Badges
- Gold background with navy border
- Uppercase, bold text
- Compact padding (6px 14px)
- Drop shadow

### Navigation
- Horizontal layout with gaps
- Uppercase text (0.85rem, 0.05em letter-spacing)
- Underline hover effect (border-bottom in coral)
- No glass effect — clean and bold

---

## Visual Hierarchy

1. **Hero Section**
   - Large uppercase headline with color gradient text
   - Cream pill badge with green and gold
   - Two prominent buttons (gradient and glass)
   - Stat boxes in teal with white text
   - Route Finder card with gradient background

2. **Feature Cards**
   - 3-column grid with gradient border backgrounds
   - Bold center-aligned text
   - Coral icon badges
   - Hover effect lifts card with larger shadow

3. **AI Assistant Card**
   - Full-width gradient (lime → teal)
   - Chat bubbles (gold for user, cream for bot)
   - Input field with navy border

4. **Promo Card**
   - Vibrant coral-to-gold gradient
   - Star decoration at top
   - Large uppercase heading in cream
   - Secondary CTA button in teal

5. **Footer**
   - Top navy border
   - Uppercase text, small size

---

## Responsive Design

- **Desktop (>900px)**: 2-column hero, 3-column feature grid
- **Tablet (900px–560px)**: 1-column hero, 2-column feature grid
- **Mobile (<560px)**: Full-width single column, scaled headlines

---

## Design Inspiration

- **Mid-Century Travel Posters**: Bold color blocks, flat illustrations, dramatic typography
- **Vintage Transit Signage**: Heavy borders, all-caps route labels, numeric fares
- **Philippine Jeepney Culture**: Vibrant colors, local character, adventurous spirit
- **Stripe/Notion-Adjacent**: Despite the retro style, maintains modern UX clarity and whitespace

---

## Files
- `index.html` — Full page markup with all sections
- `styles.css` — Complete retro design system and component styles

---

**Made with ❤️ for Batangas City, Batangas, Philippines**

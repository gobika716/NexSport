Build a production-quality frontend landing page for "NexSport" based on the following complete spec.

## 🎨 Design System & Tokens

Register these semantic CSS variables in `src/styles.css` (or `tokens.css`) and use them across all components:

- Primary Navy: `#0B2D5C`

- Sky Blue: `#20B7F3`

- Lime Accent: `#7ED321` (badges, live indicators, CTAs)

- Background: `#F7FAFC`

- Dark Text: `#102A43` | Gray Text: `#64748B` | White: `#FFFFFF`

- Hero Gradient: `from-[#0B2D5C] via-[#10488C] to-[#20B7F3]`

- Fonts: Poppins (Headings), Inter (Body) loaded via `<link>` in root.

- Cards: `rounded-[20px] bg-white border border-slate-100 shadow-sm hover:shadow-lg transition-all duration-300`

---

## 📁 Architecture & Components `src/`)

Organize files cleanly:

- `src/data/`: Type-safe mock datasets for sports, algorithms, testimonials, and stats.

- `src/types/index.ts`: Shared TypeScript interfaces `SportCategory`, `AlgorithmInfo`, `Testimonial`, `Match`).

- `src/components/common/`: `Reveal.tsx` (Framer Motion scroll observer wrapper), `SectionHeading.tsx`, `Button.tsx`.

- `src/components/landing/`: Separate file per landing section.

- `src/components/modals/`: `AuthModal.tsx` (Login/Sign Up tabs), `CreateMatchModal.tsx`.

---

## 🚀 Landing Page Structure `src/routes/index.tsx`)

1. **Sticky Navbar**

   - Logo ("NexSport"), links `#features`, `#sports`, `#about`, `#contact`), Login & Sign Up buttons.

   - Includes glassmorphism backdrop blur on scroll and mobile responsive menu.

   - Clicking Login/Sign Up triggers an interactive `AuthModal`.

2. **Hero Section**

   - Heading: _"Find Players. Build Teams. Play Fair."_

   - Subtitle: _"NexSport connects sports enthusiasts through intelligent matchmaking, balanced team formation, and performance tracking."_

   - CTAs: _"Create Match"_ (opens modal) and _"Explore Sports"_ (scrolls to sports grid).

   - Animated floating status badge ("Match nearby: 4 players ready") alongside a styled hero illustration.

3. **Stats Strip**

   - Count-up animation on view: `5000+` Players, `1200+` Matches, `12` Sports, `95%` Fair Matchmaking.

4. **About NexSport**

   - Professional platform overview explaining how NexSport solves local sports coordination and skill disparity.

5. **Why Choose NexSport**

   - 6 Feature cards: _Nearby Players_, _Create Matches_, _Balanced Teams_, _Dynamic Elo_, _Performance Dashboard_, _AI Insights_.

6. **Popular Sports**

   - 12 Sports cards with hover zoom and status badges: Cricket, Football, Badminton, Basketball, Volleyball, Tennis, Table Tennis, Kabaddi, Hockey, Chess, Running, Cycling.

   - Filter chips above the grid: _All_, _Team_, _Racquet_, _Solo/Mind_.

7. **How NexSport Works**

   - 6 step cards with downward flow connector lines:

     `1. Sign Up` ➔ `2. Skill Assessment` ➔ `3. Create or Join Match` ➔ `4. Balanced Team Formation` ➔ `5. Play Match` ➔ `6. Track Progress`

8. **Algorithms Section**

   - 6 Interactive logic cards showing real-world math/logic previews: _MCQ Assessment_, _Seed Elo Formula_, _Dynamic Elo_, _Greedy Team Balancing_, _Haversine Distance_, _Leaderboard Ranking_.

9. **AI Section**

   - 3 Glassmorphism cards with glowing cyan gradient accents and realistic AI badges:

     _AI Match Summary_, _Weekly Coach_, _Performance Insights_.

10. **Testimonials**

    - 3 cards with user avatars, star ratings, quotes, user names, and played sport.

11. **Footer**

    - Brand tagline, quick anchor links, contact info, and social media icons.

---

src/

├── assets/ # Hero illustrations, sport category cards, avatars

├── components/

│ ├── common/ # Shared UI primitives

│ │ ├── Button.tsx

│ │ ├── SectionHeading.tsx

│ │ └── Reveal.tsx # Framer Motion scroll observer wrapper

│ ├── landing/ # Page-specific sections

│ │ ├── Navbar.tsx

│ │ ├── HeroSection.tsx

│ │ ├── StatsStrip.tsx

│ │ ├── AboutSection.tsx

│ │ ├── FeaturesGrid.tsx

│ │ ├── PopularSports.tsx

│ │ ├── HowItWorks.tsx

│ │ ├── AlgorithmCards.tsx

│ │ ├── AiSection.tsx

│ │ ├── Testimonials.tsx

│ │ └── Footer.tsx

│ └── modals/ # Quick action modals

│ ├── AuthModal.tsx # Login / Sign-Up tabs

│ └── CreateMatchModal.tsx

├── data/ # Type-safe mock datasets

│ ├── sportsData.ts

│ ├── algorithmData.ts

│ ├── testimonialData.ts

│ └── mockMatches.ts

├── types/ # Shared TypeScript interfaces

│ └── index.ts

├── styles/

│ └── tokens.css # CSS variables & Tailwind config extenders

└── routes/

    └── index.tsx            # Main landing page route

## ✨ Motion & Responsiveness

- Use Framer Motion `motion`) for smooth scroll reveal animations on every section using `<Reveal>`.

- Fully mobile-first grid and flex layouts `min-w-0`, `shrink-0`) to prevent horizontal overflow on small screens.

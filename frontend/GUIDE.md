# RazorSense End-to-End Frontend Guide

## 1. Architecture & Tech Stack
- **Framework**: Next.js 16 (App Router) + React 19
- **Styling**: Tailwind CSS v4 (using CSS variables for design tokens)
- **Icons**: Lucide React for crisp UI elements.
- **Logos**: Real internet logos fetched via Clearbit Logo API (`https://logo.clearbit.com/DOMAIN`).

## 2. Component Structure
To maintain scalability, the UI is split across modular components inside `frontend/src/components/`:
- `hero/HeroSection.tsx`: The immersive dark navy header with dynamic gradients.
- `hero/MerchantOrbit.tsx`: Houses the 3D AI robot mascot with floating CSS animations and orbiting merchant tiles.
- `workflow/SupportWorkspace.tsx`: The main two-column grid (`64%` left / `36%` right).
- `workflow/ProgressStepper.tsx`: Dynamic 4-step indicator.
- `workflow/PurchaseSearch.tsx`: Input field mimicking the async search state.
- `workflow/PurchaseResults.tsx`: Selectable search results with "BEST MATCH" badge.
- `workflow/IdentificationPanel.tsx`: The beautiful `mint-to-ice-blue` panel displaying what the AI will automatically fetch.
- `workflow/PurchaseVerification.tsx`: Cryptographic verification screen for the selected purchase.
- `workflow/IssueSelector.tsx`: The 6-tile issue selector.
- `chat/ChatPanel.tsx`: The AI chat side-panel with simulated typing, progress bars, and floating composer.
- `footer/TrustFooter.tsx`: Bottom trust indicators and RazorSense branding.

## 3. The 3D AI Mascot
The AI bot was generated as a high-res 3D mascot. A custom Python script using the `Pillow` library (`bg_remove.py`) was used to algorithmically strip the white background, converting it to full transparency (`frontend/public/robot.png`).

## 4. Animations & Effects
- **Floating Robot**: A custom `@keyframes float` CSS animation drives the robot up and down smoothly over 6 seconds.
- **Orbiting Merchants**: Each merchant tile (Zomato, Amazon, eBay, Swiggy) floats with staggered `animationDelay`s and slight rotational tilts for a chaotic but balanced orbit.
- **Mix-blend-mode**: The hero section uses `mix-blend-screen` and massive `blur-[120px]` divs to create the glowing cyan and violet background flares.
- **Slide-in Transitions**: Forms use Tailwind's `animate-in fade-in slide-in-from-bottom-4` to create a smooth entrance.

## 5. Next Steps for Backend Integration
The UI currently operates on `mockData.ts`. Once the FastAPI backend is ready, the `handleSend` function in `ChatPanel.tsx` and `handleSearch` in `PurchaseSearch.tsx` should be updated to point to the real API endpoints.

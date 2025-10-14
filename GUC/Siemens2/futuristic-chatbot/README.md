# Futuristic AI Chatbot Interface

A minimalist, futuristic AI chatbot web application with cyberpunk aesthetics built with React, TypeScript, and Tailwind CSS.

## Features

- **Cyberpunk Design**: Dark theme with neon purple and cyan accents
- **Glassmorphism Effects**: Backdrop blur and translucent elements throughout
- **Animated Background**: Floating orbs with smooth animations
- **Responsive Chat Interface**: Modern message bubbles with avatars
- **Smooth Animations**: Fade-in, glow-pulse, float, and bounce animations
- **TypeScript Support**: Full type safety and IntelliSense
- **Tailwind CSS**: Custom design system with HSL colors and gradients

## Design System

### Colors (HSL)
- Background: `220 25% 10%` (dark navy)
- Primary: `280 100% 70%` (neon purple)
- Secondary: `200 100% 60%` (cyan blue)
- Accent: `180 100% 50%` (bright cyan)
- Card: `220 20% 15%` with 50% opacity
- Border: `220 20% 25%` (subtle borders)

### Effects
- Neon shadow: `0 0 30px hsl(280 100% 70% / 0.5)`
- Glass shadow: `0 8px 32px 0 hsl(0 0% 0% / 0.37)`
- Backdrop blur: 20px for glassmorphism

### Animations
- `fade-in`: translateY(20px) to 0, opacity 0 to 1, 0.6s ease-out
- `glow-pulse`: box-shadow pulsing between 20px and 40px, 2s infinite
- `float`: translateY between 0 and -10px, 3s ease-in-out infinite
- `bounce`: for typing indicator dots with staggered delays

## Components

### ChatMessage.tsx
- Props: `role: "user" | "assistant"`, `content: string`
- User messages: right-aligned, purple glassmorphic bubble
- Assistant messages: left-aligned, card glassmorphic bubble
- Avatar icons with gradient backgrounds and neon glow

### Index.tsx (Main Page)
- Three-layer background with gradient mesh overlay
- Floating animated orbs (purple and cyan)
- Sticky header with sparkles icon and gradient text
- Chat area with auto-scroll to bottom
- Input area with textarea and send button
- Loading indicator with bouncing dots

## State Management

- Messages array with id, role, content
- Input state for textarea
- isLoading state for typing indicator
- Initial message from AI assistant
- Mock AI response with 1-second delay

## Technical Requirements

- React 18+ with TypeScript
- Tailwind CSS with custom design tokens
- Lucide React icons: Bot, User, Sparkles, Send
- Smooth scrolling with useRef
- All animations use cubic-bezier(0.4, 0, 0.2, 1)

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the development server:
   ```bash
   npm start
   ```

3. Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

## File Structure

```
src/
├── components/
│   └── ChatMessage.tsx
├── pages/
│   └── Index.tsx
├── index.css (design system)
└── tailwind.config.ts (extended theme)
```

## Customization

The design system is fully customizable through the Tailwind configuration:

- Modify colors in `tailwind.config.ts`
- Adjust animations and keyframes
- Update component styles in `index.css`
- Add new components following the established patterns

## Production Integration

This interface is designed to integrate with any AI backend service:

- OpenAI API
- Anthropic Claude
- Google Gemini
- Custom AI services
- Lovable AI platform

Simply replace the mock response in `handleSendMessage` with your actual API calls.
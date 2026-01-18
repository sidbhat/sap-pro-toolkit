# SAP Pro Toolkit - Design System Standards

This document outlines the harmonized design system implemented across the SAP Pro Toolkit extension to ensure consistency, accessibility, and maintainability.

## Overview

The design system was harmonized in January 2026 to address inconsistencies across button styling, modal behavior, loading states, and AI feature theming. The system now follows SAP Horizon design principles with enhanced accessibility and responsive behavior.

---

## 🎨 Color System

### Primary Colors
```css
--primary: #0070F2 (light) / #3B9EFF (dark)
--primary-dark: #0054A6 (light) / #1E7FE0 (dark)
--primary-glow: rgba(0, 112, 242, 0.1) (light) / rgba(59, 158, 255, 0.25) (dark)
```

### Environment Colors (Consistent across themes)
```css
--env-production: #EF4444 (Red - Critical/Production)
--env-preview: #10B981 (Green - Safe/Preview/AI)
--env-sales: #F59E0B (Orange - Sales/Demo/Accent)
--env-sandbox: #A855F7 (Purple - Sandbox/Testing)
```

### Semantic Usage
- **Primary Blue**: Main actions, navigation, focus states
- **Green**: AI features, preview environments, success states
- **Orange**: Sales environments, accent features, warnings
- **Red**: Production environments, danger actions, errors

---

## 🔘 Button System

### Base Button Classes

#### Primary Button
```css
.btn-primary
```
- **Usage**: Main actions (Save, Submit, Continue)
- **Color**: Primary blue with white text
- **Hover**: Darker blue with lift effect and glow

#### Secondary Button
```css
.btn-secondary
```
- **Usage**: Secondary actions (Cancel, Back, Options)
- **Color**: White/gray background with primary border
- **Hover**: Primary color text with subtle lift

#### AI Button (NEW)
```css
.btn-ai
```
- **Usage**: All AI-powered features
- **Color**: Green theme (#10B981)
- **Hover**: Darker green with enhanced glow
- **Consistency**: Replaces previous accent buttons for AI features

#### Accent Button
```css
.btn-accent
```
- **Usage**: Special features, sales-related actions
- **Color**: Orange theme (#F59E0B)
- **Hover**: Darker orange with glow

#### Danger Button
```css
.btn-danger
```
- **Usage**: Delete, remove, critical actions
- **Color**: Red theme (#EF4444)
- **Hover**: Darker red with warning glow

### Button Sizes
```css
.btn-sm    /* Height: 32px, Padding: 8px 12px */
.btn       /* Height: 36px, Padding: 10px 16px (default) */
.btn-lg    /* Height: 44px, Padding: 12px 20px */
```

### Icon Buttons
```css
.icon-btn         /* 28x28px, used in table actions */
.btn-add          /* 32x32px, used for add actions */
.btn-add.ai-btn   /* 32x32px, AI add actions with animation */
```

### Button States
- **Hover**: `translateY(-1px)` + appropriate glow
- **Active**: `translateY(0) scale(0.98)`
- **Loading**: `.btn-loading` with spinner overlay
- **Disabled**: 50% opacity, no interactions

---

## 📋 Modal System

### Modal Structure (Standardized)
```html
<div class="modal" id="modalId">
  <div class="modal-content">
    <div class="modal-header">
      <div class="modal-header-title">
        <svg class="modal-icon">...</svg>
        <h3>Modal Title</h3>
      </div>
      <button class="modal-close">&times;</button>
    </div>
    <div class="modal-body">...</div>
    <div class="modal-footer">
      <div class="modal-footer-left"><!-- Utility buttons --></div>
      <div class="modal-footer-right"><!-- Primary actions --></div>
    </div>
  </div>
</div>
```

### Modal Footer Layout (NEW)
- **Left Section**: Utility buttons (Format, Download, Copy)
- **Right Section**: Primary actions (Cancel, Save)
- **Responsive**: Stacks vertically on mobile

### Modal Branding Standards
- **Icon**: 32x32px extension logo (var(--logo-size-modal))
- **Header**: Consistent title structure with icon
- **Glass Effect**: Backdrop blur with subtle border

### Modal Types
```css
.modal              /* Standard: max-width 480px */
.modal-large        /* Large: max-width 520px */
```

---

## ⏳ Loading System

### Spinner Components
```css
.spinner-sm   /* 16x16px */
.spinner      /* 24x24px (default) */
.spinner-lg   /* 32x32px */
.spinner-xl   /* 48x48px */
```

### Spinner Variants
```css
.spinner-primary  /* Primary blue */
.spinner-ai       /* Green for AI features */
.spinner-accent   /* Orange for special features */
.spinner-light    /* White for dark backgrounds */
```

### Button Loading States
```css
.btn-loading  /* Automatic spinner overlay with fade */
```

### Loading Cards
```css
.loading-card          /* Base loading container */
.loading-card-primary  /* Primary blue theme */
.loading-card-ai       /* Green theme for AI */
.loading-card-accent   /* Orange theme for special features */
```

---

## 🤖 AI Feature Theming

### Consistent Green Theme
All AI-powered features use the unified green color system:

#### AI Elements
- **AI Buttons**: `.btn-ai` (Green background)
- **AI Cards**: Green gradient backgrounds with left border
- **AI Loading**: `.spinner-ai` and `.loading-card-ai`
- **AI Badges**: Green background with matching border

#### AI Visual Language
- **Color**: #10B981 (consistent across light/dark themes)
- **Icon**: ✨ sparkle emoji for AI features
- **Animation**: Subtle pulse animation for AI buttons
- **Gradients**: `linear-gradient(135deg, rgba(16, 185, 129, 0.08), rgba(16, 185, 129, 0.12))`

#### AI Response Styling
```css
.llm-response-card     /* Green gradient card for AI responses */
.ai-insights-bar       /* Green themed insights display */
.diagnostics-ai-enhanced /* Green themed diagnostics */
```

---

## 📱 Responsive Design

### Breakpoints
```css
@media (max-width: 420px)  /* Mobile optimization */
@media (max-width: 380px)  /* Small mobile */
@media (pointer: coarse)   /* Touch targets */
```

### Touch Targets
- **Minimum Size**: 44x44px for touch interfaces
- **Spacing**: Adequate gaps between interactive elements
- **Button Sizing**: Responsive padding adjustments

### Mobile Adaptations
- **Modal Footer**: Stacks vertically with full-width buttons
- **Tables**: Adjusted column widths and text sizing
- **Navigation**: Touch-friendly spacing and sizing

---

## ♿ Accessibility Standards

### Focus Management
```css
*:focus-visible {
  outline: 2px solid var(--primary);
  outline-offset: 2px;
  border-radius: var(--radius-sm);
}
```

### Interactive Elements
- **Button Focus**: Enhanced glow with `box-shadow: 0 0 0 4px var(--primary-glow)`
- **Form Focus**: Border color change + glow ring
- **High Contrast**: Support for `@media (prefers-contrast: high)`

### Screen Reader Support
```css
.sr-only  /* Screen reader only content */
```

### Reduced Motion
```css
@media (prefers-reduced-motion: reduce) {
  /* All animations disabled */
}
```

### Keyboard Navigation
- **Tab Order**: Logical flow through interactive elements
- **Escape Key**: Closes modals and clears search
- **Enter Key**: Activates primary actions
- **Arrow Keys**: Navigate through lists

---

## 🎯 Component Guidelines

### Form Elements

#### Input States
```css
.form-group input:focus     /* Primary border + glow */
.form-group.error input     /* Red border + shake animation */
.form-group.success input   /* Green border + subtle glow */
```

#### Required Fields
- **Asterisk**: `.required-asterisk` in red color
- **Validation**: Real-time feedback with visual states

### Table System

#### Icon Actions
```css
.icon-btn           /* Standard 28x28 table action */
.icon-btn.primary   /* Primary blue for main actions */
.icon-btn.danger    /* Red for delete actions */
```

#### Table Hover States
- **Row Hover**: Subtle background change
- **Focus Within**: Enhanced outline for keyboard navigation

### Toast Notifications

#### Toast Variants
```css
.toast-success   /* Green background */
.toast-error     /* Red background */
.toast-warning   /* Orange background */
```

---

## 🔧 Implementation Guidelines

### CSS Architecture
1. **CSS Custom Properties**: Use for theming and consistency
2. **Component Classes**: Modular, reusable components
3. **State Classes**: `.active`, `.loading`, `.disabled`, etc.
4. **Responsive**: Mobile-first approach

### JavaScript Integration
1. **State Management**: Use data attributes and CSS classes
2. **Animation**: CSS transitions over JavaScript animations
3. **Loading States**: Automatic class application
4. **Theme Switching**: CSS custom property updates

### Performance
1. **Animations**: Use `transform` and `opacity` for GPU acceleration
2. **Will-Change**: Applied selectively for active animations
3. **Reduced Bundle**: Consolidated CSS reduces file size

---

## 📝 Development Checklist

### New Feature Implementation
- [ ] Use appropriate button variant (`.btn-primary`, `.btn-ai`, etc.)
- [ ] Follow modal structure with proper footer layout
- [ ] Implement loading states with unified spinner system
- [ ] Apply AI theming for AI-powered features (green theme)
- [ ] Test responsive behavior on mobile breakpoints
- [ ] Verify accessibility with keyboard navigation
- [ ] Check focus states and screen reader support

### Code Review Standards
- [ ] CSS classes follow naming conventions
- [ ] No inline styles (use CSS custom properties)
- [ ] Proper semantic HTML structure
- [ ] Accessibility attributes (ARIA, alt text)
- [ ] Mobile-responsive implementation
- [ ] Theme compatibility (light/dark/auto)

---

## 🎨 Design Tokens

### Spacing System
```css
--space-xs: 4px
--space-sm: 8px
--space-md: 12px
--space-lg: 20px
--space-xl: 24px
```

### Border Radius
```css
--radius-sm: 4px
--radius-md: 6px
--radius-lg: 8px
```

### Logo Sizing
```css
--logo-size-header: 28px  /* Header logo */
--logo-size-modal: 32px   /* Modal icons */
```

### Typography Scale
```css
--font-xs: clamp(10px, 2vw, 11px)
--font-sm: clamp(11px, 2.2vw, 12px)
--font-base: clamp(12px, 2.5vw, 13px)
--font-md: clamp(13px, 2.8vw, 14px)
--font-lg: clamp(14px, 3vw, 15px)
```

---

## 🚀 Future Considerations

### Planned Enhancements
1. **Design System Documentation**: Interactive component library
2. **Advanced Animations**: Micro-interactions for better UX
3. **Theme Extensions**: Additional color schemes
4. **Component Variants**: Extended button and modal types

### Maintenance
1. **Regular Audits**: Quarterly design system reviews
2. **User Feedback**: Continuous accessibility improvements
3. **Browser Testing**: Cross-browser compatibility checks
4. **Performance Monitoring**: CSS bundle size optimization

---

## 📚 Resources

### SAP Design Guidelines
- [SAP Horizon Design System](https://experience.sap.com/horizon/)
- [SAP Fiori Design Guidelines](https://experience.sap.com/fiori-design/)

### Accessibility Standards
- [WCAG 2.1 AA Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [Web Accessibility Initiative](https://www.w3.org/WAI/)

### Browser Support
- Chrome/Chromium (Primary target)
- Edge (Chromium-based)
- Safari (WebKit-based)
- Firefox (Limited testing)

---

*Last Updated: January 14, 2026*
*Version: 2.0 (Harmonized Design System)*

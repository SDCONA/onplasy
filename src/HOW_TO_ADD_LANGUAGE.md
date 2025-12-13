# How to Add a New Language to OnPlasy

This guide will walk you through adding a new language to the OnPlasy marketplace in just a few simple steps.

## Overview

OnPlasy uses a zero-dependency translation system. All translations are stored in TypeScript files in the `/translations` directory. Currently supported languages:
- **English (EN)**
- **Ukrainian (UA)**
- **Spanish (ES)**

## Step-by-Step Guide

### Step 1: Create the Translation File

1. Navigate to the `/translations` directory
2. Create a new file named `[language-code].ts` (e.g., `fr.ts` for French, `de.ts` for German, `pl.ts` for Polish)
3. Copy the content from `/translations/en.ts` as your template
4. Translate all the values (keep the keys unchanged!)

**Example for French (`/translations/fr.ts`):**

```typescript
export const fr = {
  // Common
  common: {
    loading: "Chargement...",
    save: "Enregistrer",
    cancel: "Annuler",
    delete: "Supprimer",
    edit: "Modifier",
    search: "Rechercher",
    // ... translate all values
  },

  // Header
  header: {
    searchPlaceholder: "Rechercher des produits...",
    myListings: "Mes Annonces",
    // ... translate all values
  },

  // Continue with all sections...
};

export type Translations = typeof fr;
```

**Important Notes:**
- ✅ **DO** translate the values (right side of the colon)
- ❌ **DO NOT** change the keys (left side of the colon)
- ✅ Keep the same structure and nesting
- ✅ Make sure to export the type at the end

---

### Step 2: Update the Translation Index

Open `/translations/index.tsx` and make **3 changes**:

**Change 1: Import your new language file**

```typescript
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { en } from './en';
import { uk } from './uk';
import { es } from './es';
import { fr } from './fr';  // ← Add this line
```

**Change 2: Add to the Language type**

```typescript
type Language = 'en' | 'uk' | 'es' | 'fr';  // ← Add 'fr' here
```

**Change 3: Update the language loading logic**

Find the `LanguageProvider` function and update the `useState` initialization:

```typescript
const [language, setLanguageState] = useState<Language>(() => {
  // Load from localStorage or default to 'en'
  const saved = localStorage.getItem('language');
  return (saved === 'uk' || saved === 'en' || saved === 'es' || saved === 'fr') ? saved : 'en';
  // ← Add || saved === 'fr' here
});
```

**Change 4: Update the value mapping**

Find the `value` object and add your language to the conditional:

```typescript
const value: LanguageContextType = {
  language,
  setLanguage,
  t: language === 'en' ? en : language === 'uk' ? uk : language === 'es' ? es : fr,
  // ← Add : language === 'fr' ? fr before the final value
};
```

---

### Step 3: Update the Language Switcher

Open `/components/LanguageSwitcher.tsx` and update the cycling logic:

**Update the `cycleLanguage` function:**

```typescript
const cycleLanguage = () => {
  if (language === 'en') setLanguage('uk');
  else if (language === 'uk') setLanguage('es');
  else if (language === 'es') setLanguage('fr');  // ← Add this
  else setLanguage('en');
};
```

**Update the `getLanguageDisplay` function:**

```typescript
const getLanguageDisplay = () => {
  if (language === 'en') return 'EN';
  if (language === 'uk') return 'UA';
  if (language === 'es') return 'ES';
  if (language === 'fr') return 'FR';  // ← Add this
  return 'EN';
};
```

**Update the `getTitle` function:**

```typescript
const getTitle = () => {
  if (language === 'en') return 'Switch to Ukrainian';
  if (language === 'uk') return 'Перемкнути на іспанську';
  if (language === 'es') return 'Cambiar a francés';  // ← Add this
  if (language === 'fr') return 'Passer à l\'anglais';  // ← Add this
  return 'Switch language';
};
```

---

## Complete Example: Adding German

### File 1: `/translations/de.ts`

```typescript
export const de = {
  // Common
  common: {
    loading: "Laden...",
    save: "Speichern",
    cancel: "Abbrechen",
    delete: "Löschen",
    edit: "Bearbeiten",
    search: "Suchen",
    filter: "Filter",
    sort: "Sortieren nach",
    price: "Preis",
    category: "Kategorie",
    location: "Standort",
    confirm: "Bestätigen",
    back: "Zurück",
    next: "Weiter",
    submit: "Absenden",
    close: "Schließen",
    view: "Ansehen",
    send: "Senden",
  },

  // ... continue with all other sections
  // (copy from en.ts and translate all values)
};

export type Translations = typeof de;
```

### File 2: `/translations/index.tsx` (changes only)

```typescript
// Add import
import { de } from './de';

// Update type
type Language = 'en' | 'uk' | 'es' | 'de';

// Update localStorage check
return (saved === 'uk' || saved === 'en' || saved === 'es' || saved === 'de') ? saved : 'en';

// Update value mapping
t: language === 'en' ? en : language === 'uk' ? uk : language === 'es' ? es : language === 'de' ? de : en,
```

### File 3: `/components/LanguageSwitcher.tsx` (changes only)

```typescript
const cycleLanguage = () => {
  if (language === 'en') setLanguage('uk');
  else if (language === 'uk') setLanguage('es');
  else if (language === 'es') setLanguage('de');
  else setLanguage('en');
};

const getLanguageDisplay = () => {
  if (language === 'en') return 'EN';
  if (language === 'uk') return 'UA';
  if (language === 'es') return 'ES';
  if (language === 'de') return 'DE';
  return 'EN';
};

const getTitle = () => {
  if (language === 'en') return 'Switch to Ukrainian';
  if (language === 'uk') return 'Перемкнути на іспанську';
  if (language === 'es') return 'Cambiar a alemán';
  if (language === 'de') return 'Zu Englisch wechseln';
  return 'Switch language';
};
```

---

## Language Codes Reference

Common language codes you might use:

| Language | Code | Display |
|----------|------|---------|
| English | `en` | EN |
| Ukrainian | `uk` | UA |
| Spanish | `es` | ES |
| French | `fr` | FR |
| German | `de` | DE |
| Polish | `pl` | PL |
| Italian | `it` | IT |
| Portuguese | `pt` | PT |
| Russian | `ru` | RU |
| Chinese | `zh` | ZH |
| Japanese | `ja` | JA |
| Korean | `ko` | KO |
| Arabic | `ar` | AR |
| Hindi | `hi` | HI |

---

## Testing Your New Language

1. Save all files
2. Refresh the application
3. Click the globe icon in the header
4. Cycle through languages until you reach your new language
5. Verify all translations display correctly
6. Check different pages to ensure consistency

---

## Translation Tips

### DO ✅
- Keep the same tone and formality as the English version
- Maintain consistency in terminology throughout
- Consider cultural context (e.g., currency, date formats)
- Test on mobile and desktop views
- Use native speakers for review if possible

### DON'T ❌
- Change object keys or structure
- Remove any translation keys
- Add new keys that don't exist in `en.ts`
- Translate programming terms in technical contexts
- Use automated translation without review

---

## Troubleshooting

### Error: "Property does not exist on type"
**Cause:** You changed a key name or structure  
**Fix:** Ensure your translation file has the exact same keys as `en.ts`

### Language not appearing in switcher
**Cause:** Missing updates in `/translations/index.tsx`  
**Fix:** Double-check all 4 changes in Step 2

### Translations not loading
**Cause:** TypeScript export error  
**Fix:** Ensure you have `export const [lang] = { ... }` at the top and `export type Translations = typeof [lang];` at the bottom

### Some text still in English
**Cause:** Missing translation keys  
**Fix:** Compare your file with `en.ts` to find missing keys

---

## File Structure Summary

```
/translations/
├── index.tsx          ← Translation system & provider
├── en.ts              ← English translations (base template)
├── uk.ts              ← Ukrainian translations
├── es.ts              ← Spanish translations
└── [your-lang].ts     ← Your new language file
```

---

## Need Help?

If you encounter issues:
1. Compare your files with existing language files (`en.ts`, `uk.ts`, `es.ts`)
2. Check the browser console for TypeScript errors
3. Verify all keys match exactly with `en.ts`
4. Ensure proper TypeScript syntax (commas, quotes, brackets)

---

## Summary Checklist

- [ ] Created `/translations/[lang-code].ts` with all translations
- [ ] Added `export type Translations = typeof [lang];` at the end
- [ ] Imported new language in `/translations/index.tsx`
- [ ] Added language code to `Language` type
- [ ] Updated localStorage validation
- [ ] Updated translation mapping in `value` object
- [ ] Updated `cycleLanguage()` function in `LanguageSwitcher.tsx`
- [ ] Updated `getLanguageDisplay()` function
- [ ] Updated `getTitle()` function
- [ ] Tested language switching
- [ ] Verified translations across multiple pages

---

**That's it! You've successfully added a new language to OnPlasy! 🎉**

The system automatically handles:
- Language switching
- localStorage persistence
- Type safety
- All UI updates

No database changes, no external dependencies, no build configuration needed!

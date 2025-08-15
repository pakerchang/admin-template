# File Naming Conventions Guide

This document defines file naming rules and organizational principles for the project.

## 🎯 Core Principles

### **Feature-Based Organization Principles**

- **Proximity Principle**: Related functionality files should be placed in the same directory
- **Business Context Classification**: Organize files by feature modules rather than pure technical type classification
- **Path Semantics**: Use directory structure to quickly identify file purpose and reduce naming conflicts
- **Avoid Clustering Issues**: Prevent high-similarity file names from clustering in the same directory causing incorrect selection

## Naming Rules Overview

| File Type | Naming Convention | Examples |
| --------- | ----------------- | -------- |
| React UI Components (Business Context) | PascalCase | `BannerForm.tsx`, `ImageCard.tsx` |
| Test Files | kebab-case | `banner-form.test.tsx`, `use-banner.test.ts` |
| Hooks | camelCase | `use-banner.ts`, `useAuth.ts` |
| Utility Functions | kebab-case | `format-date.ts`, `api-client.ts` |
| Constants Files | kebab-case | `error-codes.ts`, `api-endpoints.ts` |
| Configuration Files | kebab-case | `vite.config.ts`, `tailwind.config.ts` |
| Style Files | kebab-case | `button-styles.css`, `layout.scss` |

## Detailed Specifications

### React UI Components (Business Context)

- Use **PascalCase**
- Applicable to:
  - Page components
  - Business logic components
  - Reusable UI components

```typescript
// ✅ Correct
BannerForm.tsx
ImageCard.tsx
UserProfile.tsx

// ❌ Incorrect
banner-form.tsx
imageCard.tsx
user_profile.tsx
```

### Test Files

- Use **kebab-case**
- File names must end with `.test.ts` or `.test.tsx`
- Test files should correspond to the names of the files being tested

```typescript
// ✅ Correct
banner-form.test.tsx // Testing BannerForm.tsx
banner-form-validation.test.ts // Testing form validation logic
use-auth.test.ts // Testing useAuth.ts

// ❌ Incorrect
BannerForm.test.tsx
bannerFormValidation.test.ts
use_auth.test.ts
```

### Hooks

- Use **camelCase**
- Must start with `use`

```typescript
// ✅ Correct
useAuth.ts
useBanner.ts
useImageUpload.ts

// ❌ Incorrect
UseAuth.ts
auth-hook.ts
image_upload.ts
```

### Utility Functions and Constants

- Use **kebab-case**
- File names should clearly describe their functionality

```typescript
// ✅ Correct
format-date.ts
api-client.ts
error-codes.ts

// ❌ Incorrect
formatDate.ts
ApiClient.ts
ERROR_CODES.ts
```

## 📁 Feature-Based File Organization

### **Function-Oriented File Creation Principles**

**Core Concept**: Use path semantics to avoid incorrect selection issues caused by high-similarity file name clustering.

#### **Problem Example**: Naming conflicts caused by technical classification
```
❌ Technology-oriented structure (prone to incorrect selection)
src/components/
├── BannerForm.tsx      # Banner form
├── ProductForm.tsx     # Product form  
├── UserForm.tsx        # User form
├── OrderForm.tsx       # Order form
└── ArticleForm.tsx     # Article form
# 🚨 Five similar "Form" components clustered, easy to select wrong file during development
```

#### **Solution**: Feature classification reduces naming conflicts
```
✅ Feature-oriented structure (path as context)
src/pages/
├── banners/BannerForm.tsx     # Path clearly indicates banner form
├── products/ProductForm.tsx   # Form under product functionality
├── users/UserForm.tsx         # Form under user functionality
├── orders/OrderForm.tsx       # Form under order functionality
└── articles/ArticleForm.tsx   # Form under article functionality
# ✅ Differentiated by path, reducing incorrect selection probability
```

### **File Creation Decision Flow**

1. **Determine File Purpose**
   - Does it belong to a specific feature module? → Place in `pages/{feature}/`
   - Is it cross-feature shared? → Place in `components/shared/` or `hooks/`
   - Is it a utility function? → Determine if feature-specific or general

2. **Choose Organization Method**
   - **Feature-specific** → `pages/{feature}/{type}/`
   - **Cross-feature shared** → `components/shared/{category}/`
   - **General utilities** → `utils/` or `hooks/`

### **Recommended Directory Structure**

#### **Feature Module Structure** (Primary Method)
```
src/pages/banners/              # Banner feature module
├── BannerForm.tsx              # Main form component
├── BannerList.tsx              # Main list component
├── components/                 # Banner-specific components
│   └── ImageCard.tsx           # In banner context, clearly an image card
├── hooks/                      # Banner-specific hooks
│   ├── use-banner.ts           # Main business logic
│   └── use-banner-sort.ts      # Sorting functionality
├── utils/                      # Banner-specific utilities
│   └── banner-helpers.ts       # Banner utility functions
└── __tests__/                  # Banner-related tests
    └── banner-form.test.tsx
```

#### **Shared Resource Structure** (Secondary Method)
```
src/components/shared/          # Cross-feature shared components
├── table/                      # Table functionality group
│   ├── DataTable.tsx           # Main component
│   ├── hooks/                  # Table-specific hooks
│   ├── utils/                  # Table utilities
│   └── examples/               # Usage examples
└── dialog/                     # Dialog functionality group
    └── ImageUploadDialog.tsx

src/hooks/                      # General hooks
├── use-breadcrumb.ts           # Breadcrumb navigation
└── use-mobile.tsx              # Mobile device detection

src/utils/                      # General utility functions
├── date.ts                     # Date processing
└── array-helpers.ts            # Array operations
```

## 🎯 File Naming Self-Check Protocol
**MANDATORY: Execute before creating ANY new file**

### **Pre-Creation Verification**
Claude MUST execute and explicitly confirm:
1. ✅ **Purpose Classification**: "I have identified the file type and purpose correctly" [Yes/No]
2. ✅ **Feature Attribution**: "I have determined the business functionality this belongs to" [Yes/No]
3. ✅ **Location Strategy**: "I have chosen the appropriate directory following feature-based organization" [Yes/No]
4. ✅ **Naming Convention**: "I have applied the correct naming convention for this file type" [Yes/No]
5. ✅ **Conflict Prevention**: "I have checked for naming conflicts in the target directory" [Yes/No]
6. ✅ **Pattern Consistency**: "This follows established project patterns and structure" [Yes/No]

**ENFORCEMENT**: If ANY answer is "No" → Claude MUST immediately STOP and correct the issue before file creation.

### **Naming Standards Application** (30 seconds)
- [ ] **Type Classification**: What naming convention applies? [PascalCase/kebab-case/camelCase]
- [ ] **Naming Quality**: Is the name clear and descriptive? [Avoid abbreviations/Use complete words]
- [ ] **Convention Compliance**: Does this follow project standards? [Review convention table]
- [ ] **Path Semantics**: Does the directory structure clarify purpose? [Use path as context]

### **File Creation Validation** (20 seconds)
- [ ] **Directory Structure**: Is the target directory appropriate? [Feature-based organization priority]
- [ ] **Related Files**: Are related files grouped together? [Proximity principle]
- [ ] **Future Maintenance**: Will this be easy to find and maintain? [Logical grouping]
- [ ] **Team Consistency**: Does this follow established patterns? [Match existing structure]

**Return to CLAUDE.md with: File Path, Naming Rationale, Organization Strategy**

## AI Assistant Reference Rules

When AI assistants handle file naming and creation, follow these rules:

### **1. Feature-Based File Organization Priority**

- **Function Attribution Judgment**: First determine which business functionality the file belongs to
- **Avoid Clustering Issues**: Similar-named files should be differentiated by path, avoiding concentration in the same directory
- **Proximity Principle**: Related functionality files should be placed in the same feature directory

### **2. File Location Decision Flow**

```
File creation decision sequence:
1. Is it specific feature-exclusive?
   ├─ Yes → pages/{feature}/
   └─ No → Continue evaluation

2. Is it cross-feature shared component?
   ├─ Yes → components/shared/{category}/
   └─ No → Continue evaluation

3. Is it general utility or hook?
   ├─ Yes → utils/ or hooks/
   └─ No → Determine based on specific purpose
```

### **3. Naming Rule Application**

- **Identify File Type**: Check file purpose and content
- **Choose Naming Convention**: Select appropriate naming rules based on file type
- **Naming Conversion Rules**:
  - PascalCase: Capitalize first letter of each word (e.g., `BannerForm`)
  - kebab-case: All lowercase, words connected by hyphens (e.g., `banner-form`)
  - camelCase: First letter lowercase, subsequent words capitalized (e.g., `useBanner`)

### **4. Special Rules**

- **Test Files**: Must end with `.test.ts` or `.test.tsx`, placed in `__tests__` directory
- **Hooks**: Must start with `use`
- **Component Files**: Must end with `.tsx`
- **Utility Functions**: Usually end with `.ts`
- **Test Structure**: Maintain test file structure corresponding to source code structure

### **5. Practical Examples**

```typescript
// ✅ Feature-oriented file creation
pages/banners/BannerForm.tsx           // Clear functional context
pages/banners/components/ImageCard.tsx // Banner-specific image card
pages/products/ProductForm.tsx         // Form under product functionality

// ✅ Shared resource organization
components/shared/table/DataTable.tsx  // Table functionality group
hooks/use-breadcrumb.ts                // General navigation hook
utils/date.ts                          // General date utility

// ❌ Avoid clustering problems
components/BannerForm.tsx              // Mixed with other Forms
components/ProductForm.tsx             // Easy to select incorrectly
components/UserForm.tsx                // Easy to select incorrectly
```

## Considerations

### **Naming Rules**
1. **Maintain Consistency**: Use these naming rules uniformly throughout the project
2. **Clarity**: File names should clearly express their content and purpose
3. **Avoid Special Characters**: Use no special characters except hyphens (-)
4. **Avoid Abbreviations**: Use complete words unless well-known abbreviations (like API)

### **Feature-Based Organization**
5. **Function Priority**: Prioritize functional attribution when creating new files, avoid pure technical classification
6. **Path Semantics**: Use directory structure to express file purpose, reduce naming conflicts
7. **Proximity Maintenance**: Related functionality files should be centrally managed for easy maintenance and refactoring
8. **Avoid Clustering**: Be alert to similar-named files clustering in the same directory, differentiate purpose through paths

### **Implementation Recommendations**
9. **New Feature Development**: Strictly follow feature-based principles to establish directory structure
10. **Existing Features**: Gradually refactor, maintain status quo in non-urgent situations
11. **Team Collaboration**: Ensure all developers understand and follow these organizational principles
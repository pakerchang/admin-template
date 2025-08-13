---
inclusion: always
---

# Commit Standards

**Note**: This is a normative specification file written in English for precise technical understanding, as per Claude.md requirements.

## Commit Format Specification

### **Basic Format**

```
<type>[optional scope]: #<issue-number> <description>

[optional body]

[optional footer]
```

**Note:** English is allowed for commit messages (to support development workflow analysis requirements)

### **Examples**

```bash
feat: #26 implement product details page navigation
fix: #26 resolve product list click handler issues
chore: #26 update product-related dependencies
refactor: #26 restructure product components architecture
```

### **Phase-Based Development Format (For Staged Development)**

For projects using staged development process, include Phase information for enhanced Git analysis:

```
<type>: #<issue-number> Phase <X.Y> - <description>
```

**Phase-Based Examples:**

```bash
feat: #31 Phase 1.1 - implement ProductCreateForm independent component
feat: #31 Phase 1.2 - implement ProductEditForm independent component
feat: #31 Phase 1.3 - implement ProductDraftForm independent component
feat: #31 Phase 2.1 - update router configuration for independent components
fix: #31 Phase 2.2 - complete i18n internationalization fixes
docs: #31 Phase 1.0 - add ProductForm architecture refactor requirements
test: #31 Phase 3.1 - add unit tests for independent form components
```

## Commit Quality Guidelines

When creating commits, ensure they follow the established format and quality standards. The hooks system will guide you through the necessary checks and validations.

## Commit Types

### **Primary Types**

| Type       | Description      | Usage                                                   |
| ---------- | ---------------- | ------------------------------------------------------- |
| `feat`     | New feature      | Adding new functionality or features                    |
| `fix`      | Bug fix          | Fixing bugs or issues                                   |
| `chore`    | Maintenance      | Updating dependencies, config files, etc.               |
| `refactor` | Code refactoring | Improving code structure without changing functionality |

### **Secondary Types**

| Type     | Description     | Usage                                                   |
| -------- | --------------- | ------------------------------------------------------- |
| `docs`   | Documentation   | Updating documentation, comments                        |
| `style`  | Code formatting | Code style, whitespace, semicolons, etc.                |
| `test`   | Testing         | Adding or modifying tests                               |
| `build`  | Build system    | Changes affecting build system or external dependencies |
| `ci`     | CI/CD           | Continuous integration configuration files and scripts  |
| `perf`   | Performance     | Performance improvements                                |
| `revert` | Revert          | Reverting previous commits                              |

## Issue Hash Tag Specification

### **Required Issue Number**

- Every commit must be associated with a corresponding Issue
- Format: `#<issue-number>`
- Position: Between type and description

### **Issue Number Verification**

When executing commit, if unsure about the current Issue Hash Tag:

1. **Check current branch name** - Usually contains issue number
2. **Review GitLab Issues** - Confirm the issue being worked on
3. **Ask project manager** - Verify correct issue number with user

**⚠️ Important: Never guess or randomly fill in Issue numbers**

## Description Writing Guidelines

### **Description Principles**

- Use imperative mood (e.g., add, fix, update)
- Start with lowercase
- No period at the end
- Concise and clear description of changes
- **English writing is allowed** (to support development workflow analysis requirements)
- **Include Phase information** for staged development projects to enable rapid Git analysis

### **Good Description Examples**

**Standard Format:**

```bash
feat: #26 add product details page with image gallery
fix: #26 resolve navigation issue from product list
chore: #26 update typescript dependencies to latest version
refactor: #26 extract product card component for reusability
```

**Phase-Based Format (For Staged Development):**

```bash
feat: #31 Phase 2.1 - update router configuration for independent components
fix: #31 Phase 2.2 - complete i18n internationalization fixes
docs: #31 Phase 1.0 - add ProductForm architecture refactor requirements
test: #31 Phase 3.1 - add comprehensive form validation tests
```

### **Descriptions to Avoid**

```bash
# ❌ Too brief
feat: #26 update

# ❌ Unclear description
fix: #26 fix some bugs

# ❌ Using past tense
feat: #26 added product details

# ❌ Capitalize first letter
feat: #26 Add product details page
```

## Scope Usage Guidelines

### **Common Scopes**

- `auth` - Authentication related
- `api` - API related
- `ui` - User interface
- `deps` - Dependencies
- `config` - Configuration files
- `test` - Testing related

### **Scope Examples**

```bash
feat(ui): #26 implement responsive product details layout
fix(api): #26 handle product fetch error scenarios
chore(deps): #26 upgrade react router to v6.8
refactor(auth): #26 simplify user permission checks
```

## Execution Process

### **Pre-commit Checklist**

- [ ] Confirm Issue Hash Tag is correct
- [ ] Select appropriate commit type
- [ ] Write clear description
- [ ] Code passes lint checks
- [ ] Related tests pass

### **Handling Unknown Issue Numbers**

1. Check current working branch: `git branch --show-current`
2. Review recent commit history: `git log --oneline -5`
3. Check GitLab Issues page
4. **Ask user**: "Please confirm the Issue Hash Tag number for current work"

### **Commit Example Process**

```bash
# 1. Check current status
git status

# 2. Stage changes
git add .

# 3. Execute commit (confirm issue number)
git commit -m "feat: #26 implement product details page navigation"

# 4. Push to remote (if needed)
git push origin feature-branch
```

## Phase-Based Commit Search

### **Rapid Git Analysis Commands**

For projects using staged development, use these commands for efficient commit analysis:

```bash
# Search all Phase commits in current branch
git log dev..HEAD --grep="Phase [0-9]\+\.[0-9]\+" --reverse --format="%h %s"

# Search specific issue Phase commits
git log dev..HEAD --grep="#31 Phase" --reverse --format="%h %s"

# Search specific phase number
git log dev..HEAD --grep="Phase 2\." --reverse --format="%h %s"

# Search by commit type and phase
git log dev..HEAD --grep="feat.*Phase" --reverse --format="%h %s"
git log dev..HEAD --grep="fix.*Phase" --reverse --format="%h %s"
```

### **Benefits for Development Process**

- **Rapid Context Understanding** - Instantly identify completed phases
- **Efficient Branch Analysis** - Skip irrelevant commits, focus on development stages
- **Phase-to-Commit Mapping** - Clear correspondence between project phases and git history
- **Documentation Sync** - Easy verification of progress against actual commits

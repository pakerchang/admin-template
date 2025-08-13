---
inclusion: fileMatch
fileMatchPattern: "**/*.{ts,tsx,js,json,yaml,css,md}"
---

# Development Workflow Rules

**Note**: This is a normative specification file written in English for precise technical understanding, as per Claude.md requirements.

## Rules Domain Mapping & Integration Protocol

- **Development Tasks** → Staged delivery, git context analysis
- **Git Operations** → Commit standards, branch management
- **File Creation** → Naming standards, structure organization

## Core Development Principles

### **Staged Delivery Principle**

- **MANDATORY** - Each development step must STOP and wait for review completion
- **Permission-Based Progression** - Only proceed to next step after explicit approval
- **Incremental Validation** - Verify functionality after each stage completion
- **Documentation Synchronization** - Update relevant documentation after each step

### **Development Context Synchronization - EXECUTION BLOCKER**

- **🔴 ABSOLUTE REQUIREMENT** - CANNOT proceed without git context check
- **🔴 FIRST ACTION** - Must be the FIRST action before any task analysis
- **🔴 NO EXCEPTIONS** - Even simple tasks require basic git status check
- **🔴 VALIDATION REQUIRED** - Must explicitly confirm each check completed

### **Smart Git Context Check Requirements**

Before starting any development work, perform CONDITIONAL checks based on documentation progress:

#### **Level 1: Basic Check (Always Required)**

```bash
# 1. Check current git status
git status

# 2. Check current branch name
git branch --show-current
```

#### **Level 2: Progress-Based Analysis (Only if Documentation Progress Exists)**

```bash
# Check if any progress markers exist in documentation
if grep -q '\[x\]' docs/task/**/*.md; then
    echo "📋 Found progress updates - executing full Git analysis"

    # Execute Phase-based commit search for rapid analysis
    git log dev..HEAD --oneline --grep="Phase [0-9]\+\.[0-9]\+" --reverse

    # Search for specific issue commits if issue number detected
    ISSUE_NUM=$(git branch --show-current | grep -o '#[0-9]\+')
    if [ -n "$ISSUE_NUM" ]; then
        git log dev..HEAD --oneline --grep="$ISSUE_NUM Phase" --reverse
    fi
else
    echo "📋 No progress updates - minimal Git check"
    # Skip detailed analysis, show only recent commits
    git log dev..HEAD --oneline -3
fi
```

#### **Level 3: Change Detection (Always Required)**

```bash
# Check git diff for any staged changes
git diff --staged

# Check git diff for unstaged changes
git diff
```

## Cross-Domain Integration Check

When tasks involve multiple rule domains, follow the established protocols defined in the hooks system.

## Rules Conflict Resolution Hierarchy

When rules conflict across domains:

1. 🔴 **development-process.md** = HIGHEST (Process control and workflow)
2. 🟡 **commit-rules.md** = MEDIUM (Version control standards)
3. 🟢 **naming-conventions.md** = STANDARD (Code organization standards)
4. 📋 **Project Guidance** = CONTEXT (Project guidance and integration)

## Development Commands

### Core Commands

- `pnpm install` - Install dependencies
- `pnpm dev` - Start development server
- `pnpm build` - Build for production (includes TypeScript compilation)
- `pnpm lint` - Run ESLint with auto-fix
- `pnpm test` - Run tests with Vitest
- `pnpm test:coverage` - Run tests with coverage report

### Environment Setup

- Copy `.env.example` to `.env` for environment configuration

## Version Control & Deployment

### Git Repository

- **Platform**: Git (supports GitHub, GitLab, etc.)
- **Main Branch**: `master` or `main`
- **Remote URL**: Configure based on your Git hosting platform

### Deployment

- Framework supports various deployment platforms
- Configure deployment based on your hosting provider
- Environment variables should be configured per deployment environment

### Pull/Merge Request Guidelines

- Target branch is typically the main branch
- Run build and lint checks before creating PR/MR
- Use descriptive titles and comprehensive descriptions
- Follow conventional commit message format

## Quality Assurance

Quality checks and validation protocols are managed through the hooks system to ensure consistent execution across all development tasks.

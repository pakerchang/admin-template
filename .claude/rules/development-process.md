# Development Process Rules

This document defines the development process rules for the project to ensure code quality and development efficiency.

## ⚠️ BEFORE ANY DEVELOPMENT WORK - MANDATORY CHECKLIST
**🔴 STOP: Execute these checks BEFORE reading any task requirements**

- [ ] ✅ **Git Status Check**: `git status` - EXECUTED
- [ ] ✅ **Branch Check**: `git branch --show-current` - EXECUTED  
- [ ] ✅ **Progress Documentation Check**: Search for `[x]` in docs/task/**/*.md - EXECUTED
- [ ] ✅ **Commit History Analysis**: IF progress found → Execute Phase-based search - EXECUTED
- [ ] ✅ **Staged Changes Check**: `git diff --staged` - EXECUTED

**🚫 VIOLATION CONSEQUENCE**: Any development plan created without these checks is INVALID and must be redone.

### **Execution Validation Protocol**
When performing git context check, you MUST:

1. **Explicitly State Each Command Executed**:
   - "✅ Executed: git status"
   - "✅ Executed: git log dev..HEAD --grep='Phase'"
   - "✅ Analysis Result: Found X commits, Phases Y completed"

2. **Document Check Results**:
   - Current branch: [branch name]
   - Progress found: [Yes/No]
   - Phase commits identified: [list]
   - Documentation sync status: [aligned/misaligned]

3. **Declare Readiness**:
   - "🔍 Git Context Analysis Complete - Ready for development planning"

## 🤖 Claude Self-Check Protocol

### **Before ANY Response Containing Development Plans**
Claude MUST execute and explicitly confirm:
1. ✅ **Git Status Verification**: "I have checked git status and current branch" [Yes/No]
2. ✅ **Commit History Analysis**: "I have analyzed recent commit history for Phase progress" [Yes/No] 
3. ✅ **Documentation Progress Check**: "I have verified task documentation progress markers" [Yes/No]
4. ✅ **Current Phase Identification**: "I can state the exact current development phase" [Yes/No]
5. ✅ **Context Synchronization**: "Git state matches documentation progress" [Yes/No]

**ENFORCEMENT**: If ANY answer is "No" → Claude MUST immediately STOP and execute git context check first.

### **During Development Execution**
At each significant step, Claude MUST verify:
1. ✅ **Process Adherence**: "I am following staged delivery principles" [Yes/No]
2. ✅ **Quality Standards**: "I am applying required quality checks" [Yes/No]
3. ✅ **Documentation Sync**: "I am updating progress markers as I complete work" [Yes/No]

## 🚨 Core Principles

### **Staged Delivery Principle**
- **MANDATORY** - Each development step must STOP and wait for review upon completion
- **Permission-Based Progression** - Only proceed to next step after explicit approval
- **Incremental Validation** - Verify functionality after each stage completion
- **Documentation Synchronization** - Update relevant documentation after each step

### **Development Context Synchronization - EXECUTION BLOCKER**
- **🔴 ABSOLUTE REQUIREMENT** - CANNOT proceed without git context check
- **🔴 FIRST ACTION** - Must be the FIRST action before any task analysis
- **🔴 NO EXCEPTIONS** - Even simple tasks require basic git status check
- **🔴 VALIDATION REQUIRED** - Must explicitly confirm each check completed
- **Progress Analysis** - Analyze recent commit history to understand completed work
- **Code Review** - Examine git staged changes to understand pending modifications
- **Development Continuity** - Use git history to maintain development flow continuity

### **Development Flow Steps**
1. **Git Context Check**: MANDATORY - Check git commits and staged changes to understand current state
2. **Phase X.Y**: Execute development task (use precise phase naming from project documentation)
3. **STOP**: Immediately stop upon completion, DO NOT continue to next step
4. **Review**: Wait for code review and functional verification
5. **Permission**: Obtain explicit approval before proceeding
6. **Repeat**: Repeat above process until project completion

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

#### **Smart Context Analysis Requirements**
- **Progress-Driven Analysis**: Only perform detailed commit analysis when documentation progress exists
- **Phase-Based Commit Search**: Use Pattern-based search for rapid identification of staged development commits
- **Commit-to-Phase Mapping**: Establish clear correspondence between git commits and project phases using standardized commit patterns
- **Efficient Branch Comparison**: Compare current branch with main development branch (dev) using Phase-aware filtering
- **Sequential Phase Review**: Review commits in Phase order (1.1, 1.2, 2.1, etc.) rather than chronological order
- **Staged Changes Review**: Identify any pending modifications that need attention
- **Development Continuity**: Use Phase markers for seamless progress tracking across development sessions

#### **Documentation Sync Check**
- **MANDATORY** - Verify documentation matches current git state
- **Progress Validation** - Ensure documentation progress reflects actual committed work
- **Gap Identification** - Identify any gaps between documentation and actual implementation

#### **Documentation Progress Update Purpose**
**Core Purpose**: Documentation progress updates serve as **Git Analysis Acceleration Tool**

- **Quick Commit Differentiation** - Progress markers `[x]` help quickly identify commit significance and development stages
- **Analysis Efficiency** - Avoid deep-diving into every commit detail by using documentation progress as git history "index"
- **Git-to-Phase Mapping** - Establish clear correspondence between git commits and project phases
- **Rapid Context Understanding** - Enable fast comprehension of current development state through progress markers

**Simple Update Principle**: Documentation updates should be **lightweight markers**, not detailed descriptions:
- ✅ **Phase Completion Mark**: `[ ]` → `[x]`
- ✅ **Simple Completion Date**: `- Completed on YYYY-MM-DD`
- ✅ **Key Implementation Point**: One-line summary
- ❌ **NOT Required**: Detailed implementation process descriptions

**Workflow Integration**: When executing `git log dev..HEAD --oneline`, documentation progress enables:
- Quick identification of which Phases are completed
- Understanding which development stage each commit roughly corresponds to
- Clear guidance on which Phase should be executed next

#### **Smart Git Context Check Example**
```bash
# Example workflow for optimized git context check:

# Step 1: Basic status check (Always required)
$ git status
$ git branch --show-current
fix/31

# Step 2: Smart progress-based analysis
$ grep -q '\[x\]' docs/task/**/*.md && echo "Progress found" || echo "No progress"
Progress found

# Step 3: Phase-based commit search (Only if progress exists)
$ git log dev..HEAD --grep="Phase [0-9]\+\.[0-9]\+" --reverse --format="%h %s"
d6c2df8 feat: #31 Phase 1.1 - create ProductCreateForm complete independent component
bebd644 feat: #31 Phase 1.2 - create ProductEditForm complete independent component  
56b522f feat: #31 Phase 1.3 - create ProductDraftForm complete independent component
9b01485 fix: #31 Phase 2.2 - complete i18n internationalization fixes

# Step 4: Issue-specific search
$ git log dev..HEAD --grep="#31 Phase" --format="%h %s"
[Same results as above - rapid identification of all Phase commits]

# Step 5: Change detection
$ git diff --staged --name-only
$ git diff --name-only

# Result: Rapid understanding of current development state through Phase markers
# - Phases 1.1, 1.2, 1.3, 2.2 completed
# - Can immediately identify next phase to work on
```

## 🎯 Phase Naming and Documentation Standards

### **Phase Naming Requirements**
- **MANDATORY** - Use precise phase naming from project documentation (e.g., "Phase 4.1", "Phase 4.2")
- **PROHIBITED** - Generic terms like "Step 1", "Step 2", "Task A", "Task B"
- **Format** - Phase X.Y: [Specific Task Name] ([Technical Function Name if applicable])
- **Reference** - Always reference the exact phase from project documentation

### **Documentation Update Requirements**
- **MANDATORY** - Update relevant documentation after each phase completion
- **Specific Actions Required**:
  - Update progress checkboxes from `[ ]` to `[x]`
  - Add completion timestamp and implementation details
  - Update architecture sections if significant changes made
  - Record detailed progress in requirement documents
  - Specify which documents were updated in communication
- **Common Documents to Update**:
  - Main project documentation (task/feature specifications)
  - Architecture documentation (if structural changes)
  - API documentation (if interface changes)
  - CLAUDE.md (if significant architectural changes)

### **Requirement Document Progress Tracking**
- **MANDATORY** - Update requirement document progress after each phase completion
- **Purpose** - Serve as Git Analysis Acceleration Tool for rapid commit analysis and phase mapping
- **Required Updates** (Keep Simple and Lightweight):
  - Mark completed phases with `[x]` checkbox
  - Add completion timestamp in format: `[x] **Phase X.Y** - Completed on YYYY-MM-DD`
  - Add corresponding commit reference for rapid Git analysis
  - Focus on **quick identification markers** rather than comprehensive documentation
- **Enhanced Progress Recording Format** (Lightweight Markers with Commit References):
  ```
  ### 📋 實施進度

  #### Phase 1: 架構重構
  - [x] **Phase 1.1: 創建 ProductCreateForm** - Completed on 2025-07-13
    - Commit: `feat: #31 Phase 1.1 - create ProductCreateForm complete independent component`
  - [x] **Phase 1.2: 創建 ProductEditForm** - Completed on 2025-07-13  
    - Commit: `feat: #31 Phase 1.2 - create ProductEditForm complete independent component`
  - [x] **Phase 1.3: 創建 ProductDraftForm** - Completed on 2025-07-13
    - Commit: `feat: #31 Phase 1.3 - create ProductDraftForm complete independent component`

  #### Phase 2: 功能驗證
  - [x] **Phase 2.1: 路由配置更新** - Completed on 2025-07-13
  - [x] **Phase 2.2: i18n 國際化修復** - Completed on 2025-07-13
    - Commit: `fix: #31 Phase 2.2 - complete i18n internationalization fixes`
  - [ ] **Phase 3: 測試和優化** - Next phase
  ```
  
  **Note**: Keep updates simple - checkboxes, dates, and commit references for rapid git analysis.
- **Benefits** (Git Analysis Acceleration):
  - **Instant Commit Identification** - Direct commit references eliminate search time
  - **Phase-to-Commit Mapping** - Clear one-to-one correspondence between phases and commits
  - **Rapid Context Understanding** - Immediate comprehension of development state
  - **Efficient Git Search** - Use commit patterns for precise filtering

### **Communication Format Requirements**
```
✅ Phase X.Y Complete: [Exact Phase Name from Documentation]

📝 Completed Content:
- [Specific implementation details]
- [Technical components created/modified]
- [Testing results]

📋 Documentation Updated:
- [Specific file path 1]: [What was updated]
- [Specific file path 2]: [What was updated]
- [Requirement document]: Updated progress tracking with completion timestamp and implementation notes
- [Additional documentation changes]

🔍 Please Review:
- [Specific review points]

⏳ Waiting for Permission to Enter Phase X.Y+1: [Next Phase Name]
```

## 📋 Review Checklist

### **Must Check After Each Stage Completion**
- [ ] **Code Quality** - Follow project coding standards
- [ ] **Functional Correctness** - Verify logic meets requirements
- [ ] **Backward Compatibility** - Ensure existing functionality unaffected
- [ ] **Test Coverage** - Confirm adequate test cases
- [ ] **Documentation Update** - Relevant documentation synchronized
- [ ] **Requirement Progress Update** - Progress tracking updated with completion details
- [ ] **Naming Conventions** - Follow `docs/rules/naming-conventions.md`
- [ ] **Commit Standards** - Follow `docs/rules/commit-rules.md`

### **Technical Check Items**
- [ ] **TypeScript** - Type definitions correct and complete
- [ ] **Linting** - Pass ESLint checks
- [ ] **Build** - Successfully build without errors
- [ ] **Testing** - Related tests pass
- [ ] **Performance** - No obvious performance issues

## 🔄 Execution Examples

### **Multi-Step Development Task Example**
```
Task: Implement Image Validation Plugin System Business Scenario Extension

Phase 4.1: Create General Image Validation Manager (createGeneralImageValidationManager)
→ Complete → STOP → Wait for Review → Get Permission

Phase 4.2: Integrate Product Image Validation to ProductForm.tsx  
→ Complete → STOP → Wait for Review → Get Permission

Phase 4.3: Integrate Article Cover Validation to ArticleForm.tsx
→ Complete → STOP → Wait for Review → Get Permission

Phase 5.1: Execute Banner Functional Testing & Verification
→ Complete → STOP → Wait for Review → Get Permission

Phase 5.2-5.4: Execute Additional Testing & Verification
→ Complete → STOP → Wait for Review → Project Complete
```

### **Single-Step Development Task**
```
Task: Fix Simple Bug

Phase 1.1: Fix bug and test
→ Complete → STOP → Wait for Review → Get Permission → Project Complete
```

## 📝 Communication Standards

### **Communication Upon Stage Completion**
- **Clear Marking** - Clearly mark current completed phase using precise phase naming (Phase X.Y)
- **Result Summary** - Brief description of completed features and modifications
- **Documentation Update** - Explicitly state what documentation has been updated
- **Wait for Confirmation** - Explicitly state waiting for review and permission
- **Next Step Preview** - Explain plan for next phase

### **Communication Example**
```
✅ Phase 4.1 Complete: Create General Image Validation Manager (createGeneralImageValidationManager)

📝 Completed Content:
- Created createGeneralImageValidationManager function
- Implemented basic validation rules (file type, filename format, file size)
- Tested basic functionality works correctly

📋 Documentation Updated:
- Updated docs/task/image-validation/image-validation-plugin-system.md
- Marked Phase 4.1 as completed with timestamp
- Added implementation details to architecture section

🔍 Please Review:
- Code quality and architecture design
- Functional correctness
- Test coverage adequacy
- Documentation accuracy

⏳ Waiting for Permission to Enter Phase 4.2: Integrate Product Image Validation to ProductForm.tsx
```

## 🚫 Prohibited Behaviors

### **Critical Process Violations - IMMEDIATE FAILURE**
- **🔴 PROCESS FAILURE** - Skip Smart Git Context Check: Start development without checking documentation progress and appropriate git analysis level
- **🔴 INVALID OUTPUT** - Any development plan without git analysis: Results in invalid planning requiring complete restart
- **🔴 MANDATORY REDO** - Must restart with proper git context check before any development planning
- **❌ Inefficient Commit Analysis** - Perform full commit analysis when no documentation progress exists
- **❌ Ignore Phase-Based Search** - Not using Phase pattern search when progress markers exist
- **❌ Skip Review** - Proceed directly to next phase after completion
- **❌ Batch Completion** - Complete multiple phases at once
- **❌ Assume Permission** - Continue development without explicit approval
- **❌ Skip Testing** - Not verify functionality after completion
- **❌ Ignore Documentation** - Not update relevant documentation
- **❌ Imprecise Phase Naming** - Using vague terms like "Step 1" instead of "Phase X.Y"
- **❌ Incomplete Documentation Updates** - Not specifying what documents were updated
- **❌ Skip Requirement Progress Tracking** - Not updating requirement document progress with completion details
- **❌ Missing Commit References** - Not including commit references in progress documentation for rapid Git analysis

### **Violation Handling**
- Development results violating process require re-review
- May need to rollback to previous stable state
- Serious violations require re-planning development process

## 📊 Process Tracking

### **Use Todo Tool for Tracking**
- Create corresponding Todo items for each stage
- Mark as completed immediately upon completion
- Keep Todo list synchronized with actual progress

### **Status Management**
- `pending` - Waiting to start
- `in_progress` - Currently working
- `completed` - Completed, waiting for Review
- `approved` - Passed Review, can proceed to next step

## 🎯 Goals & Benefits

### **Quality Assurance**
- Ensure code quality at each stage
- Reduce late-stage fix costs
- Improve system stability

### **Collaboration Efficiency**
- Clear development rhythm
- Timely problem discovery and correction
- Better project control

### **Knowledge Management**
- Staged knowledge accumulation
- Documentation and code synchronization
- Experience accumulation and transfer

---

**Important Notes:**
- This specification applies to all development tasks
- Emergency fixes may simplify process but cannot skip Review
- Contact project manager if questions arise
- This specification has higher priority than other development guidelines

**Last Updated**: 2025-07-13  
**Maintained by**: Frontend Team

## 📑 Change Log

### 2025-07-13 Update (Latest) - Critical Process Enforcement Enhancement
- **🔴 CRITICAL ADDITION**: Added MANDATORY CHECKLIST section at document start with execution blocker protocol
- **🔴 ENFORCEMENT**: Added Claude Self-Check Protocol for pre-response validation
- **🔴 LANGUAGE STRENGTHENING**: Enhanced Development Context Synchronization with absolute requirement language
- **🔴 FAILURE CONSEQUENCES**: Added Critical Process Violations section with immediate failure protocols
- **🔴 VALIDATION PROTOCOL**: Added Execution Validation Protocol requiring explicit confirmation of each check
- **ORIGINAL FEATURES**: Maintained all previous smart git analysis optimization features
- **PROCESS BLOCKER**: Transformed guidelines from recommendations to absolute requirements with violation consequences

### 2025-07-06 Update (Previous)
- **CRITICAL**: Added Git Context Synchronization requirements
- **CLARIFIED**: Documentation Progress Update Purpose as **Git Analysis Acceleration Tool**
- **Added**: Development Context Synchronization principle as core requirement
- **Enhanced**: Git Context Check Requirements with branch comparison methodology
- **Fixed**: Replaced fixed commit count analysis with dynamic branch comparison (`git log dev..HEAD`)
- **Added**: Required Git Commands section with correct branch comparison approach
- **Enhanced**: Context Analysis Requirements to emphasize branch-based analysis
- **Added**: Git Context Check Example with real-world workflow
- **Updated**: Prohibited Behaviors to include git context check violations
- **Simplified**: Progress Recording Format to lightweight markers for rapid analysis
- **Redefined**: Benefits section to focus on git analysis acceleration rather than comprehensive documentation

### 2025-07-06 Update (Previous)
- **Added**: Phase Naming and Documentation Standards section
- **Enhanced**: Communication requirements with specific documentation update tracking
- **Updated**: All examples to use precise phase naming (Phase X.Y format)
- **Added**: Prohibited behaviors for imprecise naming and incomplete documentation updates
- **Added**: Requirement Document Progress Tracking section with detailed format requirements
- **Enhanced**: Review checklist to include requirement progress update verification
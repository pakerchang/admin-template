# Phase-Based Development Methodology

This document defines the Phase-based development methodology for structured project delivery and cross-agent coordination.

## 🎯 Core Phase Methodology

### **Phase Naming System**
- **Format**: Phase X.Y where:
  - X = Major feature/milestone number
  - Y = Sub-phase within the major feature
  - Example: Phase 1.1, Phase 1.2, Phase 2.1, etc.

### **Phase Principles**
- **Sequential Execution**: Complete one phase before starting the next
- **Clear Deliverables**: Each phase has specific, measurable outcomes
- **Review Gates**: Mandatory review and approval between phases
- **Documentation Sync**: Update documentation with each phase completion
- **Cross-Agent Coordination**: Enable seamless handoff between dev and docs agents

## 📋 Phase Workflow Protocol

### **1. Phase Planning**
- Define clear Phase X.Y objectives and scope
- Break down requirements into actionable tasks
- Establish acceptance criteria and definition of done
- Document phase plan in appropriate task file under docs/task/
- Create corresponding todo items for tracking

### **2. Phase Implementation**
- Work on single phase at a time (no parallel phase execution)
- Follow naming conventions per naming-conventions.md
- Make incremental commits with proper Phase X.Y tagging
- Update task documentation with progress markers `[x]`
- Apply quality standards throughout implementation

### **3. Phase Review & Commit**
- **Mandatory Review Stop**: Each phase must end with review checkpoint

#### Self-Check Protocol (MANDATORY at each Phase completion)
Claude MUST execute and explicitly confirm:
1. ✅ **Phase Completion Verification**: "I have completed all Phase X.Y objectives" [Yes/No]
2. ✅ **Documentation Update**: "I have updated task documentation with [x] progress markers and timestamp" [Yes/No]
3. ✅ **Quality Validation**: "I have executed required quality checks (lint/test/build if applicable)" [Yes/No]
4. ✅ **Git Commit Creation**: "I have created a Phase X.Y commit with proper message format" [Yes/No]
5. ✅ **User Approval Wait**: "I am now waiting for explicit user approval before proceeding" [Yes/No]

**ENFORCEMENT**: If ANY answer is "No", Claude MUST immediately stop and address the missing requirement.

#### Implementation Steps
- Execute quality checks using pnpm commands (lint, test, build)
- Create phase commit with proper message format per commit-rules.md
- Update task documentation to reflect completion with timestamp
- Validate acceptance criteria fulfillment

### **4. Phase Transition**
- Verify phase completion against acceptance criteria
- Commit all changes before moving to next phase
- Update progress tracking in task documents
- Plan next phase objectives if applicable
- Obtain explicit permission before proceeding

## 🔄 Cross-Agent Phase Coordination

### **Development Agent (dev-agent) Phases**
- Focus on technical implementation and code delivery
- Phase commits follow conventional commit format with issue numbers
- Quality gate enforcement with automated checks
- Technical documentation updates

### **Documentation Agent (docs-agent) Phases**
- Focus on requirement analysis and specification writing
- Phase-based documentation development
- Business context and acceptance criteria definition
- Progress tracking and requirement validation

### **Phase Handoff Protocol**
- **Dev → Docs**: Technical implementation complete, needs documentation update
- **Docs → Dev**: Requirements clarified, ready for implementation
- **Shared Understanding**: Both agents use same Phase X.Y numbering system
- **Progress Synchronization**: Both agents update same task documents

## 📝 Phase Documentation Standards

### **Task Document Phase Tracking**
Required format for phase progress tracking:

```markdown
### 📋 實施進度

#### Phase 1: [Major Milestone Name]
- [x] **Phase 1.1: [Specific Task]** - Completed on YYYY-MM-DD
  - Commit: `feat: #issue Phase 1.1 - description`
  - Agent: dev-agent
- [x] **Phase 1.2: [Specific Task]** - Completed on YYYY-MM-DD
  - Documentation: Updated requirements spec
  - Agent: docs-agent
- [ ] **Phase 1.3: [Next Task]** - Planned

#### Phase 2: [Next Major Milestone]
- [ ] **Phase 2.1: [Specific Task]** - Pending
```

### **Phase Completion Requirements**
Each phase completion must include:
- Checkbox marked as `[x]`
- Completion timestamp
- Reference to commit (for dev phases) or document update (for docs phases)
- Responsible agent identification
- Brief outcome description

## 🏷️ Phase Commit Standards

### **Commit Message Format for Phases**
```
<type>: #<issue-number> Phase <X.Y> - <description>

[optional body with implementation details]

[optional footer]
```

### **Phase Commit Examples**
```bash
feat: #31 Phase 1.1 - implement ProductCreateForm independent component
feat: #31 Phase 1.2 - implement ProductEditForm independent component  
docs: #31 Phase 1.0 - add ProductForm architecture refactor requirements
test: #31 Phase 3.1 - add unit tests for independent form components
```

## 🔍 Phase Analysis and Tracking

### **Git Commands for Phase Analysis**
```bash
# Search all Phase commits in current branch
git log dev..HEAD --grep="Phase [0-9]\+\.[0-9]\+" --reverse --format="%h %s"

# Search specific issue Phase commits  
git log dev..HEAD --grep="#31 Phase" --reverse --format="%h %s"

# Search specific phase number
git log dev..HEAD --grep="Phase 2\." --reverse --format="%h %s"

# Search by commit type and phase
git log dev..HEAD --grep="feat.*Phase" --reverse --format="%h %s"
```

### **Phase Progress Verification**
- Cross-reference git commits with documentation progress
- Verify Phase X.Y consistency between commits and docs
- Identify missing phases or gaps in sequence
- Validate agent coordination and handoff points

## 🎯 Phase Quality Standards

### **Phase Definition Quality**
- Clear, measurable objectives
- Specific deliverables and outcomes
- Realistic scope and timeline
- Well-defined acceptance criteria

### **Phase Execution Quality**
- Single-responsibility principle (one phase, one focus)
- Complete implementation before moving to next phase
- Proper documentation and progress tracking
- Quality checks and validation

### **Phase Completion Quality**
- All acceptance criteria met
- Documentation updated and synchronized
- Commit messages follow standards
- Next phase clearly planned

## 🚫 Phase Anti-Patterns

### **Prohibited Behaviors**
- **❌ Phase Skipping**: Jumping to later phases without completing current phase
- **❌ Parallel Phases**: Working on multiple phases simultaneously
- **❌ Incomplete Phases**: Moving to next phase with unfinished work
- **❌ Missing Documentation**: Not updating progress tracking
- **❌ Inconsistent Numbering**: Using different Phase X.Y systems across agents
- **❌ Batch Completion**: Marking multiple phases complete at once

### **Common Mistakes**
- Using vague phase descriptions instead of specific objectives
- Not coordinating phase numbering between dev and docs agents
- Skipping review gates between phases
- Inadequate progress documentation

## 📊 Phase Benefits

### **Development Efficiency**
- Clear progression and milestones
- Reduced context switching
- Better time estimation and planning
- Improved quality through incremental validation

### **Cross-Agent Coordination**
- Shared understanding of project state
- Clear handoff points and responsibilities
- Synchronized progress tracking
- Reduced miscommunication and rework

### **Project Management**
- Granular progress visibility
- Risk identification and mitigation
- Stakeholder communication improvement
- Historical tracking and analysis

---

**Important Notes:**
- This methodology applies to both development and documentation work
- All agents must use consistent Phase X.Y numbering
- Phase definitions should be specific and measurable
- Regular synchronization between agents is essential
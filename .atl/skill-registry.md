# Skill Registry — portfolio

Generated: 2026-04-01

## User Skills (`~/.claude/skills/`)

| Skill | Description | Trigger Context |
|-------|-------------|-----------------|
| branch-pr | PR creation workflow for Agent Teams Lite | Creating a pull request, opening a PR, preparing changes for review |
| find-skills | Helps users discover and install agent skills | User asks how to do X, "is there a skill for...", extending capabilities |
| go-testing | Go testing patterns for Gentleman.Dots, including Bubbletea TUI testing | Writing Go tests, using teatest, adding test coverage |
| issue-creation | Issue creation workflow for Agent Teams Lite | Creating a GitHub issue, reporting a bug, requesting a feature |
| judgment-day | Parallel adversarial review protocol (two blind judge sub-agents) | User says "judgment day", "dual review", "juzgar" |
| react-native-best-practices | RN performance optimization (FPS, TTI, bundle size, memory, animations) | React Native tasks, Hermes, FlashList, JS thread issues |
| skill-creator | Creates new AI agent skills following the Agent Skills spec | User asks to create a new skill or document patterns for AI |
| sdd-explore | Explore and investigate ideas before committing to a change | Orchestrator launches to investigate a feature |
| sdd-propose | Create a change proposal with intent, scope, and approach | Orchestrator launches to write a proposal |
| sdd-spec | Write specifications with requirements and scenarios | Orchestrator launches to write specs |
| sdd-design | Create technical design document with architecture decisions | Orchestrator launches to write design |
| sdd-tasks | Break down a change into an implementation task checklist | Orchestrator launches to create task breakdown |
| sdd-apply | Implement tasks from the change following specs and design | Orchestrator launches to implement |
| sdd-verify | Validate that implementation matches specs, design, and tasks | Orchestrator launches to verify |
| sdd-archive | Sync delta specs to main specs and archive a completed change | Orchestrator launches to archive |

## Project Skills

None detected.

## Project Convention Files

| File | Description |
|------|-------------|
| CLAUDE.md | Project guidance for Claude Code — commands, architecture, i18n system |

## Compact Rules

### branch-pr
- Follow issue-first enforcement: a GitHub issue MUST exist before opening a PR
- Branch name format: `{issue-number}-{short-description}`
- PR title format: `type(scope): description (#issue)`

### issue-creation
- Follow issue-first enforcement: create issue before any branch/PR work
- Use conventional labels: bug, feature, chore, docs

### judgment-day
- Launch two independent blind judge sub-agents simultaneously
- Synthesize findings, apply fixes, re-judge until both pass or escalate after 2 iterations

### go-testing
- Use `teatest` for Bubbletea TUI tests
- Table-driven tests preferred
- Test files co-located with source

### react-native-best-practices
- Use FlashList over FlatList for long lists
- Avoid anonymous functions in render
- Keep JS thread unblocked for animations

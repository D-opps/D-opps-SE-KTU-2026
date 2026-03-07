# Git Branching Strategy

## Overview

This document describes the branching strategy used across all epics, stories, tasks, and sub-tasks. It defines how branches are created, named, and merged, ensuring traceability back to Jira issues at every level.

---

## Branch Hierarchy

```
main
└── story-<ISSUE_CODE>-<branch-name>         # Story or Task branch
    └── subtask-<ISSUE_CODE>-<subtask-name>  # Sub-task branch
```

Each **epic** is composed of **stories** or **tasks**. Every story or task must have its own dedicated branch — work directly on `main` is **not allowed**.

Within a story or task branch, individual **sub-tasks** are developed in their own **sub-branches**.

---

## Workflow

### 1. Create a Branch for a Story or Task

Branch off from `main` for every story or task.

```
main → story-<ISSUE_CODE>-<branch-name>
```

> ⚠️ No direct commits to `main` are permitted.

---

### 2. Create Sub-branches for Sub-tasks

For each sub-task within a story or task, create a sub-branch from the story/task branch.

```
story-<ISSUE_CODE>-<branch-name> → subtask-<ISSUE_CODE>-<subtask-name>
```

---

### 3. Merge Sub-tasks into the Story or Task

Once a sub-task is complete, open a **Pull Request** to merge the sub-task branch back into its parent story or task branch.

```
subtask-<ISSUE_CODE>-<subtask-name> → story-<ISSUE_CODE>-<branch-name>
  via Pull Request: <ISSUE_CODE>-<subtask-general-name>
```

Repeat this for every sub-task until all are merged.

---

### 4. Merge the Story or Task into Main

Once all sub-tasks have been merged into the story or task branch, open a **Pull Request** to merge into `main`.

```
story-<ISSUE_CODE>-<branch-name> → main
  via Pull Request: <ISSUE_CODE>-<story-general-name>
```

---

## Branch Naming Conventions

| Level       | Format                                          | Example                              |
|-------------|-------------------------------------------------|--------------------------------------|
| Story/Task  | `story-<ISSUE_CODE>-<branch-name>`              | `story-PROJ-42-user-authentication`  |
| Sub-task    | `subtask-<ISSUE_CODE>-<subtask-name>`           | `subtask-PROJ-57-login-form-ui`      |

**Rules:**
- All prefixes (`story`, `subtask`) must be **lowercase**.
- Words within the branch name are separated by hyphens (`-`).
- The Jira issue code is placed **directly after** the prefix, separated by a hyphen.

---

## Pull Request Naming Conventions

| Level       | Format                                  | Example                             |
|-------------|-----------------------------------------|-------------------------------------|
| Story/Task  | `<ISSUE_CODE>-<general-name>`           | `PROJ-42-User Authentication`       |
| Sub-task    | `<ISSUE_CODE>-<general-name>`           | `PROJ-57-Login Form UI`             |

---

## Commit Messages

Commit messages within sub-task branches can be written freely. Since sub-task branches are already named with their Jira issue code and are nested inside story/task branches (which are also issue-coded), traceability is guaranteed by the branch structure itself.

---

## Visual Summary

```
main
│
├──[branch]── story-PROJ-42-user-authentication
│                  │
│                  ├──[branch]── subtask-PROJ-57-login-form-ui
│                  │                  └── [commits...]
│                  │                  └──[PR: PROJ-57-Login Form UI]──► story-PROJ-42
│                  │
│                  ├──[branch]── subtask-PROJ-58-auth-api-integration
│                  │                  └── [commits...]
│                  │                  └──[PR: PROJ-58-Auth API Integration]──► story-PROJ-42
│                  │
│                  └──[PR: PROJ-42-User Authentication]──────────────────────────► main
```

---

## Quick Reference

| What                           | Rule                                                                 |
|--------------------------------|----------------------------------------------------------------------|
| Work on `main` directly        | ❌ Not allowed                                                        |
| Story/Task branch prefix       | `story-`                                                             |
| Sub-task branch prefix         | `subtask-`                                                           |
| Branch name casing             | lowercase, hyphen-separated                                          |
| Issue code position            | After prefix, before branch name                                     |
| PR naming                      | Start with Jira issue code, followed by a hyphen and the item name  |
| Commit messages                | Free-form (traceability is handled by branch naming)                 |

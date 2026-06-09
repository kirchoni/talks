# Talks monorepo

This repository holds talk assets. Each talk lives in its own folder and may have a **local-only** nested git repo for day-to-day work.

## Layout

```
talks/                          ← this repo (shared history, publishing)
├── .gitignore
├── AGENTS.md
└── the-ui-that-builds-itself/  ← talk folder
    ├── .git/                   ← local-only; ignored by parent
    └── …
```

The parent `.gitignore` excludes nested `.git` directories so the inner repos stay local and are not pushed as submodules.

## Working with the repo

### Day-to-day development (inside a talk folder)

Work and commit inside the talk folder as you would in a normal repo:

```bash
cd the-ui-that-builds-itself
git status
git add …
git commit -m "…"
```

The parent `talks` repo does not see these commits. Use the inner repo for WIP, demo prep, and incremental history while a talk is in progress.

### Parent repo status

Until a talk is ready to publish into `talks`, its folder appears as **untracked** in the parent. That is expected.

The parent should only gain a talk when you deliberately add it—for example:

```
Setup baseline
Add "The UI That Builds Itself" talk assets
```

### Publishing a talk into the parent repo

When a talk is ready to land in `talks`, commit from the **repo root**. Git treats a folder with its own `.git` as an embedded repo (submodule/gitlink) unless you move that directory aside first:

```bash
cd /path/to/talks

mv the-ui-that-builds-itself/.git /tmp/the-ui-dot-git
git add the-ui-that-builds-itself/
mv /tmp/the-ui-dot-git the-ui-that-builds-itself/.git
git commit -m 'Add "The UI That Builds Itself" talk assets'
```

Use the same pattern to update an already-published talk:

```bash
mv the-ui-that-builds-itself/.git /tmp/the-ui-dot-git
git add the-ui-that-builds-itself/
mv /tmp/the-ui-dot-git the-ui-that-builds-itself/.git
git commit -m 'Update "The UI That Builds Itself" talk assets'
```

After publishing, the inner `.git` remains on disk and you can keep committing locally inside the talk folder.

### Adding a new talk

1. Create a folder for the talk (e.g. `my-new-talk/`).
2. Initialize a local git repo inside it if you want isolated WIP history.
3. Add `my-new-talk/.git` to the root `.gitignore`.
4. When ready, use the publish steps above with the new folder name and commit message.

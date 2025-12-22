# Technical Documentation: Project & Version Detection

This document explains the technical implementation used to detect the current project and manage its version history, including the branching logic.

## 1. Project Detection
The application identifies the current project environment through the following sequence in `script.js`:

1.  **Initial Identification**: The app calls `window.websim.getCurrentProject()`. This returns a summary object containing the `id`, `title`, and `description` of the project the user is currently viewing.
2.  **Detailed Metadata**: To get the most up-to-date statistics (likes, views) and the specific version currently bookmarked (the "current" state), the app performs a fetch to `/api/v1/projects/${id}`.
3.  **State Management**: This data is then distributed to various managers:
    *   `ProjectDescriptionManager`: Updates the UI with the project's description.
    *   `ProjectHistoryManager`: Sets the target for history fetching and identifies the "Main Branch" starting point.

## 2. Version Detection & Branching Logic
The version history in the sidebar isn't just a linear list; it's a reconstructed tree. This is handled by `modules/project-history.js`.

### The Ancestry Path
To determine which versions belong to the "current history" versus "remixes/branches," the system:
1.  **Fetches Revisions**: Retrieves all revisions for the project from `/api/v1/projects/${id}/revisions`.
2.  **Maps Parents**: Builds a `parentMap` that links every revision version to its `parent_revision_version`.
3.  **Traverses Upwards**: Starting from the project's `current_version` (the bookmarked version), it recursively walks up the parent chain until it reaches version 1.
4.  **Main Branch Identification**: Every version encountered in this upward walk is added to the `mainBranchVersions` Set.

### "Off-Branch" Detection
A version is classified and styled as **"Off-Branch"** if:
-   It is not part of the `mainBranchVersions` Set.
-   Its version number is lower than the current bookmarked version.

These versions are rendered with a more compact UI to indicate they are experimental branches or remixes that did not lead to the current bookmarked state.

## 3. Real-time Synchronization
Because users can change projects or bookmark new versions while the sidebar is closed, the system implements a refresh mechanism:

-   **Event Listener**: The `SidebarManager` dispatches a `sidebarOpened` custom event.
-   **Auto-Update**: The `ProjectHistoryManager` listens for this event. Upon trigger, it re-fetches the project metadata and the latest revisions, recalculating the ancestry path if the bookmarked version has changed. This ensures the "bookmark" icon and branch styling are always accurate.


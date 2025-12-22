import { timeAgo } from './utils.js';

export class ProjectHistoryManager {
    constructor() {
        this.currentProject = null;
        this.historyList = document.querySelector('.sidebar-history-list');
        this.sidebarContent = this.historyList?.parentElement;
        
        this.mainBranchVersions = new Set();
        this.revisionsCache = new Map();
        this.parentMap = new Map();
        this.ancestryPathBuilt = false;
        
        this.init();
    }

    init() {
        // Listen for sidebar opened event
        window.addEventListener('sidebarOpened', () => {
            if (this.currentProject && this.currentProject.id) {
                this.loadProjectHistory(this.currentProject.id, { refresh: true });
            }
        });
    }

    setCurrentProject(project) {
        this.currentProject = project;
    }

    isRevisionOffBranch(versionNumber) {
        if (!this.ancestryPathBuilt) return false;
        const bookmarkedVersion = this.currentProject?.current_version;
        return !this.mainBranchVersions.has(versionNumber) &&
               (bookmarkedVersion != null && versionNumber < bookmarkedVersion);
    }

    createHistoryItemElement({ project_revision, site }, isOffBranch = false) {
        const li = document.createElement('li');
        li.className = 'sidebar-history-item';
        li.dataset.versionId = project_revision.id;
        const version = project_revision.version || '??';
        li.dataset.versionNumber = version;

        li.classList.toggle('is-off-branch', isOffBranch);

        const promptText = site?.prompt?.text || 'Project version created';
        const model = site?.model;

        const isCurrentVersion = this.currentProject && project_revision.version == this.currentProject.current_version;

        const tokens = '13k';
        const lines_added = '+69';
        const lines_removed = '-2';

        const thumbnailUrl = project_revision.current_screenshot_url || (site ? `https://images.websim.com/v1/site/${site.id}/600` : '');
        const altText = site?.prompt?.text ? `Thumbnail for: ${site.prompt.text.substring(0, 50)}...` : 'Project version thumbnail';
        
        const versionTagHTML = `
            <div class="history-version-tag ${!isCurrentVersion ? 'is-old-version' : ''}">
                <span>V${version}</span>
                ${isCurrentVersion ? ' <i class="far fa-bookmark"></i>' : ''}
            </div>
        `;

        if (isOffBranch) {
            li.innerHTML = `
                 ${versionTagHTML}
                <div class="history-item-center">
                    <div class="history-prompt-text">
                        ${promptText}
                    </div>
                    <button class="history-action-btn history-delete-btn" title="Delete"><i class="fas fa-trash-alt"></i></button>
                </div>
            `;
            return li;
        }

        li.innerHTML = `
            <div class="history-item-left">
                <div class="history-item-avatar">
                    ${versionTagHTML}
                    <img src="${thumbnailUrl}" alt="${altText}">
                </div>
            </div>
            <div class="history-item-center">
                <div class="history-prompt-text">
                    ${promptText}
                </div>
                <div class="history-meta-stats">
                    <span class="stat-tokens" title="Size in tokens">${tokens}</span>
                    <span class="stat-lines" title="Lines Changed">
                        <span class="stat-positive">${lines_added}</span>
                        <span class="stat-negative">${lines_removed}</span>
                    </span>
                    <span class="stat-model" title="User Selected Model">${model || 'gemini-pro'}</span>
                </div>
            </div>
            <div class="history-item-right">
                <button class="history-action-btn" title="More options"><i class="fas fa-ellipsis-v"></i></button>
                <div class="history-item-right-bottom-actions">
                    <button class="history-action-btn" title="Retry Prompt"><i class="fas fa-redo-alt"></i></button>
                    <button class="history-action-btn history-delete-btn" title="Delete"><i class="fas fa-trash-alt"></i></button>
                </div>
            </div>
        `;
        
        const img = li.querySelector('.history-item-avatar img');
        const avatarContainer = img.parentElement;

        const setFailedState = () => {
            if (avatarContainer) {
                img.remove();
                avatarContainer.classList.add('loading-failed');
            }
        };

        img.onerror = setFailedState;

        if (!thumbnailUrl) {
            setFailedState();
        }
        
        return li;
    }

    async loadProjectHistory(projectId, options = {}) {
        const { refresh = false } = options;
        if (!this.historyList) {
            console.error('Sidebar history list element not found.');
            return;
        }

        // State initialization/reset on first call or project change
        if (!this.loadProjectHistory.state || this.loadProjectHistory.state.projectId !== projectId) {
            this.historyList.innerHTML = '';
            this.sidebarContent.scrollTop = 0;
            this.loadProjectHistory.state = {
                projectId: projectId,
                isLoading: false,
                isRefreshing: false,
                nextCursor: null,
                hasMore: true,
                limit: 25,
            };

            // Reset ancestry state and begin determination
            this.ancestryPathBuilt = false;
            this.mainBranchVersions.clear();
            this.revisionsCache.clear();
            this.parentMap.clear();
            this.determineMainBranch(projectId).catch(err => {
                console.error("Failed to determine main branch:", err);
            });
            
            // Setup scroll listener only once
            if (!this.sidebarContent.dataset.historyListener) {
                this.sidebarContent.addEventListener('scroll', () => {
                    if (this.sidebarContent.scrollTop < 200 && this.loadProjectHistory.state && !this.loadProjectHistory.state.isLoading && this.loadProjectHistory.state.hasMore) {
                        this.loadProjectHistory(this.loadProjectHistory.state.projectId);
                    }
                });
                this.sidebarContent.dataset.historyListener = 'true';
            }
        }
        
        const state = this.loadProjectHistory.state;

        // Refresh Logic (for sidebar reopen)
        if (refresh) {
            if (state.isRefreshing) return;
            state.isRefreshing = true;

            try {
                const oldBookmarkedVersion = this.currentProject?.current_version;

                // Get fresh project data for correct bookmark
                const projectResponse = await fetch(`/api/v1/projects/${projectId}`);
                if (projectResponse.ok) {
                    const { project } = await projectResponse.json();
                    this.currentProject = project;

                    // Update the branch stat value in the sidebar
                    const branchStatValue = document.getElementById('branch-stat-value');
                    if (branchStatValue && this.currentProject && this.currentProject.current_version != null) {
                        branchStatValue.textContent = this.currentProject.current_version;
                    }

                    // Update like count
                    const likeCountEl = document.getElementById('like-count');
                    if (likeCountEl && this.currentProject.stats && this.currentProject.stats.likes != null) {
                        likeCountEl.textContent = this.currentProject.stats.likes;
                    }

                    // If bookmark changed, recalculate main branch and update styles
                    if (this.ancestryPathBuilt && this.currentProject.current_version !== oldBookmarkedVersion) {
                        this.recalculateMainBranchPath();
                        this.updateRenderedItemsStyle();
                    }
                }

                // Fetch first page of revisions
                const url = new URL(`/api/v1/projects/${projectId}/revisions`, window.location.origin);
                url.searchParams.set('first', state.limit);
                const response = await fetch(url);
                if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
                const { revisions } = await response.json();

                if (!revisions.data || revisions.data.length === 0) return;

                // Diff and prepend new items
                const newestIdInDOM = this.historyList.firstChild?.dataset.versionId;
                const newItemsData = [];
                for (const item of revisions.data) {
                    if (newestIdInDOM && item.project_revision.id === newestIdInDOM) break;
                    newItemsData.push(item);
                }

                newItemsData.reverse().forEach(item => {
                    const revisionVersion = item.project_revision.version;
                    const isOffBranch = this.isRevisionOffBranch(revisionVersion);
                    
                    if (isOffBranch) {
                        const parentVersion = this.parentMap.get(revisionVersion);
                        if (parentVersion && this.isRevisionOffBranch(parentVersion)) {
                            return; // Skip rendering nested subversions
                        }
                    }

                    const li = this.createHistoryItemElement(item, isOffBranch);
                    this.historyList.insertBefore(li, this.historyList.firstChild);
                });

                // Check for updated thumbnails in the newly fetched data
                revisions.data.forEach(itemData => {
                    const { project_revision, site } = itemData;
                    const existingLi = this.historyList.querySelector(`[data-version-id="${project_revision.id}"]`);

                    if (existingLi) {
                        const avatarContainer = existingLi.querySelector('.history-item-avatar');
                        if (avatarContainer && avatarContainer.classList.contains('loading-failed')) {
                            const newThumbnailUrl = project_revision.current_screenshot_url || (site ? `https://images.websim.com/v1/site/${site.id}/600` : '');
                            if (newThumbnailUrl) {
                                avatarContainer.classList.remove('loading-failed');
                                const newImg = document.createElement('img');
                                newImg.src = newThumbnailUrl;
                                newImg.alt = site?.prompt?.text ? `Thumbnail for: ${site.prompt.text.substring(0, 50)}...` : 'Project version thumbnail';
                                
                                newImg.onerror = () => {
                                    if (newImg.parentElement) {
                                        const parent = newImg.parentElement;
                                        newImg.remove();
                                        parent.classList.add('loading-failed');
                                    }
                                };
                                avatarContainer.appendChild(newImg);
                            }
                        }
                    }
                });
                
                // Update bookmarks on all items, new and old
                const allItemsInDOM = this.historyList.querySelectorAll('.sidebar-history-item');
                allItemsInDOM.forEach(li => {
                    if (!li.dataset.versionId) return;
                    const versionTag = li.querySelector('.history-version-tag');
                    if(!versionTag) return;
                    
                    const versionSpan = versionTag.querySelector('span');
                    const version = versionSpan?.textContent?.replace('V', '');

                    const isCurrent = version && this.currentProject && version == this.currentProject.current_version;
                    const hasBookmark = !!versionTag.querySelector('.fa-bookmark');
                    
                    versionTag.classList.toggle('is-old-version', !isCurrent);

                    if (isCurrent && !hasBookmark) {
                        if(versionSpan) versionSpan.insertAdjacentHTML('afterend', ' <i class="far fa-bookmark"></i>');
                    } else if (!isCurrent && hasBookmark) {
                        versionTag.querySelector('.fa-bookmark')?.remove();
                    }
                });

            } catch (error) {
                console.error("Failed to refresh project history:", error);
            } finally {
                if(state) state.isRefreshing = false;
            }
            return;
        }

        // Infinite Scroll Logic (for scrolling up to see older items)
        if (state.isLoading || !state.hasMore || state.isRefreshing) {
            return;
        }
        state.isLoading = true;
        
        const isInitialLoad = !state.nextCursor;
        if (isInitialLoad && this.historyList.children.length === 0) {
            this.historyList.innerHTML = '<li class="sidebar-history-item" style="padding-left: 20px;">Loading history...</li>';
        }

        try {
            const url = new URL(`/api/v1/projects/${projectId}/revisions`, window.location.origin);
            url.searchParams.set('first', state.limit);
            if (state.nextCursor) {
                url.searchParams.set('after', state.nextCursor);
            }

            const response = await fetch(url);
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            const { revisions } = await response.json();

            if (isInitialLoad) {
                this.historyList.innerHTML = '';
            }

            if (!revisions.data || revisions.data.length === 0) {
                if (isInitialLoad) {
                    this.historyList.innerHTML = '<li class="sidebar-history-item" style="padding-left: 20px;">No history found.</li>';
                }
                state.hasMore = false;
                return;
            }
            
            const oldScrollHeight = this.sidebarContent.scrollHeight;

            revisions.data.forEach(item => {
                if (!this.historyList.querySelector(`[data-version-id="${item.project_revision.id}"]`)) {
                    const revisionVersion = item.project_revision.version;
                    const isOffBranch = this.isRevisionOffBranch(revisionVersion);

                    if (isOffBranch) {
                        const parentVersion = this.parentMap.get(revisionVersion);
                        if (parentVersion && this.isRevisionOffBranch(parentVersion)) {
                            return; // Skip rendering nested subversions
                        }
                    }
                                        
                    const li = this.createHistoryItemElement(item, isOffBranch);
                    this.historyList.appendChild(li);
                }
            });

            state.hasMore = revisions.meta.has_next_page;
            state.nextCursor = revisions.meta.end_cursor;

            if (isInitialLoad) {
                setTimeout(() => this.sidebarContent.scrollTop = this.sidebarContent.scrollHeight, 0);
            } else {
                const newScrollHeight = this.sidebarContent.scrollHeight;
                this.sidebarContent.scrollTop += newScrollHeight - oldScrollHeight;
            }

        } catch (error) {
            console.error("Failed to fetch project history:", error);
            if (isInitialLoad) {
                this.historyList.innerHTML = '<li class="sidebar-history-item" style="padding-left: 20px;">Failed to load history.</li>';
            }
        } finally {
            if(state) state.isLoading = false;
        }
    }

    recalculateMainBranchPath() {
        if (!this.currentProject) return;

        this.mainBranchVersions.clear();
        let currentVersionInPath = this.currentProject.current_version;
        while (currentVersionInPath) {
            this.mainBranchVersions.add(currentVersionInPath);
            currentVersionInPath = this.parentMap.get(currentVersionInPath);
        }
    }

    async determineMainBranch(projectId) {
        let allRevisionsData = [];
        let hasMore = true;
        let cursor = null;
        const limit = 100;

        while (hasMore) {
            const url = new URL(`/api/v1/projects/${projectId}/revisions`, window.location.origin);
            url.searchParams.set('first', limit);
            if (cursor) url.searchParams.set('after', cursor);
            
            const response = await fetch(url);
            if (!response.ok) {
                console.error(`Failed to fetch revisions page: ${response.status}`);
                break;
            }
            const { revisions } = await response.json();
            if (!revisions || !revisions.data) break;

            allRevisionsData.push(...revisions.data);
            hasMore = revisions.meta.has_next_page;
            cursor = revisions.meta.end_cursor;
        }

        this.parentMap.clear();
        allRevisionsData.forEach(item => {
            this.revisionsCache.set(item.project_revision.version, item);
            if (item.project_revision.parent_revision_version) {
                this.parentMap.set(item.project_revision.version, item.project_revision.parent_revision_version);
            }
        });

        this.mainBranchVersions.clear();
        let currentVersionInPath = this.currentProject?.current_version;
        while (currentVersionInPath) {
            this.mainBranchVersions.add(currentVersionInPath);
            currentVersionInPath = this.parentMap.get(currentVersionInPath);
        }

        this.ancestryPathBuilt = true;
        this.updateRenderedItemsStyle();
    }
    
    updateRenderedItemsStyle() {
        if (!this.ancestryPathBuilt) return;
        const itemsInDOM = this.historyList.querySelectorAll('.sidebar-history-item');
        const bookmarkedVersion = this.currentProject?.current_version;
        
        itemsInDOM.forEach(li => {
            const versionNumber = parseInt(li.dataset.versionNumber, 10);
            if (isNaN(versionNumber)) return;

            const isOffBranch = this.isRevisionOffBranch(versionNumber);

            if (isOffBranch) {
                const parentVersion = this.parentMap.get(versionNumber);
                if (parentVersion && this.isRevisionOffBranch(parentVersion)) {
                    li.remove(); // Remove nested subversion
                    return;
                }
            }

            const shouldBeOffBranch = isOffBranch;
            const isCurrentlyOffBranch = li.classList.contains('is-off-branch');

            if (shouldBeOffBranch !== isCurrentlyOffBranch) {
                const revisionData = this.revisionsCache.get(versionNumber);
                if (revisionData) {
                    const newLi = this.createHistoryItemElement(revisionData, shouldBeOffBranch);
                    li.parentElement?.replaceChild(newLi, li);
                }
            }
        });
    }
}
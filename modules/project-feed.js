export class ProjectFeedManager {
    constructor() {
        this.projectsGrid = document.getElementById('projects-grid');
        this.loader = document.getElementById('loader');
        this.mainContentEl = document.querySelector('.main-content');
        this.offset = 0;
        this.limit = 24;
        this.isLoading = false;
        this.hasMore = true;
        this.userId = null;
    }

    async init(user) {
        this.userId = user ? user.id : null;
        
        if (!this.projectsGrid || !this.loader || !this.mainContentEl) {
            console.error('Required elements for project loader not found.');
            return;
        }

        await this.fetchAndRenderProjects();
        this.mainContentEl.addEventListener('scroll', () => this.handleScroll());
    }

    async fetchAndRenderProjects() {
        if (this.isLoading || !this.hasMore) return;
        this.isLoading = true;
        this.loader.style.display = 'block';

        try {
            const url = new URL('/api/v1/feed/trending', window.location.origin);
            url.searchParams.set('limit', this.limit);
            url.searchParams.set('offset', this.offset);
            url.searchParams.set('feed', 'hot_desktop');
            url.searchParams.set('range', 'all');
            if (this.userId) {
                url.searchParams.set('for_user_id', this.userId);
            }

            const response = await fetch(url);
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            const { feed } = await response.json();
            
            const projects = feed.data;

            if (projects.length < this.limit) {
                this.hasMore = false;
                this.loader.textContent = 'No more projects to load.';
            }
            
            projects.forEach(item => {
                const card = this.createProjectCard(item);
                this.projectsGrid.appendChild(card);
            });
            this.offset += projects.length;
            
        } catch (error) {
            console.error("Failed to fetch projects:", error);
            this.loader.textContent = 'Failed to load projects.';
            this.hasMore = false;
        } finally {
            this.isLoading = false;
            if(this.hasMore) {
               this.loader.style.display = 'none';
            }
        }
    }

    createProjectCard({ project, site }) {
        if (!project || !site || !project.created_by) {
            console.warn('Skipping incomplete project item:', { project, site });
            return document.createDocumentFragment();
        }

        const card = document.createElement('a');
        card.className = 'project-card';
        card.href = `https://websim.com/p/${project.id}`;
        card.target = '_blank';
        
        const thumbnailUrl = `https://images.websim.com/v1/site/${site.id}/600`;
        const authorProfileUrl = `https://websim.com/@${project.created_by.username}`;
        const authorAvatarUrl = `https://images.websim.com/avatar/${project.created_by.username}`;

        card.innerHTML = `
            <img src="${thumbnailUrl}" alt="${project.title || 'Project thumbnail'}" class="project-thumbnail" loading="lazy" onerror="this.style.backgroundColor='#e0e0e0'; this.removeAttribute('src');">
            <div class="project-info">
                <div class="project-title">${project.title || 'Untitled Project'}</div>
                <div class="project-author">
                    <img src="${authorAvatarUrl}" alt="${project.created_by.username}" class="author-avatar" onerror="this.style.display='none'">
                    <span>@${project.created_by.username}</span>
                </div>
            </div>
        `;
        
        const authorLinkDiv = card.querySelector('.project-author');
        authorLinkDiv.addEventListener('click', (e) => {
             e.preventDefault();
             e.stopPropagation();
             window.open(authorProfileUrl, '_blank');
        });

        return card;
    }

    handleScroll() {
        const { scrollTop, scrollHeight, clientHeight } = this.mainContentEl;
        if (scrollTop + clientHeight >= scrollHeight - 500) {
            this.fetchAndRenderProjects();
        }
    }
}


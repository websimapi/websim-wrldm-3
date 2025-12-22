import { timeAgo, getRelativeDateGroup } from './utils.js';

export class CreatorProjectsManager {
    constructor() {
        this.creator = null;
        this.init();
    }

    init() {
        // Listen for load creator projects event
        window.addEventListener('loadCreatorProjects', () => {
            this.loadCreatorProjects();
        });

        // Wire up filters and search for Projects View
        const projectsViewContainer = document.getElementById('projects-view');
        if (projectsViewContainer) {
            const filterBtns = projectsViewContainer.querySelectorAll('.filter-btn');
            filterBtns.forEach(btn => {
                btn.addEventListener('click', () => {
                    filterBtns.forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');
                    const filter = btn.dataset.filter;
                    const query = projectsViewContainer.querySelector('input').value;
                    this.loadCreatorProjects(filter, query);
                });
            });

            const searchInput = projectsViewContainer.querySelector('input');
            let searchTimeout;
            searchInput.addEventListener('keyup', (e) => {
                clearTimeout(searchTimeout);
                searchTimeout = setTimeout(() => {
                    const query = e.target.value;
                    const activeFilter = projectsViewContainer.querySelector('.filter-btn.active').dataset.filter;
                    this.loadCreatorProjects(activeFilter, query);
                }, 300);
            });
        }
    }

    setCreator(creator) {
        this.creator = creator;
    }

    createCreatorProjectItem({ project, site }) {
        const item = document.createElement('div');
        item.className = 'creator-project-item';
        
        const thumbnailUrl = site ? `https://images.websim.com/v1/site/${site.id}/600` : '/image.png';

        const likes = project.stats?.likes ?? 0;
        const views = project.stats?.views ?? 0;
        
        const formatStat = (num) => {
            if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
            if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
            return num;
        };

        item.innerHTML = `
            <img src="${thumbnailUrl}" class="creator-project-thumbnail" alt="Thumbnail for ${project.title || 'Untitled Project'}" onerror="this.src='/image.png'">
            <div class="creator-project-details">
                <div class="creator-project-title">${project.title || 'Untitled Project'}</div>
                <div class="creator-project-meta">
                    <div class="creator-project-stats">
                        <span><i class="far fa-heart"></i> ${formatStat(likes)}</span>
                        <span><i class="fas fa-chart-bar"></i> ${formatStat(views)}</span>
                    </div>
                    <span class="creator-project-time">${timeAgo(project.created_at)}</span>
                </div>
            </div>
            <div class="creator-project-actions">
                <button class="action-btn" title="Settings"><i class="fas fa-cog"></i></button>
            </div>
        `;

        return item;
    }

    async loadCreatorProjects(filter = 'all', query = '') {
        if (!this.creator || !this.creator.username) {
            console.error("Creator info not available.");
            const container = document.getElementById('projects-list-container');
            if(container) container.innerHTML = `<p style="padding: 16px;">Could not load creator's projects.</p>`;
            return;
        }

        const container = document.getElementById('projects-list-container');
        container.innerHTML = `<p style="padding: 16px;">Loading projects...</p>`;

        try {
            const url = new URL(`/api/v1/users/${this.creator.username}/projects`, window.location.origin);
            url.searchParams.set('first', 50);
            url.searchParams.set('sort_by', 'updated_at');
            
            if (filter === 'posted') url.searchParams.set('posted', 'true');
            else if (filter === 'liked') url.searchParams.set('liked_by_owner', 'true');
            
            if (query) url.searchParams.set('query', query);

            const response = await fetch(url);
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

            const { projects } = await response.json();

            if (!projects.data || projects.data.length === 0) {
                container.innerHTML = `<p style="padding: 16px;">No projects found.</p>`;
                return;
            }
            
            const groupedProjects = projects.data.reduce((acc, { project, site, project_revision }) => {
                if (!project || !site) return acc;
                const group = getRelativeDateGroup(project.created_at);
                if (!acc[group]) acc[group] = [];
                acc[group].push({ project, site, project_revision });
                return acc;
            }, {});

            container.innerHTML = '';
            
            const groupOrder = ['Today', 'Yesterday', 'This Week'];
            const sortedGroups = Object.keys(groupedProjects).sort((a, b) => {
                const aIndex = groupOrder.indexOf(a);
                const bIndex = groupOrder.indexOf(b);
                if(aIndex !== -1 && bIndex !== -1) return aIndex - bIndex;
                if(aIndex !== -1) return -1;
                if(bIndex !== -1) return 1;
                return new Date(b) - new Date(a);
            });

            for (const groupName of sortedGroups) {
                const groupHeader = document.createElement('div');
                groupHeader.className = 'section-header';
                groupHeader.textContent = groupName;
                container.appendChild(groupHeader);
                
                groupedProjects[groupName].forEach(item => {
                    const projectEl = this.createCreatorProjectItem(item);
                    container.appendChild(projectEl);
                });
            }

        } catch (error) {
            console.error("Failed to load creator projects:", error);
            container.innerHTML = `<p style="padding: 16px;">Failed to load projects.</p>`;
        }
    }
}
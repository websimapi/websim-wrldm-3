import { ICONS } from './constants.js';

export class SidebarManager {
    constructor() {
        this.sidebarToggle = document.getElementById('sidebarToggle');
        this.mainHeaderLogoWrapper = document.getElementById('mainHeaderLogoWrapper');
        this.sidebar = document.getElementById('sidebar');
        this.sidebarInternalControls = document.getElementById('sidebarInternalControls');
        this.sidebarInternalCloseBtn = document.getElementById('sidebarInternalCloseBtn');
        
        this.init();
    }

    init() {
        if (this.sidebarToggle) {
            this.sidebarToggle.innerHTML = ICONS.open;
            this.sidebarToggle.addEventListener('click', () => this.openSidebar());
        }

        if (this.sidebarInternalCloseBtn) {
            this.sidebarInternalCloseBtn.addEventListener('click', () => this.closeSidebar());
        }

        this.setupTabSwitching();
    }

    openSidebar() {
        this.sidebar.classList.remove('hidden');

        if (this.mainHeaderLogoWrapper) {
            this.mainHeaderLogoWrapper.style.display = 'none';
        }

        if (this.sidebarInternalControls) {
            this.sidebarInternalControls.style.display = 'inline-flex';
            if (this.sidebarInternalCloseBtn) {
                this.sidebarInternalCloseBtn.innerHTML = ICONS.closeSidebar;
            }
        }

        // Trigger history refresh
        window.dispatchEvent(new CustomEvent('sidebarOpened'));
    }

    closeSidebar() {
        this.sidebar.classList.add('hidden');

        if (this.sidebarInternalControls) {
            this.sidebarInternalControls.style.display = 'none';
        }

        if (this.mainHeaderLogoWrapper) {
            this.mainHeaderLogoWrapper.style.display = 'inline-flex';
        }
    }

    setupTabSwitching() {
        const remixViewBtn = document.getElementById('remixViewBtn');
        const projectsViewBtn = document.getElementById('projectsViewBtn');
        const remixView = document.getElementById('remix-view');
        const projectsView = document.getElementById('projects-view');
        const sidebarActionButtons = document.querySelectorAll('.sidebar-nav-controls-left .sidebar-action-btn');

        sidebarActionButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                if (btn.id === 'remixViewBtn' || btn.id === 'projectsViewBtn') {
                    sidebarActionButtons.forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');
                }
            });
        });

        if (remixViewBtn && projectsViewBtn && remixView && projectsView) {
            remixViewBtn.addEventListener('click', () => {
                if(remixView) remixView.style.display = 'flex';
                if(projectsView) projectsView.style.display = 'none';
            });

            projectsViewBtn.addEventListener('click', () => {
                if(remixView) remixView.style.display = 'none';
                if(projectsView) projectsView.style.display = 'flex';
                if (projectsView && !projectsView.dataset.loaded) {
                    window.dispatchEvent(new CustomEvent('loadCreatorProjects'));
                    projectsView.dataset.loaded = 'true';
                }
            });
        }
    }
}


export class MenuManager {
    constructor() {
        this.init();
    }

    init() {
        this.setupModelSelector();
        this.setupAdvancedAbilities();
        this.setupVisibilitySelector();
        this.setupChatInput();
    }

    setupModelSelector() {
        const modelSelectorContainer = document.querySelector('.model-selector-container');
        if (!modelSelectorContainer) return;

        const modelSelectorBtn = modelSelectorContainer.querySelector('.model-selector-btn');
        const modelSelectorMenu = modelSelectorContainer.querySelector('#model-selector-menu');
        const modelSelectorBtnText = modelSelectorBtn.querySelector('span');
        const modelSelectorBtnIcon = modelSelectorBtn.querySelector('i');
        const modelItems = modelSelectorMenu.querySelectorAll('.model-item');

        modelSelectorBtn.addEventListener('click', (event) => {
            event.stopPropagation();
            const isHidden = modelSelectorMenu.style.display === 'none';

            this.closeOtherMenus(['model']);

            modelSelectorMenu.style.display = isHidden ? 'flex' : 'none';
            
            if (modelSelectorBtnIcon) {
                modelSelectorBtnIcon.style.transition = 'transform 0.2s ease-in-out';
                modelSelectorBtnIcon.style.transform = isHidden ? 'rotate(180deg)' : 'rotate(0deg)';
            }
        });

        document.addEventListener('click', (event) => {
            if (!modelSelectorContainer.contains(event.target)) {
                modelSelectorMenu.style.display = 'none';
                if (modelSelectorBtnIcon) {
                    modelSelectorBtnIcon.style.transform = 'rotate(0deg)';
                }
            }
        });

        modelItems.forEach(item => {
            item.addEventListener('click', () => {
                const currentActive = modelSelectorMenu.querySelector('.model-item.active');
                if (currentActive) {
                    currentActive.classList.remove('active');
                }
                item.classList.add('active');

                const modelName = item.dataset.modelName;
                if (modelSelectorBtnText) {
                    modelSelectorBtnText.textContent = modelName;
                }

                modelSelectorMenu.style.display = 'none';
                if (modelSelectorBtnIcon) {
                    modelSelectorBtnIcon.style.transform = 'rotate(0deg)';
                }

                console.log(`Model changed to: ${modelName}`);
            });
        });
    }

    setupAdvancedAbilities() {
        const abilitiesContainer = document.querySelector('.abilities-container');
        if (!abilitiesContainer) return;

        const abilitiesBtn = abilitiesContainer.querySelector('.attachment-btn');
        const abilitiesMenu = abilitiesContainer.querySelector('#advanced-abilities-menu');
        const abilitiesBadge = abilitiesBtn.querySelector('.badge');
        const checkboxes = abilitiesMenu.querySelectorAll('input[type="checkbox"]');
        const abilitiesWarning = document.getElementById('abilities-warning');

        const updateAbilitiesUI = () => {
            const checkedCount = Array.from(checkboxes).filter(cb => cb.checked).length;
            if (abilitiesBadge) {
                abilitiesBadge.textContent = checkedCount;
                if (checkedCount > 0) {
                    abilitiesBadge.style.display = 'flex';
                } else {
                    abilitiesBadge.style.display = 'none';
                }
            }
            if (abilitiesWarning) {
                abilitiesWarning.style.display = checkedCount >= 3 ? 'block' : 'none';
            }
        };

        abilitiesBtn.addEventListener('click', (event) => {
            event.stopPropagation();
            const isHidden = abilitiesMenu.style.display === 'none';
            
            this.closeOtherMenus(['abilities']);

            abilitiesMenu.style.display = isHidden ? 'flex' : 'none';
        });

        document.addEventListener('click', (event) => {
            if (abilitiesMenu.style.display === 'flex' && !abilitiesContainer.contains(event.target)) {
                abilitiesMenu.style.display = 'none';
            }
        });

        checkboxes.forEach(checkbox => {
            checkbox.addEventListener('change', () => {
                updateAbilitiesUI();
                const abilityName = checkbox.nextElementSibling.querySelector('.ability-title').textContent;
                console.log(`Ability '${abilityName}' is now ${checkbox.checked ? 'enabled' : 'disabled'}`);
            });
        });

        updateAbilitiesUI();
    }

    setupVisibilitySelector() {
        const visibilityContainer = document.querySelector('.visibility-selector-container');
        if (!visibilityContainer) return;

        const visibilityBtn = visibilityContainer.querySelector('.visibility-btn');
        const visibilityMenu = visibilityContainer.querySelector('#visibility-selector-menu');
        const visibilityBtnIcon = visibilityBtn.querySelector('i');
        const visibilityBtnText = visibilityBtn.querySelector('span');
        const visibilityItems = visibilityMenu.querySelectorAll('.visibility-item');

        const visibilityIcons = {
            public: 'fas fa-globe',
            unlisted: 'fas fa-eye-slash',
            private: 'fas fa-lock'
        };

        visibilityBtn.addEventListener('click', (event) => {
            event.stopPropagation();
            const isHidden = visibilityMenu.style.display === 'none';

            this.closeOtherMenus(['visibility']);
            
            visibilityMenu.style.display = isHidden ? 'flex' : 'none';
        });

        document.addEventListener('click', (event) => {
            if (!visibilityContainer.contains(event.target)) {
                visibilityMenu.style.display = 'none';
            }
        });

        visibilityItems.forEach(item => {
            item.addEventListener('click', () => {
                const currentActive = visibilityMenu.querySelector('.visibility-item.active');
                if (currentActive) {
                    currentActive.classList.remove('active');
                }
                item.classList.add('active');

                const newVisibility = item.dataset.visibility;

                if (visibilityBtnIcon) {
                    visibilityBtnIcon.className = visibilityIcons[newVisibility];
                }
                if (visibilityBtnText) {
                    visibilityBtnText.textContent = item.querySelector('.visibility-name').textContent;
                }

                visibilityMenu.style.display = 'none';

                console.log(`Project visibility changed to: ${newVisibility}`);
            });
        });
    }

    setupChatInput() {
        const chatInput = document.getElementById('chatInput');
        if (chatInput) {
            chatInput.addEventListener('input', () => {
                chatInput.style.height = 'auto';
                chatInput.style.height = (chatInput.scrollHeight) + 'px';
            });
        }
    }

    closeOtherMenus(exclude = []) {
        if (!exclude.includes('model')) {
            const modelMenu = document.querySelector('#model-selector-menu');
            if (modelMenu) {
                modelMenu.style.display = 'none';
                const modelSelectorBtnIcon = document.querySelector('.model-selector-btn i');
                if (modelSelectorBtnIcon) modelSelectorBtnIcon.style.transform = 'rotate(0deg)';
            }
        }

        if (!exclude.includes('abilities')) {
            const abilitiesMenu = document.querySelector('#advanced-abilities-menu');
            if (abilitiesMenu) abilitiesMenu.style.display = 'none';
        }

        if (!exclude.includes('visibility')) {
            const visibilityMenu = document.querySelector('#visibility-selector-menu');
            if (visibilityMenu) visibilityMenu.style.display = 'none';
        }
    }
}
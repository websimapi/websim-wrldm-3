export class ProjectDescriptionManager {
    constructor() {
        this.descriptionP = document.getElementById('sidebarProjectDescription');
        this.descriptionTextarea = document.getElementById('sidebarProjectDescriptionInput');
        
        this.init();
    }

    init() {
        if (!this.descriptionP || !this.descriptionTextarea) return;

        this.descriptionP.classList.add('is-placeholder');

        this.descriptionP.addEventListener('click', () => this.startEditing());
        this.descriptionTextarea.addEventListener('blur', () => this.finishEditing());
        this.descriptionTextarea.addEventListener('input', () => this.autoResize());
    }

    startEditing() {
        this.descriptionP.style.display = 'none';
        this.descriptionTextarea.style.display = 'block';
        
        const fullText = this.descriptionP.dataset.fullText;
        this.descriptionTextarea.value = fullText || '';
        this.descriptionTextarea.focus();
        
        this.autoResize();
    }

    finishEditing() {
        const newText = this.descriptionTextarea.value.trim();
        
        this.descriptionTextarea.style.display = 'none';
        this.descriptionP.style.display = 'block';

        if (newText === '') {
            this.descriptionP.textContent = 'Add a description...';
            this.descriptionP.classList.add('is-placeholder');
            delete this.descriptionP.dataset.fullText;
        } else {
            this.descriptionP.dataset.fullText = newText;
            this.descriptionP.classList.remove('is-placeholder');
            
            if (newText.length > 100) {
                this.descriptionP.textContent = newText.substring(0, 100) + '...';
            } else {
                this.descriptionP.textContent = newText;
            }
        }
    }

    autoResize() {
        this.descriptionTextarea.style.height = 'auto';
        this.descriptionTextarea.style.height = (this.descriptionTextarea.scrollHeight) + 'px';

        if (this.descriptionTextarea.value.length > this.descriptionTextarea.maxLength) {
            this.descriptionTextarea.value = this.descriptionTextarea.value.slice(0, this.descriptionTextarea.maxLength);
        }
    }

    updateDescription(description) {
        if (this.descriptionP && description) {
            this.descriptionP.dataset.fullText = description;
            this.descriptionP.classList.remove('is-placeholder');
            if (description.length > 100) {
                this.descriptionP.textContent = description.substring(0, 100) + '...';
            } else {
                this.descriptionP.textContent = description;
            }
        }
    }
}


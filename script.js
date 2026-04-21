// Script for handling the raw multi-step form dumped by the user, now backed by our Node.js API

document.addEventListener('DOMContentLoaded', () => {

    const nextButtons = document.querySelectorAll('.next');
    const progressBar = document.querySelector('.progress .percent');

    // Utility: Outil pour récupérer le texte de la carte "cadre" sélectionnée dans une section
    function getSelectedText(sectionId) {
        const section = document.getElementById(sectionId);
        if (!section) return '';
        const selected = section.querySelector('.cadre--selected .cadre-text');
        return selected ? selected.innerText.trim() : '';
    }

    nextButtons.forEach(btn => {
        btn.addEventListener('click', async function(e) {
            
            // Interaction Carte: Surlignage au clic
            if (this.classList.contains('cadre')) {
                const parent = this.closest('.row, .parent-content');
                if (parent) parent.querySelectorAll('.cadre').forEach(c => c.classList.remove('cadre--selected'));
                this.classList.add('cadre--selected');
            }
            
            const currentSection = this.closest('section.big-step');
            if(!currentSection) return;

            // Détection de l'étape de validation finale (bouton "Je valide ma simulation")
            if(currentSection.id === 'contactphone' && this.id !== 'back-btn') {
                
                const btnSubmit = this;
                const originalText = btnSubmit.innerText;
                btnSubmit.innerText = "Validation en cours...";
                btnSubmit.style.opacity = '0.7';
                btnSubmit.style.pointerEvents = 'none';

                // Prépare l'objet de données "Lead" extrait de l'UI Custom
                const leadData = {
                    chauffage: getSelectedText('chauffage'),
                    surface: getSelectedText('surface'),
                    type_bien: getSelectedText('type_bien'),
                    jardin_dispo: getSelectedText('jardin_dispo'),
                    emetteur: getSelectedText('emetteur'),
                    situation: getSelectedText('situation'),
                    cp: document.getElementById('cp') ? document.getElementById('cp').value : '',
                    prenom: document.getElementById('prenom') ? document.getElementById('prenom').value : '',
                    nom: document.getElementById('nom') ? document.getElementById('nom').value : '',
                    email: document.getElementById('email') ? document.getElementById('email').value : '',
                    phone: document.getElementById('phone') ? document.getElementById('phone').value : ''
                };

                try {
                    // Envoi des données vers le Backend Node.js
                    const response = await fetch('/api/leads', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(leadData)
                    });
                    
                    const result = await response.json();
                    
                    if(!response.ok) {
                        alert("Erreur: " + (result.error || "Une erreur inconnue est survenue."));
                        throw new Error(result.error);
                    }
                    
                    // Succès du Backend! On passe à la page de confirmation
                    moveToTarget(currentSection, currentSection.getAttribute('data-target') || 'confirmation_projet');
                    
                } catch(err) {
                    console.error("Échec de la soumission au backend:", err);
                    // Rétablir le bouton en cas d'échec
                    btnSubmit.innerText = originalText;
                    btnSubmit.style.opacity = '1';
                    btnSubmit.style.pointerEvents = 'auto';
                    return; // Ne pas avancer d'étape
                }
                return;
            }

            // Mouvement Classique entre les étapes si ce n'est pas le bouton d'envoi Backend
            let targetId = currentSection.getAttribute('data-target');
            if (this.getAttribute('data-target')) targetId = this.getAttribute('data-target');
            
            if (targetId) moveToTarget(currentSection, targetId);
        });
    });

    function moveToTarget(currentSection, targetId) {
        const targetSection = document.getElementById(targetId);
        if(!targetSection) return;

        // Hide current, show next
        currentSection.style.display = 'none';
        targetSection.style.display = 'block';

        // Update Progress Bar
        const progress = targetSection.getAttribute('data-progress');
        if (progress && progressBar) {
            progressBar.style.width = progress + '%';
        }
        
        // Simuler le chargement artificiel de la "Simulation"
        if (targetId === 'calcul_loading') {
            setTimeout(() => {
                const loadingSec = document.getElementById('calcul_loading');
                if (loadingSec) {
                    moveToTarget(loadingSec, 'analyse');
                }
            }, 2000); // 2 secondes de chargement
        }

        // Simuler le chargement artificiel "Analyse" s'il y a lieu
        if (targetId === 'analyse') {
            setTimeout(() => {
                const analyseCards = document.querySelectorAll('.analyse-card');
                analyseCards.forEach(c => c.style.borderColor = "#10B981");
                const nextBtn = document.querySelector('#analyse .next');
                if(nextBtn) {
                    nextBtn.classList.remove('disabled');
                    nextBtn.style.pointerEvents = 'auto';
                    nextBtn.style.opacity = '1';
                }
            }, 1500);
        }
        
        // Mettre à jour l'entête "Étapes"
        const stepIndicators = document.querySelectorAll('.steps .step');
        if(stepIndicators.length === 3) {
            if (progress < 60) {
                stepIndicators[0].classList.add('selected');
                stepIndicators[1].classList.remove('selected');
                stepIndicators[2].classList.remove('selected');
            } else if (progress >= 60 && progress < 90) {
                stepIndicators[0].classList.remove('selected');
                stepIndicators[1].classList.add('selected');
                stepIndicators[2].classList.remove('selected');
            } else {
                stepIndicators[1].classList.remove('selected');
                stepIndicators[2].classList.add('selected');
            }
        }
    }
});

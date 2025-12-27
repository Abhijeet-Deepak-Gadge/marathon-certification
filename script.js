// Certificate generation script with enhanced error handling and UX
let participants = [];
let dataLoaded = false;

// DOM Elements
const bibInput = document.getElementById('bibInput');
const searchBtn = document.getElementById('searchBtn');
const resultsContainer = document.getElementById('resultsContainer');
const loadingSpinner = document.getElementById('loadingSpinner');

// Search on button click
searchBtn.addEventListener('click', performCertificateSearch);

// Search on Enter key
bibInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') performCertificateSearch();
});

async function performCertificateSearch() {
    const bibNumber = bibInput.value.trim().toUpperCase();
    
    if (!bibNumber) {
        showMessage('Please enter a Bib Number to search', 'warning');
        return;
    }

    if (!dataLoaded) {
        showMessage('Participant data is still loading. Please wait a moment and try again.', 'warning');
        return;
    }

    showLoading();
    
    try {
        // Simulate processing time for better UX
        await new Promise(resolve => setTimeout(resolve, 800));
        
        const participant = participants.find(p => p.bib === bibNumber);
        
        if (!participant) {
            hideLoading();
            showMessage(`No participant found with Bib Number "${bibNumber}". Please verify your Bib Number and try again.`, 'error');
            return;
        }
        
        // Generate certificate
        await generateCertificate(participant);
        
    } catch (error) {
        hideLoading();
        console.error('Certificate generation error:', error);
        showMessage('An error occurred while generating your certificate. Please try again or contact support.', 'error');
    }
}

async function generateCertificate(participant) {
    try {
        const canvas = document.getElementById('certificateCanvas');
        const ctx = canvas.getContext('2d');
        
        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Try to load background image
        let backgroundLoaded = false;
        
        const bgImage = new Image();
        bgImage.crossOrigin = 'anonymous';
        
        bgImage.onload = () => {
            backgroundLoaded = true;
            drawCertificate(ctx, canvas, bgImage, participant);
        };
        
        bgImage.onerror = () => {
            // If background image fails, use a default background
            console.warn('Background image not found, using default background');
            drawCertificate(ctx, canvas, null, participant);
        };
        
        // Try to load the background image
        bgImage.src = 'certificate-bg.png';
        
        // Fallback if image doesn't load within 3 seconds
        setTimeout(() => {
            if (!backgroundLoaded) {
                drawCertificate(ctx, canvas, null, participant);
            }
        }, 3000);
        
    } catch (error) {
        hideLoading();
        console.error('Certificate generation error:', error);
        showMessage('Failed to generate certificate. Please try again.', 'error');
    }
}

function drawCertificate(ctx, canvas, bgImage, participant) {
    try {
        // Draw background if available
        if (bgImage) {
            ctx.drawImage(bgImage, 0, 0, canvas.width, canvas.height);
        } else {
            // Default background
            const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
            gradient.addColorStop(0, '#f8fafc');
            gradient.addColorStop(1, '#e2e8f0');
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            // Add border
            ctx.strokeStyle = '#0d9488';
            ctx.lineWidth = 8;
            ctx.strokeRect(20, 20, canvas.width - 40, canvas.height - 40);
        }
        
        // Set text properties
        ctx.textAlign = 'center';
        ctx.fillStyle = '#1f2937';
        
        // Draw participant name
        drawAutoSizedText(
            ctx,
            participant.name,
            canvas.width / 2,
            465,
            300,
            36
        );
        
        // Download the certificate
        downloadCertificate(canvas, participant.bib);
        
        hideLoading();
        showMessage('Certificate downloaded successfully!', 'success');
        
    } catch (error) {
        hideLoading();
        console.error('Drawing certificate error:', error);
        showMessage('Failed to create certificate. Please try again.', 'error');
    }
}

function drawAutoSizedText(ctx, text, x, y, maxWidth, maxFontSize) {
    let fontSize = maxFontSize;
    ctx.font = `bold ${fontSize}px Inter, sans-serif`;
    
    while (ctx.measureText(text).width > maxWidth && fontSize > 16) {
        fontSize -= 2;
        ctx.font = `bold ${fontSize}px Inter, sans-serif`;
    }
    
    ctx.fillText(text, x, y);
}

function downloadCertificate(canvas, bibNumber) {
    try {
        const link = document.createElement('a');
        link.download = `Sadri-Marathon-2025-Certificate-Bib-${bibNumber}.png`;
        link.href = canvas.toDataURL('image/png', 1.0);
        
        // Trigger download
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // Clean up
        URL.revokeObjectURL(link.href);
        
    } catch (error) {
        console.error('Download error:', error);
        throw new Error('Failed to download certificate');
    }
}

function showMessage(message, type) {
    clearResults();
    const messageDiv = document.createElement('div');
    messageDiv.className = 'fade-in';
    
    let bgColor, borderColor, textColor, icon;
    
    if (type === 'error') {
        bgColor = 'bg-red-50';
        borderColor = 'border-red-200';
        textColor = 'text-red-800';
        icon = `<svg class="w-5 h-5 text-red-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"/>
        </svg>`;
    } else if (type === 'success') {
        bgColor = 'bg-green-50';
        borderColor = 'border-green-200';
        textColor = 'text-green-800';
        icon = `<svg class="w-5 h-5 text-green-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
        </svg>`;
    } else {
        bgColor = 'bg-yellow-50';
        borderColor = 'border-yellow-200';
        textColor = 'text-yellow-800';
        icon = `<svg class="w-5 h-5 text-yellow-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/>
        </svg>`;
    }
    
    messageDiv.innerHTML = `
        <div class="bg-white rounded-lg shadow-sm border-2 ${borderColor} p-4 sm:p-5">
            <div class="flex items-start gap-3">
                ${icon}
                <p class="text-xs sm:text-sm font-medium ${textColor}">${message}</p>
            </div>
        </div>
    `;
    
    resultsContainer.appendChild(messageDiv);
}

function showLoading() {
    clearResults();
    searchBtn.disabled = true;
    loadingSpinner.classList.remove('hidden');
    bibInput.disabled = true;
}

function hideLoading() {
    searchBtn.disabled = false;
    loadingSpinner.classList.add('hidden');
    bibInput.disabled = false;
}

function clearResults() {
    resultsContainer.innerHTML = '';
}

// Load participants from external JSON
async function loadParticipants() {
    try {
        const response = await fetch('participants.json');
        if (response.ok) {
            const data = await response.json();
            participants = data;
            dataLoaded = true;
            console.log(`✅ Loaded ${participants.length} participants from participants.json`);
        } else {
            console.warn('⚠️ participants.json not found or invalid. Using empty data.');
            dataLoaded = true;
        }
    } catch (error) {
        console.log('⚠️ participants.json not found. Using empty data. Add participants.json for production.');
        console.log('📝 Expected format: [{"name":"John Doe","bib":"001","category":"5K"}]');
        dataLoaded = true;
    }
}

// Initialize
loadParticipants();
bibInput.focus();
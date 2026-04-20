const WAITLIST_DB_ID = '3a097193-f517-4b67-8637-4865cb77df88';
const CALENDAR_DB_ID = '584f8caf-b772-412a-b350-e23d7aed6ecd';
const APPOINTMENT_DB_ID = '0c6a9ad3-5897-4bc3-9604-61a980a4c16a';
const ENGAGEMENT_DB_ID = '2476e026-99e5-4db3-9604-61a980a4c16a';

document.addEventListener('DOMContentLoaded', () => {
    loadUpcomingAlbums();
    populateBookingSelector();
    
    // Waitlist Form
    const waitlistForm = document.getElementById('waitlist-form');
    if (waitlistForm) {
        waitlistForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            submitForm(WAITLIST_DB_ID, {
                email: document.getElementById('email').value,
                signup_date: new Date().toISOString().split('T')[0]
            }, 'form-msg', 'TRANSMISSION RECEIVED. WE WILL REACH OUT.');
        });
    }

    // Appointment Form
    const appointmentForm = document.getElementById('appointment-form');
    if (appointmentForm) {
        appointmentForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const select = document.getElementById('booking-date');
            const selectedOption = select.options[select.selectedIndex];
            
            submitForm(APPOINTMENT_DB_ID, {
                name: document.getElementById('book-name').value,
                email: document.getElementById('book-email').value,
                date: select.value,
                album_title: selectedOption.getAttribute('data-album'),
                guests: parseInt(document.getElementById('book-guests').value),
                request_date: new Date().toISOString().split('T')[0]
            }, 'book-msg', 'RITUAL REQUESTED. CHECK YOUR INBOX FOR VERIFICATION.');
        });
    }

    // Suggestion Form
    const suggestionForm = document.getElementById('suggestion-form');
    if (suggestionForm) {
        suggestionForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            submitForm(ENGAGEMENT_DB_ID, {
                email: document.getElementById('suggest-email').value,
                album_suggestion: document.getElementById('suggest-album').value,
                artist_suggestion: document.getElementById('suggest-artist').value,
                reason: document.getElementById('suggest-reason').value,
                request_date: new Date().toISOString().split('T')[0]
            }, 'suggest-msg', 'SUGGESTION LOGGED. THE CURATOR WILL REVIEW THE PRESSING.');
        });
    }
});

async function submitForm(dbId, data, msgId, successMsg) {
    const msg = document.getElementById(msgId);
    msg.textContent = 'COMMUNICATING WITH VAULT...';
    msg.style.color = 'var(--accent-green)';
    
    try {
        const response = await fetch(`https://baget.ai/api/public/databases/${dbId}/rows`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ data })
        });

        if (response.ok) {
            msg.textContent = successMsg;
            // Clear inputs if success
            const form = msg.parentElement.tagName === 'FORM' ? msg.parentElement : msg.closest('form');
            if (form) form.reset();
        } else {
            throw new Error('FAILED');
        }
    } catch (err) {
        msg.textContent = 'CONNECTION INTERRUPTED. PLEASE RETRY.';
        msg.style.color = '#ff4444';
    }
}

async function loadUpcomingAlbums() {
    const calendarList = document.getElementById('calendar-list');
    
    try {
        const response = await fetch(`https://baget.ai/api/public/databases/${CALENDAR_DB_ID}/rows`);
        const data = await response.json();
        
        if (data && data.length > 0) {
            calendarList.innerHTML = '';
            
            // Show all curation for Season One
            data.forEach(row => {
                const date = new Date(row.date);
                const day = date.getDate();
                const month = date.toLocaleString('default', { month: 'short' }).toUpperCase();
                
                const html = `
                    <div class="album-row neo-border shadow">
                        <div class="date-box">
                            <span class="date-day uppercase">${day}</span>
                            <span class="date-month uppercase">${month}</span>
                        </div>
                        <div class="album-info">
                            <h4 class="album-title uppercase">${row.album_title}</h4>
                            <p class="artist-name uppercase">${row.artist} // ${row.release_year}</p>
                        </div>
                        <div class="genre-tag">
                            <span class="badge uppercase" style="margin-bottom:0; color: var(--accent-blue); border-color: var(--accent-blue);">${row.genre}</span>
                        </div>
                        <div class="curator-note">
                            "${row.curator_notes}"
                        </div>
                    </div>
                `;
                calendarList.insertAdjacentHTML('beforeend', html);
            });
        } else {
            calendarList.innerHTML = '<div class="neo-border shadow" style="padding:3rem; text-align:center;">THE VAULT IS CURRENTLY CLOSED FOR CURATION.</div>';
        }
    } catch (err) {
        calendarList.innerHTML = '<div class="neo-border shadow" style="padding:3rem; text-align:center;">VAULT CONNECTION ERROR.</div>';
    }
}

async function populateBookingSelector() {
    const selector = document.getElementById('booking-date');
    if (!selector) return;

    try {
        const response = await fetch(`https://baget.ai/api/public/databases/${CALENDAR_DB_ID}/rows`);
        const data = await response.json();
        
        if (data && data.length > 0) {
            data.forEach(row => {
                const opt = document.createElement('option');
                opt.value = row.date;
                opt.textContent = `${row.date} — ${row.album_title} (${row.artist})`;
                opt.setAttribute('data-album', row.album_title);
                selector.appendChild(opt);
            });
        }
    } catch (err) {
        console.error('Failed to populate selector', err);
    }
}

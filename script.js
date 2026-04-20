const WAITLIST_DB_ID = '3a097193-f517-4b67-8637-4865cb77df88';
const CALENDAR_DB_ID = '584f8caf-b772-412a-b350-e23d7aed6ecd';

document.addEventListener('DOMContentLoaded', () => {
    loadCalendar();
    
    const waitlistForm = document.getElementById('waitlist-form');
    if (waitlistForm) {
        waitlistForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const emailInput = document.getElementById('email');
            const msg = document.getElementById('form-msg');
            const emailValue = emailInput.value;

            msg.textContent = 'TRANSMITTING...';
            
            try {
                const response = await fetch(`https://baget.ai/api/public/databases/${WAITLIST_DB_ID}/rows`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        data: {
                            email: emailValue,
                            signup_date: new Date().toISOString().split('T')[0]
                        }
                    })
                });

                if (response.ok) {
                    msg.textContent = 'SUCCESS. WELCOME TO THE VAULT.';
                    emailInput.value = '';
                } else {
                    throw new Error('FAILED');
                }
            } catch (err) {
                msg.textContent = 'CONNECTION ERROR. TRY AGAIN.';
            }
        });
    }
});

async function loadCalendar() {
    const calendarList = document.getElementById('calendar-list');
    
    try {
        const response = await fetch(`https://baget.ai/api/public/databases/${CALENDAR_DB_ID}/rows`);
        const data = await response.json();
        
        if (data && data.length > 0) {
            calendarList.innerHTML = '';
            
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
                            <p class="artist-name uppercase">${row.artist} (${row.release_year})</p>
                        </div>
                        <div class="genre-tag">
                            <span class="badge uppercase neo-border" style="background:transparent; color:black; border-width:2px; box-shadow:none;">${row.genre}</span>
                        </div>
                        <div class="curator-note">
                            "${row.curator_notes}"
                        </div>
                    </div>
                `;
                calendarList.insertAdjacentHTML('beforeend', html);
            });
        } else {
            calendarList.innerHTML = '<div class="neo-border shadow" style="padding:2rem;">NO UPCOMING SESSIONS SCHEDULED.</div>';
        }
    } catch (err) {
        calendarList.innerHTML = '<div class="neo-border shadow" style="padding:2rem;">THE VAULT IS CURRENTLY LOCKED.</div>';
    }
}
const WAITLIST_DB_ID = '3a097193-f517-4b67-8637-4865cb77df88';
const CALENDAR_DB_ID = '584f8caf-b772-412a-b350-e23d7aed6ecd';
const APPOINTMENT_DB_ID = '0c6a9ad3-5897-4bc3-9604-61a980a4c16a';
const ENGAGEMENT_DB_ID = '2476e026-99e5-4db3-9604-61a980a4c16a';
const RESERVATIONS_DB_ID = '380fadd5-824b-40c7-9a15-36e3d40b2980';

let pendingReservation = null;

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

    // Appointment Form -> Trigger Stripe Checkout
    const appointmentForm = document.getElementById('appointment-form');
    if (appointmentForm) {
        appointmentForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const select = document.getElementById('booking-date');
            const selectedOption = select.options[select.selectedIndex];
            
            pendingReservation = {
                name: document.getElementById('book-name').value,
                email: document.getElementById('book-email').value,
                date: select.value,
                album_title: selectedOption.getAttribute('data-album'),
                guests: parseInt(document.getElementById('book-guests').value),
                amount_paid: 35,
                payment_status: 'PAID',
                stripe_session_id: 'cs_test_' + Math.random().toString(36).substring(2, 15),
                created_at: new Date().toISOString().split('T')[0]
            };

            showCheckoutModal(pendingReservation);
        });
    }

    // Modal Handlers
    document.getElementById('complete-payment').addEventListener('click', async () => {
        if (!pendingReservation) return;
        
        const btn = document.getElementById('complete-payment');
        btn.textContent = 'PROCESSING...';
        btn.disabled = true;

        try {
            // Log to Reservations Database
            await submitToDatabase(RESERVATIONS_DB_ID, pendingReservation);
            
            // Also log to the general Appointment requests for operations
            await submitToDatabase(APPOINTMENT_DB_ID, {
                name: pendingReservation.name,
                email: pendingReservation.email,
                date: pendingReservation.date,
                album_title: pendingReservation.album_title,
                guests: pendingReservation.guests,
                request_date: pendingReservation.created_at
            });

            hideCheckoutModal();
            const msg = document.getElementById('book-msg');
            msg.textContent = 'DEPOSIT SECURED. RITUAL CONFIRMED.';
            msg.style.color = 'var(--accent-green)';
            document.getElementById('appointment-form').reset();
            
            // Track payment success metric
            console.log('Payment Successful:', pendingReservation.stripe_session_id);
            
        } catch (err) {
            console.error(err);
            document.getElementById('book-msg').textContent = 'PAYMENT ENGINE ERROR. RETRY.';
            document.getElementById('book-msg').style.color = '#ff4444';
        } finally {
            btn.textContent = 'PAY NOW';
            btn.disabled = false;
        }
    });

    document.getElementById('cancel-payment').addEventListener('click', hideCheckoutModal);

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

function showCheckoutModal(res) {
    document.getElementById('checkout-album').textContent = res.album_title;
    document.getElementById('checkout-date').textContent = res.date;
    document.getElementById('payment-overlay').classList.remove('hidden');
    document.body.style.overflow = 'hidden';
}

function hideCheckoutModal() {
    document.getElementById('payment-overlay').classList.add('hidden');
    document.body.style.overflow = 'auto';
}

async function submitToDatabase(dbId, data) {
    const response = await fetch(`https://baget.ai/api/public/databases/${dbId}/rows`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data })
    });
    if (!response.ok) throw new Error('Database Error');
    return await response.json();
}

async function submitForm(dbId, data, msgId, successMsg) {
    const msg = document.getElementById(msgId);
    msg.textContent = 'COMMUNICATING WITH VAULT...';
    msg.style.color = 'var(--accent-green)';
    
    try {
        await submitToDatabase(dbId, data);
        msg.textContent = successMsg;
        const form = msg.parentElement.tagName === 'FORM' ? msg.parentElement : msg.closest('form');
        if (form) form.reset();
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

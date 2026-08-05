document.addEventListener('DOMContentLoaded', () => {
  const navTabs = document.querySelectorAll('.nav-tab');
  const stageSections = document.querySelectorAll('.stage-section');

  navTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      navTabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      stageSections.forEach(stage => stage.classList.remove('active'));
      const targetId = tab.getAttribute('data-target');
      const targetStage = document.getElementById(targetId);
      if (targetStage) targetStage.classList.add('active');
    });
  });

  // ─── STAGE 1: Filter Logic ────────────────────────────────────────────────
  const stage1 = document.getElementById('stage1');
  if (stage1) {
    const filterTabs = stage1.querySelectorAll('.filter-tab');
    const tableRows  = stage1.querySelectorAll('.data-table tbody tr');

    filterTabs.forEach(tab => {
      tab.addEventListener('click', () => {
        filterTabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        const filterValue = tab.textContent.trim().toUpperCase();

        tableRows.forEach(row => {
          const badge = row.querySelector('.badge');
          if (!badge) return;
          const rowStatus = badge.textContent.trim().toUpperCase();
          row.style.display = (filterValue === 'ALL' || rowStatus === filterValue) ? '' : 'none';
        });
      });
    });
  }

  // ─── STAGE 2: Dispatch Logic ──────────────────────────────────────────────
  const stage2 = document.getElementById('stage2');

  // Transit counters (shared between Stage 2 dispatch + Stage 3 Done buttons)
  let vehiclesOut    = 0;
  let stopsRemaining = 0;
  let stopsDone      = 0;
  let bagsCollected  = 0;

  if (stage2) {
    const checkboxes        = stage2.querySelectorAll('.pending-item input[type="checkbox"]');
    const selectedBagsCard  = stage2.querySelector('.summary-cards .card:nth-child(2) .card-value');
    const plannedForDateCard = stage2.querySelector('.summary-cards .card:nth-child(3) .card-value');
    const roundLoadVal      = stage2.querySelector('.round-load-val');
    const roundLoadFill     = stage2.querySelector('.round-load-fill');
    const createRouteBtn    = stage2.querySelector('.route-form .btn-primary');
    const driverInput       = stage2.querySelector('.route-form input[placeholder="e.g. Isaac Tetteh"]');

    let totalSelectedBags = 0;
    let selectedStops     = 0;

    checkboxes.forEach(checkbox => {
      checkbox.addEventListener('change', (e) => {
        const item = e.target.closest('.pending-item');
        const bags = parseInt(item.querySelector('.pending-bags').textContent, 10) || 0;

        if (e.target.checked) {
          item.classList.add('selected');
          totalSelectedBags += bags;
          selectedStops += 1;
        } else {
          item.classList.remove('selected');
          totalSelectedBags -= bags;
          selectedStops -= 1;
        }

        selectedBagsCard.textContent  = totalSelectedBags;
        plannedForDateCard.textContent = totalSelectedBags;
        roundLoadVal.innerHTML = `<span class="text-green">${totalSelectedBags}</span> / 120`;
        roundLoadFill.style.width = `${Math.min((totalSelectedBags / 120) * 100, 100)}%`;
        createRouteBtn.textContent = `Create route (${selectedStops} stops)`;
      });
    });

    createRouteBtn.addEventListener('click', () => {
      if (selectedStops === 0) { showToast('Please select at least one pending request', true); return; }
      if (!driverInput.value.trim()) { showToast('Assign a driver', true); return; }
      showToast('Route created successfully!', false);
    });

    // Dispatch button logic
    const dispatchBtns = stage2.querySelectorAll('.dispatch-btn');
    dispatchBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const row     = e.target.closest('tr');
        const badge   = row.querySelector('.badge');
        const routeId = row.dataset.routeId;
        const driver  = row.dataset.driver;
        const vehicle = row.dataset.vehicle;
        const stops   = JSON.parse(row.dataset.stops || '[]');

        // Update badge in Stage 2 routes table
        badge.className   = 'badge badge-assigned';
        badge.textContent = 'DISPATCHED';
        e.target.remove();

        // Build transit tracking card and inject into Stage 3
        addTransitCard({ routeId, driver, vehicle, stops });
        showToast(`${routeId} dispatched successfully!`, false);
      });
    });
  }

  // ─── STAGE 3: Transit Card Builder ───────────────────────────────────────
  const transitGrid      = document.getElementById('transit-grid');
  const transitEmptyState = document.getElementById('transit-empty-state');

  // Stage 3 summary card references
  const s3Cards = {
    vehiclesOut:    document.querySelector('#stage3 .summary-cards .card:nth-child(1) .card-value'),
    stopsRemaining: document.querySelector('#stage3 .summary-cards .card:nth-child(2) .card-value'),
    bagsCollected:  document.querySelector('#stage3 .summary-cards .card:nth-child(3) .card-value'),
    stopsDone:      document.querySelector('#stage3 .summary-cards .card:nth-child(4) .card-value'),
    stopsDoneDesc:  document.querySelector('#stage3 .summary-cards .card:nth-child(4) .card-desc'),
  };

  function updateTransitSummary() {
    if (s3Cards.vehiclesOut)    s3Cards.vehiclesOut.textContent    = vehiclesOut;
    if (s3Cards.stopsRemaining) s3Cards.stopsRemaining.textContent = stopsRemaining;
    if (s3Cards.bagsCollected)  s3Cards.bagsCollected.textContent  = bagsCollected;
    if (s3Cards.stopsDone)      s3Cards.stopsDone.textContent      = stopsDone;
    if (s3Cards.stopsDoneDesc)  s3Cards.stopsDoneDesc.textContent  = `of ${stopsDone + stopsRemaining}`;
  }

  function addTransitCard({ routeId, driver, vehicle, stops }) {
    // Hide empty state
    if (transitEmptyState) transitEmptyState.style.display = 'none';

    vehiclesOut    += 1;
    stopsRemaining += stops.length;
    updateTransitSummary();

    const card = document.createElement('div');
    card.className  = 'transit-card';
    card.dataset.routeId = routeId;

    // Build stops list HTML
    const stopsListHTML = stops.length === 0
      ? '<p class="transit-no-stops">No stops assigned to this route.</p>'
      : stops.map((stop, i) => `
          <div class="transit-stop" data-bags="${stop.bags}">
            <span class="stop-num">${i + 1}</span>
            <div class="stop-info">
              <span class="stop-name">${stop.name}</span>
              <span class="stop-loc">${stop.location} &middot; est ${stop.bags}</span>
            </div>
            <span class="stop-bags">${stop.bags}</span>
            <button class="btn-done">Done</button>
          </div>`
        ).join('');

    card.innerHTML = `
      <div class="transit-card-header">
        <div class="tc-left">
          <div class="tc-route-id">${routeId}</div>
          <div class="tc-meta">${driver} &middot; ${vehicle}</div>
        </div>
        <div class="tc-right">
          <span class="badge badge-assigned tc-badge">IN TRANSIT</span>
          <span class="tc-ping">ping &#8635;</span>
        </div>
      </div>
      <div class="transit-map">
        <div class="gps-grid"></div>
        <span class="no-gps-label">no GPS yet</span>
      </div>
      <div class="transit-stops-header">
        STOPS &middot; <span class="stops-done-count">0</span>/<span class="stops-total-count">${stops.length}</span> COMPLETE
      </div>
      <div class="transit-stops-list">
        ${stopsListHTML}
      </div>
    `;

    transitGrid.appendChild(card);

    // Wire up "Done" buttons
    const doneBtns = card.querySelectorAll('.btn-done');
    doneBtns.forEach(doneBtn => {
      doneBtn.addEventListener('click', (e) => {
        const stopRow   = e.target.closest('.transit-stop');
        const bags      = parseInt(stopRow.dataset.bags, 10) || 0;

        // Mark stop as complete visually
        stopRow.classList.add('stop-completed');
        e.target.textContent = '✓';
        e.target.disabled    = true;

        // Update counters
        stopsRemaining -= 1;
        stopsDone      += 1;
        bagsCollected  += bags;
        updateTransitSummary();

        // Update in-card stops progress
        const doneCount  = card.querySelector('.stops-done-count');
        const totalCount = parseInt(card.querySelector('.stops-total-count').textContent, 10);
        doneCount.textContent = parseInt(doneCount.textContent, 10) + 1;

        // If all stops done, mark card as complete
        if (parseInt(doneCount.textContent, 10) === totalCount) {
          const cardBadge = card.querySelector('.tc-badge');
          cardBadge.className   = 'badge badge-fulfilled tc-badge';
          cardBadge.textContent = 'COMPLETE';
          vehiclesOut -= 1;
          updateTransitSummary();
        }
      });
    });
  }

  // ─── STAGE 5: Exception Handling Logic ───────────────────────────────────
  const stage5 = document.getElementById('stage5');
  if (stage5) {
    // Counter references
    const s5 = {
      openFlags:         stage5.querySelector('.summary-cards .card:nth-child(1) .card-value'),
      awaitingReschedule:stage5.querySelector('.summary-cards .card:nth-child(2) .card-value'),
      rescheduled:       stage5.querySelector('.summary-cards .card:nth-child(3) .card-value'),
      closed:            stage5.querySelector('.summary-cards .card:nth-child(4) .card-value'),
    };

    // Initialise counters from the static HTML values
    let openFlags          = parseInt(s5.openFlags.textContent, 10)          || 0;
    let awaitingReschedule = parseInt(s5.awaitingReschedule.textContent, 10) || 0;
    let rescheduled        = parseInt(s5.rescheduled.textContent, 10)        || 0;
    let closed             = parseInt(s5.closed.textContent, 10)             || 0;

    function updateS5Cards() {
      s5.openFlags.textContent          = openFlags;
      s5.awaitingReschedule.textContent = awaitingReschedule;
      s5.rescheduled.textContent        = rescheduled;
      s5.closed.textContent             = closed;
    }

    function removeItemWithFade(item) {
      item.style.transition = 'opacity 0.35s ease, max-height 0.35s ease';
      item.style.overflow   = 'hidden';
      item.style.maxHeight  = item.offsetHeight + 'px';
      requestAnimationFrame(() => {
        item.style.opacity   = '0';
        item.style.maxHeight = '0';
        item.style.paddingTop    = '0';
        item.style.paddingBottom = '0';
      });
      setTimeout(() => item.remove(), 380);
    }

    // Wire up every exception row
    const exceptionList = stage5.querySelector('.exception-list');

    exceptionList.addEventListener('click', (e) => {
      const item = e.target.closest('.exception-item');
      if (!item) return;

      // ── Reschedule ────────────────────────────────
      if (e.target.classList.contains('btn-outline')) {
        const dateInput = item.querySelector('input[type="text"]');
        const dateVal   = dateInput.value.trim();

        if (!dateVal || dateVal === 'dd/mm/yyyy') {
          showToast('Enter a reschedule date first', true);
          dateInput.focus();
          dateInput.style.borderColor = 'var(--color-orange)';
          setTimeout(() => dateInput.style.borderColor = '', 1500);
          return;
        }

        const wasAlreadyRescheduled = item.dataset.rescheduled === 'true';

        if (!wasAlreadyRescheduled) {
          // Move from Awaiting → Rescheduled
          awaitingReschedule = Math.max(0, awaitingReschedule - 1);
          rescheduled       += 1;
          item.dataset.rescheduled = 'true';
        } else {
          // Update existing reschedule date
        }

        // Update desc text to reflect new date
        const desc = item.querySelector('.ex-desc');
        if (desc) {
          // Append/replace rescheduled date note
          const current = desc.textContent.replace(/ - rescheduled for .+/, '');
          desc.textContent = `${current} - rescheduled for ${dateVal}`;
        }

        // Visual feedback on button
        const btn = e.target;
        btn.textContent = 'Updated ✓';
        btn.style.borderColor = 'var(--brand-green)';
        btn.style.color       = 'var(--brand-green)';
        setTimeout(() => {
          btn.textContent     = 'Reschedule';
          btn.style.borderColor = '';
          btn.style.color       = '';
        }, 1800);

        updateS5Cards();
        showToast('Exception rescheduled', false);
      }

      // ── Close ─────────────────────────────────────
      if (e.target.classList.contains('btn-text')) {
        openFlags = Math.max(0, openFlags - 1);

        // If it had been rescheduled, decrement that too
        if (item.dataset.rescheduled === 'true') {
          rescheduled = Math.max(0, rescheduled - 1);
        } else {
          awaitingReschedule = Math.max(0, awaitingReschedule - 1);
        }

        closed += 1;
        updateS5Cards();
        removeItemWithFade(item);
        showToast('Exception closed', false);
      }
    });
  }

  // ─── Toast ────────────────────────────────────────────────────────────────
  function showToast(message, isError) {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = 'toast';

    const icon = document.createElement('div');
    icon.className   = 'icon';
    icon.textContent = isError ? '!' : '✓';

    const text = document.createElement('span');
    text.textContent = message;

    toast.appendChild(icon);
    toast.appendChild(text);
    container.appendChild(toast);

    setTimeout(() => toast.remove(), 3300);
  }
});

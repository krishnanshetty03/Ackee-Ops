document.addEventListener('DOMContentLoaded', () => {
  const navTabs = document.querySelectorAll('.nav-tab');
  const stageSections = document.querySelectorAll('.stage-section');

  navTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      // Remove active class from all tabs
      navTabs.forEach(t => t.classList.remove('active'));
      // Add active class to clicked tab
      tab.classList.add('active');

      // Hide all stages
      stageSections.forEach(stage => stage.classList.remove('active'));
      
      // Show targeted stage
      const targetId = tab.getAttribute('data-target');
      const targetStage = document.getElementById(targetId);
      if (targetStage) {
        targetStage.classList.add('active');
      }
    });
  });

  // Filter logic for Stage 1 Table
  const stage1 = document.getElementById('stage1');
  if (stage1) {
    const filterTabs = stage1.querySelectorAll('.filter-tab');
    const tableRows = stage1.querySelectorAll('.data-table tbody tr');

    filterTabs.forEach(tab => {
      tab.addEventListener('click', () => {
        // Update active class on tabs
        filterTabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');

        const filterValue = tab.textContent.trim().toUpperCase();

        // Filter table rows
        tableRows.forEach(row => {
          const badge = row.querySelector('.badge');
          if (!badge) return;

          const rowStatus = badge.textContent.trim().toUpperCase();

          if (filterValue === 'ALL' || rowStatus === filterValue) {
            row.style.display = '';
          } else {
            row.style.display = 'none';
          }
        });
      });
    });
  }
  // Stage 2: Dispatch Logic
  const stage2 = document.getElementById('stage2');
  if (stage2) {
    const checkboxes = stage2.querySelectorAll('.pending-item input[type="checkbox"]');
    const selectedBagsCard = stage2.querySelector('.summary-cards .card:nth-child(2) .card-value');
    const plannedForDateCard = stage2.querySelector('.summary-cards .card:nth-child(3) .card-value');
    
    const roundLoadVal = stage2.querySelector('.round-load-val');
    const roundLoadFill = stage2.querySelector('.round-load-fill');
    
    const createRouteBtn = stage2.querySelector('.route-form .btn-primary');
    const driverInput = stage2.querySelector('.route-form input[placeholder="e.g. Isaac Tetteh"]');

    let totalSelectedBags = 0;
    let selectedStops = 0;

    checkboxes.forEach(checkbox => {
      checkbox.addEventListener('change', (e) => {
        const item = e.target.closest('.pending-item');
        
        // Very basic parsing for this specific mock UI
        const bagsText = item.querySelector('.pending-bags').textContent;
        const bags = parseInt(bagsText.replace(' bags', ''), 10) || 0;

        if (e.target.checked) {
          item.classList.add('selected');
          totalSelectedBags += bags;
          selectedStops += 1;
        } else {
          item.classList.remove('selected');
          totalSelectedBags -= bags;
          selectedStops -= 1;
        }

        // Update UI
        selectedBagsCard.textContent = totalSelectedBags;
        plannedForDateCard.textContent = totalSelectedBags;
        
        const percentage = Math.min((totalSelectedBags / 120) * 100, 100);
        
        roundLoadVal.innerHTML = `<span class="text-green">${totalSelectedBags}</span> / 120`;
        roundLoadFill.style.width = `${percentage}%`;

        createRouteBtn.textContent = `Create route (${selectedStops} stops)`;
      });
    });

    createRouteBtn.addEventListener('click', () => {
      if (selectedStops === 0) {
        showToast('! Please select at least one pending request', true);
        return;
      }
      if (!driverInput.value.trim()) {
        showToast('! Assign a driver', true);
        return;
      }
      showToast('Route created successfully!', false);
    });

    // Dispatch button logic
    const dispatchBtns = stage2.querySelectorAll('.routes-section .btn-outline');
    dispatchBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const row = e.target.closest('tr');
        const badge = row.querySelector('.badge');
        
        // Update badge
        badge.className = 'badge badge-assigned';
        badge.textContent = 'DISPATCHED';
        
        // Remove button
        e.target.remove();
        
        showToast('Route dispatched successfully!', false);
      });
    });
  }

  function showToast(message, isError) {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = 'toast';
    
    const icon = document.createElement('div');
    icon.className = 'icon';
    icon.textContent = isError ? '!' : '✓';
    
    const text = document.createElement('span');
    text.textContent = message;

    toast.appendChild(icon);
    toast.appendChild(text);

    container.appendChild(toast);

    // Remove toast after animation ends
    setTimeout(() => {
      toast.remove();
    }, 3300);
  }
});

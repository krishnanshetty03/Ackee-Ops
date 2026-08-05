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
});

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

  // Basic filter tab logic for aesthetics
  const filterTabs = document.querySelectorAll('.filter-tab');
  filterTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const parent = tab.closest('.filter-tabs');
      if (parent) {
        const siblings = parent.querySelectorAll('.filter-tab');
        siblings.forEach(s => s.classList.remove('active'));
        tab.classList.add('active');
      }
    });
  });
});

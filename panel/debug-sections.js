// Debug script to check section states
chrome.storage.local.get('sectionStates', (result) => {
  console.log('Section states in storage:', result.sectionStates);
});

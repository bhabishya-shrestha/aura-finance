// Script to clear deleted items from localStorage
// Run this in the browser console to reset the deletion tracking

console.log("🧹 Clearing deleted items from localStorage...");

try {
  // Clear the deleted items
  localStorage.removeItem("deletedItems");
  console.log("✅ Deleted items cleared from localStorage");

  // Also clear any existing deleted items from the sync service
  if (window.firebaseSync) {
    window.firebaseSync.deletedItems.clear();
    console.log("✅ Deleted items cleared from sync service");
  }

  console.log("🔄 You can now test account deletion without restoration");
  console.log(
    "📝 The new deletion tracking will prevent accounts from reappearing"
  );
} catch (error) {
  console.error("❌ Error clearing deleted items:", error);
}

// Demo IDs for testing - these match the seeded data in server/demo-data.ts
// In production, these would come from authentication context

export async function getDemoIds(): Promise<{ userId: string; parentId: string }> {
  try {
    // Fetch the demo user's data from the backend
    const response = await fetch("/api/demo-ids");
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Failed to fetch demo IDs:", error);
    // Fallback to hardcoded values if API fails
    return {
      userId: "demo-user-id",
      parentId: "demo-parent-id",
    };
  }
}

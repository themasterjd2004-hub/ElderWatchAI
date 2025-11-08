import { storage } from "./storage";

export async function seedDemoData() {
  try {
    // Check if demo user exists
    let demoUser = await storage.getUserByUsername("demo");
    
    if (!demoUser) {
      // Create demo user
      demoUser = await storage.createUser({
        username: "demo",
        password: "demo123",
        name: "John Smith",
        email: "demo@example.com",
        phone: "(555) 234-5678",
      });
      console.log("✅ Demo user created:", demoUser.id);
    }

    // Check if demo parent exists
    const existingParents = await storage.getParentsByUserId(demoUser.id);
    
    if (existingParents.length === 0) {
      // Create demo parent
      const demoParent = await storage.createParent({
        userId: demoUser.id,
        name: "Margaret Wilson",
        age: 76,
        address: "123 Oak Street, Springfield, IL 62701",
        phoneNumber: "(555) 123-4567",
        emergencyContact: "Dr. Sarah Johnson - (555) 987-6543",
        medicalConditions: ["Hypertension", "Arthritis"],
        monitoringMode: "skeletal",
        localOnly: true,
        autoDelete: true,
        hospitalApiEnabled: true,
      });
      console.log("✅ Demo parent created:", demoParent.id);
    }

    console.log("✅ Demo data ready");
    return { userId: demoUser.id, parentId: existingParents[0]?.id || (await storage.getParentsByUserId(demoUser.id))[0].id };
  } catch (error) {
    console.error("❌ Failed to seed demo data:", error);
    throw error;
  }
}

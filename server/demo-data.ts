import { storage } from "./storage";
import { hashPassword } from "./traditionalAuth";

export async function seedDemoData() {
  try {
    // Authorized users configuration
    const authorizedUsers = [
      {
        email: "saakshirai719@gmail.com",
        password: "saakshi@123",
        firstName: "Saakshi",
        lastName: "Rai",
      },
      {
        email: "lakshyajm3@gmail.com",
        password: "lakshya@123",
        firstName: "Lakshya",
        lastName: "JM",
      },
      {
        email: "dhruvkuruvilla@gmail.com",
        password: "dhruv@123",
        firstName: "Dhruv",
        lastName: "Kuruvilla",
      },
      {
        email: "shreyassmysuru@gmail.com",
        password: "shreyas@123",
        firstName: "Shreyas",
        lastName: "S",
      },
    ];

    // Create all authorized users
    let demoUser = null;
    for (const userData of authorizedUsers) {
      let user = await storage.getUserByEmail(userData.email);
      
      if (!user) {
        const hashedPassword = await hashPassword(userData.password);
        user = await storage.createUser({
          email: userData.email,
          password: hashedPassword,
          firstName: userData.firstName,
          lastName: userData.lastName,
          phone: "",
          role: "user",
        });
        console.log(`✅ Authorized user created: ${userData.email}`);
      }
      
      // Use first user as demo user
      if (!demoUser) {
        demoUser = user;
      }
    }

    // Fallback: create demo user if none exist
    if (!demoUser) {
      const hashedPassword = await hashPassword("demo123");
      demoUser = await storage.createUser({
        email: "demo@example.com",
        password: hashedPassword,
        firstName: "Demo",
        lastName: "User",
        phone: "(555) 234-5678",
        role: "user",
      });
      console.log("✅ Demo user created:", demoUser.id);
    }

    // Check if demo parent exists
    const existingParents = await storage.getParentsByUserId(demoUser.id);
    let demoParent;
    
    if (existingParents.length === 0) {
      // Create demo parent
      demoParent = await storage.createParent({
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
    } else {
      demoParent = existingParents[0];
    }

    // Seed hospitals (if none exist)
    const existingHospitals = await storage.getAllHospitals();
    if (existingHospitals.length === 0) {
      const hospitals = [
        {
          name: "Springfield General Hospital",
          address: "456 Medical Plaza, Springfield, IL 62704",
          phone: "(555) 401-2000",
          emergencyPhone: "(555) 401-HELP",
          gpsCoordinates: { lat: 39.7817, lng: -89.6501 },
          specializations: ["Emergency Medicine", "Cardiology", "Trauma Care"],
          availability: "24/7",
          rating: 4.8,
        },
        {
          name: "St. Mary's Medical Center",
          address: "789 Healthcare Ave, Springfield, IL 62702",
          phone: "(555) 555-3000",
          emergencyPhone: "(555) 555-9111",
          gpsCoordinates: { lat: 39.7995, lng: -89.6440 },
          specializations: ["Geriatric Care", "Neurology", "Orthopedics"],
          availability: "24/7",
          rating: 4.5,
        },
        {
          name: "Central Illinois Regional Hospital",
          address: "321 Emergency Blvd, Springfield, IL 62703",
          phone: "(555) 777-4000",
          emergencyPhone: "(555) 777-HELP",
          gpsCoordinates: { lat: 39.7684, lng: -89.6541 },
          specializations: ["Trauma Care", "Critical Care", "Emergency Medicine"],
          availability: "24/7",
          rating: 4.9,
        },
      ];

      for (const hospital of hospitals) {
        await storage.createHospital(hospital);
      }
      console.log("✅ Demo hospitals created");
    }

    // Seed ambulances (if none exist)
    const allHospitals = await storage.getAllHospitals();
    if (allHospitals.length > 0) {
      const existingAmbulances = await storage.getAmbulancesByHospitalId(allHospitals[0].id);
      if (existingAmbulances.length === 0) {
        for (const hospital of allHospitals) {
          // Create 2 ambulances per hospital
          await storage.createAmbulance({
            hospitalId: hospital.id,
            vehicleNumber: `AMB-${hospital.name.substring(0, 3).toUpperCase()}-01`,
            driverName: "John Davis",
            driverPhone: "(555) 100-0001",
            status: "available",
            currentLocation: { ...hospital.gpsCoordinates, timestamp: new Date().toISOString() },
          });
          
          await storage.createAmbulance({
            hospitalId: hospital.id,
            vehicleNumber: `AMB-${hospital.name.substring(0, 3).toUpperCase()}-02`,
            driverName: "Maria Garcia",
            driverPhone: "(555) 100-0002",
            status: "available",
            currentLocation: { ...hospital.gpsCoordinates, timestamp: new Date().toISOString() },
          });
        }
        console.log("✅ Demo ambulances created");
      }
    }

    // Seed initial vitals for demo parent
    const existingVitals = await storage.getLatestVitals(demoParent.id);
    if (!existingVitals) {
      await storage.createVitalsLog({
        parentId: demoParent.id,
        heartRate: 72,
        bloodPressureSystolic: 120,
        bloodPressureDiastolic: 80,
        oxygenSaturation: 98,
        respiratoryRate: 16,
        temperature: 36.8,
        glucoseLevel: 95,
        status: "normal",
      });
      console.log("✅ Demo vitals created");
    }

    console.log("✅ Demo data ready");
    return { userId: demoUser.id, parentId: demoParent.id };
  } catch (error) {
    console.error("❌ Failed to seed demo data:", error);
    throw error;
  }
}

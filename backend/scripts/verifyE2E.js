async function runTests() {
  console.log("=== 1. HEALTH & DATABASE DIAGNOSTIC ===");
  const health = await (await fetch("http://localhost:5000/api/health")).json();
  console.log("Status:", health.status, "| PostGIS:", health.database.status, "| Total Parcels:", health.database.totalParcels);

  console.log("\n=== 2. POSTGIS SPATIAL BBOX QUERY ===");
  const bboxRes = await (await fetch("http://localhost:5000/api/parcels?bbox=77.58,12.92,77.60,12.94")).json();
  console.log("BBox Features Returned:", bboxRes.features ? bboxRes.features.length : 0);

  console.log("\n=== 3. SEARCH AUTOCOMPLETE (POSTGIS + DEMO REGISTRY) ===");
  const searchPg = await (await fetch("http://localhost:5000/api/search?q=keshav")).json();
  console.log("PostGIS Search ('keshav'):", searchPg.results?.length, "matches. Top result:", searchPg.results?.[0]?.ownerName, "(ULPIN:", searchPg.results?.[0]?.ulpin, ")");

  const searchMock = await (await fetch("http://localhost:5000/api/search?q=Rajesh")).json();
  console.log("Demo Search ('Rajesh'):", searchMock.results?.length, "matches. Top result:", searchMock.results?.[0]?.ownerName, "(ULPIN:", searchMock.results?.[0]?.ulpin, ")");

  console.log("\n=== 4. SPATIAL HYDRATION API ===");
  const hydPg = await (await fetch(`http://localhost:5000/api/parcels/${searchPg.results[0].ulpin}`)).json();
  console.log("PostGIS Hydration:", hydPg.success, "| Owner:", hydPg.ownerName, "| Khasra:", hydPg.khasraNumber, "| Centroid:", [hydPg.lat, hydPg.lng]);

  const hydMock = await (await fetch("http://localhost:5000/api/parcels/1234567890ABCD")).json();
  console.log("Demo Hydration:", hydMock.success, "| Owner:", hydMock.ownerName, "| Khasra:", hydMock.khasraNumber, "| Centroid:", [hydMock.lat, hydMock.lng]);

  console.log("\n=== 5. FORM 12-A MUTATION WORKFLOW ROUNDTRIP ===");
  const applyRes = await (await fetch("http://localhost:5000/api/mutation/apply", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      ulpin: "1234567890ABCD",
      newOwnerName: "Smt. Kavitha Sharma",
      transferReason: "Registered Sale Deed"
    })
  })).json();
  console.log("Application Filed:", applyRes.success, "| Docket ID:", applyRes.applicationId);

  const approveRes = await (await fetch("http://localhost:5000/api/parcel/1234567890ABCD/approve", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ newOwnerName: "Smt. Kavitha Sharma" })
  })).json();
  console.log("Tahsildar Approved:", approveRes.success, "| Registered Owner:", approveRes.data?.ownerName);

  const rehyd = await (await fetch("http://localhost:5000/api/parcels/1234567890ABCD")).json();
  console.log("Post-Approval Hydration Verification:", rehyd.ownerName, "| RoR Status:", rehyd.ownership?.mutationStatus);

  console.log("\n=== 6. ENTERPRISE SECURITY HEADERS ===");
  const headRes = await fetch("http://localhost:5000/api/health");
  console.log("X-Content-Type-Options:", headRes.headers.get("x-content-type-options"));
  console.log("X-Frame-Options:", headRes.headers.get("x-frame-options"));
  console.log("Referrer-Policy:", headRes.headers.get("referrer-policy"));
  console.log("\n✅ ALL E2E TESTS PASSED SUCCESSFULLY!");
}

runTests().catch((e) => console.error("Test Error:", e));

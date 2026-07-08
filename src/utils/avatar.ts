export const getAvatarUrl = (gender: string, outfit: string) => {
  // Parse outfit string (format: "index_colorId", default: "0_blue")
  let avatarIndex = 0;
  let colorId = "blue";
  
  if (outfit && outfit.includes("_")) {
    const parts = outfit.split("_");
    avatarIndex = parseInt(parts[0], 10) || 0;
    colorId = parts[1] || "blue";
  } else {
    // Legacy support
    if (outfit === "hoodie_pink") { avatarIndex = 0; colorId = "pink"; }
    else if (outfit === "hoodie_dark") { avatarIndex = 0; colorId = "dark"; }
    else { avatarIndex = 0; colorId = "blue"; }
  }
  
  const boysSeeds = [
    "Oliver", "Jake", "Harry", "Charlie", "Thomas", 
    "Jack", "James", "William", "Leo", "Jacob", 
    "Ethan", "Noah", "Daniel", "Arthur", "Oscar"
  ];
  const girlsSeeds = [
    "Lily", "Sophia", "Jessica", "Olivia", "Isabella", 
    "Mia", "Amelia", "Chloe", "Ruby", "Ava", 
    "Evie", "Grace", "Freya", "Ella", "Sophie"
  ];
  
  const isFemale = (gender || "male").toLowerCase() === "female" || (gender || "male").toLowerCase() === "girl";
  const seeds = isFemale ? girlsSeeds : boysSeeds;
  const seed = seeds[avatarIndex % seeds.length];
  
  const colors: Record<string, string> = {
    blue: "3b82f6",
    pink: "ec4899",
    green: "10b981",
    yellow: "f59e0b",
    dark: "374151"
  };
  const colorHex = colors[colorId] || "3b82f6";
  
  return `https://api.dicebear.com/7.x/adventurer/svg?seed=${seed}&backgroundColor=${colorHex}&radius=15`;
};

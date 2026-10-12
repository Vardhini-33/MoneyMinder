const categories = [
  "Food", "Travel", "Shopping", "Bills", "Entertainment", "Health", "Education",
  "Investment", "Salary", "Rent", "Insurance", "Grocery", "Transportation",
  "Utilities", "Miscellaneous", "Emergency Fund", "Vacation"
];

const keywordFallback = (description = "") => {
  const d = description.toLowerCase();
  if (d.includes("zomato") || d.includes("swiggy") || d.includes("restaurant") || d.includes("food")) return "Food";
  if (d.includes("uber") || d.includes("ola") || d.includes("flight") || d.includes("train") || d.includes("bus")) return "Travel";
  if (d.includes("rent") || d.includes("flat") || d.includes("lease")) return "Rent";
  if (d.includes("amazon") || d.includes("flipkart") || d.includes("mall") || d.includes("store")) return "Shopping";
  if (d.includes("electricity") || d.includes("wifi") || d.includes("bill") || d.includes("water")) return "Bills";
  if (d.includes("insurance") || d.includes("policy")) return "Insurance";
  if (d.includes("netflix") || d.includes("spotify") || d.includes("prime") || d.includes("subscription")) return "Miscellaneous";
  if (d.includes("school") || d.includes("college") || d.includes("course") || d.includes("tuition")) return "Education";
  if (d.includes("salary") || d.includes("payroll")) return "Salary";
  if (d.includes("stock") || d.includes("crypto") || d.includes("mutual")) return "Investment";
  if (d.includes("doctor") || d.includes("hospital") || d.includes("clinic") || d.includes("medicine")) return "Health";
  return "Miscellaneous";
};

export async function predictCategory(description = "") {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return keywordFallback(description);

  try {
    const prompt = `Categorize this financial transaction into exactly one category from:
${categories.join(", ")}
Return only the category name.
Description: "${description}"`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.2, maxOutputTokens: 20 },
        }),
      }
    );

    if (!response.ok) throw new Error(`Gemini API returned ${response.status}`);

    const data = await response.json();
    const category = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();

    return categories.includes(category) ? category : keywordFallback(description);
  } catch (err) {
    console.warn("Gemini categorization failed:", err.message);
    return keywordFallback(description);
  }
}

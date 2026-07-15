/**
 * Company vocabulary — where a problem was asked (nullable, many per problem).
 * Fixed-but-extensible like patterns/genre: pick from these, or type a new one
 * that joins the list. Stored as a string[] on the problem row.
 */
export const COMPANIES = [
  "Google", "Amazon", "Meta", "Microsoft", "Apple", "Netflix", "Adobe",
  "Uber", "Airbnb", "LinkedIn", "Salesforce", "Oracle", "Nvidia", "Tesla",
  "Bloomberg", "Goldman Sachs", "JPMorgan", "Morgan Stanley", "Atlassian",
  "Stripe", "Databricks", "Snowflake", "Palantir", "Coinbase", "Dropbox",
  "Twitter", "Snap", "Pinterest", "Spotify", "PayPal", "Visa", "Walmart",
  "Flipkart", "Zomato", "Swiggy", "Paytm", "Razorpay", "Ola", "Jio",
  "TCS", "Infosys", "Wipro", "Accenture", "Cognizant", "Samsung", "Intel",
  "Qualcomm", "Cisco", "VMware", "ServiceNow", "Zoho", "Freshworks",
  "DE Shaw", "Tower Research", "Jane Street", "Two Sigma", "Citadel",
] as const;

export type Company = (typeof COMPANIES)[number];

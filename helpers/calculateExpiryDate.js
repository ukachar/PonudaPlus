export function calculateExpiryDate(daysValid) {
  const today = new Date();
  today.setDate(today.getDate() + daysValid); // dodajemo broj dana iz parametra
  const dd = String(today.getDate()).padStart(2, "0");
  const mm = String(today.getMonth() + 1).padStart(2, "0"); // mjeseci od 0
  const yyyy = today.getFullYear();
  return `${dd}.${mm}.${yyyy}.`;
}

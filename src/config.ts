// Corporate website configurations
// Placeholders are intentionally left blank. 
// Provide values to activate these features in production.

export const CONFIG = {
  WEBSITE_URL: "https://cascade-technologies-solutions.github.io/Nestora",
  WHATSAPP_PHONE: "", // e.g. "+919902676457"
  WHATSAPP_COMMUNITY_URL: "", // e.g. "https://chat.whatsapp.com/..."
  CONTACT_EMAIL: "", // e.g. "info@nestora.com"
  CONTACT_PHONE: "", // e.g. "+91 99026 76457"
  OFFICE_ADDRESS: "", // e.g. "Nestora Ave, Sri Sai Properties, Vidya Nagar, Hubli 580001"
};

// Helper utility to check if WhatsApp is configured
export const isWhatsAppEnabled = () => {
  return typeof CONFIG.WHATSAPP_PHONE === "string" && CONFIG.WHATSAPP_PHONE.trim().length > 0;
};

// Helper utility to get WhatsApp direct link
export const getWhatsAppLink = (message: string = "Hello, I am interested in your services.") => {
  if (!isWhatsAppEnabled()) return "";
  const phone = CONFIG.WHATSAPP_PHONE.replace(/[^0-9+]/g, ""); // clean number
  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
};

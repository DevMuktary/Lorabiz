export const NIGERIA_DATA = [
  { state: "Abia", lgas: ["Aba North", "Aba South", "Arochukwu", "Bende", "Ikwuano", "Isiala Ngwa North", "Isiala Ngwa South", "Isuikwuato", "Obi Ngwa", "Ohafia", "Osisioma", "Ugwunagbo", "Ukwa East", "Ukwa West", "Umuahia North", "Umuahia South", "Umunneochi"] },
  { state: "FCT", lgas: ["Abaji", "Bwari", "Gwagwalada", "Kuje", "Kwali", "Municipal Area Council"] },
  { state: "Kaduna", lgas: ["Birnin Gwari", "Chikun", "Giwa", "Igabi", "Ikara", "Jaba", "Jema'a", "Kachia", "Kaduna North", "Kaduna South", "Kagarko", "Kajuru", "Kaura", "Kauru", "Kubau", "Kudan", "Lere", "Makarfi", "Sabon Gari", "Sanga", "Soba", "Zangon Kataf", "Zaria"] },
  { state: "Lagos", lgas: ["Agege", "Ajeromi-Ifelodun", "Alimosho", "Amuwo-Odofin", "Apapa", "Badagry", "Epe", "Eti Osa", "Ibeju-Lekki", "Ifako-Ijaiye", "Ikeja", "Ikorodu", "Kosofe", "Lagos Island", "Lagos Mainland", "Mushin", "Ojo", "Oshodi-Isolo", "Shomolu", "Surulere"] },
  { state: "Oyo", lgas: ["Afijio", "Akinyele", "Atiba", "Atisbo", "Egbeda", "Ibadan North", "Ibadan North-East", "Ibadan North-West", "Ibadan South-East", "Ibadan South-West", "Ibarapa Central", "Ibarapa East", "Ibarapa North", "Ido", "Irepo", "Iseyin", "Itesiwaju", "Iwajowa", "Kajola", "Lagelu", "Ogbomosho North", "Ogbomosho South", "Ogo Oluwa", "Olorunsogo", "Oluyole", "Ona Ara", "Orelope", "Ori Ire", "Oyo East", "Oyo West", "Saki East", "Saki West", "Surulere"] },
  // ADD ALL OTHER STATES HERE...
];

export type CompanyInfo = {
  email: string; state: string; city: string; streetNo: string; address: string; commencementDate: string;
};

export type DocumentTypes = {
  nin: string | null; passport: string | null; signature: string | null;
};

export type Proprietor = {
  id: string; surname: string; firstName: string; otherName: string; email: string; phone: string; 
  gender: string; dob: string; state: string; lga: string; city: string; streetNo: string; serviceAddress: string;
  documents: DocumentTypes;
};

// --- LIVE VALIDATION HELPERS ---
export const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
export const isValidPhone = (phone: string) => phone.replace(/\D/g,'').length >= 10;
export const calculateAge = (dob: string) => {
  if (!dob) return 0;
  const diff = Date.now() - new Date(dob).getTime();
  return Math.abs(new Date(diff).getUTCFullYear() - 1970);
};

export const defaultPropForm: Proprietor = {
  id: "", surname: "", firstName: "", otherName: "", email: "", phone: "", gender: "", 
  dob: "", state: "", lga: "", city: "", streetNo: "", serviceAddress: "", 
  documents: { nin: null, passport: null, signature: null }
};

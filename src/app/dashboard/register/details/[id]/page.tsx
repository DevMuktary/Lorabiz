"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { 
  Buildings, Users, FileImage, CheckCircle, CaretDown, Check,
  Trash, ArrowRight, ArrowLeft, CircleNotch, WarningCircle, Plus, CloudCheck, Pencil, CloudArrowUp, XCircle, Info, handleFinalSubmit
} from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FileUpload } from "@/components/FileUpload";

// --- NIGERIA DATA ---
const NIGERIA_DATA = [
  { state: "Abia", lgas: ["Aba North", "Aba South", "Arochukwu", "Bende", "Ikwuano", "Isiala Ngwa North", "Isiala Ngwa South", "Isuikwuato", "Obi Ngwa", "Ohafia", "Osisioma", "Ugwunagbo", "Ukwa East", "Ukwa West", "Umuahia North", "Umuahia South", "Umunneochi"] },
  { state: "Adamawa", lgas: ["Demsa", "Fufure", "Ganye", "Gayuk", "Gombi", "Grie", "Hong", "Jada", "Lamurde", "Madagali", "Maiha", "Mayo Belwa", "Michika", "Mubi North", "Mubi South", "Numan", "Shelleng", "Song", "Toungo", "Yola North", "Yola South"] },
  { state: "Akwa Ibom", lgas: ["Abak", "Eastern Obolo", "Eket", "Esit Eket", "Essien Udim", "Etim Ekpo", "Etinan", "Ibeno", "Ibesikpo Asutan", "Ibiono-Ibom", "Ika", "Ikono", "Ikot Abasi", "Ikot Ekpene", "Ini", "Itu", "Mbo", "Mkpat-Enin", "Nsit-Atai", "Nsit-Ibom", "Nsit-Ubium", "Obot Akara", "Okobo", "Onna", "Oron", "Oruk Anam", "Udung-Uko", "Ukanafun", "Uruan", "Urue-Offong/Oruko", "Uyo"] },
  { state: "Anambra", lgas: ["Aguata", "Anambra East", "Anambra West", "Anaocha", "Awka North", "Awka South", "Ayamelum", "Dunukofia", "Ekwusigo", "Idemili North", "Idemili South", "Ihiala", "Njikoka", "Nnewi North", "Nnewi South", "Ogbaru", "Onitsha North", "Onitsha South", "Orumba North", "Orumba South", "Oyi"] },
  { state: "Bauchi", lgas: ["Alkaleri", "Bauchi", "Bogoro", "Damban", "Darazo", "Dass", "Gamawa", "Ganjuwa", "Giade", "Itas/Gadau", "Jama'are", "Katagum", "Kirfi", "Misau", "Ningi", "Shira", "Tafawa Balero", "Toro", "Warji", "Zaki"] },
  { state: "Bayelsa", lgas: ["Brass", "Ekeremor", "Kolokuma/Opokuma", "Nembe", "Ogbia", "Sagbama", "Southern Ijaw", "Yenagoa"] },
  { state: "Benue", lgas: ["Agatu", "Apa", "Ado", "Buruku", "Gboko", "Guma", "Gwer East", "Gwer West", "Katsina-Ala", "Konshisha", "Kwande", "Logo", "Makurdi", "Obi", "Ogbadibo", "Ohimini", "Oju", "Okpokwu", "Otukpo", "Tarka", "Ukum", "Ushongo", "Vandeikya"] },
  { state: "Borno", lgas: ["Abadam", "Askira/Uba", "Bama", "Bayo", "Biu", "Chibok", "Damboa", "Dikwa", "Gubio", "Guzamala", "Gwoza", "Hawul", "Jere", "Kaga", "Kala/Balge", "Konduga", "Kukawa", "Kwaya Kusar", "Mafa", "Magumeri", "Maiduguri", "Marte", "Mobbar", "Monguno", "Ngala", "Nganzai", "Shani"] },
  { state: "Cross River", lgas: ["Abi", "Akamkpa", "Akpabuyo", "Bakassi", "Bekwarra", "Biase", "Boki", "Calabar Municipal", "Calabar South", "Etung", "Ikom", "Obanliku", "Obubra", "Obudu", "Odukpani", "Ogoja", "Yakuur", "Yala"] },
  { state: "Delta", lgas: ["Aniocha North", "Aniocha South", "Bomadi", "Burutu", "Ethiope East", "Ethiope West", "Ika North East", "Ika South", "Isoko North", "Isoko South", "Ndokwa East", "Ndokwa West", "Okpe", "Oshimili North", "Oshimili South", "Patani", "Sapele", "Udu", "Ughelli North", "Ughelli South", "Ukwuani", "Uvwie", "Warri North", "Warri South", "Warri South West"] },
  { state: "Ebonyi", lgas: ["Abakaliki", "Afikpo North", "Afikpo South", "Ebonyi", "Ezza North", "Ezza South", "Ikwo", "Ishielu", "Ivo", "Izzi", "Ohaozara", "Ohaukwu", "Onicha"] },
  { state: "Edo", lgas: ["Akoko-Edo", "Egor", "Esan Central", "Esan North-East", "Esan South-East", "Esan West", "Etsako Central", "Etsako East", "Etsako West", "Igueben", "Ikpoba Okha", "Orhionmwon", "Oredo", "Ovia North-East", "Ovia South-West", "Owan East", "Owan West", "Uhunmwonde"] },
  { state: "Ekiti", lgas: ["Ado Ekiti", "Efon", "Ekiti East", "Ekiti South-West", "Ekiti West", "Emure", "Gbonyin", "Ido Osi", "Ijero", "Ikere", "Ikole", "Ilejemeje", "Irepodun/Ifelodun", "Ise/Orun", "Moba", "Oye"] },
  { state: "Enugu", lgas: ["Aninri", "Awgu", "Enugu East", "Enugu North", "Enugu South", "Ezeagu", "Igbo Etiti", "Igbo Eze North", "Igbo Eze South", "Isi Uzo", "Nkanu East", "Nkanu West", "Nsukka", "Oji River", "Udenu", "Udi", "Uzo Uwani"] },
  { state: "FCT", lgas: ["Abaji", "Bwari", "Gwagwalada", "Kuje", "Kwali", "Municipal Area Council"] },
  { state: "Gombe", lgas: ["Akko", "Balanga", "Billiri", "Dukku", "Funakaye", "Gombe", "Kaltungo", "Kwami", "Nafada", "Shongom", "Yamaltu/Deba"] },
  { state: "Imo", lgas: ["Aboh Mbaise", "Ahiazu Mbaise", "Ehime Mbano", "Ezinihitte", "Ideato North", "Ideato South", "Ihitte/Uboma", "Ikeduru", "Isiala Mbano", "Isu", "Mbaitoli", "Ngor Okpala", "Njaba", "Nkwerre", "Nwangele", "Obowo", "Oguta", "Ohaji/Egbema", "Okigwe", "Orlu", "Orsu", "Oru East", "Oru West", "Owerri Municipal", "Owerri North", "Owerri West", "Unuimo"] },
  { state: "Jigawa", lgas: ["Auyo", "Babura", "Biriniwa", "Birnin Kudu", "Buji", "Dutse", "Gagarawa", "Garki", "Gumel", "Guri", "Gwaram", "Gwiwa", "Hadejia", "Jahun", "Kafin Hausa", "Kaugama", "Kazaure", "Kiri Kasama", "Kiyawa", "Kaugama", "Maigatari", "Malam Madori", "Miga", "Ringim", "Roni", "Sule Tankarkar", "Taura", "Yankwashi"] },
  { state: "Kaduna", lgas: ["Birnin Gwari", "Chikun", "Giwa", "Igabi", "Ikara", "Jaba", "Jema'a", "Kachia", "Kaduna North", "Kaduna South", "Kagarko", "Kajuru", "Kaura", "Kauru", "Kubau", "Kudan", "Lere", "Makarfi", "Sabon Gari", "Sanga", "Soba", "Zangon Kataf", "Zaria"] },
  { state: "Kano", lgas: ["Ajingi", "Albasu", "Bagwai", "Bebeji", "Bichi", "Bunkure", "Dala", "Dambatta", "Dawakin Kudu", "Dawakin Tofa", "Doguwa", "Fagge", "Gabasawa", "Garko", "Garun Mallam", "Gaya", "Gezawa", "Gwale", "Gwarzo", "Kabo", "Kano Municipal", "Karaye", "Kibiya", "Kiru", "Kumbotso", "Kunchi", "Kura", "Madobi", "Makoda", "Minjibir", "Nasarawa", "Rano", "Rimin Gado", "Rogo", "Shanono", "Sumaila", "Takai", "Tarauni", "Tofa", "Tsanyawa", "Tudun Wada", "Ungogo", "Warawa", "Wudil"] },
  { state: "Katsina", lgas: ["Bakori", "Batagarawa", "Batsari", "Baure", "Bindawa", "Charanchi", "Dandume", "Danja", "Dan Musa", "Daura", "Dutsi", "Dutsin Ma", "Faskari", "Funtua", "Ingawa", "Jibia", "Kafur", "Kaita", "Kankara", "Kankia", "Katsina", "Kurfi", "Kusada", "Mai'Adua", "Malumfashi", "Mani", "Mashi", "Matazu", "Musawa", "Rimi", "Sabuwa", "Safana", "Sandamu", "Zango"] },
  { state: "Kebbi", lgas: ["Aleiro", "Arewa Dandi", "Argungu", "Augie", "Bagudo", "Birnin Kebbi", "Bunza", "Dandi", "Fakai", "Gwandu", "Jega", "Kalgo", "Koko/Besse", "Maiyama", "Ngaski", "Sakaba", "Shanga", "Suru", "Wasagu/Danko", "Yauri", "Zuru"] },
  { state: "Kogi", lgas: ["Adavi", "Ajaokuta", "Ankpa", "Bassa", "Dekina", "Ibaji", "Idah", "Igalamela Odolu", "Ijumu", "Kabba/Bunu", "Kogi", "Lokoja", "Mopa Muro", "Ofu", "Ogori/Magongo", "Okehi", "Okene", "Olamaboro", "Omala", "Yagba East", "Yagba West"] },
  { state: "Kwara", lgas: ["Asa", "Baruten", "Edu", "Ekiti", "Ifelodun", "Ilorin East", "Ilorin South", "Ilorin West", "Irepodun", "Isin", "Kaiama", "Moro", "Offa", "Oke Ero", "Oyun", "Pategi"] },
  { state: "Lagos", lgas: ["Agege", "Ajeromi-Ifelodun", "Alimosho", "Amuwo-Odofin", "Apapa", "Badagry", "Epe", "Eti Osa", "Ibeju-Lekki", "Ifako-Ijaiye", "Ikeja", "Ikorodu", "Kosofe", "Lagos Island", "Lagos Mainland", "Mushin", "Ojo", "Oshodi-Isolo", "Shomolu", "Surulere"] },
  { state: "Nasarawa", lgas: ["Akwanga", "Awe", "Doma", "Karu", "Keana", "Keffi", "Kokona", "Lafia", "Nasarawa", "Nasarawa Egon", "Obi", "Toto", "Wamba"] },
  { state: "Niger", lgas: ["Agaie", "Agwara", "Bida", "Borgu", "Bosso", "Chanchaga", "Edati", "Gbako", "Gurara", "Katcha", "Kontagora", "Lapai", "Lavun", "Magama", "Mariga", "Mashegu", "Mokwa", "Moya", "Paikoro", "Rafi", "Rijau", "Shiroro", "Suleja", "Tafa", "Wushishi"] },
  { state: "Ogun", lgas: ["Abeokuta North", "Abeokuta South", "Ado-Odo/Ota", "Egbado North", "Egbado South", "Ewekoro", "Ifo", "Ijebu East", "Ijebu North", "Ijebu North East", "Ijebu Ode", "Ikenne", "Imeko Afon", "Ipokia", "Obafemi Owode", "Odeda", "Odogbolu", "Ogun Waterside", "Remo North", "Shagamu"] },
  { state: "Ondo", lgas: ["Akoko North-East", "Akoko North-West", "Akoko South-East", "Akoko South-West", "Akure North", "Akure South", "Ese Odo", "Idanre", "Ifedore", "Ilaje", "Ile Oluji/Okeigbo", "Irele", "Odigbo", "Okitipupa", "Ondo East", "Ondo West", "Ose", "Owo"] },
  { state: "Osun", lgas: ["Aiyedade", "Aiyedire", "Atakunmosa East", "Atakunmosa West", "Boluwaduro", "Boripe", "Ede North", "Ede South", "Egbedore", "Ejigbo", "Ife Central", "Ife East", "Ife North", "Ife South", "Ifedayo", "Ifelodun", "Ila", "Ilesa East", "Ilesa West", "Irepodun", "Irewole", "Isokan", "Iwo", "Obokun", "Odo Otin", "Ola Oluwa", "Olorunda", "Oriade", "Orolu", "Osogbo"] },
  { state: "Oyo", lgas: ["Afijio", "Akinyele", "Atiba", "Atisbo", "Egbeda", "Ibadan North", "Ibadan North-East", "Ibadan North-West", "Ibadan South-East", "Ibadan South-West", "Ibarapa Central", "Ibarapa East", "Ibarapa North", "Ido", "Irepo", "Iseyin", "Itesiwaju", "Iwajowa", "Kajola", "Lagelu", "Ogbomosho North", "Ogbomosho South", "Ogo Oluwa", "Olorunsogo", "Oluyole", "Ona Ara", "Orelope", "Ori Ire", "Oyo East", "Oyo West", "Saki East", "Saki West", "Surulere"] },
  { state: "Plateau", lgas: ["Bokkos", "Barkin Ladi", "Bassa", "Jos East", "Jos North", "Jos South", "Kanam", "Kanke", "Langtang North", "Langtang South", "Mangu", "Mikang", "Pankshin", "Qua'an Pan", "Riyom", "Shendam", "Wase"] },
  { state: "Rivers", lgas: ["Abua/Odual", "Ahoada East", "Ahoada West", "Akuku-Toru", "Andoni", "Asari-Toru", "Bonny", "Degema", "Eleme", "Emuoha", "Etche", "Gokana", "Ikwerre", "Khana", "Obio/Akpor", "Ogba/Egbema/Ndoni", "Ogu/Bolo", "Okrika", "Omuma", "Opobo/Nkoro", "Oyigbo", "Port Harcourt", "Tai"] },
  { state: "Sokoto", lgas: ["Binji", "Bodinga", "Dange Shuni", "Gada", "Goronyo", "Gudu", "Gwadabawa", "Illela", "Isa", "Kebbe", "Kware", "Rabah", "Sabon Birni", "Shagari", "Silame", "Sokoto North", "Sokoto South", "Tambuwal", "Tangaza", "Tureta", "Wamako", "Wurno", "Yabo"] },
  { state: "Taraba", lgas: ["Ardo Kola", "Bali", "Donga", "Gashaka", "Gassol", "Ibi", "Jalingo", "Karim Lamido", "Kumi", "Lau", "Sardauna", "Takum", "Ussa", "Wukari", "Yorro", "Zing"] },
  { state: "Yobe", lgas: ["Bade", "Bursari", "Damaturu", "Fika", "Fune", "Geidam", "Gujba", "Gulani", "Jakusko", "Karasuwa", "Machina", "Nangere", "Nguru", "Potiskum", "Tarmuwa", "Yunusari", "Yusufari"] },
  { state: "Zamfara", lgas: ["Anka", "Bakura", "Birnin Magaji/Kiyaw", "Bukkuyum", "Bungudu", "Gummi", "Gusau", "Kaura Namoda", "Maradun", "Maru", "Shinkafi", "Talata Mafara", "Chafe", "Zurmi"] }
];

// --- CUSTOM SEARCHABLE DROPDOWN ---
function SearchableDropdown({ label, value, onChange, options, placeholder, required }: any) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => { setQuery(value); }, [value]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setQuery(value);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [value]);

  const filteredOptions = options.filter((opt: string) => opt.toLowerCase().includes(query.toLowerCase()));

  return (
    <div className="space-y-2 relative" ref={dropdownRef}>
      <Label className="text-xs font-bold uppercase tracking-widest text-slate-500">{label} {required && <span className="text-red-500">*</span>}</Label>
      <div 
        className={`flex items-center w-full h-12 px-4 border-2 rounded-xl transition-colors cursor-text ${isOpen ? "bg-white border-[#ff3f7a] ring-2 ring-[#ff3f7a]/10" : "bg-slate-50 border-slate-200 hover:border-slate-300"}`}
        onClick={() => setIsOpen(true)}
      >
        <input
          type="text" value={isOpen ? query : value}
          onChange={(e) => { setQuery(e.target.value); setIsOpen(true); if (e.target.value !== value) onChange(""); }}
          onFocus={() => setIsOpen(true)} placeholder={placeholder}
          className="w-full h-full font-bold text-slate-900 outline-none placeholder:text-slate-400 placeholder:font-medium bg-transparent truncate pr-2"
        />
        <CaretDown className={`h-4 w-4 text-slate-400 shrink-0 transition-transform ${isOpen ? "rotate-180" : ""}`} weight="bold" />
      </div>
      
      {isOpen && (
        <div className="absolute z-50 top-[70px] left-0 right-0 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-2">
          <ul className="max-h-60 overflow-y-auto py-2 scrollbar-thin scrollbar-thumb-slate-200">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((opt: string) => (
                <li key={opt} onClick={() => { onChange(opt); setQuery(opt); setIsOpen(false); }} className={`px-4 py-3 cursor-pointer flex items-center justify-between group ${value === opt ? "bg-[#ff3f7a]/10" : "hover:bg-slate-50"}`}>
                  <span className={`text-sm font-bold ${value === opt ? "text-[#ff3f7a]" : "text-slate-900"}`}>{opt}</span>
                  {value === opt && <Check className="h-4 w-4 text-[#ff3f7a]" weight="bold" />}
                </li>
              ))
            ) : <li className="px-4 py-4 text-center text-sm font-medium text-slate-500">No results found.</li>}
          </ul>
        </div>
      )}
    </div>
  );
}

// --- TYPES ---
type DocumentTypes = { nin: string | null; passport: string | null; signature: string | null; };
type Proprietor = { id: string; surname: string; firstName: string; otherName: string; email: string; phone: string; gender: string; dob: string; state: string; lga: string; city: string; streetNo: string; serviceAddress: string; documents: DocumentTypes; };

export default function RegistrationDetailsPage() {
  const params = useParams();
  const id = params?.id as string;
  const router = useRouter();

  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [autoSaveStatus, setAutoSaveStatus] = useState<"IDLE" | "SAVING" | "SAVED" | "ERROR">("IDLE");

  // Custom Toast State
  const [toast, setToast] = useState<{ show: boolean, message: string, type: "error" | "success" }>({ show: false, message: "", type: "error" });

  const showToast = (message: string, type: "error" | "success" = "error") => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast(prev => ({ ...prev, show: false })), 4500);
  };

  const [draft, setDraft] = useState({ proposedName: "LOADING...", ownershipType: "SOLE", specificNature: "LOADING..." });
  const [companyInfo, setCompanyInfo] = useState({ email: "", state: "", city: "", streetNo: "", address: "", commencementDate: "" });
  const [proprietors, setProprietors] = useState<Proprietor[]>([]);
  const [expandedPropId, setExpandedPropId] = useState<string | null>(null);

  const isSoleProprietor = draft.ownershipType === "SOLE";

  // FETCH DRAFT
  useEffect(() => {
    if (!id) return;
    const fetchDraft = async () => {
      try {
        const res = await fetch(`/api/register/details/${id}`);
        const json = await res.json();
        if (json.success) {
          setDraft(json.data);
          if (json.data.companyEmail || json.data.companyState) {
            setCompanyInfo({
              email: json.data.companyEmail || "", state: json.data.companyState || "", city: json.data.companyCity || "", 
              streetNo: json.data.companyStreetNo || "", address: json.data.companyAddress || "", commencementDate: json.data.commencementDate || ""
            });
          }
          if (json.data.proprietors && json.data.proprietors.length > 0) {
            setProprietors(json.data.proprietors.map((p: any) => ({
              ...p, documents: { nin: p.ninUrl || null, passport: p.passportUrl || null, signature: p.signatureUrl || null }
            })));
          } else {
            // Auto-add first empty proprietor block
            const initialId = Date.now().toString();
            setProprietors([{ id: initialId, surname: "", firstName: "", otherName: "", email: "", phone: "", gender: "", dob: "", state: "", lga: "", city: "", streetNo: "", serviceAddress: "", documents: { nin: null, passport: null, signature: null } }]);
            setExpandedPropId(initialId);
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchDraft();
  }, [id]);

  // CLOUD AUTO-SAVE (Debounced)
  useEffect(() => {
    if (loading || !draft.proposedName || proprietors.length === 0) return;
    
    setAutoSaveStatus("SAVING");
    const timer = setTimeout(async () => {
      try {
        await fetch(`/api/register/details/${id}`, {
          method: "PUT", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ companyInfo, proprietors })
        });
        setAutoSaveStatus("SAVED");
      } catch (e) {
        setAutoSaveStatus("ERROR");
      }
    }, 1500);

    return () => clearTimeout(timer);
  }, [companyInfo, proprietors, id, loading]);

  // PROPRIETOR LOGIC
  const handleUpdateProprietor = (propId: string, field: keyof Proprietor, value: any) => {
    setProprietors(prev => prev.map(p => p.id === propId ? { ...p, [field]: value } : p));
  };

  const handleUpdateDoc = (propId: string, docType: keyof DocumentTypes, url: string | null) => {
    setProprietors(prev => prev.map(p => p.id === propId ? { ...p, documents: { ...p.documents, [docType]: url } } : p));
  };

  const addNewProprietor = () => {
    const newId = Date.now().toString();
    setProprietors(prev => [...prev, { id: newId, surname: "", firstName: "", otherName: "", email: "", phone: "", gender: "", dob: "", state: "", lga: "", city: "", streetNo: "", serviceAddress: "", documents: { nin: null, passport: null, signature: null } }]);
    setExpandedPropId(newId);
  };

  const removeProprietor = (propId: string) => {
    setProprietors(prev => prev.filter(p => p.id !== propId));
  };

  // VALIDATION & AGE CALCULATOR
  const calculateAge = (dobString: string) => {
    const birthDate = new Date(dobString);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;
    return age;
  };

  const validateStep = () => {
    if (currentStep === 1) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!companyInfo.email || !emailRegex.test(companyInfo.email)) return showToast("Please provide a valid Company Email.");
      if (!companyInfo.state) return showToast("Company State of Residence is required.");
      if (!companyInfo.address) return showToast("Company Street Address is required.");
      if (!companyInfo.commencementDate) return showToast("Commencement Date is required.");
    }

    if (currentStep === 2) {
      if (isSoleProprietor && proprietors.length > 1) return showToast("Sole Proprietorships can only have 1 proprietor.");
      if (!isSoleProprietor && proprietors.length < 2) return showToast("Partnerships require at least 2 proprietors.");

      let adultCount = 0;
      let hasMinor = false;
      let minorName = "";

      for (let i = 0; i < proprietors.length; i++) {
        const p = proprietors[i];
        if (!p.surname || !p.firstName || !p.phone || !p.gender || !p.dob || !p.state || !p.lga || !p.serviceAddress) {
          setExpandedPropId(p.id);
          return showToast(`Please fill all required (*) fields for ${p.firstName || `Proprietor ${i+1}`}.`);
        }
        if (p.phone.length < 10) {
          setExpandedPropId(p.id);
          return showToast("Please enter a valid 10 or 11 digit phone number.");
        }
        
        const age = calculateAge(p.dob);
        if (age >= 18) adultCount++;
        else {
          hasMinor = true;
          minorName = `${p.firstName} ${p.surname}`;
        }
      }

      if (isSoleProprietor && hasMinor) return showToast("A Sole Proprietor must be at least 18 years old.");
      if (!isSoleProprietor && hasMinor && adultCount < 2) return showToast(`${minorName} is under 18. CAC requires at least two (2) adult partners (18+) before a minor can be added.`);
      
      setExpandedPropId(null); // Collapse all on success
    }

    if (currentStep === 3) {
      for (const p of proprietors) {
        if (!p.documents.nin || !p.documents.passport || !p.documents.signature) {
          return showToast(`Please upload all 3 required documents for ${p.firstName} ${p.surname}.`);
        }
      }
    }

    setCurrentStep(prev => prev + 1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><CircleNotch className="animate-spin h-10 w-10 text-[#ff3f7a]" /></div>;
  }

  return (
    <div className="max-w-4xl mx-auto pb-24 pt-8 px-4 font-sans selection:bg-[#ff3f7a] selection:text-white relative">
      
      {/* --- CUSTOM TOAST NOTIFICATION --- */}
      <div className={`fixed top-6 left-1/2 -translate-x-1/2 z-[100] transition-all duration-300 ${toast.show ? 'translate-y-0 opacity-100' : '-translate-y-10 opacity-0 pointer-events-none'}`}>
        <div className={`flex items-center gap-3 px-6 py-4 rounded-2xl shadow-2xl font-bold text-sm border-2 ${toast.type === 'error' ? 'bg-red-50 text-red-700 border-red-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'}`}>
          {toast.type === 'error' ? <XCircle className="h-6 w-6" weight="fill" /> : <CheckCircle className="h-6 w-6" weight="fill" />}
          {toast.message}
        </div>
      </div>

      {/* Header & Auto-save */}
      <div className="mb-8 pt-2 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/register/business-name" className="p-2 bg-white rounded-xl border border-slate-200 text-slate-500 hover:text-slate-900 shadow-sm transition-colors">
            <ArrowLeft className="h-5 w-5" weight="bold" />
          </Link>
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Proprietor Details</h1>
            <p className="text-sm font-medium text-slate-500">Step {currentStep} of 4</p>
          </div>
        </div>
        
        {/* Auto-save Indicator */}
        <div className="hidden sm:flex items-center gap-2 text-xs font-bold px-3 py-1.5 rounded-full bg-slate-100 text-slate-500 border border-slate-200">
          {autoSaveStatus === "SAVING" && <><CloudArrowUp className="h-4 w-4 animate-bounce text-[#ff3f7a]" weight="fill" /> Saving to cloud...</>}
          {autoSaveStatus === "SAVED" && <><CloudCheck className="h-4 w-4 text-emerald-500" weight="fill" /> Saved to draft</>}
          {autoSaveStatus === "ERROR" && <><WarningCircle className="h-4 w-4 text-red-500" weight="fill" /> Save failed</>}
          {autoSaveStatus === "IDLE" && <><CloudCheck className="h-4 w-4 text-slate-400" weight="fill" /> Up to date</>}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-slate-200 h-2 rounded-full mb-8 overflow-hidden">
        <div className="bg-[#ff3f7a] h-full rounded-full transition-all duration-500 ease-out" style={{ width: `${(currentStep / 4) * 100}%` }}></div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden mb-20">
        
        {/* ========================================== */}
        {/* STEP 1: COMPANY INFO                       */}
        {/* ========================================== */}
        {currentStep === 1 && (
          <div className="p-6 sm:p-8 animate-in fade-in slide-in-from-right-4 duration-300">
            <h2 className="text-2xl font-black text-slate-900 mb-6 border-b pb-4">Company Information</h2>
            
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase tracking-widest text-slate-500">Business Name (Locked)</Label>
                  <div className="h-12 flex items-center px-4 bg-slate-50 border border-slate-200 rounded-xl font-bold uppercase text-slate-700 select-none">{draft.proposedName}</div>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase tracking-widest text-slate-500">Nature of Business (Locked)</Label>
                  <div className="h-12 flex items-center px-4 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-700 select-none">{draft.specificNature}</div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase tracking-widest text-slate-500">Company Email <span className="text-red-500">*</span></Label>
                  <Input type="email" placeholder="contact@company.com" value={companyInfo.email} onChange={e => setCompanyInfo({...companyInfo, email: e.target.value})} className="h-12 bg-white focus-visible:ring-[#ff3f7a] border-2" />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase tracking-widest text-slate-500">Commencement Date <span className="text-red-500">*</span></Label>
                  <Input type="date" value={companyInfo.commencementDate} onChange={e => setCompanyInfo({...companyInfo, commencementDate: e.target.value})} className="h-12 bg-white focus-visible:ring-[#ff3f7a] border-2" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <SearchableDropdown label="State of Residence" required placeholder="Search state..." value={companyInfo.state} options={NIGERIA_DATA.map(s => s.state)} onChange={(val: string) => setCompanyInfo({...companyInfo, state: val})} />
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase tracking-widest text-slate-500">City</Label>
                  <Input value={companyInfo.city} onChange={e => setCompanyInfo({...companyInfo, city: e.target.value})} className="h-12 bg-white focus-visible:ring-[#ff3f7a] border-2" />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase tracking-widest text-slate-500">Street Number</Label>
                  <Input value={companyInfo.streetNo} onChange={e => setCompanyInfo({...companyInfo, streetNo: e.target.value})} className="h-12 bg-white focus-visible:ring-[#ff3f7a] border-2" />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-widest text-slate-500">Company Street Address <span className="text-red-500">*</span></Label>
                <Input value={companyInfo.address} onChange={e => setCompanyInfo({...companyInfo, address: e.target.value})} className="h-12 bg-white focus-visible:ring-[#ff3f7a] border-2" />
              </div>
            </div>
          </div>
        )}

        {/* ========================================== */}
        {/* STEP 2: PROPRIETOR INFO                    */}
        {/* ========================================== */}
        {currentStep === 2 && (
          <div className="p-6 sm:p-8 animate-in fade-in slide-in-from-right-4 duration-300 bg-slate-50/30">
            <h2 className="text-2xl font-black text-slate-900 mb-6 border-b pb-4">Proprietor Information</h2>
            
            {proprietors.map((prop, index) => {
              const isExpanded = expandedPropId === prop.id;
              const title = prop.firstName ? `${prop.firstName} ${prop.surname}` : `Proprietor ${index + 1}`;
              const availableLgas = NIGERIA_DATA.find(s => s.state === prop.state)?.lgas || [];

              return (
                <div key={prop.id} className={`mb-4 border-2 rounded-2xl bg-white overflow-hidden transition-all duration-300 ${isExpanded ? 'border-[#ff3f7a] shadow-md' : 'border-slate-200'}`}>
                  
                  {/* Accordion Header */}
                  <div 
                    onClick={() => setExpandedPropId(isExpanded ? null : prop.id)}
                    className={`flex justify-between items-center p-5 cursor-pointer transition-colors ${isExpanded ? 'bg-[#ff3f7a]/5' : 'hover:bg-slate-50'}`}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`h-10 w-10 rounded-full flex items-center justify-center font-black ${isExpanded ? 'bg-[#ff3f7a] text-white' : 'bg-slate-100 text-slate-500'}`}>{index + 1}</div>
                      <div>
                        <h3 className="font-bold text-slate-900 text-lg">{title}</h3>
                        <p className="text-xs font-medium text-slate-400">Click to {isExpanded ? 'collapse' : 'expand'} details</p>
                      </div>
                    </div>
                    <div className="flex gap-2 items-center">
                      {!isSoleProprietor && index > 0 && !isExpanded && (
                        <button onClick={(e) => { e.stopPropagation(); removeProprietor(prop.id); }} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"><Trash weight="bold"/></button>
                      )}
                      <CaretDown className={`h-5 w-5 text-slate-400 transition-transform duration-300 ${isExpanded ? 'rotate-180 text-[#ff3f7a]' : ''}`} weight="bold" />
                    </div>
                  </div>

                  {/* Accordion Body */}
                  <div className={`grid transition-all duration-300 ease-in-out ${isExpanded ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
                    <div className="overflow-hidden">
                      <div className="p-6 border-t border-slate-100 space-y-6">
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                          <div className="space-y-2"><Label className="text-xs font-bold uppercase text-slate-500">Surname <span className="text-red-500">*</span></Label><Input value={prop.surname} onChange={e => handleUpdateProprietor(prop.id, 'surname', e.target.value)} className="h-12 border-2 focus-visible:ring-[#ff3f7a]" /></div>
                          <div className="space-y-2"><Label className="text-xs font-bold uppercase text-slate-500">First Name <span className="text-red-500">*</span></Label><Input value={prop.firstName} onChange={e => handleUpdateProprietor(prop.id, 'firstName', e.target.value)} className="h-12 border-2 focus-visible:ring-[#ff3f7a]" /></div>
                          <div className="space-y-2"><Label className="text-xs font-bold uppercase text-slate-500">Other Name</Label><Input value={prop.otherName} onChange={e => handleUpdateProprietor(prop.id, 'otherName', e.target.value)} className="h-12 border-2 focus-visible:ring-[#ff3f7a]" /></div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                          <div className="space-y-2"><Label className="text-xs font-bold uppercase text-slate-500">Email Address <span className="text-red-500">*</span></Label><Input type="email" value={prop.email} onChange={e => handleUpdateProprietor(prop.id, 'email', e.target.value)} className="h-12 border-2 focus-visible:ring-[#ff3f7a]" /></div>
                          
                          {/* Custom Phone Input UI */}
                          <div className="space-y-2">
                            <Label className="text-xs font-bold uppercase text-slate-500">Phone Number <span className="text-red-500">*</span></Label>
                            <div className="flex">
                              <div className="flex items-center justify-center bg-slate-100 border-2 border-r-0 border-slate-200 px-3 rounded-l-xl text-sm font-bold text-slate-600 select-none">
                                🇳🇬 +234
                              </div>
                              <Input type="tel" placeholder="801 234 5678" value={prop.phone} onChange={e => handleUpdateProprietor(prop.id, 'phone', e.target.value)} className="h-12 border-2 rounded-l-none focus-visible:ring-[#ff3f7a]" />
                            </div>
                          </div>

                          <div className="space-y-2">
                            <Label className="text-xs font-bold uppercase text-slate-500">Gender <span className="text-red-500">*</span></Label>
                            <select value={prop.gender} onChange={e => handleUpdateProprietor(prop.id, 'gender', e.target.value)} className="flex h-12 w-full rounded-xl border-2 border-slate-200 bg-white px-4 text-sm font-bold text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff3f7a]">
                              <option value="">-- Select --</option>
                              <option value="MALE">MALE</option>
                              <option value="FEMALE">FEMALE</option>
                            </select>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                          <SearchableDropdown label="State" required placeholder="Search state..." value={prop.state} options={NIGERIA_DATA.map(s => s.state)} onChange={(val: string) => handleUpdateProprietor(prop.id, 'state', val)} />
                          <SearchableDropdown label="L.G.A" required placeholder="Search LGA..." value={prop.lga} options={availableLgas} disabled={!prop.state} onChange={(val: string) => handleUpdateProprietor(prop.id, 'lga', val)} />
                          <div className="space-y-2"><Label className="text-xs font-bold uppercase text-slate-500">Date of Birth <span className="text-red-500">*</span></Label><Input type="date" value={prop.dob} onChange={e => handleUpdateProprietor(prop.id, 'dob', e.target.value)} className="h-12 border-2 focus-visible:ring-[#ff3f7a] font-bold" /></div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-[1fr_1fr_2fr] gap-5">
                          <div className="space-y-2"><Label className="text-xs font-bold uppercase text-slate-500">City</Label><Input value={prop.city} onChange={e => handleUpdateProprietor(prop.id, 'city', e.target.value)} className="h-12 border-2 focus-visible:ring-[#ff3f7a]" /></div>
                          <div className="space-y-2"><Label className="text-xs font-bold uppercase text-slate-500">Street No.</Label><Input value={prop.streetNo} onChange={e => handleUpdateProprietor(prop.id, 'streetNo', e.target.value)} className="h-12 border-2 focus-visible:ring-[#ff3f7a]" /></div>
                          <div className="space-y-2"><Label className="text-xs font-bold uppercase text-slate-500">Service Address <span className="text-red-500">*</span></Label><Input value={prop.serviceAddress} onChange={e => handleUpdateProprietor(prop.id, 'serviceAddress', e.target.value)} className="h-12 border-2 focus-visible:ring-[#ff3f7a]" /></div>
                        </div>

                      </div>
                    </div>
                  </div>
                </div>
              );
            })}

            {!isSoleProprietor && (
              <button onClick={addNewProprietor} className="w-full h-14 border-2 border-dashed border-slate-300 rounded-2xl flex items-center justify-center gap-2 text-slate-500 font-bold hover:border-[#ff3f7a] hover:text-[#ff3f7a] hover:bg-[#ff3f7a]/5 transition-colors mt-2">
                <Plus className="h-5 w-5" weight="bold" /> Add Another Partner
              </button>
            )}
          </div>
        )}

        {/* ========================================== */}
        {/* STEP 3: DOCUMENTS UPLOADS                  */}
        {/* ========================================== */}
        {currentStep === 3 && (
          <div className="p-6 sm:p-8 animate-in fade-in slide-in-from-right-4 duration-300 bg-slate-50/30">
            <div className="mb-8 border-b pb-4">
              <h2 className="text-2xl font-black text-slate-900 mb-2">Required Documents</h2>
              <div className="flex items-center gap-2 text-amber-700 bg-amber-50 px-4 py-3 rounded-xl text-sm font-medium border border-amber-200">
                <Info className="h-5 w-5 shrink-0" weight="fill" />
                Upload valid IDs and signatures for each proprietor. Max size: 4MB (JPEG/PNG).
              </div>
            </div>
            
            <div className="space-y-8">
              {proprietors.map((p, idx) => (
                <div key={p.id} className="bg-white border-2 border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                  <div className="bg-slate-50 border-b border-slate-100 px-6 py-4 flex items-center gap-3">
                    <div className="h-8 w-8 bg-[#ff3f7a]/10 text-[#ff3f7a] rounded-full flex items-center justify-center font-bold">{idx + 1}</div>
                    <h3 className="font-bold text-slate-900 text-lg">Documents for {p.firstName || "Proprietor"}</h3>
                  </div>
                  
                  <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
                    <FileUpload 
                      label="NIN Card/Slip"
                      value={p.documents.nin}
                      onUploadSuccess={(url) => handleUpdateDoc(p.id, "nin", url)}
                      onRemove={() => handleUpdateDoc(p.id, "nin", null)}
                    />
                    <FileUpload 
                      label="Passport Photo"
                      description="Clear face on white background"
                      value={p.documents.passport}
                      onUploadSuccess={(url) => handleUpdateDoc(p.id, "passport", url)}
                      onRemove={() => handleUpdateDoc(p.id, "passport", null)}
                    />
                    <FileUpload 
                      label="Signature"
                      description="Signed on plain white paper"
                      value={p.documents.signature}
                      onUploadSuccess={(url) => handleUpdateDoc(p.id, "signature", url)}
                      onRemove={() => handleUpdateDoc(p.id, "signature", null)}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ========================================== */}
        {/* STEP 4: PREVIEW                            */}
        {/* ========================================== */}
        {currentStep === 4 && (
          <div className="p-6 sm:p-8 animate-in fade-in slide-in-from-right-4 duration-300">
            <h2 className="text-2xl font-black text-slate-900 mb-6 border-b pb-4">Preview & Submit</h2>
            
            <div className="space-y-8">
              {/* Preview Company */}
              <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200">
                <div className="flex justify-between items-center mb-4 border-b border-slate-200 pb-2">
                  <h3 className="font-black text-lg text-slate-800 uppercase tracking-widest">Company Details</h3>
                  <button onClick={() => setCurrentStep(1)} className="text-[#ff3f7a] font-bold text-sm flex items-center gap-1 hover:underline"><Pencil className="h-4 w-4"/> Edit</button>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-y-6 gap-x-4 text-sm bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                  <div className="col-span-2"><p className="text-slate-400 font-medium text-xs uppercase tracking-widest mb-1">Business Name</p><p className="font-bold text-slate-900">{draft.proposedName}</p></div>
                  <div className="col-span-2"><p className="text-slate-400 font-medium text-xs uppercase tracking-widest mb-1">Nature</p><p className="font-bold text-slate-900">{draft.specificNature}</p></div>
                  <div><p className="text-slate-400 font-medium text-xs uppercase tracking-widest mb-1">Email</p><p className="font-bold text-slate-900 truncate">{companyInfo.email}</p></div>
                  <div><p className="text-slate-400 font-medium text-xs uppercase tracking-widest mb-1">State</p><p className="font-bold text-slate-900">{companyInfo.state}</p></div>
                  <div className="col-span-2"><p className="text-slate-400 font-medium text-xs uppercase tracking-widest mb-1">Address</p><p className="font-bold text-slate-900">{companyInfo.address}</p></div>
                </div>
              </div>

              {/* Preview Proprietors */}
              <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200">
                <div className="flex justify-between items-center mb-4 border-b border-slate-200 pb-2">
                  <h3 className="font-black text-lg text-slate-800 uppercase tracking-widest">Proprietors ({proprietors.length})</h3>
                  <button onClick={() => setCurrentStep(2)} className="text-[#ff3f7a] font-bold text-sm flex items-center gap-1 hover:underline"><Pencil className="h-4 w-4"/> Edit</button>
                </div>
                {proprietors.map((p, idx) => (
                  <div key={p.id} className="bg-white p-5 rounded-xl border border-slate-200 mb-4 shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-1 h-full bg-[#ff3f7a]"></div>
                    <p className="font-black text-slate-900 mb-4 text-lg">{idx + 1}. {p.surname} {p.firstName} {p.otherName}</p>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-y-4 gap-x-4 text-sm">
                      <div><p className="text-slate-400 font-medium text-xs uppercase tracking-widest mb-1">Phone</p><p className="font-bold text-slate-700">{p.phone}</p></div>
                      <div><p className="text-slate-400 font-medium text-xs uppercase tracking-widest mb-1">Gender</p><p className="font-bold text-slate-700">{p.gender}</p></div>
                      <div><p className="text-slate-400 font-medium text-xs uppercase tracking-widest mb-1">State / LGA</p><p className="font-bold text-slate-700">{p.state} / {p.lga}</p></div>
                      <div>
                        <p className="text-slate-400 font-medium text-xs uppercase tracking-widest mb-1">Documents Uploaded</p>
                        <div className="flex gap-1.5 mt-1">
                          <span className={`px-2 py-0.5 rounded text-[10px] uppercase tracking-widest font-black ${p.documents.nin ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-400 border border-red-100'}`}>NIN</span>
                          <span className={`px-2 py-0.5 rounded text-[10px] uppercase tracking-widest font-black ${p.documents.passport ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-400 border border-red-100'}`}>Photo</span>
                          <span className={`px-2 py-0.5 rounded text-[10px] uppercase tracking-widest font-black ${p.documents.signature ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-400 border border-red-100'}`}>Sign</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* --- GLOBAL BOTTOM NAVIGATION --- */}
        <div className="fixed bottom-0 left-0 lg:left-72 right-0 bg-white border-t border-slate-200 p-4 sm:p-6 flex justify-between items-center z-40 shadow-[0_-10px_40px_rgb(0,0,0,0.05)]">
          <Button variant="outline" onClick={() => setCurrentStep(prev => prev - 1)} disabled={currentStep === 1 || isSubmitting} className="h-12 px-4 sm:px-6 font-bold text-slate-600 rounded-xl hover:bg-slate-100 border-2 transition-colors">
            <ArrowLeft className="sm:mr-2 h-5 w-5" weight="bold" /> <span className="hidden sm:inline">Back</span>
          </Button>

          {currentStep < 4 ? (
             <Button onClick={validateStep} className="h-12 px-6 sm:px-10 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl shadow-lg transition-transform active:scale-95">
               Next Step <ArrowRight className="ml-2 h-5 w-5" weight="bold" />
             </Button>
          ) : (
             <Button onClick={handleFinalSubmit} disabled={isSubmitting} className="h-14 px-8 sm:px-12 bg-[#ff3f7a] hover:bg-[#e02b62] text-white font-black text-lg rounded-xl shadow-xl shadow-[#ff3f7a]/30 transition-all disabled:opacity-70 disabled:cursor-not-allowed">
               {isSubmitting ? <><CircleNotch className="animate-spin h-6 w-6 mr-2" weight="bold" /> Submitting...</> : "Submit to CAC"}
             </Button>
          )}
        </div>

      </div>
    </div>
  );
}

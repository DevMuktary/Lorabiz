"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { 
  Buildings, Users, FileImage, CheckCircle, 
  Trash, Pencil, ArrowRight, ArrowLeft, CircleNotch, WarningCircle, Plus
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

// --- TYPES ---
type CompanyInfo = {
  email: string; state: string; city: string; streetNo: string; address: string; commencementDate: string;
};

type DocumentTypes = {
  nin: string | null;
  passport: string | null;
  signature: string | null;
};

type Proprietor = {
  id: string; surname: string; firstName: string; otherName: string; email: string; phone: string; 
  gender: string; dob: string; state: string; lga: string; city: string; streetNo: string; serviceAddress: string;
  documents: DocumentTypes;
};

export default function RegistrationDetailsPage() {
  const params = useParams();
  const id = params?.id as string;
  const router = useRouter();

  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [draft, setDraft] = useState({ proposedName: "LOADING...", ownershipType: "SOLE", specificNature: "LOADING..." });
  const [companyInfo, setCompanyInfo] = useState<CompanyInfo>({ email: "", state: "", city: "", streetNo: "", address: "", commencementDate: "" });
  
  const [proprietors, setProprietors] = useState<Proprietor[]>([]);
  const [editingPropId, setEditingPropId] = useState<string | null>(null);
  const [propForm, setPropForm] = useState<Proprietor>({
    id: "", surname: "", firstName: "", otherName: "", email: "", phone: "", gender: "", dob: "", state: "", lga: "", city: "", streetNo: "", serviceAddress: "", 
    documents: { nin: null, passport: null, signature: null }
  });

  const [selectedDocProprietor, setSelectedDocProprietor] = useState<string>("");

  const availableLgas = NIGERIA_DATA.find(s => s.state === propForm.state)?.lgas || [];
  const isSoleProprietor = draft.ownershipType === "SOLE";

  // FETCH REAL DRAFT DATA FROM DB ON LOAD
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
              email: json.data.companyEmail || "", 
              state: json.data.companyState || "", 
              city: json.data.companyCity || "", 
              streetNo: json.data.companyStreetNo || "", 
              address: json.data.companyAddress || "", 
              commencementDate: json.data.commencementDate || ""
            });
          }

          if (json.data.proprietors && json.data.proprietors.length > 0) {
            const mapped = json.data.proprietors.map((p: any) => ({
              ...p,
              documents: { 
                nin: p.ninUrl || null, 
                passport: p.passportUrl || null, 
                signature: p.signatureUrl || null 
              }
            }));
            setProprietors(mapped);
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

  // PROPRIETOR MANAGEMENT
  const handleSaveProprietor = () => {
    if (!propForm.surname || !propForm.firstName || !propForm.phone || !propForm.state || !propForm.gender) {
      alert("Please fill all required proprietor fields (Surname, First Name, Phone, State, Gender)."); 
      return;
    }
    
    if (editingPropId) {
      setProprietors(prev => prev.map(p => p.id === editingPropId ? { ...propForm } : p));
      setEditingPropId(null);
    } else {
      setProprietors(prev => [...prev, { ...propForm, id: Date.now().toString() }]);
    }
    
    setPropForm({ 
      id: "", surname: "", firstName: "", otherName: "", email: "", phone: "", gender: "", dob: "", state: "", lga: "", city: "", streetNo: "", serviceAddress: "", 
      documents: { nin: null, passport: null, signature: null } 
    });
  };

  const handleEditProprietor = (prop: Proprietor) => { setPropForm(prop); setEditingPropId(prop.id); };
  const handleRemoveProprietor = (pid: string) => {
    if (selectedDocProprietor === pid) setSelectedDocProprietor("");
    setProprietors(prev => prev.filter(p => p.id !== pid));
  };

  // VALIDATION & PROGRESSION PIPELINE
  const handleNextStep = () => {
    if (currentStep === 1) {
      if (!companyInfo.state || !companyInfo.address) {
        alert("Please provide the Company State and Address to proceed.");
        return;
      }
    }
    
    if (currentStep === 2) {
      if (isSoleProprietor && proprietors.length !== 1) {
        alert("A Sole Proprietorship requires exactly 1 proprietor. Please add your details.");
        return;
      }
      if (!isSoleProprietor && proprietors.length < 2) {
        alert("A Partnership requires at least 2 proprietors. Please add all partners.");
        return;
      }
    }

    if (currentStep === 3) {
      const missingDocs = proprietors.some(p => !p.documents.nin || !p.documents.passport || !p.documents.signature);
      if (missingDocs) {
        alert("Missing Documents! Please ensure NIN, Passport, and Signature are uploaded for ALL proprietors.");
        return;
      }
    }

    setCurrentStep(prev => prev + 1);
  };

  const handleFinalSubmit = async () => {
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/register/details/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ companyInfo, proprietors })
      });
      
      const data = await res.json();
      if (data.success) {
        router.push("/dashboard?success=true");
      } else {
        alert(data.message || "Failed to submit registration.");
        setIsSubmitting(false);
      }
    } catch (error) {
      alert("Network error. Please check your connection.");
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <CircleNotch className="animate-spin h-10 w-10 text-[#ff3f7a]" />
      </div>
    );
  }

  const hideProprietorForm = isSoleProprietor && proprietors.length >= 1 && !editingPropId;

  return (
    <div className="max-w-4xl mx-auto pb-16 pt-8 px-4 font-sans selection:bg-[#ff3f7a] selection:text-white">
      
      {/* --- WIZARD HEADER NAV --- */}
      <div className="mb-10">
        <div className="flex items-center justify-between relative">
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-slate-100 -z-10 rounded-full"></div>
          <div className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-[#ff3f7a] -z-10 rounded-full transition-all duration-500" style={{ width: `${((currentStep - 1) / 3) * 100}%` }}></div>
          {[ 
            { step: 1, title: "Company", icon: Buildings }, 
            { step: 2, title: "Proprietors", icon: Users }, 
            { step: 3, title: "Documents", icon: FileImage }, 
            { step: 4, title: "Preview", icon: CheckCircle }
          ].map((s) => (
            <div key={s.step} className="flex flex-col items-center gap-2">
              <div className={`h-12 w-12 rounded-full flex items-center justify-center font-bold text-lg border-4 transition-colors duration-300 ${currentStep >= s.step ? "bg-[#ff3f7a] border-white text-white shadow-md" : "bg-white border-slate-100 text-slate-400"}`}>
                <s.icon className="h-6 w-6" weight={currentStep >= s.step ? "fill" : "bold"} />
              </div>
              <span className={`text-xs font-bold uppercase tracking-wider hidden sm:block ${currentStep >= s.step ? "text-slate-900" : "text-slate-400"}`}>{s.title}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        
        {/* ========================================== */}
        {/* STEP 1: COMPANY INFO                       */}
        {/* ========================================== */}
        {currentStep === 1 && (
          <div className="p-8 animate-in fade-in slide-in-from-right-4 duration-300">
            <h2 className="text-2xl font-black text-slate-900 mb-6 border-b pb-4">Company Information</h2>
            
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Business Name (Not Editable)</Label>
                  <div className="h-12 flex items-center px-4 bg-slate-100 border border-slate-200 rounded-xl font-bold uppercase text-slate-700">
                    {draft.proposedName}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Nature of Business (Not Editable)</Label>
                  <div className="h-12 flex items-center px-4 bg-slate-100 border border-slate-200 rounded-xl font-bold text-slate-700">
                    {draft.specificNature}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Company Email</Label>
                  <Input type="email" placeholder="contact@company.com" value={companyInfo.email} onChange={e => setCompanyInfo({...companyInfo, email: e.target.value})} className="h-12 bg-slate-50 focus-visible:ring-[#ff3f7a]" />
                </div>
                <div className="space-y-2">
                  <Label>Commencement Date</Label>
                  <Input type="date" value={companyInfo.commencementDate} onChange={e => setCompanyInfo({...companyInfo, commencementDate: e.target.value})} className="h-12 bg-slate-50 focus-visible:ring-[#ff3f7a]" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label>Company State of Residence *</Label>
                  <select value={companyInfo.state} onChange={e => setCompanyInfo({...companyInfo, state: e.target.value})} className="flex h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff3f7a]">
                    <option value="">-- Select State --</option>
                    {NIGERIA_DATA.map(s => <option key={s.state} value={s.state}>{s.state}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>Company City</Label>
                  <Input value={companyInfo.city} onChange={e => setCompanyInfo({...companyInfo, city: e.target.value})} className="h-12 bg-slate-50 focus-visible:ring-[#ff3f7a]" />
                </div>
                <div className="space-y-2">
                  <Label>Company Street Number</Label>
                  <Input value={companyInfo.streetNo} onChange={e => setCompanyInfo({...companyInfo, streetNo: e.target.value})} className="h-12 bg-slate-50 focus-visible:ring-[#ff3f7a]" />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Company Street Address *</Label>
                <Input value={companyInfo.address} onChange={e => setCompanyInfo({...companyInfo, address: e.target.value})} className="h-12 bg-slate-50 focus-visible:ring-[#ff3f7a]" />
              </div>
            </div>
          </div>
        )}

        {/* ========================================== */}
        {/* STEP 2: PROPRIETOR INFO                    */}
        {/* ========================================== */}
        {currentStep === 2 && (
          <div className="p-8 animate-in fade-in slide-in-from-right-4 duration-300">
            <h2 className="text-2xl font-black text-slate-900 mb-6 border-b pb-4">Proprietor Information</h2>
            
            {isSoleProprietor && (
              <div className="bg-blue-50 border border-blue-200 text-blue-800 p-4 rounded-xl mb-6 flex gap-3 text-sm font-medium">
                <WarningCircle className="h-5 w-5 shrink-0" weight="fill" />
                As a Sole Proprietorship, this business requires exactly one (1) proprietor.
              </div>
            )}

            {!isSoleProprietor && (
              <div className="bg-amber-50 border border-amber-200 text-amber-800 p-4 rounded-xl mb-6 flex gap-3 text-sm font-medium">
                <Users className="h-5 w-5 shrink-0" weight="fill" />
                Partnerships require a minimum of two (2) proprietors.
              </div>
            )}

            {proprietors.length > 0 && (
              <div className="mb-8 border border-slate-200 rounded-2xl overflow-hidden shadow-sm overflow-x-auto">
                <table className="w-full text-left text-sm min-w-[500px]">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase">
                    <tr><th className="p-4">Name</th><th className="p-4">Phone</th><th className="p-4">State</th><th className="p-4 text-right">Actions</th></tr>
                  </thead>
                  <tbody>
                    {proprietors.map(prop => (
                      <tr key={prop.id} className="border-b border-slate-100 hover:bg-slate-50">
                        <td className="p-4 font-bold text-slate-900">{prop.surname} {prop.firstName}</td>
                        <td className="p-4 text-slate-600">{prop.phone}</td>
                        <td className="p-4 text-slate-600">{prop.state}</td>
                        <td className="p-4 flex justify-end gap-2">
                          <button onClick={() => handleEditProprietor(prop)} className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg"><Pencil className="h-4 w-4" weight="bold" /></button>
                          <button onClick={() => handleRemoveProprietor(prop.id)} className="p-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg"><Trash className="h-4 w-4" weight="bold" /></button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {!hideProprietorForm && (
              <div className="bg-slate-50/50 border border-slate-200 rounded-2xl p-6 space-y-6">
                <h3 className="font-bold text-slate-900 border-b pb-2 flex items-center gap-2">
                  {editingPropId ? <Pencil weight="bold"/> : <Plus weight="bold"/>} 
                  {editingPropId ? "Edit Proprietor" : "Add New Proprietor"}
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  <div className="space-y-2"><Label>Surname *</Label><Input value={propForm.surname} onChange={e => setPropForm({...propForm, surname: e.target.value})} className="h-12 bg-white" /></div>
                  <div className="space-y-2"><Label>First Name *</Label><Input value={propForm.firstName} onChange={e => setPropForm({...propForm, firstName: e.target.value})} className="h-12 bg-white" /></div>
                  <div className="space-y-2"><Label>Other Name</Label><Input value={propForm.otherName} onChange={e => setPropForm({...propForm, otherName: e.target.value})} className="h-12 bg-white" /></div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  <div className="space-y-2"><Label>Email</Label><Input type="email" value={propForm.email} onChange={e => setPropForm({...propForm, email: e.target.value})} className="h-12 bg-white" /></div>
                  <div className="space-y-2"><Label>Phone Number *</Label><Input type="tel" placeholder="+234..." value={propForm.phone} onChange={e => setPropForm({...propForm, phone: e.target.value})} className="h-12 bg-white" /></div>
                  <div className="space-y-2">
                    <Label>Gender *</Label>
                    <select value={propForm.gender} onChange={e => setPropForm({...propForm, gender: e.target.value})} className="flex h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff3f7a]">
                      <option value="">-- Select Gender --</option>
                      <option value="MALE">MALE</option>
                      <option value="FEMALE">FEMALE</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  <div className="space-y-2">
                    <Label>State *</Label>
                    <select value={propForm.state} onChange={e => setPropForm({...propForm, state: e.target.value, lga: ""})} className="flex h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff3f7a]">
                      <option value="">-- Select State --</option>
                      {NIGERIA_DATA.map(s => <option key={s.state} value={s.state}>{s.state}</option>)}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label>LGA *</Label>
                    <select value={propForm.lga} onChange={e => setPropForm({...propForm, lga: e.target.value})} disabled={!propForm.state} className="flex h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff3f7a]">
                      <option value="">-- Select LGA --</option>
                      {availableLgas.map(lga => <option key={lga} value={lga}>{lga}</option>)}
                    </select>
                  </div>
                  <div className="space-y-2"><Label>Date of Birth *</Label><Input type="date" value={propForm.dob} onChange={e => setPropForm({...propForm, dob: e.target.value})} className="h-12 bg-white" /></div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-[1fr_1fr_2fr] gap-5">
                  <div className="space-y-2"><Label>City</Label><Input value={propForm.city} onChange={e => setPropForm({...propForm, city: e.target.value})} className="h-12 bg-white" /></div>
                  <div className="space-y-2"><Label>Street No.</Label><Input value={propForm.streetNo} onChange={e => setPropForm({...propForm, streetNo: e.target.value})} className="h-12 bg-white" /></div>
                  <div className="space-y-2"><Label>Service Address</Label><Input value={propForm.serviceAddress} onChange={e => setPropForm({...propForm, serviceAddress: e.target.value})} className="h-12 bg-white" /></div>
                </div>

                <div className="flex justify-end pt-4">
                  <Button onClick={handleSaveProprietor} type="button" className="bg-slate-900 hover:bg-slate-800 text-white h-12 px-8 rounded-xl shadow-lg">
                    {editingPropId ? "Update Proprietor" : "Save Proprietor to List"}
                  </Button>
                </div>
              </div>
            )}
            
            {/* Show an explicit button to open form again for Partnerships */}
            {hideProprietorForm && !isSoleProprietor && (
               <Button onClick={() => setEditingPropId(null)} variant="outline" className="w-full mt-4 h-14 border-dashed border-2 hover:bg-slate-50">
                 <Plus className="mr-2" /> Add Another Partner
               </Button>
            )}
          </div>
        )}

        {/* ========================================== */}
        {/* STEP 3: DOCUMENTS UPLOADS                  */}
        {/* ========================================== */}
        {currentStep === 3 && (
          <div className="p-8 animate-in fade-in slide-in-from-right-4 duration-300">
            <h2 className="text-2xl font-black text-slate-900 mb-2 border-b pb-4">Document Uploads</h2>
            <p className="text-slate-500 mb-6 text-sm font-medium">Please upload valid IDs and signatures for each proprietor. Max size: 4MB (JPEG/PNG).</p>
            
            <div className="space-y-8">
              <div className="space-y-2 max-w-md">
                <Label className="font-bold text-slate-900">Select Proprietor to Upload For</Label>
                <select 
                  value={selectedDocProprietor} 
                  onChange={e => setSelectedDocProprietor(e.target.value)} 
                  className="flex h-14 w-full rounded-xl border-2 border-[#ff3f7a]/30 bg-[#ff3f7a]/5 px-4 font-bold text-slate-900 focus-visible:outline-none focus-visible:border-[#ff3f7a]"
                >
                  <option value="" disabled>-- Select a Proprietor --</option>
                  {proprietors.map(p => <option key={p.id} value={p.id}>{p.surname} {p.firstName}</option>)}
                </select>
              </div>

              {selectedDocProprietor ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 border-t border-slate-100">
                  <FileUpload 
                    label="NIN Card/Slip"
                    value={proprietors.find(p => p.id === selectedDocProprietor)?.documents.nin || null}
                    onUploadSuccess={(url) => setProprietors(prev => prev.map(p => p.id === selectedDocProprietor ? { ...p, documents: { ...p.documents, nin: url } } : p))}
                    onRemove={() => setProprietors(prev => prev.map(p => p.id === selectedDocProprietor ? { ...p, documents: { ...p.documents, nin: null } } : p))}
                  />
                  <FileUpload 
                    label="Passport Photograph"
                    value={proprietors.find(p => p.id === selectedDocProprietor)?.documents.passport || null}
                    onUploadSuccess={(url) => setProprietors(prev => prev.map(p => p.id === selectedDocProprietor ? { ...p, documents: { ...p.documents, passport: url } } : p))}
                    onRemove={() => setProprietors(prev => prev.map(p => p.id === selectedDocProprietor ? { ...p, documents: { ...p.documents, passport: null } } : p))}
                  />
                  <FileUpload 
                    label="Signature"
                    description="Signed on plain white paper"
                    value={proprietors.find(p => p.id === selectedDocProprietor)?.documents.signature || null}
                    onUploadSuccess={(url) => setProprietors(prev => prev.map(p => p.id === selectedDocProprietor ? { ...p, documents: { ...p.documents, signature: url } } : p))}
                    onRemove={() => setProprietors(prev => prev.map(p => p.id === selectedDocProprietor ? { ...p, documents: { ...p.documents, signature: null } } : p))}
                  />
                </div>
              ) : (
                <div className="h-48 border-2 border-dashed border-slate-200 rounded-2xl flex items-center justify-center bg-slate-50 text-slate-400 font-bold">
                  Select a proprietor above to reveal upload fields.
                </div>
              )}
            </div>
          </div>
        )}

        {/* ========================================== */}
        {/* STEP 4: PREVIEW & SUBMIT                   */}
        {/* ========================================== */}
        {currentStep === 4 && (
          <div className="p-8 animate-in fade-in slide-in-from-right-4 duration-300">
            <h2 className="text-2xl font-black text-slate-900 mb-6 border-b pb-4">Preview & Submit</h2>
            
            <div className="space-y-8 bg-slate-50 p-6 rounded-2xl border border-slate-100 shadow-inner">
              
              {/* Preview Company */}
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-black text-lg text-slate-800 uppercase tracking-widest">Company Details</h3>
                  <button onClick={() => setCurrentStep(1)} className="text-[#ff3f7a] font-bold text-sm flex items-center gap-1 hover:underline"><Pencil className="h-4 w-4"/> Edit</button>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm bg-white p-4 rounded-xl border border-slate-200">
                  <div className="col-span-2"><p className="text-slate-400 font-medium">Business Name</p><p className="font-bold text-slate-900">{draft.proposedName}</p></div>
                  <div className="col-span-2"><p className="text-slate-400 font-medium">Nature</p><p className="font-bold text-slate-900">{draft.specificNature}</p></div>
                  <div><p className="text-slate-400 font-medium">Email</p><p className="font-bold text-slate-900">{companyInfo.email || "-"}</p></div>
                  <div><p className="text-slate-400 font-medium">State</p><p className="font-bold text-slate-900">{companyInfo.state || "-"}</p></div>
                  <div><p className="text-slate-400 font-medium">Address</p><p className="font-bold text-slate-900">{companyInfo.address || "-"}</p></div>
                  <div><p className="text-slate-400 font-medium">Commencement</p><p className="font-bold text-slate-900">{companyInfo.commencementDate || "-"}</p></div>
                </div>
              </div>

              <div className="border-t border-slate-200"></div>

              {/* Preview Proprietors */}
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-black text-lg text-slate-800 uppercase tracking-widest">Proprietors ({proprietors.length})</h3>
                  <button onClick={() => setCurrentStep(2)} className="text-[#ff3f7a] font-bold text-sm flex items-center gap-1 hover:underline"><Pencil className="h-4 w-4"/> Edit</button>
                </div>
                {proprietors.map((p, idx) => (
                  <div key={p.id} className="bg-white p-4 rounded-xl border border-slate-200 mb-3 shadow-sm">
                    <p className="font-black text-slate-900 mb-3">{idx + 1}. {p.surname} {p.firstName} {p.otherName}</p>
                    <div className="flex flex-wrap gap-x-8 gap-y-4 text-sm">
                      <div><p className="text-slate-400 font-medium">Phone</p><p className="font-bold text-slate-700">{p.phone}</p></div>
                      <div><p className="text-slate-400 font-medium">Gender</p><p className="font-bold text-slate-700">{p.gender}</p></div>
                      <div><p className="text-slate-400 font-medium">State / LGA</p><p className="font-bold text-slate-700">{p.state} / {p.lga}</p></div>
                      <div>
                        <p className="text-slate-400 font-medium">Documents Uploaded</p>
                        <div className="flex gap-2 mt-1">
                          <span className={`px-2 py-0.5 rounded text-xs font-bold ${p.documents.nin ? 'bg-emerald-100 text-emerald-700' : 'bg-red-50 text-red-400'}`}>NIN</span>
                          <span className={`px-2 py-0.5 rounded text-xs font-bold ${p.documents.passport ? 'bg-emerald-100 text-emerald-700' : 'bg-red-50 text-red-400'}`}>Passport</span>
                          <span className={`px-2 py-0.5 rounded text-xs font-bold ${p.documents.signature ? 'bg-emerald-100 text-emerald-700' : 'bg-red-50 text-red-400'}`}>Signature</span>
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
        <div className="bg-slate-50 border-t border-slate-200 p-6 flex justify-between items-center">
          <Button 
            variant="outline" 
            onClick={() => setCurrentStep(prev => prev - 1)}
            disabled={currentStep === 1 || isSubmitting}
            className="h-12 px-6 font-bold text-slate-600 rounded-xl hover:bg-slate-200 transition-colors"
          >
            <ArrowLeft className="mr-2 h-4 w-4" weight="bold" /> Back
          </Button>

          {currentStep < 4 ? (
             <Button 
              onClick={handleNextStep}
              className="h-12 px-8 bg-[#ff3f7a] hover:bg-[#e02b62] text-white font-bold rounded-xl shadow-lg shadow-[#ff3f7a]/30 transition-all"
             >
               Next Step <ArrowRight className="ml-2 h-4 w-4" weight="bold" />
             </Button>
          ) : (
             <Button 
              onClick={handleFinalSubmit}
              disabled={isSubmitting}
              className="h-14 px-10 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-lg rounded-xl shadow-lg shadow-emerald-600/30 transition-all disabled:opacity-70 disabled:cursor-not-allowed"
             >
               {isSubmitting ? (
                 <><CircleNotch className="animate-spin h-6 w-6 mr-2" weight="bold" /> Submitting...</>
               ) : "Submit"}
             </Button>
          )}
        </div>

      </div>
    </div>
  );
}

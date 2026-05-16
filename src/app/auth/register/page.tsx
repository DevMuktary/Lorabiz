"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { 
  User, EnvelopeSimple, Phone, LockKey, Spinner, CheckCircle, ShieldCheck, 
  RocketLaunch, GenderIntersex, MapPin, Buildings, WhatsappLogo, CalendarBlank
} from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

// --- START: FULL NIGERIA STATE & LGA DATA ---
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
// --- END: NIGERIA DATA ---

export default function RegisterPage() {
  const router = useRouter();
  
  // UI States
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [sameAsPhone, setSameAsPhone] = useState(false);
  
  // Form Data States
  const [formData, setFormData] = useState({
    firstName: "",
    middleName: "", // NEW
    lastName: "",
    email: "",
    phone: "",
    whatsapp: "",
    password: "",
    confirmPassword: "",
    gender: "",
    state: "",
    lga: "",
    street: "",
    buildingNo: "",
  });

  // OTP Flow States
  const [otpStep, setOtpStep] = useState<"idle" | "sent" | "verified">("idle");
  const [otpCode, setOtpCode] = useState("");
  const [otpTimer, setOtpTimer] = useState(0);

  const availableLgas = NIGERIA_DATA.find(s => s.state === formData.state)?.lgas || [];

  // Password Strength Calculator
  const getPasswordStrength = () => {
    let score = 0;
    if (!formData.password) return score;
    if (formData.password.length > 7) score += 1;
    if (/[A-Z]/.test(formData.password)) score += 1;
    if (/[0-9]/.test(formData.password)) score += 1;
    if (/[^A-Za-z0-9]/.test(formData.password)) score += 1;
    return score;
  };
  const passScore = getPasswordStrength();

  // Smart Sync: Mirror phone to whatsapp if checkbox is checked
  useEffect(() => {
    if (sameAsPhone) {
      setFormData((prev) => ({ ...prev, whatsapp: prev.phone }));
    }
  }, [formData.phone, sameAsPhone]);

  // Handle Input Changes with Real-time Masking
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    let { id, value } = e.target;
    
    // Strict Input Masking: Prevent non-numeric characters completely as they type
    if (id === "whatsapp" || id === "phone") {
      value = value.replace(/\D/g, ""); 
    }

    setFormData(prev => ({ ...prev, [id]: value }));
    
    if (errors[id]) {
      setErrors(prev => ({ ...prev, [id]: "" }));
    }
  };

  // Clear terms error on check
  useEffect(() => {
    if (termsAccepted && errors.terms) {
      setErrors(prev => ({ ...prev, terms: "" }));
    }
  }, [termsAccepted, errors.terms]);

  // OTP Timer Logic
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (otpTimer > 0 && otpStep === "sent") {
      interval = setInterval(() => {
        setOtpTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [otpTimer, otpStep]);

  // Real API Call for OTP
  const handleSendOTP = async () => {
    if (!formData.email || !formData.email.includes("@")) {
      setErrors({ email: "Please enter a valid email address first." });
      return;
    }
    setErrors({ email: "" });
    setOtpStep("idle");

    try {
      const res = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: formData.email }),
      });

      if (res.ok) {
        setOtpStep("sent");
        setOtpTimer(60);
      } else {
        const data = await res.json();
        setErrors({ email: data.message || "Failed to send code." });
      }
    } catch (err) {
      setErrors({ email: "Network error. Try again." });
    }
  };

  // Frontend Verification (Backend validates it again)
  const handleVerifyOTP = () => {
    if (otpCode.length === 6) { 
      setOtpStep("verified");
      setErrors({ email: "" });
    } else {
      setErrors({ email: "Code must be exactly 6 digits." });
    }
  };

  // Form Submission & Validation
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    let newErrors: Record<string, string> = {};

    if (!termsAccepted) newErrors.terms = "You must agree to the Terms and Conditions to create an account.";
    if (otpStep !== "verified") newErrors.email = "You must verify your email to continue.";
    if (!otpCode) newErrors.email = "OTP code is required for registration.";
    
    if (formData.phone.startsWith("0")) {
      if (formData.phone.length !== 11) newErrors.phone = "Phone numbers starting with 0 must be 11 digits.";
    } else {
      if (formData.phone.length !== 10) newErrors.phone = "Phone numbers without a leading 0 must be 10 digits.";
    }

    if (formData.whatsapp.startsWith("0")) {
      if (formData.whatsapp.length !== 11) newErrors.whatsapp = "WhatsApp numbers starting with 0 must be 11 digits.";
    } else {
      if (formData.whatsapp.length !== 10) newErrors.whatsapp = "WhatsApp numbers without a leading 0 must be 10 digits.";
    }

    if (passScore < 3) newErrors.password = "Password is too weak. Add numbers or symbols.";
    if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = "Passwords do not match.";
    if (!formData.state) newErrors.state = "Please select a state.";
    if (!formData.lga) newErrors.lga = "Please select an LGA.";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          otpCode, // Include OTP Code for backend verification
        }),
      });

      if (res.ok) {
        router.push("/auth/login?registered=true");
      } else {
        const data = await res.json();
        
        // Handle OTP specifically 
        if (data.message?.toLowerCase().includes("code") || data.message?.toLowerCase().includes("verification")) {
          setOtpStep("sent");
          setErrors({ email: data.message });
        } else {
          setErrors({ form: data.message || "Registration failed." });
        }
      }
    } catch (err) {
      setErrors({ form: "An unexpected error occurred. Please try again." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 w-full flex bg-white font-sans selection:bg-[#ff3f7a] selection:text-white overflow-hidden">
      
      {/* LEFT PANEL - Hard Width, No Scrolling Allowed */}
      <div className="hidden lg:flex lg:w-[45%] shrink-0 h-full bg-[#ff3f7a] p-12 flex-col justify-center relative overflow-hidden">
        <div className="absolute top-[-15%] left-[-10%] w-[500px] h-[500px] bg-white/20 rounded-full blur-[80px] pointer-events-none"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[400px] h-[400px] bg-black/10 rounded-full blur-[80px] pointer-events-none"></div>

        <div className="relative z-10 text-white space-y-6 max-w-lg mx-auto">
          <h1 className="text-5xl font-bold leading-[1.1] tracking-tight">
            Launch your dream business today.
          </h1>
          <p className="text-lg text-white/90 leading-relaxed">
            Skip the legal jargon and the expensive agents. Register your business instantly with our seamless, automated CAC platform.
          </p>
          
          <div className="pt-8 space-y-4">
            <div className="flex items-center gap-3 text-white font-medium">
              <CheckCircle weight="fill" className="h-6 w-6 text-white/80" />
              <span>100% Agent-Free Process</span>
            </div>
            <div className="flex items-center gap-3 text-white font-medium">
              <ShieldCheck weight="fill" className="h-6 w-6 text-white/80" />
              <span>Bank-Grade Data Security</span>
            </div>
            <div className="flex items-center gap-3 text-white font-medium">
              <RocketLaunch weight="fill" className="h-6 w-6 text-white/80" />
              <span>Fast-Tracked Approvals</span>
            </div>
          </div>
        </div>

        <div className="absolute bottom-12 left-12 z-10">
          <p className="text-sm font-semibold tracking-widest text-white/70 uppercase">
            Powered by Quadrox Technologies Limited
          </p>
        </div>
      </div>

      {/* RIGHT PANEL */}
      <div className="flex-1 h-full overflow-y-auto overflow-x-hidden relative block bg-white">
        <div className="w-full max-w-xl mx-auto p-6 sm:p-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
          
          <div className="mb-8 flex justify-center lg:justify-start mt-2 sm:mt-0">
            <Image 
              src="/logo.png" 
              alt="Lumebiz Logo" 
              width={340} 
              height={120} 
              className="object-contain h-20 lg:h-24 w-auto"
              priority
            />
          </div>

          <div className="mb-8 text-center lg:text-left">
            <h2 className="text-3xl font-bold text-gray-900 tracking-tight">Create an account</h2>
            <p className="text-gray-500 mt-2 text-[16px]">Enter your details to create your account.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            
            {errors.form && (
              <div className="p-4 bg-red-50 text-red-600 text-sm font-medium rounded-lg border border-red-100 flex items-center gap-2">
                <CheckCircle weight="bold" className="h-5 w-5 shrink-0" />
                {errors.form}
              </div>
            )}

            {/* SECTION 1: Personal Details */}
            <div className="space-y-5">
              <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">1. Personal Identity</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <Label htmlFor="firstName" className="text-gray-700 font-medium">First Name</Label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-3.5 h-5 w-5 text-gray-400" />
                    <Input id="firstName" value={formData.firstName} onChange={handleChange} required placeholder="John" className="pl-11 h-12 text-[16px] bg-gray-50/50 border-gray-200 focus-visible:ring-[#ff3f7a]" />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="lastName" className="text-gray-700 font-medium">Last Name</Label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-3.5 h-5 w-5 text-gray-400" />
                    <Input id="lastName" value={formData.lastName} onChange={handleChange} required placeholder="Doe" className="pl-11 h-12 text-[16px] bg-gray-50/50 border-gray-200 focus-visible:ring-[#ff3f7a]" />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <Label htmlFor="middleName" className="text-gray-700 font-medium">
                    Middle Name <span className="text-gray-400 font-normal">(Optional)</span>
                  </Label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-3.5 h-5 w-5 text-gray-400" />
                    <Input id="middleName" value={formData.middleName} onChange={handleChange} placeholder="Smith" className="pl-11 h-12 text-[16px] bg-gray-50/50 border-gray-200 focus-visible:ring-[#ff3f7a]" />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="gender" className="text-gray-700 font-medium">Gender</Label>
                  <div className="relative">
                    <GenderIntersex className="absolute left-3.5 top-3.5 h-5 w-5 text-gray-400" />
                    <select id="gender" value={formData.gender} onChange={handleChange} required className="flex h-12 w-full rounded-md border border-gray-200 bg-gray-50/50 pl-11 pr-3 text-[16px] shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#ff3f7a]">
                      <option value="" disabled>Select Gender</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Prefer not to say">Prefer not to say</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* SECTION 2: Contact & Security */}
            <div className="space-y-5">
              <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">2. Contact & Security</h3>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-gray-700 font-medium">Email Address</Label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <EnvelopeSimple className="absolute left-3.5 top-3.5 h-5 w-5 text-gray-400" />
                    <Input id="email" type="email" disabled={otpStep === "verified"} value={formData.email} onChange={handleChange} required placeholder="you@example.com" className="pl-11 h-12 text-[16px] bg-gray-50/50 border-gray-200 focus-visible:ring-[#ff3f7a]" />
                  </div>
                  {otpStep === "idle" && (
                    <Button type="button" onClick={handleSendOTP} className="h-12 bg-[#ff3f7a] hover:bg-[#e02b62] text-white px-6 transition-all">Verify</Button>
                  )}
                  {otpStep === "verified" && (
                    <Button type="button" disabled className="h-12 bg-green-100 text-green-700 border border-green-200 px-6">Verified ✓</Button>
                  )}
                </div>
                
                {otpStep === "sent" && (
                  <div className="p-4 bg-gray-50 rounded-lg border border-gray-100 mt-2 flex gap-2 animate-in fade-in zoom-in-95">
                    <Input value={otpCode} onChange={(e) => setOtpCode(e.target.value)} maxLength={6} placeholder="Enter 6-digit OTP" className="h-12 text-center text-lg tracking-widest bg-white" />
                    <Button type="button" onClick={handleVerifyOTP} className="h-12 bg-[#ff3f7a] text-white">Confirm</Button>
                    {otpTimer > 0 ? (
                      <div className="h-12 px-4 flex items-center justify-center bg-gray-200 rounded-md text-gray-600 font-mono font-medium">{otpTimer}s</div>
                    ) : (
                      <Button type="button" onClick={handleSendOTP} variant="outline" className="h-12">Resend</Button>
                    )}
                  </div>
                )}
                {errors.email && <p className="text-sm text-red-500 font-medium mt-1">{errors.email}</p>}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-gray-700 font-medium">Phone Number</Label>
                  <div className="flex items-center">
                    <div className="flex items-center justify-center h-12 px-3 border border-r-0 border-gray-200 bg-gray-100 rounded-l-md text-[16px] font-medium text-gray-700">
                      <span className="mr-2 text-lg">🇳🇬</span> +234
                    </div>
                    <Input id="phone" type="tel" maxLength={11} value={formData.phone} onChange={handleChange} required placeholder="800 000 0000" className="h-12 text-[16px] bg-gray-50/50 border-gray-200 rounded-l-none focus-visible:ring-[#ff3f7a]" />
                  </div>
                  {errors.phone && <p className="text-sm text-red-500 font-medium mt-1">{errors.phone}</p>}
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="whatsapp" className="text-gray-700 font-medium">WhatsApp Number</Label>
                    <label className="flex items-center gap-1.5 text-xs text-gray-600 cursor-pointer font-medium hover:text-[#ff3f7a] transition-colors">
                      <input 
                        type="checkbox" 
                        checked={sameAsPhone}
                        onChange={(e) => setSameAsPhone(e.target.checked)}
                        className="h-3.5 w-3.5 accent-[#ff3f7a] rounded border-gray-300 cursor-pointer"
                      />
                      Same as Phone
                    </label>
                  </div>
                  <div className="flex items-center relative">
                    <div className="flex items-center justify-center h-12 px-3 border border-r-0 border-gray-200 bg-gray-100 rounded-l-md text-[16px] font-medium text-gray-700">
                      <WhatsappLogo className="h-5 w-5 text-green-500 mr-2" weight="fill" /> +234
                    </div>
                    <Input 
                      id="whatsapp" 
                      type="tel" 
                      maxLength={11} 
                      value={formData.whatsapp} 
                      onChange={handleChange} 
                      required 
                      disabled={sameAsPhone}
                      placeholder="800 000 0000" 
                      className="h-12 text-[16px] bg-gray-50/50 border-gray-200 rounded-l-none focus-visible:ring-[#ff3f7a] disabled:opacity-50 disabled:cursor-not-allowed" 
                    />
                  </div>
                  {errors.whatsapp && <p className="text-sm text-red-500 font-medium mt-1">{errors.whatsapp}</p>}
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-gray-700 font-medium">Create Password</Label>
                  <div className="relative">
                    <LockKey className="absolute left-3.5 top-3.5 h-5 w-5 text-gray-400" />
                    <Input id="password" type="password" value={formData.password} onChange={handleChange} required placeholder="••••••••" className="pl-11 h-12 text-[16px] bg-gray-50/50 border-gray-200 focus-visible:ring-[#ff3f7a]" />
                  </div>
                  
                  {formData.password && (
                    <div className="flex gap-1 mt-2">
                      {[1, 2, 3, 4].map((level) => (
                        <div key={level} className={`h-1.5 w-full rounded-full transition-all duration-300 ${passScore >= level ? (passScore < 3 ? 'bg-yellow-400' : 'bg-green-500') : 'bg-gray-200'}`} />
                      ))}
                    </div>
                  )}
                  {errors.password && <p className="text-sm text-red-500 font-medium mt-1">{errors.password}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-gray-700 font-medium">Confirm Password</Label>
                  <div className="relative">
                    <LockKey className="absolute left-3.5 top-3.5 h-5 w-5 text-gray-400" />
                    <Input id="confirmPassword" type="password" value={formData.confirmPassword} onChange={handleChange} required placeholder="••••••••" className="pl-11 h-12 text-[16px] bg-gray-50/50 border-gray-200 focus-visible:ring-[#ff3f7a]" />
                  </div>
                  {errors.confirmPassword && <p className="text-sm text-red-500 font-medium mt-1">{errors.confirmPassword}</p>}
                </div>
              </div>
            </div>

            {/* SECTION 3: Office Address */}
            <div className="space-y-5">
              <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">3. Office Address</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <Label htmlFor="state" className="text-gray-700 font-medium">State</Label>
                  <div className="relative">
                    <MapPin className="absolute left-3.5 top-3.5 h-5 w-5 text-gray-400" />
                    <select id="state" value={formData.state} onChange={handleChange} required className="flex h-12 w-full rounded-md border border-gray-200 bg-gray-50/50 pl-11 pr-3 text-[16px] shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#ff3f7a]">
                      <option value="" disabled>Select State</option>
                      {NIGERIA_DATA.map((s) => (
                        <option key={s.state} value={s.state}>{s.state} State</option>
                      ))}
                    </select>
                  </div>
                  {errors.state && <p className="text-sm text-red-500 font-medium mt-1">{errors.state}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="lga" className="text-gray-700 font-medium">Local Government (LGA)</Label>
                  <div className="relative">
                    <MapPin className="absolute left-3.5 top-3.5 h-5 w-5 text-gray-400" />
                    <select id="lga" value={formData.lga} onChange={handleChange} required disabled={!formData.state} className="flex h-12 w-full rounded-md border border-gray-200 bg-gray-50/50 pl-11 pr-3 text-[16px] shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#ff3f7a] disabled:opacity-50 disabled:cursor-not-allowed">
                      <option value="" disabled>Select LGA</option>
                      {availableLgas.map((lga) => (
                        <option key={lga} value={lga}>{lga}</option>
                      ))}
                    </select>
                  </div>
                  {errors.lga && <p className="text-sm text-red-500 font-medium mt-1">{errors.lga}</p>}
                </div>
              </div>

              <div className="grid grid-cols-[2fr_1fr] gap-5">
                <div className="space-y-2">
                  <Label htmlFor="street" className="text-gray-700 font-medium">Street Name</Label>
                  <div className="relative">
                    <Buildings className="absolute left-3.5 top-3.5 h-5 w-5 text-gray-400" />
                    <Input id="street" value={formData.street} onChange={handleChange} required placeholder="e.g. 12 Awolowo Way" className="pl-11 h-12 text-[16px] bg-gray-50/50 border-gray-200 focus-visible:ring-[#ff3f7a]" />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="buildingNo" className="text-gray-700 font-medium">Building No.</Label>
                  <Input id="buildingNo" value={formData.buildingNo} onChange={handleChange} placeholder="Optional" className="h-12 text-[16px] bg-gray-50/50 border-gray-200 focus-visible:ring-[#ff3f7a]" />
                </div>
              </div>
            </div>

            {/* CHECKBOX & SUBMIT CONTAINER */}
            <div className="pt-6 border-t space-y-4">
              
              <label className="flex items-start gap-3 p-4 border border-gray-200 bg-gray-50/50 rounded-xl cursor-pointer hover:bg-gray-100 transition-colors">
                <input 
                  type="checkbox" 
                  checked={termsAccepted} 
                  onChange={(e) => setTermsAccepted(e.target.checked)} 
                  className="mt-0.5 h-5 w-5 accent-[#ff3f7a] rounded border-gray-300 cursor-pointer shrink-0" 
                />
                <span className="text-sm text-gray-600 leading-relaxed">
                  I agree to LumeBiz's <Link href="#" className="text-[#ff3f7a] font-semibold hover:underline">Terms & Conditions</Link>, <Link href="#" className="text-[#ff3f7a] font-semibold hover:underline">Acceptable Use</Link> and <Link href="#" className="text-[#ff3f7a] font-semibold hover:underline">Privacy Policy</Link>.
                </span>
              </label>
              
              {errors.terms && <p className="text-sm text-red-500 font-medium pl-1">{errors.terms}</p>}

              <Button 
                type="submit" 
                disabled={loading} 
                className="w-full h-14 text-lg font-semibold bg-[#ff3f7a] hover:bg-[#e02b62] text-white shadow-xl shadow-[#ff3f7a]/25 transition-all"
              >
                {loading ? (
                  <Spinner className="animate-spin h-6 w-6" weight="bold" />
                ) : (
                  <>Create Account</>
                )}
              </Button>
            </div>

            <div className="text-center text-gray-500 mt-6">
              Already have an account?{" "}
              <Link href="/auth/login" className="font-semibold text-[#ff3f7a] hover:underline transition-all">
                Sign in
              </Link>
            </div>
            
            <div className="h-8 w-full"></div>
          </form>

        </div>
      </div>
    </div>
  );
}

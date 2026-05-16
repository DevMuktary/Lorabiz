"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { 
  User, 
  EnvelopeSimple, 
  Phone, 
  LockKey, 
  Spinner, 
  CheckCircle, 
  ShieldCheck,
  RocketLaunch,
  MapPin,
  CalendarBlank,
  GenderIntersex,
  House
} from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

// Full Nigerian States and LGAs Mapping
const nigeriaLocations: Record<string, string[]> = {
  "Abia": ["Aba North", "Aba South", "Arochukwu", "Bende", "Ikwuano", "Isiala Ngwa North", "Isiala Ngwa South", "Isuikwuato", "Obi Ngwa", "Ohafia", "Osisioma", "Ugwunagbo", "Ukwa East", "Ukwa West", "Umuahia North", "Umuahia South", "Umu Nneochi"],
  "Adamawa": ["Demsa", "Fufure", "Ganye", "Gayuk", "Gombi", "Grie", "Hong", "Jada", "Lamurde", "Madagali", "Maiha", "Mayo Belwa", "Michika", "Mubi North", "Mubi South", "Numan", "Shelleng", "Song", "Toungo", "Yola North", "Yola South"],
  "Akwa Ibom": ["Abak", "Eastern Obolo", "Eket", "Esit Eket", "Essien Udim", "Etim Ekpo", "Etinan", "Ibeno", "Ibesikpo Asutan", "Ibiono-Ibom", "Ika", "Ikono", "Ikot Abasi", "Ikot Ekpene", "Ini", "Itu", "Mbo", "Mkpat-Enin", "Nsit-Atai", "Nsit-Ibom", "Nsit-Ubium", "Obot Akara", "Okobo", "Onna", "Oron", "Oruk Anam", "Udung-Uko", "Ukanafun", "Uruan", "Urue-Offong/Oruko", "Uyo"],
  "Anambra": ["Aguata", "Anambra East", "Anambra West", "Anaocha", "Awka North", "Awka South", "Ayamelum", "Dunukofia", "Ekwusigo", "Idemili North", "Idemili South", "Ihiala", "Njikoka", "Nnewi North", "Nnewi South", "Ogbaru", "Onitsha North", "Onitsha South", "Orumba North", "Orumba South", "Oyi"],
  "Bauchi": ["Alkaleri", "Bauchi", "Bogoro", "Damban", "Darazo", "Dass", "Gamawa", "Ganjuwa", "Giade", "Itas/Gadau", "Jama'are", "Katagum", "Kirfi", "Misau", "Ningi", "Shira", "Tafawa Balewa", "Toro", "Warji", "Zaki"],
  "Bayelsa": ["Brass", "Ekeremor", "Kolokuma/Opokuma", "Nembe", "Ogbia", "Sagbama", "Southern Ijaw", "Yenagoa"],
  "Benue": ["Ado", "Agatu", "Apa", "Buruku", "Gboko", "Guma", "Gwer East", "Gwer West", "Katsina-Ala", "Konshisha", "Kwande", "Logo", "Makurdi", "Obi", "Ogbadibo", "Ohimini", "Oju", "Okpokwu", "Otukpo", "Tarka", "Ukum", "Ushongo", "Vandeikya"],
  "Borno": ["Abadam", "Askira/Uba", "Bama", "Bayo", "Biu", "Chibok", "Damboa", "Dikwa", "Gubio", "Guzamala", "Gwoza", "Hawul", "Jere", "Kaga", "Kala/Balge", "Konduga", "Kukawa", "Kwaya Kusar", "Mafa", "Magumeri", "Maiduguri", "Marte", "Mobbar", "Monguno", "Ngala", "Nganzai", "Shani"],
  "Cross River": ["Abi", "Akamkpa", "Akpabuyo", "Bakassi", "Bekwarra", "Biase", "Boki", "Calabar Municipal", "Calabar South", "Etung", "Ikom", "Obanliku", "Obubra", "Obudu", "Odukpani", "Ogoja", "Yakuur", "Yala"],
  "Delta": ["Aniocha North", "Aniocha South", "Bomadi", "Burutu", "Ethiope East", "Ethiope West", "Ika North East", "Ika South", "Isoko North", "Isoko South", "Ndokwa East", "Ndokwa West", "Okpe", "Oshimili North", "Oshimili South", "Patani", "Sapele", "Udu", "Ughelli North", "Ughelli South", "Ukwuani", "Uvwie", "Warri North", "Warri South", "Warri South West"],
  "Ebonyi": ["Abakaliki", "Afikpo North", "Afikpo South", "Ebonyi", "Ezza North", "Ezza South", "Ikwo", "Ishielu", "Ivo", "Izzi", "Ohaozara", "Ohaukwu", "Onicha"],
  "Edo": ["Akoko-Edo", "Egor", "Esan Central", "Esan North-East", "Esan South-East", "Esan West", "Etsako Central", "Etsako East", "Etsako West", "Igueben", "Ikpoba Okha", "Orhionmwon", "Oredo", "Ovia North-East", "Ovia South-West", "Owan East", "Owan West", "Uhunmwonde"],
  "Ekiti": ["Ado Ekiti", "Efon", "Ekiti East", "Ekiti South-West", "Ekiti West", "Emure", "Gbonyin", "Ido Osi", "Ijero", "Ikere", "Ikole", "Ilejemeje", "Irepodun/Ifelodun", "Ise/Orun", "Moba", "Oye"],
  "Enugu": ["Aninri", "Awgu", "Enugu East", "Enugu North", "Enugu South", "Ezeagu", "Igbo Etiti", "Igbo Eze North", "Igbo Eze South", "Isi Uzo", "Nkanu East", "Nkanu West", "Nsukka", "Oji River", "Udenu", "Udi", "Uzo Uwani"],
  "FCT": ["Abaji", "Bwari", "Gwagwalada", "Kuje", "Kwali", "Municipal Area Council"],
  "Gombe": ["Akko", "Balanga", "Billiri", "Dukku", "Funakaye", "Gombe", "Kaltungo", "Kwami", "Nafada", "Shongom", "Yamaltu/Deba"],
  "Imo": ["Aboh Mbaise", "Ahiazu Mbaise", "Ehime Mbano", "Ezinihitte", "Ideato North", "Ideato South", "Ihitte/Uboma", "Ikeduru", "Isiala Mbano", "Isu", "Mbaitoli", "Ngor Okpala", "Njaba", "Nkwerre", "Nwangele", "Obowo", "Oguta", "Ohaji/Egbema", "Okigwe", "Orlu", "Orsu", "Oru East", "Oru West", "Owerri Municipal", "Owerri North", "Owerri West", "Unuimo"],
  "Jigawa": ["Auyo", "Babura", "Biriniwa", "Birnin Kudu", "Buji", "Dutse", "Gagarawa", "Garki", "Gumel", "Guri", "Gwaram", "Gwiwa", "Hadejia", "Jahun", "Kafin Hausa", "Kaugama", "Kazaure", "Kiri Kasama", "Kiyawa", "Kaugama", "Malam Madori", "Miga", "Ringim", "Roni", "Sule Tankarkar", "Taura", "Yankwashi"],
  "Kaduna": ["Birnin Gwari", "Chikun", "Giwa", "Igabi", "Ikara", "Jaba", "Jema'a", "Kachia", "Kaduna North", "Kaduna South", "Kagarko", "Kajuru", "Kaura", "Kauru", "Kubau", "Kudan", "Lere", "Makarfi", "Sabon Gari", "Sanga", "Soba", "Zangon Kataf", "Zaria"],
  "Kano": ["Ajingi", "Albasu", "Bagwai", "Bebeji", "Bichi", "Bunkure", "Dala", "Dambatta", "Dawakin Kudu", "Dawakin Tofa", "Doguwa", "Fagge", "Gabasawa", "Garko", "Garun Mallam", "Gaya", "Gezawa", "Gwale", "Gwarzo", "Kabo", "Kano Municipal", "Karaye", "Kibiya", "Kiru", "Kumbotso", "Kunchi", "Kura", "Madobi", "Makoda", "Minjibir", "Nasarawa", "Rano", "Rimin Gado", "Rogo", "Shanono", "Sumaila", "Takai", "Tarauni", "Tofa", "Tsanyawa", "Tudun Wada", "Ungogo", "Warawa", "Wudil"],
  "Katsina": ["Bakori", "Batagarawa", "Batsari", "Baure", "Bindawa", "Charanchi", "Dandume", "Danja", "Dan Musa", "Daura", "Dutsi", "Dutsin Ma", "Faskari", "Funtua", "Ingawa", "Jibia", "Kafur", "Kaita", "Kankara", "Kankia", "Katsina", "Kurfi", "Kusada", "Mai'Adua", "Malumfashi", "Mani", "Mashi", "Matazu", "Musawa", "Rimi", "Sabuwa", "Safana", "Sandamu", "Zango"],
  "Kebbi": ["Aleiro", "Arewa Dandi", "Argungu", "Augie", "Bagudo", "Birnin Kebbi", "Bunza", "Dandi", "Fakai", "Gwandu", "Jega", "Kalgo", "Koko/Besse", "Maiyama", "Ngaski", "Sakaba", "Shanga", "Suru", "Wasagu/Danko", "Yauri", "Zuru"],
  "Kogi": ["Adavi", "Ajaokuta", "Ankpa", "Bassa", "Dekina", "Ibaji", "Idah", "Igalamela Odolu", "Ijumu", "Kabba/Bunu", "Kogi", "Lokoja", "Mopa Muro", "Ofu", "Ogori/Magongo", "Okehi", "Okene", "Olamaboro", "Omala", "Yagba East", "Yagba West"],
  "Kwara": ["Asa", "Baruten", "Edu", "Ekiti", "Ifelodun", "Ilorin East", "Ilorin South", "Ilorin West", "Irepodun", "Isin", "Kaiama", "Moro", "Offa", "Oke Ero", "Oyun", "Pategi"],
  "Lagos": ["Agege", "Ajeromi-Ifelodun", "Alimosho", "Amuwo-Odofin", "Apapa", "Badagry", "Epe", "Eti Osa", "Ibeju-Lekki", "Ifako-Ijaiye", "Ikeja", "Ikorodu", "Kosofe", "Lagos Island", "Lagos Mainland", "Mushin", "Ojo", "Oshodi-Isolo", "Shomolu", "Surulere"],
  "Nasarawa": ["Akwanga", "Awe", "Doma", "Karu", "Keana", "Keffi", "Kokona", "Lafia", "Nasarawa", "Nasarawa Egon", "Obi", "Toto", "Wamba"],
  "Niger": ["Agaie", "Agwara", "Bida", "Borgu", "Bosso", "Chanchaga", "Edati", "Gbako", "Katcha", "Kontagora", "Lapai", "Lavun", "Magama", "Mariga", "Mashegu", "Mokwa", "Moya", "Paikoro", "Rafi", "Rijau", "Shiroro", "Suleja", "Tafa", "Wushishi"],
  "Ogun": ["Abeokuta North", "Abeokuta South", "Ado-Odo/Ota", "Egbado North", "Egbado South", "Ewekoro", "Ifo", "Ijebu East", "Ijebu North", "Ijebu North East", "Ijebu Ode", "Ikenne", "Imeko Afon", "Ipokia", "Obafemi Owode", "Odeda", "Odogbolu", "Ogun Waterside", "Remo North", "Shagamu"],
  "Ondo": ["Akoko North-East", "Akoko North-West", "Akoko South-East", "Akoko South-West", "Akure North", "Akure South", "Ese Odo", "Idanre", "Ifedore", "Ilaje", "Ile Oluji/Okeigbo", "Irele", "Odigbo", "Okitipupa", "Ondo East", "Ondo West", "Ose", "Owo"],
  "Osun": ["Atakunmosa East", "Atakunmosa West", "Aiyedaade", "Aiyedire", "Boluwaduro", "Boripe", "Ede North", "Ede South", "Ife Central", "Ife East", "Ife North", "Ife South", "Egbedore", "Ejigbo", "Ifedayo", "Ifelodun", "Ila", "Ilesa East", "Ilesa West", "Irepodun", "Irewole", "Isokan", "Iwo", "Obokun", "Odo Otin", "Ola Oluwa", "Olorunda", "Oriade", "Orolu", "Osogbo"],
  "Oyo": ["Afijio", "Akinyele", "Atiba", "Atisbo", "Egbeda", "Ibadan North", "Ibadan North-East", "Ibadan North-West", "Ibadan South-East", "Ibadan South-West", "Ibarapa Central", "Ibarapa East", "Ibarapa North", "Ido", "Irepo", "Iseyin", "Itesiwaju", "Iwajowa", "Kajola", "Lagelu", "Ogbomosho North", "Ogbomosho South", "Ogo Oluwa", "Olorunsogo", "Oluyole", "Ona Ara", "Orelope", "Ori Ire", "Oyo", "Oyo East", "Saki East", "Saki West", "Surulere"],
  "Plateau": ["Bokkos", "Barkin Ladi", "Bassa", "Jos East", "Jos North", "Jos South", "Kanam", "Kanke", "Langtang North", "Langtang South", "Mangu", "Mikang", "Pankshin", "Qua'an Pan", "Riyom", "Shendam", "Wase"],
  "Rivers": ["Abua/Odual", "Ahoada East", "Ahoada West", "Akuku-Toru", "Andoni", "Asari-Toru", "Bonny", "Degema", "Eleme", "Emuoha", "Etche", "Gokana", "Ikwerre", "Khana", "Obio/Akpor", "Ogba/Egbema/Ndoni", "Ogu/Bolo", "Okrika", "Omuma", "Opobo/Nkoro", "Oyigbo", "Port Harcourt", "Tai"],
  "Sokoto": ["Binji", "Bodinga", "Dange Shuni", "Gada", "Goronyo", "Gudu", "Gwadabawa", "Illela", "Isa", "Kebbe", "Kware", "Rabah", "Sabon Birni", "Shagari", "Silame", "Sokoto North", "Sokoto South", "Tambuwal", "Tangaza", "Tureta", "Wamako", "Wurno", "Yabo"],
  "Taraba": ["Ardo Kola", "Bali", "Donga", "Gashaka", "Gassol", "Ibi", "Jalingo", "Karim Lamido", "Kumi", "Lau", "Sardauna", "Takum", "Ussa", "Wukari", "Yorro", "Zing"],
  "Yobe": ["Bade", "Bursari", "Damaturu", "Fika", "Fune", "Geidam", "Gujba", "Gulani", "Jakusko", "Karasuwa", "Machina", "Nangere", "Nguru", "Potiskum", "Tarmuwa", "Yunusari", "Yusufari"],
  "Zamfara": ["Anka", "Bakura", "Birnin Magaji/Kiyaw", "Bukkuyum", "Bungudu", "Gummi", "Gusau", "Kaura Namoda", "Maradun", "Maru", "Shinkafi", "Talata Mafara", "Zurmi"]
};

export default function RegisterPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  
  // OTP Verification States
  const [emailVerified, setEmailVerified] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otpValue, setOtpValue] = useState("");
  const [countdown, setCountdown] = useState(0);

  // Form Data State
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    gender: "",
    dob: "",
    state: "",
    lga: "",
    street: "",
    buildingNo: "",
    password: "",
    confirmPassword: ""
  });

  // Handle countdown timer for OTP
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { id, value } = e.target;
    setFormData(prev => {
      // If State changes, reset the LGA so they don't have a mismatch
      if (id === "state") {
        return { ...prev, [id]: value, lga: "" };
      }
      return { ...prev, [id]: value };
    });
    
    // If they change their email after verifying, reset the verification
    if (id === "email" && emailVerified) {
      setEmailVerified(false);
      setOtpSent(false);
      setOtpValue("");
    }
  };

  const handleSendOTP = () => {
    if (!formData.email || !formData.email.includes("@")) {
      setError("Please enter a valid email address first.");
      return;
    }
    setError("");
    setOtpSent(true);
    setCountdown(60); // 60 seconds countdown
    // In a real app, you would make an API call here to send the email
  };

  const handleVerifyOTP = () => {
    if (otpValue.length >= 4) { // Simulated verification (accepts any 4+ digit code for now)
      setEmailVerified(true);
      setOtpSent(false);
      setError("");
    } else {
      setError("Invalid OTP code.");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    // Frontend Validations
    if (!emailVerified) {
      setError("You must verify your email address before continuing.");
      setLoading(false);
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match.");
      setLoading(false);
      return;
    }

    try {
      // Concatenate names for the database
      const fullName = `${formData.firstName} ${formData.lastName}`.trim();
      
      const payload = {
        fullName,
        email: formData.email,
        phone: formData.phone,
        password: formData.password,
        // In the future, you can send gender, dob, state, etc. to a Profile table
      };

      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        router.push("/login?registered=true");
      } else {
        const data = await res.json();
        setError(data.message || "Registration failed.");
      }
    } catch (err) {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Helper to determine password strength
  const getPasswordStrength = () => {
    const pw = formData.password;
    if (!pw) return { text: "", color: "bg-gray-200", width: "w-0" };
    if (pw.length < 6) return { text: "Weak", color: "bg-red-400", width: "w-1/3" };
    if (pw.length >= 8 && /[A-Z]/.test(pw) && /[0-9]/.test(pw)) return { text: "Strong", color: "bg-green-500", width: "w-full" };
    return { text: "Fair", color: "bg-yellow-400", width: "w-2/3" };
  };

  const pwStrength = getPasswordStrength();

  return (
    <div className="min-h-screen w-full flex bg-white font-sans selection:bg-[#ff3f7a] selection:text-white">
      
      {/* LEFT PANEL - The Brand Experience (Fixed on scroll) */}
      <div className="hidden lg:flex w-1/2 bg-[#ff3f7a] p-12 flex-col justify-center relative overflow-hidden h-screen sticky top-0">
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

      {/* RIGHT PANEL - The Form (Scrollable) */}
      <div className="w-full lg:w-1/2 flex items-start justify-center p-6 sm:p-12 overflow-y-auto min-h-screen">
        <div className="w-full max-w-md py-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
          
          {/* Logo */}
          <div className="mb-8 flex justify-center lg:justify-start">
            <Image 
              src="/logo.png" 
              alt="Lumebiz Logo" 
              width={340} 
              height={120} 
              className="object-contain h-24 lg:h-28 w-auto"
              priority
            />
          </div>

          <div className="mb-8 text-center lg:text-left">
            <h2 className="text-3xl font-bold text-gray-900 tracking-tight">Create an account</h2>
            <p className="text-gray-500 mt-2 text-[16px]">Enter your details to create your account.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            
            {error && (
              <div className="p-4 bg-red-50 text-red-600 text-sm font-medium rounded-lg border border-red-100 flex items-center gap-2">
                <CheckCircle weight="bold" className="h-5 w-5 shrink-0" />
                {error}
              </div>
            )}

            {/* SECTION 1: IDENTITY */}
            <div className="space-y-5">
              <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Personal Identity</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName" className="text-gray-700 font-medium">First Name</Label>
                  <Input id="firstName" value={formData.firstName} onChange={handleChange} required placeholder="John" className="h-12 text-[16px] bg-gray-50/50 border-gray-200 focus-visible:ring-[#ff3f7a] focus-visible:border-[#ff3f7a]" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName" className="text-gray-700 font-medium">Last Name</Label>
                  <Input id="lastName" value={formData.lastName} onChange={handleChange} required placeholder="Doe" className="h-12 text-[16px] bg-gray-50/50 border-gray-200 focus-visible:ring-[#ff3f7a] focus-visible:border-[#ff3f7a]" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="dob" className="text-gray-700 font-medium">Date of Birth</Label>
                  <div className="relative">
                    <CalendarBlank className="absolute left-3.5 top-3.5 h-5 w-5 text-gray-400" />
                    <Input id="dob" type="date" value={formData.dob} onChange={handleChange} required className="pl-11 h-12 text-[16px] bg-gray-50/50 border-gray-200 focus-visible:ring-[#ff3f7a]" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="gender" className="text-gray-700 font-medium">Gender</Label>
                  <div className="relative">
                    <GenderIntersex className="absolute left-3.5 top-3.5 h-5 w-5 text-gray-400" />
                    <select 
                      id="gender" 
                      value={formData.gender} 
                      onChange={handleChange} 
                      required 
                      className="flex h-12 w-full rounded-md border border-gray-200 bg-gray-50/50 px-3 pl-11 py-1 text-[16px] shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#ff3f7a] focus-visible:border-[#ff3f7a] appearance-none"
                    >
                      <option value="" disabled>Select</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* SECTION 2: CONTACT & VERIFICATION */}
            <div className="space-y-5">
              <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Contact Details</h3>
              
              <div className="space-y-2">
                <Label htmlFor="email" className="text-gray-700 font-medium">Email Address</Label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <EnvelopeSimple className="absolute left-3.5 top-3.5 h-5 w-5 text-gray-400" />
                    <Input 
                      id="email" type="email" value={formData.email} onChange={handleChange} required readOnly={emailVerified} placeholder="you@example.com" 
                      className={`pl-11 h-12 text-[16px] border-gray-200 ${emailVerified ? 'bg-green-50 border-green-200 text-green-900' : 'bg-gray-50/50 focus-visible:ring-[#ff3f7a]'}`} 
                    />
                  </div>
                  {!emailVerified && !otpSent && (
                    <Button type="button" onClick={handleSendOTP} className="h-12 px-6 bg-gray-900 hover:bg-gray-800 text-white font-semibold">
                      Verify
                    </Button>
                  )}
                  {emailVerified && (
                    <div className="h-12 px-4 flex items-center justify-center bg-green-100 text-green-700 rounded-md border border-green-200">
                      <CheckCircle weight="fill" className="h-6 w-6" />
                    </div>
                  )}
                </div>
                
                {/* OTP UI */}
                {otpSent && !emailVerified && (
                  <div className="mt-3 p-4 bg-gray-50 rounded-lg border border-gray-200 space-y-3 animate-in fade-in">
                    <Label className="text-gray-600 text-sm">Enter the code sent to your email</Label>
                    <div className="flex gap-2">
                      <Input 
                        value={otpValue} onChange={(e) => setOtpValue(e.target.value)} placeholder="000000" maxLength={6}
                        className="h-12 text-center text-xl tracking-widest font-bold border-gray-300 focus-visible:ring-[#ff3f7a]" 
                      />
                      <Button type="button" onClick={handleVerifyOTP} className="h-12 px-6 bg-[#ff3f7a] hover:bg-[#e02b62] text-white">
                        Confirm
                      </Button>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-500">
                        {countdown > 0 ? `Code expires in ${countdown}s` : "Code expired"}
                      </span>
                      {countdown === 0 && (
                        <button type="button" onClick={handleSendOTP} className="text-[#ff3f7a] font-semibold hover:underline">
                          Resend OTP
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone" className="text-gray-700 font-medium">Phone Number</Label>
                <div className="relative">
                  <Phone className="absolute left-3.5 top-3.5 h-5 w-5 text-gray-400" />
                  <Input id="phone" type="tel" value={formData.phone} onChange={handleChange} required placeholder="0800 000 0000" className="pl-11 h-12 text-[16px] bg-gray-50/50 border-gray-200 focus-visible:ring-[#ff3f7a]" />
                </div>
              </div>
            </div>

            {/* SECTION 3: ADDRESS */}
            <div className="space-y-5">
              <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Residential Address</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="state" className="text-gray-700 font-medium">State</Label>
                  <div className="relative">
                    <MapPin className="absolute left-3.5 top-3.5 h-5 w-5 text-gray-400" />
                    <select 
                      id="state" value={formData.state} onChange={handleChange} required 
                      className="flex h-12 w-full rounded-md border border-gray-200 bg-gray-50/50 px-3 pl-11 py-1 text-[16px] shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#ff3f7a] focus-visible:border-[#ff3f7a] appearance-none"
                    >
                      <option value="" disabled>Select State</option>
                      {Object.keys(nigeriaLocations).map(state => (
                        <option key={state} value={state}>{state}</option>
                      ))}
                    </select>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="lga" className="text-gray-700 font-medium">L.G.A</Label>
                  <select 
                    id="lga" value={formData.lga} onChange={handleChange} required disabled={!formData.state}
                    className="flex h-12 w-full rounded-md border border-gray-200 bg-gray-50/50 px-3 py-1 text-[16px] shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#ff3f7a] focus-visible:border-[#ff3f7a] disabled:opacity-50 appearance-none"
                  >
                    <option value="" disabled>Select LGA</option>
                    {formData.state && nigeriaLocations[formData.state].map(lga => (
                      <option key={lga} value={lga}>{lga}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-[1fr_100px] gap-4">
                <div className="space-y-2">
                  <Label htmlFor="street" className="text-gray-700 font-medium">Street Name</Label>
                  <Input id="street" value={formData.street} onChange={handleChange} required placeholder="e.g. Allen Avenue" className="h-12 text-[16px] bg-gray-50/50 border-gray-200 focus-visible:ring-[#ff3f7a]" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="buildingNo" className="text-gray-700 font-medium">Bldg No.</Label>
                  <Input id="buildingNo" value={formData.buildingNo} onChange={handleChange} placeholder="e.g. 14B" className="h-12 text-[16px] bg-gray-50/50 border-gray-200 focus-visible:ring-[#ff3f7a]" />
                </div>
              </div>
            </div>

            {/* SECTION 4: SECURITY */}
            <div className="space-y-5">
              <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Security</h3>
              
              <div className="space-y-2">
                <Label htmlFor="password" className="text-gray-700 font-medium">Create Password</Label>
                <div className="relative">
                  <LockKey className="absolute left-3.5 top-3.5 h-5 w-5 text-gray-400" />
                  <Input id="password" type="password" value={formData.password} onChange={handleChange} required placeholder="••••••••" className="pl-11 h-12 text-[16px] bg-gray-50/50 border-gray-200 focus-visible:ring-[#ff3f7a]" />
                </div>
                {/* Password Strength Indicator */}
                {formData.password && (
                  <div className="pt-1">
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-gray-500 font-medium">Password strength:</span>
                      <span className={`font-bold ${pwStrength.text === 'Weak' ? 'text-red-500' : pwStrength.text === 'Fair' ? 'text-yellow-600' : 'text-green-600'}`}>
                        {pwStrength.text}
                      </span>
                    </div>
                    <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                      <div className={`h-full ${pwStrength.width} ${pwStrength.color} transition-all duration-300`}></div>
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-gray-700 font-medium">Confirm Password</Label>
                <div className="relative">
                  <ShieldCheck className="absolute left-3.5 top-3.5 h-5 w-5 text-gray-400" />
                  <Input id="confirmPassword" type="password" value={formData.confirmPassword} onChange={handleChange} required placeholder="••••••••" className={`pl-11 h-12 text-[16px] bg-gray-50/50 border-gray-200 focus-visible:ring-[#ff3f7a] ${formData.confirmPassword && formData.password !== formData.confirmPassword ? 'border-red-300 focus-visible:ring-red-400' : ''}`} />
                </div>
                {formData.confirmPassword && formData.password !== formData.confirmPassword && (
                  <p className="text-xs text-red-500 font-medium mt-1">Passwords do not match.</p>
                )}
              </div>
            </div>

            <div className="pt-6">
              <Button type="submit" disabled={loading || !emailVerified} className="w-full h-14 text-lg font-bold tracking-wide bg-[#ff3f7a] hover:bg-[#e02b62] text-white shadow-xl shadow-[#ff3f7a]/30 transition-all rounded-xl">
                {loading ? <Spinner className="animate-spin h-6 w-6" weight="bold" /> : "Complete Registration"}
              </Button>
            </div>

            <p className="text-center text-gray-500 pb-8">
              Already have an account?{" "}
              <Link href="/login" className="font-bold text-[#ff3f7a] hover:underline transition-all">
                Sign in
              </Link>
            </p>
          </form>
          
          <div className="lg:hidden mt-4 text-center pb-12">
             <p className="text-xs font-semibold tracking-widest text-gray-400 uppercase">
              Powered by Quadrox Technologies Ltd
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}

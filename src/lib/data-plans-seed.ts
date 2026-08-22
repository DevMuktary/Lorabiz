import { PrismaClient } from "@prisma/client";

export interface DataPlanSeedItem {
  planId: number;
  network: "MTN" | "GLO" | "AIRTEL" | "9MOBILE";
  category: "SME" | "DATA_SHARE" | "GIFTING" | "CORPORATE" | "AWOOF" | "LITE";
  name: string;
  productCode: string;
  price: number;
  costPrice: number;
  validity: string;
  capacity: string;
  isActive: boolean;
}

/**
 * Pricing formula:
 * - Under ₦1,000 (< 1000): +60%
 * - ₦1,000 to ₦5,000 (1000 - 5000): +20%
 * - ₦5,000 to ₦20,000 (5000 - 20000): +10%
 * - Above ₦20,000 (> 20000): +8%
 */
export function calculateSellingPrice(costPrice: number): number {
  let markupRate = 0.08;
  if (costPrice < 1000) {
    markupRate = 0.60;
  } else if (costPrice <= 5000) {
    markupRate = 0.20;
  } else if (costPrice <= 20000) {
    markupRate = 0.10;
  } else {
    markupRate = 0.08;
  }
  return Math.round(costPrice * (1 + markupRate));
}

export const DATA_PLANS_SEED: DataPlanSeedItem[] = [
  // ==========================================
  // 1. GLO DIRECT (GIFTING)
  // ==========================================
  { planId: 940, network: "GLO", category: "GIFTING", name: "Glo 2.6GB 30 Days", productCode: "glo_2_6gb30days", costPrice: 930, price: calculateSellingPrice(930), validity: "30 Days", capacity: "2.6GB", isActive: true },
  { planId: 941, network: "GLO", category: "GIFTING", name: "Glo 5GB 30 Days", productCode: "glo_5gb30days", costPrice: 1395, price: calculateSellingPrice(1395), validity: "30 Days", capacity: "5GB", isActive: true },
  { planId: 942, network: "GLO", category: "GIFTING", name: "Glo 6.15GB 30 Days", productCode: "glo_6_15gb30days", costPrice: 1860, price: calculateSellingPrice(1860), validity: "30 Days", capacity: "6.15GB", isActive: true },
  { planId: 943, network: "GLO", category: "GIFTING", name: "Glo 7.25GB 30 Days", productCode: "glo_7_25gb30days", costPrice: 2325, price: calculateSellingPrice(2325), validity: "30 Days", capacity: "7.25GB", isActive: true },
  { planId: 944, network: "GLO", category: "GIFTING", name: "Glo 10GB 30 Days", productCode: "glo_10gb30days", costPrice: 2790, price: calculateSellingPrice(2790), validity: "30 Days", capacity: "10GB", isActive: true },
  { planId: 945, network: "GLO", category: "GIFTING", name: "Glo 12.5GB 30 Days", productCode: "glo_12_5gb30days", costPrice: 3720, price: calculateSellingPrice(3720), validity: "30 Days", capacity: "12.5GB", isActive: true },
  { planId: 946, network: "GLO", category: "GIFTING", name: "Glo 16GB 30 Days", productCode: "glo_16gb30days", costPrice: 4650, price: calculateSellingPrice(4650), validity: "30 Days", capacity: "16GB", isActive: true },
  { planId: 947, network: "GLO", category: "GIFTING", name: "Glo 20.5GB 30 Days", productCode: "glo_20_5gb30days", costPrice: 5580, price: calculateSellingPrice(5580), validity: "30 Days", capacity: "20.5GB", isActive: true },
  { planId: 948, network: "GLO", category: "GIFTING", name: "Glo 28GB 30 Days", productCode: "glo_28gb30days", costPrice: 7440, price: calculateSellingPrice(7440), validity: "30 Days", capacity: "28GB", isActive: true },
  { planId: 949, network: "GLO", category: "GIFTING", name: "Glo 38GB 30 Days", productCode: "glo_38gb30days", costPrice: 9300, price: calculateSellingPrice(9300), validity: "30 Days", capacity: "38GB", isActive: true },
  { planId: 950, network: "GLO", category: "GIFTING", name: "Glo 64GB 30 Days", productCode: "glo_64gb30days", costPrice: 13950, price: calculateSellingPrice(13950), validity: "30 Days", capacity: "64GB", isActive: true },
  { planId: 951, network: "GLO", category: "GIFTING", name: "Glo 107GB 30 Days", productCode: "glo_107gb30days", costPrice: 18600, price: calculateSellingPrice(18600), validity: "30 Days", capacity: "107GB", isActive: true },
  { planId: 952, network: "GLO", category: "GIFTING", name: "Glo 135GB 30 Days", productCode: "glo_135gb30days", costPrice: 23250, price: calculateSellingPrice(23250), validity: "30 Days", capacity: "135GB", isActive: true },
  { planId: 953, network: "GLO", category: "GIFTING", name: "Glo 165GB 30 Days", productCode: "glo_165gb30days", costPrice: 27900, price: calculateSellingPrice(27900), validity: "30 Days", capacity: "165GB", isActive: true },
  { planId: 954, network: "GLO", category: "GIFTING", name: "Glo 220GB 30 Days", productCode: "glo_220gb30days", costPrice: 37200, price: calculateSellingPrice(37200), validity: "30 Days", capacity: "220GB", isActive: true },
  { planId: 955, network: "GLO", category: "GIFTING", name: "Glo 310GB 60 Days", productCode: "glo_310gb60days", costPrice: 46500, price: calculateSellingPrice(46500), validity: "60 Days", capacity: "310GB", isActive: true },
  { planId: 956, network: "GLO", category: "GIFTING", name: "Glo 380GB 90 Days", productCode: "glo_380gb90days", costPrice: 55800, price: calculateSellingPrice(55800), validity: "90 Days", capacity: "380GB", isActive: true },
  { planId: 957, network: "GLO", category: "GIFTING", name: "Glo 475GB 90 Days", productCode: "glo_475gb90days", costPrice: 69750, price: calculateSellingPrice(69750), validity: "90 Days", capacity: "475GB", isActive: true },
  { planId: 958, network: "GLO", category: "GIFTING", name: "Glo 1TB 365 Days", productCode: "glo_1tb365days", costPrice: 139500, price: calculateSellingPrice(139500), validity: "365 Days", capacity: "1TB", isActive: true },

  // ==========================================
  // 2. AIRTEL DIRECT GIFTING
  // ==========================================
  { planId: 409, network: "AIRTEL", category: "GIFTING", name: "Airtel 2GB 30 Days", productCode: "airtel_2gb30days", costPrice: 1470, price: calculateSellingPrice(1470), validity: "30 Days", capacity: "2GB", isActive: true },
  { planId: 410, network: "AIRTEL", category: "GIFTING", name: "Airtel 3GB 30 Days", productCode: "airtel_3gb30days", costPrice: 1960, price: calculateSellingPrice(1960), validity: "30 Days", capacity: "3GB", isActive: true },
  { planId: 521, network: "AIRTEL", category: "GIFTING", name: "Airtel 10GB 30 Days", productCode: "airtel_10gb30days", costPrice: 3920, price: calculateSellingPrice(3920), validity: "30 Days", capacity: "10GB", isActive: true },
  { planId: 817, network: "AIRTEL", category: "GIFTING", name: "Airtel 1GB 7 Days", productCode: "airtel_1gb7_days", costPrice: 784, price: calculateSellingPrice(784), validity: "7 Days", capacity: "1GB", isActive: true },
  { planId: 846, network: "AIRTEL", category: "GIFTING", name: "Airtel 500MB 7 Days", productCode: "airtel_500mb7_days", costPrice: 490, price: calculateSellingPrice(490), validity: "7 Days", capacity: "500MB", isActive: true },
  { planId: 863, network: "AIRTEL", category: "GIFTING", name: "Airtel 4GB 30 Days", productCode: "airtel_4gb30days", costPrice: 2450, price: calculateSellingPrice(2450), validity: "30 Days", capacity: "4GB", isActive: true },
  { planId: 864, network: "AIRTEL", category: "GIFTING", name: "Airtel 8GB 30 Days", productCode: "airtel_8gb30days", costPrice: 2940, price: calculateSellingPrice(2940), validity: "30 Days", capacity: "8GB", isActive: true },
  { planId: 865, network: "AIRTEL", category: "GIFTING", name: "Airtel 13GB 30 Days", productCode: "airtel_13gb30days", costPrice: 4900, price: calculateSellingPrice(4900), validity: "30 Days", capacity: "13GB", isActive: true },
  { planId: 866, network: "AIRTEL", category: "GIFTING", name: "Airtel 18GB 30 Days", productCode: "airtel_18gb30days", costPrice: 5880, price: calculateSellingPrice(5880), validity: "30 Days", capacity: "18GB", isActive: true },
  { planId: 867, network: "AIRTEL", category: "GIFTING", name: "Airtel 25GB 30 Days", productCode: "airtel_25gb30days", costPrice: 7840, price: calculateSellingPrice(7840), validity: "30 Days", capacity: "25GB", isActive: true },
  { planId: 868, network: "AIRTEL", category: "GIFTING", name: "Airtel 35GB 30 Days", productCode: "airtel_35gb30days", costPrice: 9800, price: calculateSellingPrice(9800), validity: "30 Days", capacity: "35GB", isActive: true },
  { planId: 869, network: "AIRTEL", category: "GIFTING", name: "Airtel 60GB 30 Days", productCode: "airtel_60gb30days", costPrice: 14700, price: calculateSellingPrice(14700), validity: "30 Days", capacity: "60GB", isActive: true },
  { planId: 870, network: "AIRTEL", category: "GIFTING", name: "Airtel 100GB 30 Days", productCode: "airtel_100gb30days", costPrice: 19600, price: calculateSellingPrice(19600), validity: "30 Days", capacity: "100GB", isActive: true },
  { planId: 871, network: "AIRTEL", category: "GIFTING", name: "Airtel 160GB 30 Days", productCode: "airtel_160gb30days", costPrice: 29400, price: calculateSellingPrice(29400), validity: "30 Days", capacity: "160GB", isActive: true },
  { planId: 872, network: "AIRTEL", category: "GIFTING", name: "Airtel 210GB 30 Days", productCode: "airtel_210gb30days", costPrice: 39200, price: calculateSellingPrice(39200), validity: "30 Days", capacity: "210GB", isActive: true },
  { planId: 873, network: "AIRTEL", category: "GIFTING", name: "Airtel 300GB 90 Days", productCode: "airtel_300gb90days", costPrice: 49000, price: calculateSellingPrice(49000), validity: "90 Days", capacity: "300GB", isActive: true },
  { planId: 874, network: "AIRTEL", category: "GIFTING", name: "Airtel 650GB 365 Days", productCode: "airtel_650gb365days", costPrice: 98000, price: calculateSellingPrice(98000), validity: "365 Days", capacity: "650GB", isActive: true },

  // ==========================================
  // 3. MTN DIRECT GIFTING
  // ==========================================
  { planId: 110, network: "MTN", category: "GIFTING", name: "MTN 10GB 30 Days", productCode: "mtn_10gb_30days", costPrice: 4477.5, price: calculateSellingPrice(4477.5), validity: "30 Days", capacity: "10GB", isActive: true },
  { planId: 876, network: "MTN", category: "GIFTING", name: "MTN 2.7GB 30 Days", productCode: "mtn_2_7gb_30days", costPrice: 1990, price: calculateSellingPrice(1990), validity: "30 Days", capacity: "2.7GB", isActive: true },
  { planId: 883, network: "MTN", category: "GIFTING", name: "MTN 20GB 30 Days", productCode: "mtn_20gb_30days", costPrice: 7462.5, price: calculateSellingPrice(7462.5), validity: "30 Days", capacity: "20GB", isActive: true },
  { planId: 884, network: "MTN", category: "GIFTING", name: "MTN 25GB 30 Days", productCode: "mtn_25gb_30days", costPrice: 8955, price: calculateSellingPrice(8955), validity: "30 Days", capacity: "25GB", isActive: true },
  { planId: 886, network: "MTN", category: "GIFTING", name: "MTN 75GB 30 Days", productCode: "mtn_75gb_30days", costPrice: 17910, price: calculateSellingPrice(17910), validity: "30 Days", capacity: "75GB", isActive: true },
  { planId: 888, network: "MTN", category: "GIFTING", name: "MTN 250GB 30 Days", productCode: "mtn_250gb_30days", costPrice: 54725, price: calculateSellingPrice(54725), validity: "30 Days", capacity: "250GB", isActive: true },
  { planId: 889, network: "MTN", category: "GIFTING", name: "MTN 90GB 60 Days", productCode: "mtn_90gb_60days", costPrice: 24875, price: calculateSellingPrice(24875), validity: "60 Days", capacity: "90GB", isActive: true },
  { planId: 890, network: "MTN", category: "GIFTING", name: "MTN 200GB 60 Days", productCode: "mtn_200gb_60days", costPrice: 49750, price: calculateSellingPrice(49750), validity: "60 Days", capacity: "200GB", isActive: true },
  { planId: 891, network: "MTN", category: "GIFTING", name: "MTN 150GB 60 Days", productCode: "mtn_150gb_60days", costPrice: 39800, price: calculateSellingPrice(39800), validity: "60 Days", capacity: "150GB", isActive: true },
  { planId: 923, network: "MTN", category: "GIFTING", name: "MTN 2GB 30 Days", productCode: "mtn_2gb_30days", costPrice: 1492.5, price: calculateSellingPrice(1492.5), validity: "30 Days", capacity: "2GB", isActive: true },
  { planId: 928, network: "MTN", category: "GIFTING", name: "MTN 3.5GB 30 Days", productCode: "mtn_3_5gb_30days", costPrice: 2487.5, price: calculateSellingPrice(2487.5), validity: "30 Days", capacity: "3.5GB", isActive: true },
  { planId: 932, network: "MTN", category: "GIFTING", name: "MTN 12.5GB 30 Days", productCode: "mtn_12_5gb_30days", costPrice: 5472.5, price: calculateSellingPrice(5472.5), validity: "30 Days", capacity: "12.5GB", isActive: true },
  { planId: 934, network: "MTN", category: "GIFTING", name: "MTN 16.5GB 30 Days", productCode: "mtn_16_5gb_30days", costPrice: 6467.5, price: calculateSellingPrice(6467.5), validity: "30 Days", capacity: "16.5GB", isActive: true },
  { planId: 935, network: "MTN", category: "GIFTING", name: "MTN 36GB 30 Days", productCode: "mtn_36gb_30days", costPrice: 10945, price: calculateSellingPrice(10945), validity: "30 Days", capacity: "36GB", isActive: true },
  { planId: 936, network: "MTN", category: "GIFTING", name: "MTN 165GB 30 Days", productCode: "mtn_165gb_30days", costPrice: 34825, price: calculateSellingPrice(34825), validity: "30 Days", capacity: "165GB", isActive: true },
  { planId: 937, network: "MTN", category: "GIFTING", name: "MTN 7GB 30 Days", productCode: "mtn_7gb_30days", costPrice: 3482.5, price: calculateSellingPrice(3482.5), validity: "30 Days", capacity: "7GB", isActive: true },
  { planId: 975, network: "MTN", category: "GIFTING", name: "MTN 800GB 365 Days", productCode: "mtn_800gb_365days", costPrice: 124375, price: calculateSellingPrice(124375), validity: "365 Days", capacity: "800GB", isActive: true },

  // ==========================================
  // 4. MTN SME
  // ==========================================
  { planId: 7, network: "MTN", category: "SME", name: "MTN SME 1GB", productCode: "mtn_sme_1gb", costPrice: 400, price: calculateSellingPrice(400), validity: "30 Days", capacity: "1GB", isActive: true },
  { planId: 8, network: "MTN", category: "SME", name: "MTN SME 2GB", productCode: "mtn_sme_2gb", costPrice: 700, price: calculateSellingPrice(700), validity: "30 Days", capacity: "2GB", isActive: true },
  { planId: 9, network: "MTN", category: "SME", name: "MTN SME 5GB", productCode: "mtn_sme_5gb", costPrice: 1750, price: calculateSellingPrice(1750), validity: "30 Days", capacity: "5GB", isActive: true },
  { planId: 279, network: "MTN", category: "SME", name: "MTN SME 500MB", productCode: "mtn_sme_500mb", costPrice: 280, price: calculateSellingPrice(280), validity: "30 Days", capacity: "500MB", isActive: true },
  { planId: 496, network: "MTN", category: "SME", name: "MTN SME 3GB", productCode: "mtn_sme_3gb", costPrice: 1050, price: calculateSellingPrice(1050), validity: "30 Days", capacity: "3GB", isActive: true },
  { planId: 509, network: "MTN", category: "SME", name: "MTN SME 10GB", productCode: "mtn_sme_10gb", costPrice: 3500, price: calculateSellingPrice(3500), validity: "30 Days", capacity: "10GB", isActive: true },
  { planId: 1002, network: "MTN", category: "SME", name: "MTN SME 1GB Monthly", productCode: "mtn_sme_1gb_monthly", costPrice: 520, price: calculateSellingPrice(520), validity: "30 Days", capacity: "1GB", isActive: true },
  { planId: 1016, network: "MTN", category: "SME", name: "MTN 1GB 30 Days Awoof", productCode: "mtn_1gb_30days_awoof", costPrice: 235, price: calculateSellingPrice(235), validity: "30 Days", capacity: "1GB", isActive: true },

  // ==========================================
  // 5. GLO CORPORATE (CG)
  // ==========================================
  { planId: 686, network: "GLO", category: "CORPORATE", name: "Glo CG 200MB 14 Days", productCode: "glo_cg_200mb14days", costPrice: 81, price: calculateSellingPrice(81), validity: "14 Days", capacity: "200MB", isActive: true },
  { planId: 688, network: "GLO", category: "CORPORATE", name: "Glo CG 500MB 30 Days", productCode: "glo_cg_500mb30days", costPrice: 202.5, price: calculateSellingPrice(202.5), validity: "30 Days", capacity: "500MB", isActive: true },
  { planId: 689, network: "GLO", category: "CORPORATE", name: "Glo CG 1GB 30 Days", productCode: "glo_cg_1gb30days", costPrice: 405, price: calculateSellingPrice(405), validity: "30 Days", capacity: "1GB", isActive: true },
  { planId: 690, network: "GLO", category: "CORPORATE", name: "Glo CG 2GB 30 Days", productCode: "glo_cg_2gb30days", costPrice: 810, price: calculateSellingPrice(810), validity: "30 Days", capacity: "2GB", isActive: true },
  { planId: 691, network: "GLO", category: "CORPORATE", name: "Glo CG 3GB 30 Days", productCode: "glo_cg_3gb30days", costPrice: 1215, price: calculateSellingPrice(1215), validity: "30 Days", capacity: "3GB", isActive: true },
  { planId: 692, network: "GLO", category: "CORPORATE", name: "Glo CG 5GB 30 Days", productCode: "glo_cg_5gb30days", costPrice: 2025, price: calculateSellingPrice(2025), validity: "30 Days", capacity: "5GB", isActive: true },
  { planId: 693, network: "GLO", category: "CORPORATE", name: "Glo CG 10GB 30 Days", productCode: "glo_cg_10gb30days", costPrice: 4050, price: calculateSellingPrice(4050), validity: "30 Days", capacity: "10GB", isActive: true },
  { planId: 991, network: "GLO", category: "CORPORATE", name: "Glo CG 1GB 3 Days", productCode: "glo_cg_1gb3days", costPrice: 355, price: calculateSellingPrice(355), validity: "3 Days", capacity: "1GB", isActive: true },
  { planId: 992, network: "GLO", category: "CORPORATE", name: "Glo CG 3GB 3 Days", productCode: "glo_cg_3gb3days", costPrice: 1065, price: calculateSellingPrice(1065), validity: "3 Days", capacity: "3GB", isActive: true },
  { planId: 993, network: "GLO", category: "CORPORATE", name: "Glo CG 5GB 3 Days", productCode: "glo_cg_5gb3days", costPrice: 1775, price: calculateSellingPrice(1775), validity: "3 Days", capacity: "5GB", isActive: true },
  { planId: 994, network: "GLO", category: "CORPORATE", name: "Glo CG 1GB 7 Days", productCode: "glo_cg_1gb7days", costPrice: 370, price: calculateSellingPrice(370), validity: "7 Days", capacity: "1GB", isActive: true },
  { planId: 995, network: "GLO", category: "CORPORATE", name: "Glo CG 3GB 7 Days", productCode: "glo_cg_3gb7days", costPrice: 1110, price: calculateSellingPrice(1110), validity: "7 Days", capacity: "3GB", isActive: true },
  { planId: 996, network: "GLO", category: "CORPORATE", name: "Glo CG 5GB 7 Days", productCode: "glo_cg_5gb7days", costPrice: 1850, price: calculateSellingPrice(1850), validity: "7 Days", capacity: "5GB", isActive: true },

  // ==========================================
  // 6. MTN DATA SHARE
  // ==========================================
  { planId: 802, network: "MTN", category: "DATA_SHARE", name: "MTN 5GB Data Share", productCode: "mtn_5gb_data_share", costPrice: 1650, price: calculateSellingPrice(1650), validity: "30 Days", capacity: "5GB", isActive: true },
  { planId: 803, network: "MTN", category: "DATA_SHARE", name: "MTN 3GB Data Share", productCode: "mtn_3gb_data_share", costPrice: 1250, price: calculateSellingPrice(1250), validity: "30 Days", capacity: "3GB", isActive: true },
  { planId: 804, network: "MTN", category: "DATA_SHARE", name: "MTN 2GB Data Share", productCode: "mtn_2gb_data_share", costPrice: 750, price: calculateSellingPrice(750), validity: "30 Days", capacity: "2GB", isActive: true },
  { planId: 805, network: "MTN", category: "DATA_SHARE", name: "MTN 1GB Data Share", productCode: "mtn_1gb_data_share", costPrice: 400, price: calculateSellingPrice(400), validity: "30 Days", capacity: "1GB", isActive: true },
  { planId: 806, network: "MTN", category: "DATA_SHARE", name: "MTN 500MB Data Share", productCode: "mtn_500mb_data_share", costPrice: 280, price: calculateSellingPrice(280), validity: "30 Days", capacity: "500MB", isActive: true },
  { planId: 1001, network: "MTN", category: "DATA_SHARE", name: "MTN 1GB Data Share 30 Days", productCode: "mtn_1gb_data_share_30days", costPrice: 520, price: calculateSellingPrice(520), validity: "30 Days", capacity: "1GB", isActive: true },
  { planId: 1003, network: "MTN", category: "DATA_SHARE", name: "MTN 3GB Data Share 7 Days", productCode: "mtn_3gb_data_share_7days", costPrice: 1150, price: calculateSellingPrice(1150), validity: "7 Days", capacity: "3GB", isActive: true },
  { planId: 1004, network: "MTN", category: "DATA_SHARE", name: "MTN 2GB Data Share 7 Days", productCode: "mtn_2gb_data_share_7days", costPrice: 700, price: calculateSellingPrice(700), validity: "7 Days", capacity: "2GB", isActive: true },

  // ==========================================
  // 7. AIRTEL SME
  // ==========================================
  { planId: 815, network: "AIRTEL", category: "SME", name: "Airtel 10GB 30 Days", productCode: "airtel_sme_10gb30days", costPrice: 3350, price: calculateSellingPrice(3350), validity: "30 Days", capacity: "10GB", isActive: true },
  { planId: 820, network: "AIRTEL", category: "SME", name: "Airtel 1.5GB 7 Days", productCode: "airtel_sme_1_5gb7days", costPrice: 1100, price: calculateSellingPrice(1100), validity: "7 Days", capacity: "1.5GB", isActive: true },
  { planId: 859, network: "AIRTEL", category: "SME", name: "Airtel 10GB 7 Days", productCode: "airtel_sme_10gb7days", costPrice: 3300, price: calculateSellingPrice(3300), validity: "7 Days", capacity: "10GB", isActive: true },
  { planId: 861, network: "AIRTEL", category: "SME", name: "Airtel 18GB 7 Days", productCode: "airtel_sme_18gb7days", costPrice: 5500, price: calculateSellingPrice(5500), validity: "7 Days", capacity: "18GB", isActive: true },
  { planId: 895, network: "AIRTEL", category: "SME", name: "Airtel 600MB 2 Days", productCode: "airtel_sme_600mb2days", costPrice: 245, price: calculateSellingPrice(245), validity: "2 Days", capacity: "600MB", isActive: true },
  { planId: 899, network: "AIRTEL", category: "SME", name: "Airtel 6GB 7 Days", productCode: "airtel_sme_6gb7days", costPrice: 2750, price: calculateSellingPrice(2750), validity: "7 Days", capacity: "6GB", isActive: true },
  { planId: 904, network: "AIRTEL", category: "SME", name: "Airtel 1GB 1 Day Special", productCode: "airtel_sme_1gb1dayspecial", costPrice: 540, price: calculateSellingPrice(540), validity: "1 Day", capacity: "1GB", isActive: true },
  { planId: 905, network: "AIRTEL", category: "SME", name: "Airtel 1.5GB 2 Days Special", productCode: "airtel_sme_1_5gb2dayspecial", costPrice: 670, price: calculateSellingPrice(670), validity: "2 Days", capacity: "1.5GB", isActive: true },
  { planId: 906, network: "AIRTEL", category: "SME", name: "Airtel 2GB 2 Days Special", productCode: "airtel_sme_2gb2dayspecial", costPrice: 850, price: calculateSellingPrice(850), validity: "2 Days", capacity: "2GB", isActive: true },
  { planId: 907, network: "AIRTEL", category: "SME", name: "Airtel 3GB 2 Days Special", productCode: "airtel_sme_3gb2dayspecial", costPrice: 1100, price: calculateSellingPrice(1100), validity: "2 Days", capacity: "3GB", isActive: true },
  { planId: 911, network: "AIRTEL", category: "SME", name: "Airtel 3.5GB 7 Days", productCode: "airtel_sme_3_5gb7days", costPrice: 1600, price: calculateSellingPrice(1600), validity: "7 Days", capacity: "3.5GB", isActive: true },
  { planId: 912, network: "AIRTEL", category: "SME", name: "Airtel 5GB 2 Days", productCode: "airtel_sme_5gb2days", costPrice: 1600, price: calculateSellingPrice(1600), validity: "2 Days", capacity: "5GB", isActive: true },
  { planId: 915, network: "AIRTEL", category: "SME", name: "Airtel 300MB 2 Days", productCode: "airtel_sme_300mb2days", costPrice: 130, price: calculateSellingPrice(130), validity: "2 Days", capacity: "300MB", isActive: true },
  { planId: 978, network: "AIRTEL", category: "SME", name: "Airtel 150MB 1 Day", productCode: "airtel_sme_150mb1day", costPrice: 66, price: calculateSellingPrice(66), validity: "1 Day", capacity: "150MB", isActive: true },
  { planId: 979, network: "AIRTEL", category: "SME", name: "Airtel 1.5GB 7 Days Social", productCode: "airtel_sme_1_5gb7days_social", costPrice: 535, price: calculateSellingPrice(535), validity: "7 Days", capacity: "1.5GB", isActive: true },
  { planId: 985, network: "AIRTEL", category: "SME", name: "Airtel 1GB 3 Days Social", productCode: "airtel_sme_1gb3days_social", costPrice: 325, price: calculateSellingPrice(325), validity: "3 Days", capacity: "1GB", isActive: true },
  { planId: 989, network: "AIRTEL", category: "SME", name: "Airtel 1.5GB 1 Day", productCode: "airtel_sme_1_5gb1day", costPrice: 435, price: calculateSellingPrice(435), validity: "1 Day", capacity: "1.5GB", isActive: true },
  { planId: 990, network: "AIRTEL", category: "SME", name: "Airtel 4GB 2 Days", productCode: "airtel_sme_4gb2days", costPrice: 900, price: calculateSellingPrice(900), validity: "2 Days", capacity: "4GB", isActive: true },
  { planId: 998, network: "AIRTEL", category: "SME", name: "Airtel 13GB 30 Days", productCode: "airtel_sme_13gb30days", costPrice: 6000, price: calculateSellingPrice(6000), validity: "30 Days", capacity: "13GB", isActive: true },
  { planId: 1008, network: "AIRTEL", category: "SME", name: "Airtel 60GB 60 Days", productCode: "airtel_sme_60gb60days", costPrice: 11000, price: calculateSellingPrice(11000), validity: "60 Days", capacity: "60GB", isActive: true },
  { planId: 1012, network: "AIRTEL", category: "SME", name: "Airtel 2GB 2 Days", productCode: "airtel_sme_2gb2days", costPrice: 680, price: calculateSellingPrice(680), validity: "2 Days", capacity: "2GB", isActive: true },
  { planId: 1013, network: "AIRTEL", category: "SME", name: "Airtel 3GB 2 Days", productCode: "airtel_sme_3gb2days", costPrice: 890, price: calculateSellingPrice(890), validity: "2 Days", capacity: "3GB", isActive: true },

  // ==========================================
  // 8. GLO AWOOF
  // ==========================================
  { planId: 900, network: "GLO", category: "AWOOF", name: "Glo 750MB 1 Day", productCode: "glo_awoof_750mb1day", costPrice: 186, price: calculateSellingPrice(186), validity: "1 Day", capacity: "750MB", isActive: true },
  { planId: 901, network: "GLO", category: "AWOOF", name: "Glo 1.5GB 1 Day", productCode: "glo_awoof_1_5gb1day", costPrice: 279, price: calculateSellingPrice(279), validity: "1 Day", capacity: "1.5GB", isActive: true },
  { planId: 902, network: "GLO", category: "AWOOF", name: "Glo 2.5GB 2 Days", productCode: "glo_awoof_2_5gb2days", costPrice: 465, price: calculateSellingPrice(465), validity: "2 Days", capacity: "2.5GB", isActive: true },
  { planId: 903, network: "GLO", category: "AWOOF", name: "Glo 10GB 7 Days", productCode: "glo_awoof_10gb7days", costPrice: 1860, price: calculateSellingPrice(1860), validity: "7 Days", capacity: "10GB", isActive: true },

  // ==========================================
  // 9. MTN AWOOF
  // ==========================================
  { planId: 828, network: "MTN", category: "AWOOF", name: "MTN 1GB 1 Day", productCode: "mtn_awoof_1gb1day", costPrice: 495, price: calculateSellingPrice(495), validity: "1 Day", capacity: "1GB", isActive: true },
  { planId: 855, network: "MTN", category: "AWOOF", name: "MTN 3.2GB 2 Days", productCode: "mtn_awoof_3_2gb2days", costPrice: 990, price: calculateSellingPrice(990), validity: "2 Days", capacity: "3.2GB", isActive: true },
  { planId: 858, network: "MTN", category: "AWOOF", name: "MTN 2.5GB 2 Days", productCode: "mtn_awoof_2_5gb2days", costPrice: 891, price: calculateSellingPrice(891), validity: "2 Days", capacity: "2.5GB", isActive: true },
  { planId: 862, network: "MTN", category: "AWOOF", name: "MTN 2GB 2 Days", productCode: "mtn_awoof_2gb2days", costPrice: 742.5, price: calculateSellingPrice(742.5), validity: "2 Days", capacity: "2GB", isActive: true },
  { planId: 916, network: "MTN", category: "AWOOF", name: "MTN 750MB 3 Days", productCode: "mtn_awoof_750mb3days", costPrice: 445.5, price: calculateSellingPrice(445.5), validity: "3 Days", capacity: "750MB", isActive: true },
  { planId: 920, network: "MTN", category: "AWOOF", name: "MTN 1GB 7 Days", productCode: "mtn_awoof_1gb7days", costPrice: 792, price: calculateSellingPrice(792), validity: "7 Days", capacity: "1GB", isActive: true },
  { planId: 921, network: "MTN", category: "AWOOF", name: "MTN 1.5GB 7 Days", productCode: "mtn_awoof_1_5gb7days", costPrice: 990, price: calculateSellingPrice(990), validity: "7 Days", capacity: "1.5GB", isActive: true },
  { planId: 922, network: "MTN", category: "AWOOF", name: "MTN 1.2GB 7 Days", productCode: "mtn_awoof_1_2gb7days", costPrice: 742.5, price: calculateSellingPrice(742.5), validity: "7 Days", capacity: "1.2GB", isActive: true },
  { planId: 924, network: "MTN", category: "AWOOF", name: "MTN 6GB 7 Days", productCode: "mtn_awoof_6gb7days", costPrice: 2475, price: calculateSellingPrice(2475), validity: "7 Days", capacity: "6GB", isActive: true },
  { planId: 925, network: "MTN", category: "AWOOF", name: "MTN 11GB 7 Days", productCode: "mtn_awoof_11gb7days", costPrice: 3465, price: calculateSellingPrice(3465), validity: "7 Days", capacity: "11GB", isActive: true },
  { planId: 926, network: "MTN", category: "AWOOF", name: "MTN 110MB 1 Day", productCode: "mtn_awoof_110mb1day", costPrice: 99, price: calculateSellingPrice(99), validity: "1 Day", capacity: "110MB", isActive: true },
  { planId: 929, network: "MTN", category: "AWOOF", name: "MTN 500MB 7 Days", productCode: "mtn_awoof_500mb7days", costPrice: 495, price: calculateSellingPrice(495), validity: "7 Days", capacity: "500MB", isActive: true },
  { planId: 930, network: "MTN", category: "AWOOF", name: "6.75GB Xtra-Special 30 Days", productCode: "mtn_awoof_6_75gb30days", costPrice: 2970, price: calculateSellingPrice(2970), validity: "30 Days", capacity: "6.75GB", isActive: true },
  { planId: 931, network: "MTN", category: "AWOOF", name: "14.5GB Xtra-Special 30 Days", productCode: "mtn_awoof_14_5gb30days", costPrice: 4950, price: calculateSellingPrice(4950), validity: "30 Days", capacity: "14.5GB", isActive: true },
  { planId: 938, network: "MTN", category: "AWOOF", name: "MTN 1.5GB 2 Days", productCode: "mtn_awoof_1_5gb2days", costPrice: 594, price: calculateSellingPrice(594), validity: "2 Days", capacity: "1.5GB", isActive: true },
  { planId: 964, network: "MTN", category: "AWOOF", name: "1.8GB ThryveData 30 Days", productCode: "mtn_awoof_1_8gb30days", costPrice: 1485, price: calculateSellingPrice(1485), validity: "30 Days", capacity: "1.8GB", isActive: true },
  { planId: 965, network: "MTN", category: "AWOOF", name: "MTN 1.2GB All Social 30 Days", productCode: "mtn_awoof_1_2gb_social30days", costPrice: 445.5, price: calculateSellingPrice(445.5), validity: "30 Days", capacity: "1.2GB", isActive: true },
  { planId: 974, network: "MTN", category: "AWOOF", name: "MTN 20GB 7 Days", productCode: "mtn_awoof_20gb7days", costPrice: 4950, price: calculateSellingPrice(4950), validity: "7 Days", capacity: "20GB", isActive: true },
  { planId: 976, network: "MTN", category: "AWOOF", name: "MTN 500MB 1 Day", productCode: "mtn_awoof_500mb1day", costPrice: 346.5, price: calculateSellingPrice(346.5), validity: "1 Day", capacity: "500MB", isActive: true },
  { planId: 984, network: "MTN", category: "AWOOF", name: "MTN 2.5GB 1 Day", productCode: "mtn_awoof_2_5gb1day", costPrice: 742.5, price: calculateSellingPrice(742.5), validity: "1 Day", capacity: "2.5GB", isActive: true },
  { planId: 999, network: "MTN", category: "AWOOF", name: "MTN 3.5GB 7 Days", productCode: "mtn_awoof_3_5gb7days", costPrice: 1485, price: calculateSellingPrice(1485), validity: "7 Days", capacity: "3.5GB", isActive: true },
  { planId: 1010, network: "MTN", category: "AWOOF", name: "MTN 1GB 1 Day LTE", productCode: "mtn_awoof_1gb1day_lte", costPrice: 250.47, price: calculateSellingPrice(250.47), validity: "1 Day", capacity: "1GB", isActive: true },
  { planId: 1014, network: "MTN", category: "AWOOF", name: "MTN 1GB 30 Day", productCode: "mtn_awoof_1gb30day", costPrice: 235.62, price: calculateSellingPrice(235.62), validity: "30 Days", capacity: "1GB", isActive: true },

  // ==========================================
  // 10. AIRTEL SME LTE / LITE
  // ==========================================
  { planId: 967, network: "AIRTEL", category: "LITE", name: "Airtel 1GB 7 Days Lite", productCode: "airtel_sme_1gb7days_lite", costPrice: 779, price: calculateSellingPrice(779), validity: "7 Days", capacity: "1GB", isActive: true },
  { planId: 968, network: "AIRTEL", category: "LITE", name: "Airtel 2GB 30 Days Lite", productCode: "airtel_sme_2gb30days_lite", costPrice: 1558, price: calculateSellingPrice(1558), validity: "30 Days", capacity: "2GB", isActive: true },
  { planId: 969, network: "AIRTEL", category: "LITE", name: "Airtel 3GB 30 Days Lite", productCode: "airtel_sme_3gb30days_lite", costPrice: 2337, price: calculateSellingPrice(2337), validity: "30 Days", capacity: "3GB", isActive: true },
  { planId: 971, network: "AIRTEL", category: "LITE", name: "Airtel 8GB 30 Days Lite", productCode: "airtel_sme_8gb30days_lite", costPrice: 6232, price: calculateSellingPrice(6232), validity: "30 Days", capacity: "8GB", isActive: true },
  { planId: 972, network: "AIRTEL", category: "LITE", name: "Airtel 10GB 30 Days Lite", productCode: "airtel_sme_10gb30days_lite", costPrice: 7790, price: calculateSellingPrice(7790), validity: "30 Days", capacity: "10GB", isActive: true },
];

/**
 * Ensures all plans exist in database, deactivates retired plans, and updates pricing & metadata
 */
export async function ensureDataPlansSeeded(prisma: PrismaClient) {
  try {
    const validPlanIds = DATA_PLANS_SEED.map((p) => p.planId);

    // 1. Deactivate plans no longer offered upstream
    await prisma.mobileDataPlan.updateMany({
      where: {
        planId: { notIn: validPlanIds },
      },
      data: {
        isActive: false,
      },
    });

    // 2. Upsert valid active plans
    for (const plan of DATA_PLANS_SEED) {
      await prisma.mobileDataPlan.upsert({
        where: { planId: plan.planId },
        update: {
          name: plan.name,
          productCode: plan.productCode,
          network: plan.network,
          category: plan.category,
          validity: plan.validity,
          capacity: plan.capacity,
          costPrice: plan.costPrice,
          price: plan.price,
          isActive: true,
        },
        create: {
          planId: plan.planId,
          network: plan.network,
          category: plan.category,
          name: plan.name,
          productCode: plan.productCode,
          price: plan.price,
          costPrice: plan.costPrice,
          validity: plan.validity,
          capacity: plan.capacity,
          isActive: plan.isActive,
        },
      });
    }
  } catch (error) {
    console.error("ensureDataPlansSeeded error:", error);
  }
}

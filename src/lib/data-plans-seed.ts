import { PrismaClient } from "@prisma/client";

export interface DataPlanSeedItem {
  planId: number;
  network: "MTN" | "GLO" | "AIRTEL" | "9MOBILE";
  category: "SME" | "DATA_SHARE" | "GIFTING" | "CORPORATE" | "AWOOF" | "LITE" | "COUPON" | "CLOUD";
  name: string;
  productCode: string;
  price: number;
  costPrice: number;
  validity: string;
  capacity: string;
  isActive: boolean;
}

export const DATA_PLANS_SEED: DataPlanSeedItem[] = [
  // ==========================================
  // 1. MTN DIRECT DATA
  // ==========================================
  { planId: 113, network: "MTN", category: "GIFTING", name: "MTN 17GB 30 Days", productCode: "mtn_17gb30days", price: 6200, costPrice: 5500, validity: "30 Days", capacity: "17GB", isActive: true },
  { planId: 346, network: "MTN", category: "GIFTING", name: "MTN 250GB 90 Days", productCode: "mtn_250gb_90days", price: 72000, costPrice: 65000, validity: "90 Days", capacity: "250GB", isActive: true },
  { planId: 461, network: "MTN", category: "GIFTING", name: "MTN 20GB 30 Days", productCode: "mtn_20gb30days", price: 7300, costPrice: 6500, validity: "30 Days", capacity: "20GB", isActive: true },
  { planId: 462, network: "MTN", category: "GIFTING", name: "MTN 120GB 30 Days", productCode: "mtn_120gb30days", price: 36000, costPrice: 32000, validity: "30 Days", capacity: "120GB", isActive: true },
  { planId: 482, network: "MTN", category: "GIFTING", name: "MTN 30GB 60 Days", productCode: "mtn_30gb60days", price: 10800, costPrice: 9500, validity: "60 Days", capacity: "30GB", isActive: true },
  { planId: 755, network: "MTN", category: "GIFTING", name: "MTN 25GB 30 Days", productCode: "mtn_25gb30days", price: 9000, costPrice: 8000, validity: "30 Days", capacity: "25GB", isActive: true },
  { planId: 788, network: "MTN", category: "GIFTING", name: "MTN 1TB 365 Days", productCode: "mtn_1tb365days", price: 135000, costPrice: 120000, validity: "365 Days", capacity: "1TB", isActive: true },
  { planId: 791, network: "MTN", category: "GIFTING", name: "MTN 200GB 30 Days", productCode: "mtn_200gb30days", price: 56000, costPrice: 50000, validity: "30 Days", capacity: "200GB", isActive: true },
  { planId: 792, network: "MTN", category: "GIFTING", name: "MTN 100GB 60 Days", productCode: "mtn_100gb60days", price: 29500, costPrice: 26000, validity: "60 Days", capacity: "100GB", isActive: true },
  { planId: 793, network: "MTN", category: "GIFTING", name: "MTN 160GB 60 Days", productCode: "mtn_160gb60days", price: 45000, costPrice: 40000, validity: "60 Days", capacity: "160GB", isActive: true },
  { planId: 799, network: "MTN", category: "GIFTING", name: "MTN 1GB 1 Day", productCode: "mtn_1gb1_day", price: 350, costPrice: 300, validity: "1 Day", capacity: "1GB", isActive: true },
  { planId: 800, network: "MTN", category: "GIFTING", name: "MTN 3.5GB 2 Days", productCode: "mtn_3_5gb2_days", price: 1050, costPrice: 900, validity: "2 Days", capacity: "3.5GB", isActive: true },
  { planId: 801, network: "MTN", category: "GIFTING", name: "MTN 15GB 7 Days", productCode: "mtn_15gb7_days", price: 4600, costPrice: 4000, validity: "7 Days", capacity: "15GB", isActive: true },

  // ==========================================
  // 2. GLO DIRECT GIFTING
  // ==========================================
  { planId: 940, network: "GLO", category: "GIFTING", name: "Glo 2.6GB 30 Days", productCode: "glo_2_6gb30days", price: 1050, costPrice: 930, validity: "30 Days", capacity: "2.6GB", isActive: true },
  { planId: 941, network: "GLO", category: "GIFTING", name: "Glo 5GB 30 Days", productCode: "glo_5gb30days", price: 1550, costPrice: 1395, validity: "30 Days", capacity: "5GB", isActive: true },
  { planId: 942, network: "GLO", category: "GIFTING", name: "Glo 6.15GB 30 Days", productCode: "glo_6_15gb30days", price: 2050, costPrice: 1860, validity: "30 Days", capacity: "6.15GB", isActive: true },
  { planId: 943, network: "GLO", category: "GIFTING", name: "Glo 7.25GB 30 Days", productCode: "glo_7_25gb30days", price: 2550, costPrice: 2325, validity: "30 Days", capacity: "7.25GB", isActive: true },
  { planId: 944, network: "GLO", category: "GIFTING", name: "Glo 10GB 30 Days", productCode: "glo_10gb30days", price: 3050, costPrice: 2790, validity: "30 Days", capacity: "10GB", isActive: true },
  { planId: 945, network: "GLO", category: "GIFTING", name: "Glo 12.5GB 30 Days", productCode: "glo_12_5gb30days", price: 4100, costPrice: 3720, validity: "30 Days", capacity: "12.5GB", isActive: true },
  { planId: 946, network: "GLO", category: "GIFTING", name: "Glo 16GB 30 Days", productCode: "glo_16gb30days", price: 5100, costPrice: 4650, validity: "30 Days", capacity: "16GB", isActive: true },
  { planId: 948, network: "GLO", category: "GIFTING", name: "Glo 28GB 30 Days", productCode: "glo_28gb30days", price: 8100, costPrice: 7440, validity: "30 Days", capacity: "28GB", isActive: true },
  { planId: 949, network: "GLO", category: "GIFTING", name: "Glo 38GB 30 Days", productCode: "glo_38gb30days", price: 10100, costPrice: 9300, validity: "30 Days", capacity: "38GB", isActive: true },
  { planId: 950, network: "GLO", category: "GIFTING", name: "Glo 64GB 30 Days", productCode: "glo_64gb30days", price: 15100, costPrice: 13950, validity: "30 Days", capacity: "64GB", isActive: true },
  { planId: 951, network: "GLO", category: "GIFTING", name: "Glo 107GB 30 Days", productCode: "glo_107gb30days", price: 20100, costPrice: 18600, validity: "30 Days", capacity: "107GB", isActive: true },
  { planId: 952, network: "GLO", category: "GIFTING", name: "Glo 135GB 30 Days", productCode: "glo_135gb30days", price: 25100, costPrice: 23250, validity: "30 Days", capacity: "135GB", isActive: true },
  { planId: 953, network: "GLO", category: "GIFTING", name: "Glo 165GB 30 Days", productCode: "glo_165gb30days", price: 30100, costPrice: 27900, validity: "30 Days", capacity: "165GB", isActive: true },
  { planId: 954, network: "GLO", category: "GIFTING", name: "Glo 220GB 30 Days", productCode: "glo_220gb30days", price: 40100, costPrice: 37200, validity: "30 Days", capacity: "220GB", isActive: true },
  { planId: 955, network: "GLO", category: "GIFTING", name: "Glo 310GB 60 Days", productCode: "glo_310gb60days", price: 50000, costPrice: 46500, validity: "60 Days", capacity: "310GB", isActive: true },
  { planId: 956, network: "GLO", category: "GIFTING", name: "Glo 380GB 90 Days", productCode: "glo_380gb90days", price: 60000, costPrice: 55800, validity: "90 Days", capacity: "380GB", isActive: true },
  { planId: 957, network: "GLO", category: "GIFTING", name: "Glo 475GB 90 Days", productCode: "glo_475gb90days", price: 75000, costPrice: 69750, validity: "90 Days", capacity: "475GB", isActive: true },
  { planId: 958, network: "GLO", category: "GIFTING", name: "Glo 1TB 365 Days", productCode: "glo_1tb365days", price: 149000, costPrice: 139500, validity: "365 Days", capacity: "1TB", isActive: true },

  // ==========================================
  // 3. AIRTEL DIRECT GIFTING
  // ==========================================
  { planId: 409, network: "AIRTEL", category: "GIFTING", name: "Airtel 2GB 30 Days", productCode: "airtel_2gb30days", price: 1650, costPrice: 1470, validity: "30 Days", capacity: "2GB", isActive: true },
  { planId: 410, network: "AIRTEL", category: "GIFTING", name: "Airtel 3GB 30 Days", productCode: "airtel_3gb30days", price: 2180, costPrice: 1960, validity: "30 Days", capacity: "3GB", isActive: true },
  { planId: 521, network: "AIRTEL", category: "GIFTING", name: "Airtel 10GB 30 Days", productCode: "airtel_10gb30days", price: 4350, costPrice: 3920, validity: "30 Days", capacity: "10GB", isActive: true },
  { planId: 817, network: "AIRTEL", category: "GIFTING", name: "Airtel 1GB 7 Days", productCode: "airtel_1gb7_days", price: 900, costPrice: 784, validity: "7 Days", capacity: "1GB", isActive: true },
  { planId: 846, network: "AIRTEL", category: "GIFTING", name: "Airtel 500MB 7 Days", productCode: "airtel_500mb7_days", price: 580, costPrice: 490, validity: "7 Days", capacity: "500MB", isActive: true },
  { planId: 863, network: "AIRTEL", category: "GIFTING", name: "Airtel 4GB 30 Days", productCode: "airtel_4gb30days", price: 2720, costPrice: 2450, validity: "30 Days", capacity: "4GB", isActive: true },
  { planId: 864, network: "AIRTEL", category: "GIFTING", name: "Airtel 8GB 30 Days", productCode: "airtel_8gb30days", price: 3250, costPrice: 2940, validity: "30 Days", capacity: "8GB", isActive: true },
  { planId: 865, network: "AIRTEL", category: "GIFTING", name: "Airtel 13GB 30 Days", productCode: "airtel_13gb30days", price: 5400, costPrice: 4900, validity: "30 Days", capacity: "13GB", isActive: true },
  { planId: 866, network: "AIRTEL", category: "GIFTING", name: "Airtel 18GB 30 Days", productCode: "airtel_18gb30days", price: 6450, costPrice: 5880, validity: "30 Days", capacity: "18GB", isActive: true },
  { planId: 867, network: "AIRTEL", category: "GIFTING", name: "Airtel 25GB 30 Days", productCode: "airtel_25gb30days", price: 8600, costPrice: 7840, validity: "30 Days", capacity: "25GB", isActive: true },
  { planId: 868, network: "AIRTEL", category: "GIFTING", name: "Airtel 35GB 30 Days", productCode: "airtel_35gb30days", price: 10700, costPrice: 9800, validity: "30 Days", capacity: "35GB", isActive: true },
  { planId: 869, network: "AIRTEL", category: "GIFTING", name: "Airtel 60GB 30 Days", productCode: "airtel_60gb30days", price: 16000, costPrice: 14700, validity: "30 Days", capacity: "60GB", isActive: true },
  { planId: 870, network: "AIRTEL", category: "GIFTING", name: "Airtel 100GB 30 Days", productCode: "airtel_100gb30days", price: 21200, costPrice: 19600, validity: "30 Days", capacity: "100GB", isActive: true },
  { planId: 871, network: "AIRTEL", category: "GIFTING", name: "Airtel 160GB 30 Days", productCode: "airtel_160gb30days", price: 31800, costPrice: 29400, validity: "30 Days", capacity: "160GB", isActive: true },
  { planId: 872, network: "AIRTEL", category: "GIFTING", name: "Airtel 210GB 30 Days", productCode: "airtel_210gb30days", price: 42200, costPrice: 39200, validity: "30 Days", capacity: "210GB", isActive: true },
  { planId: 873, network: "AIRTEL", category: "GIFTING", name: "Airtel 300GB 90 Days", productCode: "airtel_300gb90days", price: 52800, costPrice: 49000, validity: "90 Days", capacity: "300GB", isActive: true },
  { planId: 874, network: "AIRTEL", category: "GIFTING", name: "Airtel 650GB 365 Days", productCode: "airtel_650gb365days", price: 105000, costPrice: 98000, validity: "365 Days", capacity: "650GB", isActive: true },

  // ==========================================
  // 4. 9MOBILE DIRECT GIFTING
  // ==========================================
  { planId: 27, network: "9MOBILE", category: "GIFTING", name: "9Mobile 2GB 30 Days", productCode: "etisalat_2gb30days", price: 750, costPrice: 600, validity: "30 Days", capacity: "2GB", isActive: true },
  { planId: 28, network: "9MOBILE", category: "GIFTING", name: "9Mobile 4.5GB 30 Days", productCode: "etisalat_4_5gb30days", price: 1550, costPrice: 1350, validity: "30 Days", capacity: "4.5GB", isActive: true },
  { planId: 30, network: "9MOBILE", category: "GIFTING", name: "9Mobile 11GB 30 Days", productCode: "etisalat_11gb30days", price: 3800, costPrice: 3300, validity: "30 Days", capacity: "11GB", isActive: true },
  { planId: 32, network: "9MOBILE", category: "GIFTING", name: "9Mobile 75GB 30 Days", productCode: "etisalat_75gb30days", price: 20500, costPrice: 18000, validity: "30 Days", capacity: "75GB", isActive: true },
  { planId: 423, network: "9MOBILE", category: "GIFTING", name: "9Mobile 1.5GB 30 Days", productCode: "etisalat_1_5gb30days", price: 550, costPrice: 450, validity: "30 Days", capacity: "1.5GB", isActive: true },
  { planId: 425, network: "9MOBILE", category: "GIFTING", name: "9Mobile 40GB 30 Days", productCode: "etisalat_40gb30days", price: 12500, costPrice: 11000, validity: "30 Days", capacity: "40GB", isActive: true },
  { planId: 427, network: "9MOBILE", category: "GIFTING", name: "9Mobile 3GB 30 Days", productCode: "etisalat_3gb30days", price: 1050, costPrice: 900, validity: "30 Days", capacity: "3GB", isActive: true },
  { planId: 436, network: "9MOBILE", category: "GIFTING", name: "9Mobile 15GB 30 Days", productCode: "etisalat_15gb30days", price: 5200, costPrice: 4500, validity: "30 Days", capacity: "15GB", isActive: true },
  { planId: 493, network: "9MOBILE", category: "GIFTING", name: "9Mobile 75GB 3 Months", productCode: "etisalat_75gb3_months", price: 21000, costPrice: 18500, validity: "90 Days", capacity: "75GB", isActive: true },
  { planId: 494, network: "9MOBILE", category: "GIFTING", name: "9Mobile 165GB 6 Months", productCode: "etisalat_165gb6_months", price: 45000, costPrice: 40000, validity: "180 Days", capacity: "165GB", isActive: true },
  { planId: 495, network: "9MOBILE", category: "GIFTING", name: "9Mobile 365GB 1 Year", productCode: "etisalat_365gb1_year", price: 95000, costPrice: 85000, validity: "365 Days", capacity: "365GB", isActive: true },

  // ==========================================
  // 5. MTN DIRECT GIFTING
  // ==========================================
  { planId: 110, network: "MTN", category: "GIFTING", name: "MTN 10GB 30 Days", productCode: "mtn_10gb_30days", price: 4950, costPrice: 4477.5, validity: "30 Days", capacity: "10GB", isActive: true },
  { planId: 876, network: "MTN", category: "GIFTING", name: "MTN 2.7GB 30 Days", productCode: "mtn_2_7gb_30days", price: 2200, costPrice: 1990, validity: "30 Days", capacity: "2.7GB", isActive: true },
  { planId: 883, network: "MTN", category: "GIFTING", name: "MTN 20GB 30 Days", productCode: "mtn_20gb_30days", price: 8200, costPrice: 7462.5, validity: "30 Days", capacity: "20GB", isActive: true },
  { planId: 884, network: "MTN", category: "GIFTING", name: "MTN 25GB 30 Days", productCode: "mtn_25gb_30days", price: 9800, costPrice: 8955, validity: "30 Days", capacity: "25GB", isActive: true },
  { planId: 886, network: "MTN", category: "GIFTING", name: "MTN 75GB 30 Days", productCode: "mtn_75gb_30days", price: 19500, costPrice: 17910, validity: "30 Days", capacity: "75GB", isActive: true },
  { planId: 888, network: "MTN", category: "GIFTING", name: "MTN 250GB 30 Days", productCode: "mtn_250gb_30days", price: 58500, costPrice: 54725, validity: "30 Days", capacity: "250GB", isActive: true },
  { planId: 889, network: "MTN", category: "GIFTING", name: "MTN 90GB 60 Days", productCode: "mtn_90gb_60days", price: 27000, costPrice: 24875, validity: "60 Days", capacity: "90GB", isActive: true },
  { planId: 890, network: "MTN", category: "GIFTING", name: "MTN 200GB 60 Days", productCode: "mtn_200gb_60days", price: 53500, costPrice: 49750, validity: "60 Days", capacity: "200GB", isActive: true },
  { planId: 891, network: "MTN", category: "GIFTING", name: "MTN 150GB 60 Days", productCode: "mtn_150gb_60days", price: 43000, costPrice: 39800, validity: "60 Days", capacity: "150GB", isActive: true },
  { planId: 923, network: "MTN", category: "GIFTING", name: "MTN 2GB 30 Days", productCode: "mtn_2gb_30days", price: 1680, costPrice: 1492.5, validity: "30 Days", capacity: "2GB", isActive: true },
  { planId: 928, network: "MTN", category: "GIFTING", name: "MTN 3.5GB 30 Days", productCode: "mtn_3_5gb_30days", price: 2750, costPrice: 2487.5, validity: "30 Days", capacity: "3.5GB", isActive: true },
  { planId: 932, network: "MTN", category: "GIFTING", name: "MTN 12.5GB 30 Days", productCode: "mtn_12_5gb_30days", price: 6000, costPrice: 5472.5, validity: "30 Days", capacity: "12.5GB", isActive: true },
  { planId: 934, network: "MTN", category: "GIFTING", name: "MTN 16.5GB 30 Days", productCode: "mtn_16_5gb_30days", price: 7100, costPrice: 6467.5, validity: "30 Days", capacity: "16.5GB", isActive: true },
  { planId: 935, network: "MTN", category: "GIFTING", name: "MTN 36GB 30 Days", productCode: "mtn_36gb_30days", price: 12000, costPrice: 10945, validity: "30 Days", capacity: "36GB", isActive: true },
  { planId: 936, network: "MTN", category: "GIFTING", name: "MTN 165GB 30 Days", productCode: "mtn_165gb_30days", price: 37500, costPrice: 34825, validity: "30 Days", capacity: "165GB", isActive: true },
  { planId: 937, network: "MTN", category: "GIFTING", name: "MTN 7GB 30 Days", productCode: "mtn_7gb_30days", price: 3850, costPrice: 3482.5, validity: "30 Days", capacity: "7GB", isActive: true },
  { planId: 975, network: "MTN", category: "GIFTING", name: "MTN 800GB 365 Days", productCode: "mtn_800gb_365_days", price: 133000, costPrice: 124375, validity: "365 Days", capacity: "800GB", isActive: true },

  // ==========================================
  // 6. MTN SME DATA
  // ==========================================
  { planId: 7, network: "MTN", category: "SME", name: "MTN SME 1GB", productCode: "mtn_sme_1gb", price: 550, costPrice: 480, validity: "30 Days", capacity: "1GB", isActive: true },
  { planId: 8, network: "MTN", category: "SME", name: "MTN SME 2GB", productCode: "data_share_2gb", price: 1250, costPrice: 1100, validity: "30 Days", capacity: "2GB", isActive: true },
  { planId: 9, network: "MTN", category: "SME", name: "MTN SME 5GB", productCode: "data_share_5gb", price: 3050, costPrice: 2750, validity: "30 Days", capacity: "5GB", isActive: true },
  { planId: 279, network: "MTN", category: "SME", name: "MTN SME 500MB", productCode: "mtn_sme_500mb", price: 430, costPrice: 365, validity: "30 Days", capacity: "500MB", isActive: true },
  { planId: 496, network: "MTN", category: "SME", name: "MTN SME 3GB", productCode: "data_share_3gb", price: 1850, costPrice: 1650, validity: "30 Days", capacity: "3GB", isActive: true },
  { planId: 509, network: "MTN", category: "SME", name: "MTN SME 10GB", productCode: "data_share_10gb", price: 6100, costPrice: 5500, validity: "30 Days", capacity: "10GB", isActive: true },
  { planId: 1002, network: "MTN", category: "SME", name: "MTN SME 1GB Monthly", productCode: "mtn_sme_1gb_monthly", price: 680, costPrice: 590, validity: "30 Days", capacity: "1GB", isActive: true },

  // ==========================================
  // 7. GLO CORPORATE / CG DATA
  // ==========================================
  { planId: 686, network: "GLO", category: "CORPORATE", name: "Glo CG 200MB 14 Days", productCode: "glo_cg_200mb_14days", price: 95, costPrice: 79.8, validity: "14 Days", capacity: "200MB", isActive: true },
  { planId: 688, network: "GLO", category: "CORPORATE", name: "Glo CG 500MB 30 Days", productCode: "glo_cg_500mb_30days", price: 240, costPrice: 199.5, validity: "30 Days", capacity: "500MB", isActive: true },
  { planId: 689, network: "GLO", category: "CORPORATE", name: "Glo CG 1GB 30 Days", productCode: "glo_cg_1gb_30days", price: 460, costPrice: 399, validity: "30 Days", capacity: "1GB", isActive: true },
  { planId: 690, network: "GLO", category: "CORPORATE", name: "Glo CG 2GB 30 Days", productCode: "glo_cg_2gb_30days", price: 900, costPrice: 798, validity: "30 Days", capacity: "2GB", isActive: true },
  { planId: 691, network: "GLO", category: "CORPORATE", name: "Glo CG 3GB 30 Days", productCode: "glo_cg_3gb_30days", price: 1350, costPrice: 1197, validity: "30 Days", capacity: "3GB", isActive: true },
  { planId: 692, network: "GLO", category: "CORPORATE", name: "Glo CG 5GB 30 Days", productCode: "glo_cg_5gb_30days", price: 2250, costPrice: 1995, validity: "30 Days", capacity: "5GB", isActive: true },
  { planId: 693, network: "GLO", category: "CORPORATE", name: "Glo CG 10GB 30 Days", productCode: "glo_cg_10gb_30days", price: 4500, costPrice: 3990, validity: "30 Days", capacity: "10GB", isActive: true },
  { planId: 991, network: "GLO", category: "CORPORATE", name: "Glo CG 1GB 3 Days", productCode: "glo_cg_1gb_3_days", price: 320, costPrice: 270, validity: "3 Days", capacity: "1GB", isActive: true },
  { planId: 992, network: "GLO", category: "CORPORATE", name: "Glo CG 3GB 3 Days", productCode: "glo_cg_3gb_3_days", price: 930, costPrice: 810, validity: "3 Days", capacity: "3GB", isActive: true },
  { planId: 993, network: "GLO", category: "CORPORATE", name: "Glo CG 5GB 3 Days", productCode: "glo_cg_5gb_3_days", price: 1550, costPrice: 1350, validity: "3 Days", capacity: "5GB", isActive: true },
  { planId: 994, network: "GLO", category: "CORPORATE", name: "Glo CG 1GB 7 Days", productCode: "glo_cg_1gb_7_days", price: 380, costPrice: 320, validity: "7 Days", capacity: "1GB", isActive: true },
  { planId: 995, network: "GLO", category: "CORPORATE", name: "Glo CG 3GB 7 Days", productCode: "glo_cg_3gb_7_days", price: 1100, costPrice: 960, validity: "7 Days", capacity: "3GB", isActive: true },
  { planId: 996, network: "GLO", category: "CORPORATE", name: "Glo CG 5GB 7 Days", productCode: "glo_cg_5gb_7_days", price: 1800, costPrice: 1600, validity: "7 Days", capacity: "5GB", isActive: true },

  // ==========================================
  // 8. AIRTEL CORPORATE DATA
  // ==========================================
  { planId: 522, network: "AIRTEL", category: "CORPORATE", name: "Airtel 100MB 7 Days", productCode: "airtel_100mb_7days", price: 100, costPrice: 80, validity: "7 Days", capacity: "100MB", isActive: true },
  { planId: 523, network: "AIRTEL", category: "CORPORATE", name: "Airtel 300MB 7 Days", productCode: "airtel_300mb_7days", price: 190, costPrice: 150, validity: "7 Days", capacity: "300MB", isActive: true },
  { planId: 524, network: "AIRTEL", category: "CORPORATE", name: "Airtel 500MB 30 Days", productCode: "airtel_500mb_30days", price: 300, costPrice: 240, validity: "30 Days", capacity: "500MB", isActive: true },
  { planId: 525, network: "AIRTEL", category: "CORPORATE", name: "Airtel 1GB 30 Days", productCode: "airtel_1gb_30days", price: 420, costPrice: 350, validity: "30 Days", capacity: "1GB", isActive: true },

  // ==========================================
  // 9. 9MOBILE SME DATA
  // ==========================================
  { planId: 694, network: "9MOBILE", category: "SME", name: "9Mobile SME 1GB", productCode: "etisalat_sme_1gb", price: 360, costPrice: 300, validity: "30 Days", capacity: "1GB", isActive: true },
  { planId: 695, network: "9MOBILE", category: "SME", name: "9Mobile SME 1.5GB", productCode: "etisalat_sme_1_5gb", price: 530, costPrice: 450, validity: "30 Days", capacity: "1.5GB", isActive: true },
  { planId: 696, network: "9MOBILE", category: "SME", name: "9Mobile SME 2GB", productCode: "etisalat_sme_2gb", price: 700, costPrice: 600, validity: "30 Days", capacity: "2GB", isActive: true },
  { planId: 698, network: "9MOBILE", category: "SME", name: "9Mobile SME 3GB", productCode: "etisalat_sme_3gb", price: 1020, costPrice: 900, validity: "30 Days", capacity: "3GB", isActive: true },
  { planId: 700, network: "9MOBILE", category: "SME", name: "9Mobile SME 5GB", productCode: "etisalat_sme_5gb", price: 1700, costPrice: 1500, validity: "30 Days", capacity: "5GB", isActive: true },
  { planId: 702, network: "9MOBILE", category: "SME", name: "9Mobile SME 10GB", productCode: "etisalat_sme_10gb", price: 3400, costPrice: 3000, validity: "30 Days", capacity: "10GB", isActive: true },
  { planId: 703, network: "9MOBILE", category: "SME", name: "9Mobile SME 15GB", productCode: "etisalat_sme_15gb", price: 5100, costPrice: 4500, validity: "30 Days", capacity: "15GB", isActive: true },
  { planId: 704, network: "9MOBILE", category: "SME", name: "9Mobile SME 20GB", productCode: "etisalat_sme_20gb", price: 6800, costPrice: 6000, validity: "30 Days", capacity: "20GB", isActive: true },
  { planId: 786, network: "9MOBILE", category: "SME", name: "9Mobile SME 50GB", productCode: "etisalat_sme_50gb", price: 16800, costPrice: 15000, validity: "30 Days", capacity: "50GB", isActive: true },
  { planId: 795, network: "9MOBILE", category: "SME", name: "9Mobile SME 500MB", productCode: "etisalat_sme_500mb", price: 190, costPrice: 150, validity: "30 Days", capacity: "500MB", isActive: true },
  { planId: 796, network: "9MOBILE", category: "SME", name: "9Mobile SME 100GB", productCode: "etisalat_sme_100gb", price: 33500, costPrice: 30000, validity: "30 Days", capacity: "100GB", isActive: true },

  // ==========================================
  // 10. MTN CORPORATE DATA
  // ==========================================
  { planId: 497, network: "MTN", category: "CORPORATE", name: "Corporate DATA 10GB", productCode: "corporate_data_10gb", price: 3500, costPrice: 3000, validity: "30 Days", capacity: "10GB", isActive: true },
  { planId: 501, network: "MTN", category: "CORPORATE", name: "Corporate DATA 5GB", productCode: "corporate_data_5gb", price: 1800, costPrice: 1500, validity: "30 Days", capacity: "5GB", isActive: true },
  { planId: 502, network: "MTN", category: "CORPORATE", name: "Corporate DATA 3GB", productCode: "corporate_data_3gb", price: 1100, costPrice: 900, validity: "30 Days", capacity: "3GB", isActive: true },
  { planId: 503, network: "MTN", category: "CORPORATE", name: "Corporate DATA 2GB", productCode: "corporate_data_2gb", price: 750, costPrice: 600, validity: "30 Days", capacity: "2GB", isActive: true },
  { planId: 504, network: "MTN", category: "CORPORATE", name: "Corporate DATA 1GB", productCode: "corporate_data_1gb", price: 380, costPrice: 300, validity: "30 Days", capacity: "1GB", isActive: true },
  { planId: 505, network: "MTN", category: "CORPORATE", name: "Corporate DATA 500MB", productCode: "corporate_data_500mb", price: 210, costPrice: 160, validity: "30 Days", capacity: "500MB", isActive: true },

  // ==========================================
  // 11. MTN DIRECT DATA COUPON
  // ==========================================
  { planId: 763, network: "MTN", category: "COUPON", name: "MTN 3GB 30 Days Coupon", productCode: "mtn_3gb_30_days_coupon", price: 1150, costPrice: 950, validity: "30 Days", capacity: "3GB", isActive: true },
  { planId: 797, network: "MTN", category: "COUPON", name: "MTN 9GB 30 Days Coupon", productCode: "mtn_9gb_30_days_coupon", price: 3100, costPrice: 2700, validity: "30 Days", capacity: "9GB", isActive: true },
  { planId: 798, network: "MTN", category: "COUPON", name: "MTN 12GB 30 Days Coupon", productCode: "mtn_12gb_30_days_coupon", price: 4000, costPrice: 3500, validity: "30 Days", capacity: "12GB", isActive: true },
  { planId: 807, network: "MTN", category: "COUPON", name: "MTN 24GB 30 Days Coupon", productCode: "mtn_24gb_30_days_coupon", price: 7700, costPrice: 6800, validity: "30 Days", capacity: "24GB", isActive: true },
  { planId: 808, network: "MTN", category: "COUPON", name: "MTN 6GB 30 Days Coupon", productCode: "mtn_6gb_30_days_coupon", price: 2100, costPrice: 1800, validity: "30 Days", capacity: "6GB", isActive: true },

  // ==========================================
  // 12. MTN DATA SHARE
  // ==========================================
  { planId: 802, network: "MTN", category: "DATA_SHARE", name: "MTN 5GB Data Share", productCode: "mtn_5gb_data_share", price: 2850, costPrice: 2500, validity: "30 Days", capacity: "5GB", isActive: true },
  { planId: 803, network: "MTN", category: "DATA_SHARE", name: "MTN 3GB Data Share", productCode: "mtn_3gb_data_share", price: 1950, costPrice: 1700, validity: "30 Days", capacity: "3GB", isActive: true },
  { planId: 804, network: "MTN", category: "DATA_SHARE", name: "MTN 2GB Data Share", productCode: "mtn_2gb_data_share", price: 1320, costPrice: 1150, validity: "30 Days", capacity: "2GB", isActive: true },
  { planId: 805, network: "MTN", category: "DATA_SHARE", name: "MTN 1GB Data Share", productCode: "mtn_1gb_data_share", price: 560, costPrice: 480, validity: "30 Days", capacity: "1GB", isActive: true },
  { planId: 806, network: "MTN", category: "DATA_SHARE", name: "MTN 500MB Data Share", productCode: "mtn_500mb_data_share", price: 430, costPrice: 365, validity: "30 Days", capacity: "500MB", isActive: true },
  { planId: 1001, network: "MTN", category: "DATA_SHARE", name: "MTN 1GB Data Share 30 Days", productCode: "mtn_1gb_data_share_30_days", price: 680, costPrice: 590, validity: "30 Days", capacity: "1GB", isActive: true },
  { planId: 1003, network: "MTN", category: "DATA_SHARE", name: "MTN 3GB Data Share 7 Days", productCode: "mtn_3gb_data_share_7_days", price: 1650, costPrice: 1450, validity: "7 Days", capacity: "3GB", isActive: true },
  { planId: 1004, network: "MTN", category: "DATA_SHARE", name: "MTN 2GB Data Share 7 Days", productCode: "mtn_2gb_data_share_7_days", price: 1150, costPrice: 999, validity: "7 Days", capacity: "2GB", isActive: true },

  // ==========================================
  // 13. AIRTEL SME DATA
  // ==========================================
  { planId: 815, network: "AIRTEL", category: "SME", name: "Airtel 10GB 30 Days", productCode: "airtel_10gb30_days", price: 3750, costPrice: 3350, validity: "30 Days", capacity: "10GB", isActive: true },
  { planId: 820, network: "AIRTEL", category: "SME", name: "Airtel 1.5GB 7 Days", productCode: "airtel_1_5gb7_days", price: 1250, costPrice: 1100, validity: "7 Days", capacity: "1.5GB", isActive: true },
  { planId: 848, network: "AIRTEL", category: "SME", name: "Airtel 7GB 7 Days", productCode: "airtel_7gb7_days", price: 2550, costPrice: 2250, validity: "7 Days", capacity: "7GB", isActive: true },
  { planId: 859, network: "AIRTEL", category: "SME", name: "Airtel 10GB 7 Days", productCode: "airtel_10gb7_days", price: 3700, costPrice: 3300, validity: "7 Days", capacity: "10GB", isActive: true },
  { planId: 861, network: "AIRTEL", category: "SME", name: "Airtel 18GB 7 Days", productCode: "airtel_18gb7_days", price: 6100, costPrice: 5500, validity: "7 Days", capacity: "18GB", isActive: true },
  { planId: 895, network: "AIRTEL", category: "SME", name: "Airtel 600MB 2 Days", productCode: "airtel_600mb2_days", price: 300, costPrice: 245, validity: "2 Days", capacity: "600MB", isActive: true },
  { planId: 899, network: "AIRTEL", category: "SME", name: "Airtel 6GB 7 Days", productCode: "airtel_6gb7_days", price: 3100, costPrice: 2750, validity: "7 Days", capacity: "6GB", isActive: true },
  { planId: 904, network: "AIRTEL", category: "SME", name: "Airtel 1GB 1 Day Special", productCode: "airtel_1gb1_day_special", price: 630, costPrice: 540, validity: "1 Day", capacity: "1GB", isActive: true },
  { planId: 905, network: "AIRTEL", category: "SME", name: "Airtel 1.5GB 2 Days Special", productCode: "airtel_1_5gb2_days_special", price: 770, costPrice: 670, validity: "2 Days", capacity: "1.5GB", isActive: true },
  { planId: 906, network: "AIRTEL", category: "SME", name: "Airtel 2GB 2 Days Special", productCode: "airtel_2gb2_days_special", price: 970, costPrice: 850, validity: "2 Days", capacity: "2GB", isActive: true },
  { planId: 907, network: "AIRTEL", category: "SME", name: "Airtel 3GB 2 Days Special", productCode: "airtel_3gb2_days_special", price: 1250, costPrice: 1100, validity: "2 Days", capacity: "3GB", isActive: true },
  { planId: 911, network: "AIRTEL", category: "SME", name: "Airtel 3.5GB 7 Days", productCode: "airtel_3_5gb7_days", price: 1820, costPrice: 1600, validity: "7 Days", capacity: "3.5GB", isActive: true },
  { planId: 912, network: "AIRTEL", category: "SME", name: "Airtel 5GB 2 Days", productCode: "airtel_5gb2_days", price: 1820, costPrice: 1600, validity: "2 Days", capacity: "5GB", isActive: true },
  { planId: 913, network: "AIRTEL", category: "SME", name: "Airtel 200MB 2 Days", productCode: "airtel_200mb2_days", price: 270, costPrice: 220, validity: "2 Days", capacity: "200MB", isActive: true },
  { planId: 915, network: "AIRTEL", category: "SME", name: "Airtel 300MB 2 Days", productCode: "airtel_300mb2_days", price: 170, costPrice: 130, validity: "2 Days", capacity: "300MB", isActive: true },
  { planId: 978, network: "AIRTEL", category: "SME", name: "Airtel 150MB 1 Day", productCode: "airtel_150mb1_day", price: 85, costPrice: 66, validity: "1 Day", capacity: "150MB", isActive: true },
  { planId: 979, network: "AIRTEL", category: "SME", name: "Airtel 1.5GB 7 Days Social Bundle", productCode: "airtel_1_5gb7_days_social_bundle", price: 630, costPrice: 535, validity: "7 Days", capacity: "1.5GB", isActive: true },
  { planId: 985, network: "AIRTEL", category: "SME", name: "Airtel 1GB 3 Days Social Bundle", productCode: "airtel_1gb3_days_social_bundle", price: 390, costPrice: 325, validity: "3 Days", capacity: "1GB", isActive: true },
  { planId: 987, network: "AIRTEL", category: "SME", name: "Airtel 9GB 7 Days", productCode: "airtel_9gb7_days", price: 3250, costPrice: 2855, validity: "7 Days", capacity: "9GB", isActive: true },
  { planId: 989, network: "AIRTEL", category: "SME", name: "Airtel 1.5GB 1 Day", productCode: "airtel_1_5gb1_day", price: 510, costPrice: 435, validity: "1 Day", capacity: "1.5GB", isActive: true },
  { planId: 990, network: "AIRTEL", category: "SME", name: "Airtel 4GB 2 Days", productCode: "airtel_4gb2_days", price: 1050, costPrice: 900, validity: "2 Days", capacity: "4GB", isActive: true },
  { planId: 998, network: "AIRTEL", category: "SME", name: "Airtel 13GB 30 Days", productCode: "airtel_13gb30_days", price: 6700, costPrice: 6000, validity: "30 Days", capacity: "13GB", isActive: true },
  { planId: 1007, network: "AIRTEL", category: "SME", name: "Airtel 8GB 30 Days", productCode: "airtel_8gb30_days", price: 2500, costPrice: 2200, validity: "30 Days", capacity: "8GB", isActive: true },
  { planId: 1008, network: "AIRTEL", category: "SME", name: "Airtel 60GB 60 Days", productCode: "airtel_60gb60_days", price: 12400, costPrice: 11000, validity: "60 Days", capacity: "60GB", isActive: true },

  // ==========================================
  // 14. GLO AWOOF
  // ==========================================
  { planId: 900, network: "GLO", category: "AWOOF", name: "Glo 750MB 1 Day", productCode: "glo_750mb1_day", price: 230, costPrice: 186, validity: "1 Day", capacity: "750MB", isActive: true },
  { planId: 901, network: "GLO", category: "AWOOF", name: "Glo 1.5GB 1 Day", productCode: "glo_1_5gb1_day", price: 335, costPrice: 279, validity: "1 Day", capacity: "1.5GB", isActive: true },
  { planId: 902, network: "GLO", category: "AWOOF", name: "Glo 2.5GB 2 Days", productCode: "glo_2_5gb2_days", price: 540, costPrice: 465, validity: "2 Days", capacity: "2.5GB", isActive: true },
  { planId: 903, network: "GLO", category: "AWOOF", name: "Glo 10GB 7 Days", productCode: "glo_10gb7_days", price: 2100, costPrice: 1860, validity: "7 Days", capacity: "10GB", isActive: true },

  // ==========================================
  // 15. MTN AWOOF / SPECIALS
  // ==========================================
  { planId: 828, network: "MTN", category: "AWOOF", name: "MTN 1GB 1 Day Plan", productCode: "mtn_1gb1_day_plan", price: 570, costPrice: 495, validity: "1 Day", capacity: "1GB", isActive: true },
  { planId: 855, network: "MTN", category: "AWOOF", name: "MTN 3.2GB 2 Days Plan", productCode: "mtn_3_2gb2_days_plan", price: 1100, costPrice: 990, validity: "2 Days", capacity: "3.2GB", isActive: true },
  { planId: 858, network: "MTN", category: "AWOOF", name: "MTN 2.5GB 2 Days", productCode: "mtn_2_5gb2_days", price: 1000, costPrice: 891, validity: "2 Days", capacity: "2.5GB", isActive: true },
  { planId: 862, network: "MTN", category: "AWOOF", name: "MTN 2GB 2 Days", productCode: "mtn_2gb2_days", price: 850, costPrice: 742.5, validity: "2 Days", capacity: "2GB", isActive: true },
  { planId: 916, network: "MTN", category: "AWOOF", name: "MTN 750MB 3 Days", productCode: "mtn_750mb3_days", price: 520, costPrice: 445.5, validity: "3 Days", capacity: "750MB", isActive: true },
  { planId: 920, network: "MTN", category: "AWOOF", name: "MTN 1GB 7 Days", productCode: "mtn_1gb7_days", price: 900, costPrice: 792, validity: "7 Days", capacity: "1GB", isActive: true },
  { planId: 921, network: "MTN", category: "AWOOF", name: "MTN 1.5GB 7 Days", productCode: "mtn_1_5gb7_days", price: 1100, costPrice: 990, validity: "7 Days", capacity: "1.5GB", isActive: true },
  { planId: 922, network: "MTN", category: "AWOOF", name: "MTN 1.2GB 7 Days", productCode: "mtn_1_2gb7_days", price: 850, costPrice: 742.5, validity: "7 Days", capacity: "1.2GB", isActive: true },
  { planId: 924, network: "MTN", category: "AWOOF", name: "MTN 6GB 7 Days", productCode: "mtn_6gb7_days", price: 2750, costPrice: 2475, validity: "7 Days", capacity: "6GB", isActive: true },
  { planId: 925, network: "MTN", category: "AWOOF", name: "MTN 11GB 7 Days", productCode: "mtn_11gb7_days", price: 3850, costPrice: 3465, validity: "7 Days", capacity: "11GB", isActive: true },
  { planId: 926, network: "MTN", category: "AWOOF", name: "MTN 110MB 1 Day", productCode: "mtn_110mb1_day", price: 120, costPrice: 99, validity: "1 Day", capacity: "110MB", isActive: true },
  { planId: 927, network: "MTN", category: "AWOOF", name: "MTN 230MB 1 Day", productCode: "mtn_230mb1_day", price: 240, costPrice: 198, validity: "1 Day", capacity: "230MB", isActive: true },
  { planId: 929, network: "MTN", category: "AWOOF", name: "MTN 500MB 7 Days", productCode: "mtn_500mb7_days", price: 570, costPrice: 495, validity: "7 Days", capacity: "500MB", isActive: true },
  { planId: 930, network: "MTN", category: "AWOOF", name: "6.75GB XTRA-SPECIAL 30 Days", productCode: "6_75gb_xtra-special30_days", price: 3300, costPrice: 2970, validity: "30 Days", capacity: "6.75GB", isActive: true },
  { planId: 931, network: "MTN", category: "AWOOF", name: "14.5GB XTRA-SPECIAL 30 Days", productCode: "14_5gb_xtra-special30_days", price: 5500, costPrice: 4950, validity: "30 Days", capacity: "14.5GB", isActive: true },
  { planId: 938, network: "MTN", category: "AWOOF", name: "MTN 1.5GB 2 Days", productCode: "mtn_1_5gb2_days", price: 680, costPrice: 594, validity: "2 Days", capacity: "1.5GB", isActive: true },
  { planId: 964, network: "MTN", category: "AWOOF", name: "1.8GB ThryveData 30 Days", productCode: "1_8gb_thryvedata30_days", price: 1680, costPrice: 1485, validity: "30 Days", capacity: "1.8GB", isActive: true },
  { planId: 965, network: "MTN", category: "AWOOF", name: "MTN 1.2GB All Social 30 Days", productCode: "mtn_1_2gb_all_social_30_days", price: 520, costPrice: 445.5, validity: "30 Days", capacity: "1.2GB", isActive: true },
  { planId: 974, network: "MTN", category: "AWOOF", name: "MTN 20GB 7 Days", productCode: "mtn_20gb7_days", price: 5500, costPrice: 4950, validity: "7 Days", capacity: "20GB", isActive: true },
  { planId: 976, network: "MTN", category: "AWOOF", name: "MTN 500MB 1 Day", productCode: "mtn_500mb1_day", price: 410, costPrice: 346.5, validity: "1 Day", capacity: "500MB", isActive: true },
  { planId: 984, network: "MTN", category: "AWOOF", name: "MTN 2.5GB 1 Day", productCode: "mtn_2_5gb1_day", price: 850, costPrice: 742.5, validity: "1 Day", capacity: "2.5GB", isActive: true },
  { planId: 999, network: "MTN", category: "AWOOF", name: "MTN 3.5GB 7 Days Plan", productCode: "mtn_3_5gb7_days_plan", price: 1680, costPrice: 1485, validity: "7 Days", capacity: "3.5GB", isActive: true },

  // ==========================================
  // 16. 9MOBILE CORPORATE
  // ==========================================
  { planId: 842, network: "9MOBILE", category: "CORPORATE", name: "9Mobile CG 1GB 30 Days", productCode: "etisalat_cg_1gb_30days", price: 380, costPrice: 300, validity: "30 Days", capacity: "1GB", isActive: true },

  // ==========================================
  // 17. AIRTEL SME LITE
  // ==========================================
  { planId: 967, network: "AIRTEL", category: "LITE", name: "Airtel 1GB 7 Days Lite", productCode: "airtel_1gb7_days_lite", price: 890, costPrice: 779, validity: "7 Days", capacity: "1GB", isActive: true },
  { planId: 968, network: "AIRTEL", category: "LITE", name: "Airtel 2GB 30 Days Lite", productCode: "airtel_2gb30_days_lite", price: 1750, costPrice: 1558, validity: "30 Days", capacity: "2GB", isActive: true },
  { planId: 969, network: "AIRTEL", category: "LITE", name: "Airtel 3GB 30 Days Lite", productCode: "airtel_3gb30_days_lite", price: 2600, costPrice: 2337, validity: "30 Days", capacity: "3GB", isActive: true },
  { planId: 971, network: "AIRTEL", category: "LITE", name: "Airtel 8GB 30 Days Lite", productCode: "airtel_8gb30_days_lite", price: 6850, costPrice: 6232, validity: "30 Days", capacity: "8GB", isActive: true },
  { planId: 972, network: "AIRTEL", category: "LITE", name: "Airtel 10GB 30 Days Lite", productCode: "airtel_10gb30_days_lite", price: 8500, costPrice: 7790, validity: "30 Days", capacity: "10GB", isActive: true },

  // ==========================================
  // 18. GLO CLOUD DATA
  // ==========================================
  { planId: 605, network: "GLO", category: "CLOUD", name: "Glo Cloud 50MB incl 5MB nite 1 Day", productCode: "glo_cloud_50mb_incl_5mb_nite1day", price: 70, costPrice: 50, validity: "1 Day", capacity: "50MB", isActive: true },
  { planId: 606, network: "GLO", category: "CLOUD", name: "Glo Cloud 350MB incl 110MB nite 2 Days", productCode: "glo_cloud_350mb_incl_110mb_nite2days", price: 150, costPrice: 100, validity: "2 Days", capacity: "350MB", isActive: true },
  { planId: 607, network: "GLO", category: "CLOUD", name: "Glo Cloud 1.8GB incl 1GB nite 14 Days", productCode: "glo_cloud_1_8gb_incl_1gb_nite14days", price: 600, costPrice: 500, validity: "14 Days", capacity: "1.8GB", isActive: true },
  { planId: 608, network: "GLO", category: "CLOUD", name: "Glo Cloud 150MB incl 35MB nite 1 Day", productCode: "glo_cloud_150mb_incl_35mb_nite1day", price: 120, costPrice: 100, validity: "1 Day", capacity: "150MB", isActive: true },
  { planId: 609, network: "GLO", category: "CLOUD", name: "Glo Cloud 250MB Night 1 Day", productCode: "glo_cloud_250mb_night1day", price: 100, costPrice: 75, validity: "1 Day", capacity: "250MB", isActive: true },
  { planId: 610, network: "GLO", category: "CLOUD", name: "Glo Cloud 7GB Special 7 Days", productCode: "glo_cloud_7gb_special7days", price: 2100, costPrice: 1800, validity: "7 Days", capacity: "7GB", isActive: true },
  { planId: 611, network: "GLO", category: "CLOUD", name: "Glo Cloud 100MB WTF 1 Day", productCode: "glo_cloud_100mb_wtf1day", price: 70, costPrice: 50, validity: "1 Day", capacity: "100MB", isActive: true },
  { planId: 612, network: "GLO", category: "CLOUD", name: "Glo Cloud 200MB WTF 7 Days", productCode: "glo_cloud_200mb_wtf7days", price: 150, costPrice: 100, validity: "7 Days", capacity: "200MB", isActive: true },
  { planId: 613, network: "GLO", category: "CLOUD", name: "Glo Cloud 500MB WTF 30 Days", productCode: "glo_cloud_500mb_wtf30days", price: 300, costPrice: 250, validity: "30 Days", capacity: "500MB", isActive: true },
  { planId: 614, network: "GLO", category: "CLOUD", name: "Glo Cloud 20MB Telegram 1 Day", productCode: "glo_cloud_20mb_telegram1day", price: 40, costPrice: 25, validity: "1 Day", capacity: "20MB", isActive: true },
  { planId: 615, network: "GLO", category: "CLOUD", name: "Glo Cloud 50MB Telegram 7 Days", productCode: "glo_cloud_50mb_telegram7days", price: 70, costPrice: 50, validity: "7 Days", capacity: "50MB", isActive: true },
  { planId: 616, network: "GLO", category: "CLOUD", name: "Glo Cloud 125MB Telegram 30 Days", productCode: "glo_cloud_125mb_telegram30days", price: 150, costPrice: 100, validity: "30 Days", capacity: "125MB", isActive: true },
  { planId: 617, network: "GLO", category: "CLOUD", name: "Glo Cloud 20MB Instagram 1 Day", productCode: "glo_cloud_20mb_instagram1day", price: 40, costPrice: 25, validity: "1 Day", capacity: "20MB", isActive: true },
  { planId: 618, network: "GLO", category: "CLOUD", name: "Glo Cloud 50MB Instagram 7 Days", productCode: "glo_cloud_50mb_instagram7days", price: 70, costPrice: 50, validity: "7 Days", capacity: "50MB", isActive: true },
  { planId: 619, network: "GLO", category: "CLOUD", name: "Glo Cloud 125MB Instagram 30 Days", productCode: "glo_cloud_125mb_instagram30days", price: 150, costPrice: 100, validity: "30 Days", capacity: "125MB", isActive: true },
  { planId: 620, network: "GLO", category: "CLOUD", name: "Glo Cloud 20MB TikTok 1 Day", productCode: "glo_cloud_20mb_tiktok1day", price: 40, costPrice: 25, validity: "1 Day", capacity: "20MB", isActive: true },
  { planId: 621, network: "GLO", category: "CLOUD", name: "Glo Cloud 50MB TikTok 7 Days", productCode: "glo_cloud_50mb_tiktok7days", price: 70, costPrice: 50, validity: "7 Days", capacity: "50MB", isActive: true },
  { planId: 622, network: "GLO", category: "CLOUD", name: "Glo Cloud 125MB TikTok 30 Days", productCode: "glo_cloud_125mb_tiktok30days", price: 150, costPrice: 100, validity: "30 Days", capacity: "125MB", isActive: true },
  { planId: 623, network: "GLO", category: "CLOUD", name: "Glo Cloud 20MB Opera 1 Day", productCode: "glo_cloud_20mb_opera1day", price: 40, costPrice: 25, validity: "1 Day", capacity: "20MB", isActive: true },
  { planId: 624, network: "GLO", category: "CLOUD", name: "Glo Cloud 100MB Opera 7 Days", productCode: "glo_cloud_100mb_opera7days", price: 120, costPrice: 100, validity: "7 Days", capacity: "100MB", isActive: true },
  { planId: 625, network: "GLO", category: "CLOUD", name: "Glo Cloud 300MB Opera 30 Days", productCode: "glo_cloud_300mb_opera30days", price: 250, costPrice: 200, validity: "30 Days", capacity: "300MB", isActive: true },
  { planId: 626, network: "GLO", category: "CLOUD", name: "Glo Cloud 100MB YouTube 1 Day", productCode: "glo_cloud_100mb_youtube1day", price: 100, costPrice: 80, validity: "1 Day", capacity: "100MB", isActive: true },
  { planId: 627, network: "GLO", category: "CLOUD", name: "Glo Cloud 200MB YouTube 7 Days", productCode: "glo_cloud_200mb_youtube7days", price: 180, costPrice: 150, validity: "7 Days", capacity: "200MB", isActive: true },
  { planId: 628, network: "GLO", category: "CLOUD", name: "Glo Cloud 500MB YouTube 30 Days", productCode: "glo_cloud_500mb_youtube30days", price: 350, costPrice: 300, validity: "30 Days", capacity: "500MB", isActive: true },
  { planId: 629, network: "GLO", category: "CLOUD", name: "Glo Cloud 3.9GB incl 2GB nite 30 Days", productCode: "glo_cloud_3_9gb_incl_2gb_nite30days", price: 1250, costPrice: 1100, validity: "30 Days", capacity: "3.9GB", isActive: true },
  { planId: 630, network: "GLO", category: "CLOUD", name: "Glo Cloud 7.5GB incl 4GB nite 30 Days", productCode: "glo_cloud_7_5gb_incl_4gb_nite30days", price: 2300, costPrice: 2000, validity: "30 Days", capacity: "7.5GB", isActive: true },
  { planId: 631, network: "GLO", category: "CLOUD", name: "Glo Cloud 9.2GB incl 4GB nite 30 Days", productCode: "glo_cloud_9_2gb_incl_4gb_nite30days", price: 2800, costPrice: 2500, validity: "30 Days", capacity: "9.2GB", isActive: true },
  { planId: 632, network: "GLO", category: "CLOUD", name: "Glo Cloud 500MB Night 1 Day", productCode: "glo_cloud_500mb_night1day", price: 150, costPrice: 100, validity: "1 Day", capacity: "500MB", isActive: true },
  { planId: 633, network: "GLO", category: "CLOUD", name: "Glo Cloud 1GB Night 1 Day", productCode: "glo_cloud_1gb_night1day", price: 250, costPrice: 200, validity: "1 Day", capacity: "1GB", isActive: true },
  { planId: 644, network: "GLO", category: "CLOUD", name: "Glo Cloud 50MB 1 Day", productCode: "glo_cloud_50mb1day", price: 70, costPrice: 50, validity: "1 Day", capacity: "50MB", isActive: true },
  { planId: 645, network: "GLO", category: "CLOUD", name: "Glo Cloud 150MB 1 Day", productCode: "glo_cloud_150mb1day", price: 120, costPrice: 100, validity: "1 Day", capacity: "150MB", isActive: true },
  { planId: 646, network: "GLO", category: "CLOUD", name: "Glo Cloud 350MB 2 Days", productCode: "glo_cloud_350mb2days", price: 220, costPrice: 180, validity: "2 Days", capacity: "350MB", isActive: true },
  { planId: 647, network: "GLO", category: "CLOUD", name: "Glo Cloud 1GB 14 Days", productCode: "glo_cloud_1gb14days", price: 450, costPrice: 380, validity: "14 Days", capacity: "1GB", isActive: true },
  { planId: 648, network: "GLO", category: "CLOUD", name: "Glo Cloud 3.9GB 30 Days", productCode: "glo_cloud_3_9gb30days", price: 1350, costPrice: 1200, validity: "30 Days", capacity: "3.9GB", isActive: true },
  { planId: 649, network: "GLO", category: "CLOUD", name: "Glo Cloud 4.1GB 30 Days", productCode: "glo_cloud_4_1gb30days", price: 1550, costPrice: 1350, validity: "30 Days", capacity: "4.1GB", isActive: true },
  { planId: 650, network: "GLO", category: "CLOUD", name: "Glo Cloud 5.8GB 30 Days", productCode: "glo_cloud_5_8gb30days", price: 2100, costPrice: 1850, validity: "30 Days", capacity: "5.8GB", isActive: true },
  { planId: 664, network: "GLO", category: "CLOUD", name: "Glo Cloud 1GB Special 1 Day", productCode: "glo_cloud_1gb_special_3001day", price: 380, costPrice: 300, validity: "1 Day", capacity: "1GB", isActive: true },
  { planId: 665, network: "GLO", category: "CLOUD", name: "Glo Cloud 2GB Special 2 Days", productCode: "glo_cloud_2gb_special_5002days", price: 620, costPrice: 500, validity: "2 Days", capacity: "2GB", isActive: true },
  { planId: 667, network: "GLO", category: "CLOUD", name: "Glo Cloud 3.58GB 30 Days", productCode: "glo_cloud_3_58gb_n1500_oneoff30days", price: 1750, costPrice: 1500, validity: "30 Days", capacity: "3.58GB", isActive: true },
  { planId: 668, network: "GLO", category: "CLOUD", name: "Glo Cloud 3GB Weekend 2 Days", productCode: "glo_cloud_3gb_weekend5002days", price: 650, costPrice: 500, validity: "2 Days", capacity: "3GB", isActive: true },
  { planId: 673, network: "GLO", category: "CLOUD", name: "Glo Cloud 1.5GB YouTube 30 Days", productCode: "glo_cloud_1_5gb_youtube_n50030days", price: 650, costPrice: 500, validity: "30 Days", capacity: "1.5GB", isActive: true },
  { planId: 674, network: "GLO", category: "CLOUD", name: "Glo Cloud 4GB YouTube 30 Days", productCode: "glo_cloud_4gb_youtube_n100030days", price: 1250, costPrice: 1000, validity: "30 Days", capacity: "4GB", isActive: true },
  { planId: 675, network: "GLO", category: "CLOUD", name: "Glo Cloud 5GB YouTube 5 Days", productCode: "glo_cloud_5gb_youtube_n500_time5days", price: 700, costPrice: 500, validity: "5 Days", capacity: "5GB", isActive: true },
  { planId: 676, network: "GLO", category: "CLOUD", name: "Glo Cloud 10GB YouTube 10 Days", productCode: "glo_cloud_10gb_youtube_n1000_time10days", price: 1350, costPrice: 1000, validity: "10 Days", capacity: "10GB", isActive: true },
];

/**
 * Ensures all plans exist in database and synchronizes plan IDs & metadata
 * without overwriting custom admin-configured selling prices!
 */
export async function ensureDataPlansSeeded(prisma: PrismaClient) {
  try {
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
          // Preserves existing price if already configured by admin!
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

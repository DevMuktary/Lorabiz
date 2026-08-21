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

export const DATA_PLANS_SEED: DataPlanSeedItem[] = [
  // ==========================================
  // MTN SME DATA
  // ==========================================
  { planId: 7, network: "MTN", category: "SME", name: "MTN SME 1GB", productCode: "mtn_sme_1gb", price: 400, costPrice: 400, validity: "30 Days", capacity: "1GB", isActive: true },
  { planId: 8, network: "MTN", category: "SME", name: "MTN SME 2GB", productCode: "mtn_sme_2gb", price: 700, costPrice: 700, validity: "30 Days", capacity: "2GB", isActive: true },
  { planId: 9, network: "MTN", category: "SME", name: "MTN SME 5GB", productCode: "mtn_sme_5gb", price: 1750, costPrice: 1750, validity: "30 Days", capacity: "5GB", isActive: true },
  { planId: 279, network: "MTN", category: "SME", name: "MTN SME 500MB", productCode: "mtn_sme_500mb", price: 280, costPrice: 280, validity: "30 Days", capacity: "500MB", isActive: true },
  { planId: 496, network: "MTN", category: "SME", name: "MTN SME 3GB", productCode: "mtn_sme_3gb", price: 1050, costPrice: 1050, validity: "30 Days", capacity: "3GB", isActive: true },
  { planId: 509, network: "MTN", category: "SME", name: "MTN SME 10GB", productCode: "mtn_sme_10gb", price: 3500, costPrice: 3500, validity: "30 Days", capacity: "10GB", isActive: true },
  { planId: 1002, network: "MTN", category: "SME", name: "MTN SME 1GB Monthly", productCode: "mtn_sme_1gb_monthly", price: 520, costPrice: 520, validity: "30 Days", capacity: "1GB", isActive: true },
  { planId: 1016, network: "MTN", category: "SME", name: "MTN 1GB 30 Days Awoof", productCode: "mtn_1gb_30_days_awoof", price: 235, costPrice: 235, validity: "30 Days", capacity: "1GB", isActive: true },

  // ==========================================
  // MTN DATA SHARE
  // ==========================================
  { planId: 802, network: "MTN", category: "DATA_SHARE", name: "MTN 5GB Data Share", productCode: "mtn_5gb_share", price: 1650, costPrice: 1650, validity: "30 Days", capacity: "5GB", isActive: true },
  { planId: 803, network: "MTN", category: "DATA_SHARE", name: "MTN 3GB Data Share", productCode: "mtn_3gb_share", price: 1250, costPrice: 1250, validity: "30 Days", capacity: "3GB", isActive: true },
  { planId: 804, network: "MTN", category: "DATA_SHARE", name: "MTN 2GB Data Share", productCode: "mtn_2gb_share", price: 750, costPrice: 750, validity: "30 Days", capacity: "2GB", isActive: true },
  { planId: 805, network: "MTN", category: "DATA_SHARE", name: "MTN 1GB Data Share", productCode: "mtn_1gb_share", price: 400, costPrice: 400, validity: "30 Days", capacity: "1GB", isActive: true },
  { planId: 806, network: "MTN", category: "DATA_SHARE", name: "MTN 500MB Data Share", productCode: "mtn_500mb_share", price: 280, costPrice: 280, validity: "30 Days", capacity: "500MB", isActive: true },
  { planId: 1001, network: "MTN", category: "DATA_SHARE", name: "MTN 1GB Data Share 30 Days", productCode: "mtn_1gb_share_30d", price: 520, costPrice: 520, validity: "30 Days", capacity: "1GB", isActive: true },
  { planId: 1003, network: "MTN", category: "DATA_SHARE", name: "MTN 3GB Data Share 7 Days", productCode: "mtn_3gb_share_7d", price: 1150, costPrice: 1150, validity: "7 Days", capacity: "3GB", isActive: true },
  { planId: 1004, network: "MTN", category: "DATA_SHARE", name: "MTN 2GB Data Share 7 Days", productCode: "mtn_2gb_share_7d", price: 700, costPrice: 700, validity: "7 Days", capacity: "2GB", isActive: true },

  // ==========================================
  // MTN AWOOF / SPECIAL
  // ==========================================
  { planId: 828, network: "MTN", category: "AWOOF", name: "MTN 1GB 1 Day Plan", productCode: "mtn_1gb_1d", price: 495, costPrice: 495, validity: "1 Day", capacity: "1GB", isActive: true },
  { planId: 855, network: "MTN", category: "AWOOF", name: "MTN 3.2GB 2 Days Plan", productCode: "mtn_3_2gb_2d", price: 990, costPrice: 990, validity: "2 Days", capacity: "3.2GB", isActive: true },
  { planId: 858, network: "MTN", category: "AWOOF", name: "MTN 2.5GB 2 Days", productCode: "mtn_2_5gb_2d", price: 891, costPrice: 891, validity: "2 Days", capacity: "2.5GB", isActive: true },
  { planId: 862, network: "MTN", category: "AWOOF", name: "MTN 2GB 2 Days", productCode: "mtn_2gb_2d", price: 742.5, costPrice: 742.5, validity: "2 Days", capacity: "2GB", isActive: true },
  { planId: 916, network: "MTN", category: "AWOOF", name: "MTN 750MB 3 Days", productCode: "mtn_750mb_3d", price: 445.5, costPrice: 445.5, validity: "3 Days", capacity: "750MB", isActive: true },
  { planId: 920, network: "MTN", category: "AWOOF", name: "MTN 1GB 7 Days", productCode: "mtn_1gb_7d", price: 792, costPrice: 792, validity: "7 Days", capacity: "1GB", isActive: true },
  { planId: 921, network: "MTN", category: "AWOOF", name: "MTN 1.5GB 7 Days", productCode: "mtn_1_5gb_7d", price: 990, costPrice: 990, validity: "7 Days", capacity: "1.5GB", isActive: true },
  { planId: 922, network: "MTN", category: "AWOOF", name: "MTN 1.2GB 7 Days", productCode: "mtn_1_2gb_7d", price: 742.5, costPrice: 742.5, validity: "7 Days", capacity: "1.2GB", isActive: true },
  { planId: 924, network: "MTN", category: "AWOOF", name: "MTN 6GB 7 Days", productCode: "mtn_6gb_7d", price: 2475, costPrice: 2475, validity: "7 Days", capacity: "6GB", isActive: true },
  { planId: 925, network: "MTN", category: "AWOOF", name: "MTN 11GB 7 Days", productCode: "mtn_11gb_7d", price: 3465, costPrice: 3465, validity: "7 Days", capacity: "11GB", isActive: true },
  { planId: 926, network: "MTN", category: "AWOOF", name: "MTN 110MB 1 Day", productCode: "mtn_110mb_1d", price: 99, costPrice: 99, validity: "1 Day", capacity: "110MB", isActive: true },
  { planId: 929, network: "MTN", category: "AWOOF", name: "MTN 500MB 7 Days", productCode: "mtn_500mb_7d", price: 495, costPrice: 495, validity: "7 Days", capacity: "500MB", isActive: true },
  { planId: 930, network: "MTN", category: "AWOOF", name: "6.75GB XTRA-SPECIAL 30 Days", productCode: "mtn_6_75gb_xtra_30d", price: 2970, costPrice: 2970, validity: "30 Days", capacity: "6.75GB", isActive: true },
  { planId: 931, network: "MTN", category: "AWOOF", name: "14.5GB XTRA-SPECIAL 30 Days", productCode: "mtn_14_5gb_xtra_30d", price: 4950, costPrice: 4950, validity: "30 Days", capacity: "14.5GB", isActive: true },
  { planId: 938, network: "MTN", category: "AWOOF", name: "MTN 1.5GB 2 Days", productCode: "mtn_1_5gb_2d", price: 594, costPrice: 594, validity: "2 Days", capacity: "1.5GB", isActive: true },
  { planId: 964, network: "MTN", category: "AWOOF", name: "1.8GB ThryveData 30 Days", productCode: "mtn_1_8gb_thryve_30d", price: 1485, costPrice: 1485, validity: "30 Days", capacity: "1.8GB", isActive: true },
  { planId: 965, network: "MTN", category: "AWOOF", name: "MTN 1.2GB All Social 30 Days", productCode: "mtn_1_2gb_social_30d", price: 445.5, costPrice: 445.5, validity: "30 Days", capacity: "1.2GB", isActive: true },
  { planId: 974, network: "MTN", category: "AWOOF", name: "MTN 20GB 7 Days", productCode: "mtn_20gb_7d", price: 4950, costPrice: 4950, validity: "7 Days", capacity: "20GB", isActive: true },
  { planId: 976, network: "MTN", category: "AWOOF", name: "MTN 500MB 1 Day", productCode: "mtn_500mb_1d", price: 346.5, costPrice: 346.5, validity: "1 Day", capacity: "500MB", isActive: true },
  { planId: 984, network: "MTN", category: "AWOOF", name: "MTN 2.5GB 1 Day", productCode: "mtn_2_5gb_1d", price: 742.5, costPrice: 742.5, validity: "1 Day", capacity: "2.5GB", isActive: true },
  { planId: 999, network: "MTN", category: "AWOOF", name: "MTN 3.5GB 7 Days Plan", productCode: "mtn_3_5gb_7d", price: 1485, costPrice: 1485, validity: "7 Days", capacity: "3.5GB", isActive: true },
  { planId: 1010, network: "MTN", category: "AWOOF", name: "MTN 1GB 1 Day LTE", productCode: "mtn_1gb_1d_lte", price: 250.47, costPrice: 250.47, validity: "1 Day", capacity: "1GB", isActive: true },
  { planId: 1014, network: "MTN", category: "AWOOF", name: "MTN 1GB 30 Days", productCode: "mtn_1gb_30d", price: 235.62, costPrice: 235.62, validity: "30 Days", capacity: "1GB", isActive: true },

  // ==========================================
  // MTN DIRECT GIFTING
  // ==========================================
  { planId: 110, network: "MTN", category: "GIFTING", name: "MTN 10GB 30 Days", productCode: "mtn_10gb_30d_gift", price: 4477.5, costPrice: 4477.5, validity: "30 Days", capacity: "10GB", isActive: true },
  { planId: 876, network: "MTN", category: "GIFTING", name: "MTN 2.7GB 30 Days", productCode: "mtn_2_7gb_30d_gift", price: 1990, costPrice: 1990, validity: "30 Days", capacity: "2.7GB", isActive: true },
  { planId: 883, network: "MTN", category: "GIFTING", name: "MTN 20GB 30 Days", productCode: "mtn_20gb_30d_gift", price: 7462.5, costPrice: 7462.5, validity: "30 Days", capacity: "20GB", isActive: true },
  { planId: 884, network: "MTN", category: "GIFTING", name: "MTN 25GB 30 Days", productCode: "mtn_25gb_30d_gift", price: 8955, costPrice: 8955, validity: "30 Days", capacity: "25GB", isActive: true },
  { planId: 886, network: "MTN", category: "GIFTING", name: "MTN 75GB 30 Days", productCode: "mtn_75gb_30d_gift", price: 17910, costPrice: 17910, validity: "30 Days", capacity: "75GB", isActive: true },
  { planId: 888, network: "MTN", category: "GIFTING", name: "MTN 250GB 30 Days", productCode: "mtn_250gb_30d_gift", price: 54725, costPrice: 54725, validity: "30 Days", capacity: "250GB", isActive: true },
  { planId: 889, network: "MTN", category: "GIFTING", name: "MTN 90GB 60 Days", productCode: "mtn_90gb_60d_gift", price: 24875, costPrice: 24875, validity: "60 Days", capacity: "90GB", isActive: true },
  { planId: 890, network: "MTN", category: "GIFTING", name: "MTN 200GB 60 Days", productCode: "mtn_200gb_60d_gift", price: 49750, costPrice: 49750, validity: "60 Days", capacity: "200GB", isActive: true },
  { planId: 891, network: "MTN", category: "GIFTING", name: "MTN 150GB 60 Days", productCode: "mtn_150gb_60d_gift", price: 39800, costPrice: 39800, validity: "60 Days", capacity: "150GB", isActive: true },
  { planId: 923, network: "MTN", category: "GIFTING", name: "MTN 2GB 30 Days", productCode: "mtn_2gb_30d_gift", price: 1492.5, costPrice: 1492.5, validity: "30 Days", capacity: "2GB", isActive: true },
  { planId: 928, network: "MTN", category: "GIFTING", name: "MTN 3.5GB 30 Days", productCode: "mtn_3_5gb_30d_gift", price: 2487.5, costPrice: 2487.5, validity: "30 Days", capacity: "3.5GB", isActive: true },
  { planId: 932, network: "MTN", category: "GIFTING", name: "MTN 12.5GB 30 Days", productCode: "mtn_12_5gb_30d_gift", price: 5472.5, costPrice: 5472.5, validity: "30 Days", capacity: "12.5GB", isActive: true },
  { planId: 934, network: "MTN", category: "GIFTING", name: "MTN 16.5GB 30 Days", productCode: "mtn_16_5gb_30d_gift", price: 6467.5, costPrice: 6467.5, validity: "30 Days", capacity: "16.5GB", isActive: true },
  { planId: 935, network: "MTN", category: "GIFTING", name: "MTN 36GB 30 Days", productCode: "mtn_36gb_30d_gift", price: 10945, costPrice: 10945, validity: "30 Days", capacity: "36GB", isActive: true },
  { planId: 936, network: "MTN", category: "GIFTING", name: "MTN 165GB 30 Days", productCode: "mtn_165gb_30d_gift", price: 34825, costPrice: 34825, validity: "30 Days", capacity: "165GB", isActive: true },
  { planId: 937, network: "MTN", category: "GIFTING", name: "MTN 7GB 30 Days", productCode: "mtn_7gb_30d_gift", price: 3482.5, costPrice: 3482.5, validity: "30 Days", capacity: "7GB", isActive: true },
  { planId: 975, network: "MTN", category: "GIFTING", name: "MTN 800GB 365 Days", productCode: "mtn_800gb_365d_gift", price: 124375, costPrice: 124375, validity: "365 Days", capacity: "800GB", isActive: true },

  // ==========================================
  // AIRTEL DIRECT GIFTING
  // ==========================================
  { planId: 409, network: "AIRTEL", category: "GIFTING", name: "Airtel 2GB 30 Days", productCode: "airtel_2gb_30d_gift", price: 1470, costPrice: 1470, validity: "30 Days", capacity: "2GB", isActive: true },
  { planId: 410, network: "AIRTEL", category: "GIFTING", name: "Airtel 3GB 30 Days", productCode: "airtel_3gb_30d_gift", price: 1960, costPrice: 1960, validity: "30 Days", capacity: "3GB", isActive: true },
  { planId: 521, network: "AIRTEL", category: "GIFTING", name: "Airtel 10GB 30 Days", productCode: "airtel_10gb_30d_gift", price: 3920, costPrice: 3920, validity: "30 Days", capacity: "10GB", isActive: true },
  { planId: 817, network: "AIRTEL", category: "GIFTING", name: "Airtel 1GB 7 Days", productCode: "airtel_1gb_7d_gift", price: 784, costPrice: 784, validity: "7 Days", capacity: "1GB", isActive: true },
  { planId: 846, network: "AIRTEL", category: "GIFTING", name: "Airtel 500MB 7 Days", productCode: "airtel_500mb_7d_gift", price: 490, costPrice: 490, validity: "7 Days", capacity: "500MB", isActive: true },
  { planId: 863, network: "AIRTEL", category: "GIFTING", name: "Airtel 4GB 30 Days", productCode: "airtel_4gb_30d_gift", price: 2450, costPrice: 2450, validity: "30 Days", capacity: "4GB", isActive: true },
  { planId: 864, network: "AIRTEL", category: "GIFTING", name: "Airtel 8GB 30 Days", productCode: "airtel_8gb_30d_gift", price: 2940, costPrice: 2940, validity: "30 Days", capacity: "8GB", isActive: true },
  { planId: 865, network: "AIRTEL", category: "GIFTING", name: "Airtel 13GB 30 Days", productCode: "airtel_13gb_30d_gift", price: 4900, costPrice: 4900, validity: "30 Days", capacity: "13GB", isActive: true },
  { planId: 866, network: "AIRTEL", category: "GIFTING", name: "Airtel 18GB 30 Days", productCode: "airtel_18gb_30d_gift", price: 5880, costPrice: 5880, validity: "30 Days", capacity: "18GB", isActive: true },
  { planId: 867, network: "AIRTEL", category: "GIFTING", name: "Airtel 25GB 30 Days", productCode: "airtel_25gb_30d_gift", price: 7840, costPrice: 7840, validity: "30 Days", capacity: "25GB", isActive: true },
  { planId: 868, network: "AIRTEL", category: "GIFTING", name: "Airtel 35GB 30 Days", productCode: "airtel_35gb_30d_gift", price: 9800, costPrice: 9800, validity: "30 Days", capacity: "35GB", isActive: true },
  { planId: 869, network: "AIRTEL", category: "GIFTING", name: "Airtel 60GB 30 Days", productCode: "airtel_60gb_30d_gift", price: 14700, costPrice: 14700, validity: "30 Days", capacity: "60GB", isActive: true },
  { planId: 870, network: "AIRTEL", category: "GIFTING", name: "Airtel 100GB 30 Days", productCode: "airtel_100gb_30d_gift", price: 19600, costPrice: 19600, validity: "30 Days", capacity: "100GB", isActive: true },
  { planId: 871, network: "AIRTEL", category: "GIFTING", name: "Airtel 160GB 30 Days", productCode: "airtel_160gb_30d_gift", price: 29400, costPrice: 29400, validity: "30 Days", capacity: "160GB", isActive: true },
  { planId: 872, network: "AIRTEL", category: "GIFTING", name: "Airtel 210GB 30 Days", productCode: "airtel_210gb_30d_gift", price: 39200, costPrice: 39200, validity: "30 Days", capacity: "210GB", isActive: true },
  { planId: 873, network: "AIRTEL", category: "GIFTING", name: "Airtel 300GB 90 Days", productCode: "airtel_300gb_90d_gift", price: 49000, costPrice: 49000, validity: "90 Days", capacity: "300GB", isActive: true },
  { planId: 874, network: "AIRTEL", category: "GIFTING", name: "Airtel 650GB 365 Days", productCode: "airtel_650gb_365d_gift", price: 98000, costPrice: 98000, validity: "365 Days", capacity: "650GB", isActive: true },

  // ==========================================
  // AIRTEL SME DATA
  // ==========================================
  { planId: 815, network: "AIRTEL", category: "SME", name: "Airtel 10GB 30 Days", productCode: "airtel_10gb_30d_sme", price: 3350, costPrice: 3350, validity: "30 Days", capacity: "10GB", isActive: true },
  { planId: 820, network: "AIRTEL", category: "SME", name: "Airtel 1.5GB 7 Days", productCode: "airtel_1_5gb_7d_sme", price: 1100, costPrice: 1100, validity: "7 Days", capacity: "1.5GB", isActive: true },
  { planId: 859, network: "AIRTEL", category: "SME", name: "Airtel 10GB 7 Days", productCode: "airtel_10gb_7d_sme", price: 3300, costPrice: 3300, validity: "7 Days", capacity: "10GB", isActive: true },
  { planId: 861, network: "AIRTEL", category: "SME", name: "Airtel 18GB 7 Days", productCode: "airtel_18gb_7d_sme", price: 5500, costPrice: 5500, validity: "7 Days", capacity: "18GB", isActive: true },
  { planId: 895, network: "AIRTEL", category: "SME", name: "Airtel 600MB 2 Days", productCode: "airtel_600mb_2d_sme", price: 245, costPrice: 245, validity: "2 Days", capacity: "600MB", isActive: true },
  { planId: 899, network: "AIRTEL", category: "SME", name: "Airtel 6GB 7 Days", productCode: "airtel_6gb_7d_sme", price: 2750, costPrice: 2750, validity: "7 Days", capacity: "6GB", isActive: true },
  { planId: 904, network: "AIRTEL", category: "SME", name: "Airtel 1GB 1 Day Special", productCode: "airtel_1gb_1d_special", price: 540, costPrice: 540, validity: "1 Day", capacity: "1GB", isActive: true },
  { planId: 905, network: "AIRTEL", category: "SME", name: "Airtel 1.5GB 2 Days Special", productCode: "airtel_1_5gb_2d_special", price: 670, costPrice: 670, validity: "2 Days", capacity: "1.5GB", isActive: true },
  { planId: 906, network: "AIRTEL", category: "SME", name: "Airtel 2GB 2 Days Special", productCode: "airtel_2gb_2d_special", price: 850, costPrice: 850, validity: "2 Days", capacity: "2GB", isActive: true },
  { planId: 907, network: "AIRTEL", category: "SME", name: "Airtel 3GB 2 Days Special", productCode: "airtel_3gb_2d_special", price: 1100, costPrice: 1100, validity: "2 Days", capacity: "3GB", isActive: true },
  { planId: 911, network: "AIRTEL", category: "SME", name: "Airtel 3.5GB 7 Days", productCode: "airtel_3_5gb_7d_sme", price: 1600, costPrice: 1600, validity: "7 Days", capacity: "3.5GB", isActive: true },
  { planId: 912, network: "AIRTEL", category: "SME", name: "Airtel 5GB 2 Days", productCode: "airtel_5gb_2d_sme", price: 1600, costPrice: 1600, validity: "2 Days", capacity: "5GB", isActive: true },
  { planId: 915, network: "AIRTEL", category: "SME", name: "Airtel 300MB 2 Days", productCode: "airtel_300mb_2d_sme", price: 130, costPrice: 130, validity: "2 Days", capacity: "300MB", isActive: true },
  { planId: 978, network: "AIRTEL", category: "SME", name: "Airtel 150MB 1 Day", productCode: "airtel_150mb_1d_sme", price: 66, costPrice: 66, validity: "1 Day", capacity: "150MB", isActive: true },
  { planId: 979, network: "AIRTEL", category: "SME", name: "Airtel 1.5GB 7 Days Social Bundle", productCode: "airtel_1_5gb_7d_social", price: 535, costPrice: 535, validity: "7 Days", capacity: "1.5GB", isActive: true },
  { planId: 985, network: "AIRTEL", category: "SME", name: "Airtel 1GB 3 Days Social Bundle", productCode: "airtel_1gb_3d_social", price: 325, costPrice: 325, validity: "3 Days", capacity: "1GB", isActive: true },
  { planId: 989, network: "AIRTEL", category: "SME", name: "Airtel 1.5GB 1 Day", productCode: "airtel_1_5gb_1d_sme", price: 435, costPrice: 435, validity: "1 Day", capacity: "1.5GB", isActive: true },
  { planId: 990, network: "AIRTEL", category: "SME", name: "Airtel 4GB 2 Days", productCode: "airtel_4gb_2d_sme", price: 900, costPrice: 900, validity: "2 Days", capacity: "4GB", isActive: true },
  { planId: 998, network: "AIRTEL", category: "SME", name: "Airtel 13GB 30 Days", productCode: "airtel_13gb_30d_sme", price: 6000, costPrice: 6000, validity: "30 Days", capacity: "13GB", isActive: true },
  { planId: 1008, network: "AIRTEL", category: "SME", name: "Airtel 60GB 60 Days", productCode: "airtel_60gb_60d_sme", price: 11000, costPrice: 11000, validity: "60 Days", capacity: "60GB", isActive: true },
  { planId: 1012, network: "AIRTEL", category: "SME", name: "Airtel 2GB 2 Days", productCode: "airtel_2gb_2d_sme", price: 680, costPrice: 680, validity: "2 Days", capacity: "2GB", isActive: true },
  { planId: 1013, network: "AIRTEL", category: "SME", name: "Airtel 3GB 2 Days", productCode: "airtel_3gb_2d_sme", price: 890, costPrice: 890, validity: "2 Days", capacity: "3GB", isActive: true },

  // ==========================================
  // AIRTEL SME LITE
  // ==========================================
  { planId: 967, network: "AIRTEL", category: "LITE", name: "Airtel 1GB 7 Days Lite", productCode: "airtel_1gb_7d_lite", price: 779, costPrice: 779, validity: "7 Days", capacity: "1GB", isActive: true },
  { planId: 968, network: "AIRTEL", category: "LITE", name: "Airtel 2GB 30 Days Lite", productCode: "airtel_2gb_30d_lite", price: 1558, costPrice: 1558, validity: "30 Days", capacity: "2GB", isActive: true },
  { planId: 969, network: "AIRTEL", category: "LITE", name: "Airtel 3GB 30 Days Lite", productCode: "airtel_3gb_30d_lite", price: 2337, costPrice: 2337, validity: "30 Days", capacity: "3GB", isActive: true },
  { planId: 971, network: "AIRTEL", category: "LITE", name: "Airtel 8GB 30 Days Lite", productCode: "airtel_8gb_30d_lite", price: 6232, costPrice: 6232, validity: "30 Days", capacity: "8GB", isActive: true },
  { planId: 972, network: "AIRTEL", category: "LITE", name: "Airtel 10GB 30 Days Lite", productCode: "airtel_10gb_30d_lite", price: 7790, costPrice: 7790, validity: "30 Days", capacity: "10GB", isActive: true },

  // ==========================================
  // GLO CORPORATE / CG DATA
  // ==========================================
  { planId: 686, network: "GLO", category: "CORPORATE", name: "Glo CG 200MB 14 Days", productCode: "glo_cg_200mb_14d", price: 81, costPrice: 81, validity: "14 Days", capacity: "200MB", isActive: true },
  { planId: 688, network: "GLO", category: "CORPORATE", name: "Glo CG 500MB 30 Days", productCode: "glo_cg_500mb_30d", price: 202.5, costPrice: 202.5, validity: "30 Days", capacity: "500MB", isActive: true },
  { planId: 689, network: "GLO", category: "CORPORATE", name: "Glo CG 1GB 30 Days", productCode: "glo_cg_1gb_30d", price: 405, costPrice: 405, validity: "30 Days", capacity: "1GB", isActive: true },
  { planId: 690, network: "GLO", category: "CORPORATE", name: "Glo CG 2GB 30 Days", productCode: "glo_cg_2gb_30d", price: 810, costPrice: 810, validity: "30 Days", capacity: "2GB", isActive: true },
  { planId: 691, network: "GLO", category: "CORPORATE", name: "Glo CG 3GB 30 Days", productCode: "glo_cg_3gb_30d", price: 1215, costPrice: 1215, validity: "30 Days", capacity: "3GB", isActive: true },
  { planId: 692, network: "GLO", category: "CORPORATE", name: "Glo CG 5GB 30 Days", productCode: "glo_cg_5gb_30d", price: 2025, costPrice: 2025, validity: "30 Days", capacity: "5GB", isActive: true },
  { planId: 693, network: "GLO", category: "CORPORATE", name: "Glo CG 10GB 30 Days", productCode: "glo_cg_10gb_30d", price: 4050, costPrice: 4050, validity: "30 Days", capacity: "10GB", isActive: true },
  { planId: 991, network: "GLO", category: "CORPORATE", name: "Glo CG 1GB 3 Days", productCode: "glo_cg_1gb_3d", price: 355, costPrice: 355, validity: "3 Days", capacity: "1GB", isActive: true },
  { planId: 992, network: "GLO", category: "CORPORATE", name: "Glo CG 3GB 3 Days", productCode: "glo_cg_3gb_3d", price: 1065, costPrice: 1065, validity: "3 Days", capacity: "3GB", isActive: true },
  { planId: 993, network: "GLO", category: "CORPORATE", name: "Glo CG 5GB 3 Days", productCode: "glo_cg_5gb_3d", price: 1775, costPrice: 1775, validity: "3 Days", capacity: "5GB", isActive: true },
  { planId: 994, network: "GLO", category: "CORPORATE", name: "Glo CG 1GB 7 Days", productCode: "glo_cg_1gb_7d", price: 370, costPrice: 370, validity: "7 Days", capacity: "1GB", isActive: true },
  { planId: 995, network: "GLO", category: "CORPORATE", name: "Glo CG 3GB 7 Days", productCode: "glo_cg_3gb_7d", price: 1110, costPrice: 1110, validity: "7 Days", capacity: "3GB", isActive: true },
  { planId: 996, network: "GLO", category: "CORPORATE", name: "Glo CG 5GB 7 Days", productCode: "glo_cg_5gb_7d", price: 1850, costPrice: 1850, validity: "7 Days", capacity: "5GB", isActive: true },

  // ==========================================
  // GLO DIRECT GIFTING
  // ==========================================
  { planId: 940, network: "GLO", category: "GIFTING", name: "Glo 2.6GB 30 Days", productCode: "glo_2_6gb_30d_gift", price: 930, costPrice: 930, validity: "30 Days", capacity: "2.6GB", isActive: true },
  { planId: 941, network: "GLO", category: "GIFTING", name: "Glo 5GB 30 Days", productCode: "glo_5gb_30d_gift", price: 1395, costPrice: 1395, validity: "30 Days", capacity: "5GB", isActive: true },
  { planId: 942, network: "GLO", category: "GIFTING", name: "Glo 6.15GB 30 Days", productCode: "glo_6_15gb_30d_gift", price: 1860, costPrice: 1860, validity: "30 Days", capacity: "6.15GB", isActive: true },
  { planId: 943, network: "GLO", category: "GIFTING", name: "Glo 7.25GB 30 Days", productCode: "glo_7_25gb_30d_gift", price: 2325, costPrice: 2325, validity: "30 Days", capacity: "7.25GB", isActive: true },
  { planId: 944, network: "GLO", category: "GIFTING", name: "Glo 10GB 30 Days", productCode: "glo_10gb_30d_gift", price: 2790, costPrice: 2790, validity: "30 Days", capacity: "10GB", isActive: true },
  { planId: 945, network: "GLO", category: "GIFTING", name: "Glo 12.5GB 30 Days", productCode: "glo_12_5gb_30d_gift", price: 3720, costPrice: 3720, validity: "30 Days", capacity: "12.5GB", isActive: true },
  { planId: 946, network: "GLO", category: "GIFTING", name: "Glo 16GB 30 Days", productCode: "glo_16gb_30d_gift", price: 4650, costPrice: 4650, validity: "30 Days", capacity: "16GB", isActive: true },
  { planId: 947, network: "GLO", category: "GIFTING", name: "Glo 20.5GB 30 Days", productCode: "glo_20_5gb_30d_gift", price: 5580, costPrice: 5580, validity: "30 Days", capacity: "20.5GB", isActive: true },
  { planId: 948, network: "GLO", category: "GIFTING", name: "Glo 28GB 30 Days", productCode: "glo_28gb_30d_gift", price: 7440, costPrice: 7440, validity: "30 Days", capacity: "28GB", isActive: true },
  { planId: 949, network: "GLO", category: "GIFTING", name: "Glo 38GB 30 Days", productCode: "glo_38gb_30d_gift", price: 9300, costPrice: 9300, validity: "30 Days", capacity: "38GB", isActive: true },
  { planId: 950, network: "GLO", category: "GIFTING", name: "Glo 64GB 30 Days", productCode: "glo_64gb_30d_gift", price: 13950, costPrice: 13950, validity: "30 Days", capacity: "64GB", isActive: true },
  { planId: 951, network: "GLO", category: "GIFTING", name: "Glo 107GB 30 Days", productCode: "glo_107gb_30d_gift", price: 18600, costPrice: 18600, validity: "30 Days", capacity: "107GB", isActive: true },
  { planId: 952, network: "GLO", category: "GIFTING", name: "Glo 135GB 30 Days", productCode: "glo_135gb_30d_gift", price: 23250, costPrice: 23250, validity: "30 Days", capacity: "135GB", isActive: true },
  { planId: 953, network: "GLO", category: "GIFTING", name: "Glo 165GB 30 Days", productCode: "glo_165gb_30d_gift", price: 27900, costPrice: 27900, validity: "30 Days", capacity: "165GB", isActive: true },
  { planId: 954, network: "GLO", category: "GIFTING", name: "Glo 220GB 30 Days", productCode: "glo_220gb_30d_gift", price: 37200, costPrice: 37200, validity: "30 Days", capacity: "220GB", isActive: true },
  { planId: 955, network: "GLO", category: "GIFTING", name: "Glo 310GB 60 Days", productCode: "glo_310gb_60d_gift", price: 46500, costPrice: 46500, validity: "60 Days", capacity: "310GB", isActive: true },
  { planId: 956, network: "GLO", category: "GIFTING", name: "Glo 380GB 90 Days", productCode: "glo_380gb_90d_gift", price: 55800, costPrice: 55800, validity: "90 Days", capacity: "380GB", isActive: true },
  { planId: 957, network: "GLO", category: "GIFTING", name: "Glo 475GB 90 Days", productCode: "glo_475gb_90d_gift", price: 69750, costPrice: 69750, validity: "90 Days", capacity: "475GB", isActive: true },
  { planId: 958, network: "GLO", category: "GIFTING", name: "Glo 1TB 365 Days", productCode: "glo_1tb_365d_gift", price: 139500, costPrice: 139500, validity: "365 Days", capacity: "1TB", isActive: true },

  // ==========================================
  // GLO AWOOF
  // ==========================================
  { planId: 900, network: "GLO", category: "AWOOF", name: "Glo 750MB 1 Day", productCode: "glo_750mb_1d_awoof", price: 186, costPrice: 186, validity: "1 Day", capacity: "750MB", isActive: true },
  { planId: 901, network: "GLO", category: "AWOOF", name: "Glo 1.5GB 1 Day", productCode: "glo_1_5gb_1d_awoof", price: 279, costPrice: 279, validity: "1 Day", capacity: "1.5GB", isActive: true },
  { planId: 902, network: "GLO", category: "AWOOF", name: "Glo 2.5GB 2 Days", productCode: "glo_2_5gb_2d_awoof", price: 465, costPrice: 465, validity: "2 Days", capacity: "2.5GB", isActive: true },
  { planId: 903, network: "GLO", category: "AWOOF", name: "Glo 10GB 7 Days", productCode: "glo_10gb_7d_awoof", price: 1860, costPrice: 1860, validity: "7 Days", capacity: "10GB", isActive: true },
];

export async function ensureDataPlansSeeded(prisma: PrismaClient) {
  for (const plan of DATA_PLANS_SEED) {
    const existing = await prisma.mobileDataPlan.findUnique({
      where: { planId: plan.planId },
    });

    if (!existing) {
      await prisma.mobileDataPlan.create({
        data: {
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
  }
}

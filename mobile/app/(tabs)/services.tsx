import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
} from "react-native";
import {
  Scale,
  ChevronRight,
  Clock,
} from "lucide-react-native";
import { useQuery } from "@tanstack/react-query";
import { api } from "../../lib/api";
import { colors } from "../../constants/theme";

const SERVICES_CATALOG = [
  {
    id: "biz_name",
    title: "Business Name Registration",
    category: "CAC",
    desc: "Sole proprietorships & partnerships with accredited CAC filing (30 Mins).",
    logo: require("../../assets/cac.png"),
  },
  {
    id: "llc",
    title: "Company Registration (LLC)",
    category: "CAC",
    desc: "Private Limited Company with MEMART and share capital (24-72 Hrs).",
    logo: require("../../assets/cac.png"),
  },
  {
    id: "scuml",
    title: "SCUML Certificate",
    category: "Compliance",
    desc: "Special Control Unit Against Money Laundering for corporate bank accounts.",
    logo: require("../../assets/scuml.png"),
  },
  {
    id: "tax_id",
    title: "Tax Identification (TIN)",
    category: "Tax Services",
    desc: "Joint Tax Board (JTB) / FIRS TIN processing and corporate validation.",
    logo: require("../../assets/nrs.png"),
  },
  {
    id: "smedan",
    title: "SMEDAN Certification",
    category: "MSME Development",
    desc: "Official registration with Small & Medium Enterprises Development Agency.",
    logo: require("../../assets/smedan.png"),
  },
  {
    id: "affidavit",
    title: "Court Affidavits",
    category: "Legal",
    desc: "Loss of document, change of name, age declaration affidavits.",
    icon: Scale,
  },
];

export default function ServicesScreen() {
  const { data: dashboardData } = useQuery({
    queryKey: ["mobileServicesApps"],
    queryFn: async () => {
      try {
        return await api.get("/api/dashboard?limit=10");
      } catch {
        return null;
      }
    },
  });

  const applications = dashboardData?.registrations || [];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {/* Header */}
      <View style={styles.header}>
        <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 6 }}>
          <Image
            source={require("../../assets/cac.png")}
            style={{ width: 36, height: 36, marginRight: 10 }}
            resizeMode="contain"
          />
          <Text style={styles.headerTitle}>Corporate & Legal Services</Text>
        </View>
        <Text style={styles.headerSubtitle}>
          Accredited company registrations, compliance certifications, and statutory filings
        </Text>
      </View>

      {/* Services Grid */}
      <Text style={styles.sectionHeader}>Available Registrations</Text>
      <View style={styles.catalogList}>
        {SERVICES_CATALOG.map((item) => {
          const IconComp = item.icon;
          return (
            <TouchableOpacity
              key={item.id}
              style={styles.serviceItem}
              activeOpacity={0.8}
            >
              <View style={styles.itemLogoBox}>
                {item.logo ? (
                  <Image source={item.logo} style={styles.agencyLogo} resizeMode="contain" />
                ) : IconComp ? (
                  <IconComp size={22} color={colors.primary} />
                ) : null}
              </View>
              <View style={{ flex: 1, marginLeft: 14 }}>
                <Text style={styles.itemTitle}>{item.title}</Text>
                <Text style={styles.itemDesc}>{item.desc}</Text>
              </View>
              <ChevronRight size={18} color={colors.textMuted} />
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Active Filings & Tracking Section */}
      <Text style={styles.sectionHeader}>Your Filings & Applications</Text>
      {applications.length > 0 ? (
        <View style={styles.applicationsList}>
          {applications.map((app: any, idx: number) => {
            const isApproved = app.status === "APPROVED";
            const isQueried = app.status === "QUERIED";
            return (
              <View key={app.id || idx} style={styles.appCard}>
                <View style={styles.appCardHeader}>
                  <Text style={styles.appName} numberOfLines={1}>
                    {app.proposedName || "Application Draft"}
                  </Text>
                  <View
                    style={[
                      styles.statusBadge,
                      {
                        backgroundColor: isApproved
                          ? "#10B98122"
                          : isQueried
                          ? "#EF444422"
                          : "#F59E0B22",
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusBadgeText,
                        {
                          color: isApproved
                            ? colors.success
                            : isQueried
                            ? colors.error
                            : colors.warning,
                        },
                      ]}
                    >
                      {app.status}
                    </Text>
                  </View>
                </View>
                <Text style={styles.appId}>
                  Tracking ID: {app.trackingId || app.id?.substring(0, 10)}
                </Text>
              </View>
            );
          })}
        </View>
      ) : (
        <View style={styles.emptyCard}>
          <Clock size={28} color={colors.textMuted} />
          <Text style={styles.emptyCardTitle}>No corporate applications yet</Text>
          <Text style={styles.emptyCardSub}>
            Select a service above to submit a new Business Name or LLC registration.
          </Text>
        </View>
      )}

      {/* Disclaimer Box */}
      <View style={styles.disclaimerBox}>
        <Text style={styles.disclaimerTitle}>Regulatory Notice</Text>
        <Text style={styles.disclaimerText}>
          Lorabiz is an independent corporate facilitation and business management platform. We are an accredited corporate services facilitator and not an agency of the Corporate Affairs Commission (CAC) or the Federal Government of Nigeria.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  contentContainer: {
    paddingHorizontal: 16,
    paddingTop: 52,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: colors.text,
  },
  headerSubtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 4,
    lineHeight: 17,
  },
  sectionHeader: {
    fontSize: 15,
    fontWeight: "800",
    color: colors.text,
    marginBottom: 10,
    marginTop: 6,
  },
  catalogList: {
    gap: 10,
    marginBottom: 24,
  },
  serviceItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    borderRadius: 16,
    padding: 14,
  },
  itemLogoBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  agencyLogo: {
    width: 28,
    height: 28,
  },
  itemTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: colors.text,
  },
  itemDesc: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
    lineHeight: 15,
  },
  applicationsList: {
    gap: 10,
    marginBottom: 24,
  },
  appCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    borderRadius: 14,
    padding: 14,
  },
  appCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  appName: {
    fontSize: 14,
    fontWeight: "800",
    color: colors.text,
    flex: 1,
    marginRight: 10,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: "800",
  },
  appId: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 4,
  },
  emptyCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
    marginBottom: 24,
  },
  emptyCardTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.text,
    marginTop: 10,
  },
  emptyCardSub: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: "center",
    marginTop: 4,
  },
  disclaimerBox: {
    backgroundColor: "rgba(200, 45, 117, 0.08)",
    borderWidth: 1,
    borderColor: "rgba(200, 45, 117, 0.25)",
    borderRadius: 14,
    padding: 14,
  },
  disclaimerTitle: {
    fontSize: 12,
    fontWeight: "800",
    color: colors.primaryLight,
    marginBottom: 4,
  },
  disclaimerText: {
    fontSize: 11,
    color: colors.textSecondary,
    lineHeight: 16,
  },
});

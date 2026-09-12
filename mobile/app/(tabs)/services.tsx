import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import {
  Briefcase,
  Building2,
  ShieldAlert,
  FileCheck,
  Scale,
  ChevronRight,
  Clock,
  CheckCircle,
  AlertCircle,
} from "lucide-react-native";
import { useQuery } from "@tanstack/react-query";
import { api } from "../../lib/api";
import { colors } from "../../constants/theme";

const SERVICES_CATALOG = [
  {
    id: "biz_name",
    title: "Business Name Registration",
    category: "CAC",
    desc: "Sole proprietorships & partnerships with accredited CAC filing.",
    icon: Building2,
    color: colors.primary,
  },
  {
    id: "llc",
    title: "Company Registration (LLC)",
    category: "CAC",
    desc: "Private Limited Company with MEMART and share capital.",
    icon: Briefcase,
    color: colors.purple,
  },
  {
    id: "scuml",
    title: "SCUML Certificate",
    category: "Compliance",
    desc: "Special Control Unit Against Money Laundering for corporate accounts.",
    icon: ShieldAlert,
    color: colors.gold,
  },
  {
    id: "tax_id",
    title: "Tax Identification (TIN)",
    category: "Tax Services",
    desc: "Joint Tax Board (JTB) TIN validation & registration for businesses.",
    icon: FileCheck,
    color: colors.success,
  },
  {
    id: "affidavit",
    title: "Court Affidavits",
    category: "Legal",
    desc: "Loss of document, change of name, age declaration affidavits.",
    icon: Scale,
    color: "#EC4899",
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
        <Text style={styles.headerTitle}>Corporate & Legal Services</Text>
        <Text style={styles.headerSubtitle}>
          Accredited company registrations, compliance certifications, and filings
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
              <View style={[styles.itemIconBox, { backgroundColor: `${item.color}22` }]}>
                <IconComp size={22} color={item.color} />
              </View>
              <View style={{ flex: 1, marginLeft: 14 }}>
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <Text style={styles.itemTitle}>{item.title}</Text>
                </View>
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
    paddingHorizontal: 20,
    paddingTop: 54,
    paddingBottom: 36,
  },
  header: {
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: colors.text,
  },
  headerSubtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 4,
  },
  sectionHeader: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.text,
    marginBottom: 12,
    marginTop: 10,
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
    borderRadius: 14,
    padding: 14,
  },
  itemIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  itemTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.text,
  },
  itemDesc: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
    lineHeight: 16,
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
    fontSize: 15,
    fontWeight: "700",
    color: colors.text,
    flex: 1,
    marginRight: 10,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: "700",
  },
  appId: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 4,
  },
  emptyCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    borderRadius: 14,
    padding: 24,
    alignItems: "center",
    marginBottom: 24,
  },
  emptyCardTitle: {
    fontSize: 14,
    fontWeight: "600",
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
    backgroundColor: "#0284C70D",
    borderWidth: 1,
    borderColor: "#0284C733",
    borderRadius: 14,
    padding: 14,
  },
  disclaimerTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.primaryLight,
    marginBottom: 4,
  },
  disclaimerText: {
    fontSize: 11,
    color: colors.textSecondary,
    lineHeight: 16,
  },
});

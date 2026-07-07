import { Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import { getCoverFields, getPartyRows, getStandardTermsClauses } from "@/lib/nda-content";
import type { NdaFormData } from "@/lib/nda-types";

const styles = StyleSheet.create({
  page: { padding: 48, fontSize: 10, fontFamily: "Helvetica", lineHeight: 1.4 },
  title: { fontSize: 16, fontFamily: "Helvetica-Bold", textAlign: "center", marginBottom: 16 },
  fieldRow: { flexDirection: "row", marginBottom: 4 },
  fieldLabel: { fontFamily: "Helvetica-Bold", width: 160 },
  fieldValue: { flex: 1 },
  table: { marginTop: 16, marginBottom: 16, borderWidth: 1, borderColor: "#999999" },
  tableRow: { flexDirection: "row" },
  tableBoldCell: {
    flex: 1,
    padding: 4,
    borderWidth: 0.5,
    borderColor: "#999999",
    fontFamily: "Helvetica-Bold",
  },
  tableCell: { flex: 1, padding: 4, borderWidth: 0.5, borderColor: "#999999" },
  sectionTitle: { fontSize: 13, fontFamily: "Helvetica-Bold", marginTop: 16, marginBottom: 8 },
  clause: { marginBottom: 8, textAlign: "justify" },
  clauseTitle: { fontFamily: "Helvetica-Bold" },
  footer: { marginTop: 16, fontSize: 8, color: "#666666" },
});

interface NdaPdfDocumentProps {
  data: NdaFormData;
}

export default function NdaPdfDocument({ data }: NdaPdfDocumentProps) {
  const coverFields = getCoverFields(data);
  const partyRows = getPartyRows(data);
  const clauses = getStandardTermsClauses(data);

  return (
    <Document title="Mutual Non-Disclosure Agreement">
      <Page size="LETTER" style={styles.page}>
        <Text style={styles.title}>Mutual Non-Disclosure Agreement</Text>

        {coverFields.map((field) => (
          <View style={styles.fieldRow} key={field.label}>
            <Text style={styles.fieldLabel}>{field.label}:</Text>
            <Text style={styles.fieldValue}>{field.value}</Text>
          </View>
        ))}

        <View style={styles.table}>
          <View style={styles.tableRow}>
            <Text style={styles.tableBoldCell}> </Text>
            <Text style={styles.tableBoldCell}>Party 1</Text>
            <Text style={styles.tableBoldCell}>Party 2</Text>
          </View>
          {partyRows.map((row) => (
            <View style={styles.tableRow} key={row.label}>
              <Text style={styles.tableBoldCell}>{row.label}</Text>
              <Text style={styles.tableCell}>{row.partyOne}</Text>
              <Text style={styles.tableCell}>{row.partyTwo}</Text>
            </View>
          ))}
        </View>

        <Text style={styles.sectionTitle}>Standard Terms</Text>
        {clauses.map((clause, index) => (
          <View style={styles.clause} key={clause.title} wrap>
            <Text>
              <Text style={styles.clauseTitle}>
                {index + 1}. {clause.title}.{" "}
              </Text>
              {clause.body}
            </Text>
          </View>
        ))}

        <Text style={styles.footer}>
          Based on the Common Paper Mutual Non-Disclosure Agreement, Version 1.0, free to use
          under CC BY 4.0. This document is a prototype output and is not legal advice.
        </Text>
      </Page>
    </Document>
  );
}

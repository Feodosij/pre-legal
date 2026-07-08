import { Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import { parseInlineMarkdown } from "@/lib/inline-markdown";
import type { RenderedDocument } from "@/lib/rendered-document-types";

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

interface GenericPdfDocumentProps {
  document: RenderedDocument;
}

function InlineText({ text }: { text: string }) {
  return (
    <>
      {parseInlineMarkdown(text).map((segment, index) =>
        segment.bold ? (
          <Text key={index} style={styles.clauseTitle}>
            {segment.text}
          </Text>
        ) : (
          <Text key={index}>{segment.text}</Text>
        )
      )}
    </>
  );
}

export default function GenericPdfDocument({ document }: GenericPdfDocumentProps) {
  return (
    <Document title={document.title}>
      <Page size="LETTER" style={styles.page}>
        <Text style={styles.title}>{document.title}</Text>

        {document.coverFields.map((field) => (
          <View style={styles.fieldRow} key={field.label}>
            <Text style={styles.fieldLabel}>{field.label}:</Text>
            <Text style={styles.fieldValue}>{field.value}</Text>
          </View>
        ))}

        <View style={styles.table}>
          <View style={styles.tableRow}>
            <Text style={styles.tableBoldCell}> </Text>
            {document.partyRoleLabels.map((label) => (
              <Text style={styles.tableBoldCell} key={label}>
                {label}
              </Text>
            ))}
          </View>
          {document.partyRows.map((row) => (
            <View style={styles.tableRow} key={row.label}>
              <Text style={styles.tableBoldCell}>{row.label}</Text>
              {row.values.map((value, index) => (
                <Text style={styles.tableCell} key={index}>
                  {value}
                </Text>
              ))}
            </View>
          ))}
        </View>

        {document.sections.map((section) => (
          <View key={section.title}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            {section.subsections.map((subsection, index) => (
              <View style={styles.clause} key={index} wrap>
                <Text>
                  {subsection.title && (
                    <Text style={styles.clauseTitle}>
                      {index + 1}. {subsection.title}.{" "}
                    </Text>
                  )}
                  <InlineText text={subsection.body} />
                </Text>
              </View>
            ))}
          </View>
        ))}

        <Text style={styles.footer}>
          This document is a prototype output and is not legal advice.
        </Text>
      </Page>
    </Document>
  );
}

import { NextRequest, NextResponse } from 'next/server';
import { renderToStream } from '@react-pdf/renderer';
import React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

const styles = StyleSheet.create({
  page: { padding: 40, fontFamily: 'Helvetica' },
  header: { marginBottom: 30, borderBottom: '2px solid #8B2E2E', paddingBottom: 10 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#2A2A2A' },
  subtitle: { fontSize: 12, color: '#666', marginTop: 5 },
  section: { marginTop: 10, flexGrow: 1 },
  row: { flexDirection: 'row', justifyItems: 'space-between', marginBottom: 5 },
  bold: { fontWeight: 'bold' },
  total: { marginTop: 20, borderTop: '1px solid #ccc', paddingTop: 10, fontWeight: 'bold', fontSize: 16 }
});

const InvoiceDocument = ({ id }: { id: string }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      <View style={styles.header}>
        <Text style={styles.title}>Mithila Enterprises</Text>
        <Text style={styles.subtitle}>Tax Invoice | Order #{id}</Text>
      </View>
      <View style={styles.section}>
        <Text style={{ marginBottom: 20, fontSize: 14 }}>Thank you for your business!</Text>
        
        {/* Placeholder Table */}
        <View style={{ ...styles.row, borderBottom: '1px solid #ccc', paddingBottom: 5, marginBottom: 10 }}>
          <Text style={{ width: '60%', fontWeight: 'bold' }}>Description</Text>
          <Text style={{ width: '20%', fontWeight: 'bold', textAlign: 'right' }}>Qty</Text>
          <Text style={{ width: '20%', fontWeight: 'bold', textAlign: 'right' }}>Amount</Text>
        </View>
        <View style={styles.row}>
          <Text style={{ width: '60%' }}>Premium Fabrics (Assorted)</Text>
          <Text style={{ width: '20%', textAlign: 'right' }}>1</Text>
          <Text style={{ width: '20%', textAlign: 'right' }}>INR 12,450.00</Text>
        </View>
        
        <View style={{ ...styles.row, ...styles.total }}>
          <Text style={{ width: '80%' }}>Total</Text>
          <Text style={{ width: '20%', textAlign: 'right' }}>INR 12,450.00</Text>
        </View>
      </View>
    </Page>
  </Document>
);

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const stream = await renderToStream(<InvoiceDocument id={id} />);
    
    return new Response(stream as any, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="invoice-${id}.pdf"`,
      },
    });
  } catch (error) {
    console.error('PDF Generation Error:', error);
    return new NextResponse('Error generating PDF', { status: 500 });
  }
}

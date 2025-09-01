import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  ScrollView,
  Share,
  Platform,
  Modal,
  Switch,
} from 'react-native';
// calendar removed: using simple month/year pickers
import { salesService } from '../../services/salesService';
import { useToast } from '../../components/ToastProvider';
import { Sale } from '../../types';

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  pageHeader: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingTop: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  pageTitle: { fontSize: 18, fontWeight: '800', color: '#0F172A' },
  pageSubtitle: { fontSize: 12, color: '#64748B', marginTop: 4 },
  filtersRow: { flexDirection: 'row', padding: 12, gap: 8 },
  filterButton: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  filterButtonActive: { borderColor: '#2563EB', backgroundColor: '#EFF6FF' },
  filterText: { fontSize: 13, color: '#374151', fontWeight: '700' },
  listItem: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 12,
    marginTop: 10,
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E6EEF8',
  },
  listTitle: { fontSize: 14, fontWeight: '800', color: '#0F172A' },
  listSubtitle: { fontSize: 12, color: '#64748B', marginTop: 6 },
  listAmount: { marginTop: 8 },
  containerPadding: { padding: 12 },
  rowInline: { flexDirection: 'row' },
  rowGap8: { gap: 8 },
  marginTop12: { marginTop: 12 },
  actionsInline: {
    marginTop: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  loadingPadding: { padding: 24 },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 12,
  },
  exportButton: {
    backgroundColor: '#2563EB',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
  },
  exportText: { color: '#FFFFFF', fontWeight: '800' },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 13,
    color: '#0F172A',
  },
  selectedInfo: { marginTop: 8, color: '#64748B' },
  scrollYears: { paddingVertical: 8 },
  yearButton: { marginRight: 8 },
  smallMarginTop8: { marginTop: 8 },
  // Sale item styles (match SalesScreen layout)
  saleItem: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 12,
    marginBottom: 8,
    borderRadius: 12,
    padding: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  saleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  saleInfo: { flex: 1, marginRight: 8 },
  saleTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 2,
  },
  saleCustomer: { fontSize: 11, color: '#64748B', fontWeight: '500' },
  saleSku: { fontSize: 10, color: '#9CA3AF', fontWeight: '500', marginTop: 2 },
  saleAmount: { alignItems: 'flex-end' },
  saleTotalPrice: { fontSize: 14, fontWeight: '900', color: '#0F172A' },
  saleTime: { fontSize: 10, color: '#9CA3AF', marginTop: 4 },
  saleDetails: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 16,
    marginTop: 12,
  },
  saleDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  saleDetailLabel: { fontSize: 13, color: '#64748B', fontWeight: '600' },
  saleDetailValue: { fontSize: 14, color: '#0F172A', fontWeight: '700' },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    alignSelf: 'flex-start',
    marginTop: 8,
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statusCompleted: { backgroundColor: '#DCFCE7' },
  statusCompletedText: { color: '#15803D' },
  statusPartial: { backgroundColor: '#FEF3C7' },
  statusPartialText: { color: '#D97706' },
  statusPending: { backgroundColor: '#FEE2E2' },
  statusPendingText: { color: '#DC2626' },
  paymentBreakdown: { marginTop: 12 },
  paymentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  },
  paymentIcon: {
    width: 24,
    height: 24,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  paymentIconCash: { backgroundColor: '#10B981' },
  paymentIconOnline: { backgroundColor: '#3B82F6' },
  paymentIconText: { color: '#FFFFFF', fontSize: 12 },
  paymentLabel: { flex: 1, fontSize: 13, color: '#64748B', fontWeight: '600' },
  paymentValue: { fontSize: 14, color: '#0F172A', fontWeight: '700' },
  detailValueError: { color: '#EF4444' },
  paymentItemMargin: { marginTop: 8 },
  paymentBreakdownText: { fontSize: 12, color: '#9CA3AF' },
  monthGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  monthButtonInline: { marginRight: 8, marginBottom: 8 },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(2,6,23,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 720,
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 6,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 8,
  },
  modalMessage: { fontSize: 13, color: '#475569', marginBottom: 12 },
  modalPath: { fontSize: 12, color: '#94A3B8', marginBottom: 12 },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 8 },
  modalButtonPrimary: {
    backgroundColor: '#2563EB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  modalButton: { borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10 },
  modalButtonTextPrimary: { color: '#fff', fontWeight: '700' },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  switchLabel: { fontSize: 13, color: '#374151', fontWeight: '700' },
});

const startOfDay = (d: Date) => {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
};

const endOfDay = (d: Date) => {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x;
};

const formatCurrency = (amount: number): string => {
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'pkr',
      minimumFractionDigits: 0,
    }).format(amount);
  } catch (e) {
    return String(amount);
  }
};

const formatTime = (date: Date): string => {
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });
};

const getSaleStatus = (totalPrice: number, paidAmount: number) => {
  if (paidAmount >= totalPrice) return 'completed';
  if (paidAmount > 0) return 'partial';
  return 'pending';
};

const SaleItemComponent: React.FC<{ item: Sale }> = ({ item }) => {
  const timestamp = item.createdAt?.toDate
    ? item.createdAt.toDate()
    : new Date();
  const paidCash = Number(item.paidCash || 0);
  const paidOnline = Number(item.paidOnline || 0);
  const totalPaid = Number(item.paidAmount || paidCash + paidOnline || 0);
  const remaining = Number(
    item.remainingAmount || Math.max(0, (item.totalPrice || 0) - totalPaid),
  );
  const saleStatus = getSaleStatus(item.totalPrice || 0, totalPaid);

  return (
    <View style={styles.saleItem}>
      <View style={styles.saleHeader}>
        <View style={styles.saleInfo}>
          <Text style={styles.saleTitle}>
            {item.productName || item.name || item.sku}
          </Text>
          <Text style={styles.saleCustomer}>{item.customer}</Text>
          {item.sku && <Text style={styles.saleSku}>SKU: {item.sku}</Text>}
        </View>
        <View style={styles.saleAmount}>
          <Text style={styles.saleTotalPrice}>
            {formatCurrency(item.totalPrice || 0)}
          </Text>
          <Text style={styles.saleTime}>{formatTime(timestamp)}</Text>
        </View>
      </View>

      <View style={styles.saleDetails}>
        <View style={styles.saleDetailRow}>
          <Text style={styles.saleDetailLabel}>Quantity × Unit Price</Text>
          <Text style={styles.saleDetailValue}>
            {item.quantity} × {formatCurrency(item.unitPrice || 0)}
          </Text>
        </View>

        <View style={styles.saleDetailRow}>
          <Text style={styles.saleDetailLabel}>Total Paid</Text>
          <Text style={styles.saleDetailValue}>
            {formatCurrency(totalPaid)}
          </Text>
        </View>

        {remaining > 0 && (
          <View style={styles.saleDetailRow}>
            <Text style={styles.saleDetailLabel}>Remaining</Text>
            <Text style={[styles.saleDetailValue, styles.detailValueError]}>
              {formatCurrency(remaining)}
            </Text>
          </View>
        )}
      </View>

      {(paidCash > 0 || paidOnline > 0) && (
        <View style={styles.paymentBreakdown}>
          {paidCash > 0 && (
            <View style={styles.paymentItem}>
              <View style={[styles.paymentIcon, styles.paymentIconCash]}>
                <Text style={styles.paymentIconText}>💵</Text>
              </View>
              <Text style={styles.paymentLabel}>Cash</Text>
              <Text style={styles.paymentValue}>
                {formatCurrency(paidCash)}
              </Text>
            </View>
          )}

          {paidOnline > 0 && (
            <View style={styles.paymentItem}>
              <View style={[styles.paymentIcon, styles.paymentIconOnline]}>
                <Text style={styles.paymentIconText}>💳</Text>
              </View>
              <Text style={styles.paymentLabel}>
                {item.paymentPlatform || 'Online'}
              </Text>
              <Text style={styles.paymentValue}>
                {formatCurrency(paidOnline)}
              </Text>
            </View>
          )}

          {item.transactionId && (
            <View style={[styles.paymentItem, styles.paymentItemMargin]}>
              <Text style={[styles.paymentLabel, styles.paymentBreakdownText]}>
                Transaction ID: {item.transactionId}
              </Text>
            </View>
          )}
        </View>
      )}

      <View
        style={[
          styles.statusBadge,
          saleStatus === 'completed' && styles.statusCompleted,
          saleStatus === 'partial' && styles.statusPartial,
          saleStatus === 'pending' && styles.statusPending,
        ]}
      >
        <Text
          style={[
            styles.statusBadgeText,
            saleStatus === 'completed' && styles.statusCompletedText,
            saleStatus === 'partial' && styles.statusPartialText,
            saleStatus === 'pending' && styles.statusPendingText,
          ]}
        >
          {saleStatus === 'completed'
            ? '✅ Paid in Full'
            : saleStatus === 'partial'
            ? '⚠️ Partially Paid'
            : '❌ Pending Payment'}
        </Text>
      </View>
    </View>
  );
};

const ReportsScreen: React.FC = () => {
  const toast = useToast();
  const [errorModalVisible, setErrorModalVisible] = useState(false);
  const [errorModalTitle, setErrorModalTitle] = useState('');
  const [errorModalMessage, setErrorModalMessage] = useState('');
  const [errorModalPath, setErrorModalPath] = useState<string | null>(null);
  const [modalSourcePath, setModalSourcePath] = useState<string | null>(null);
  const [saveToDevice, setSaveToDevice] = useState(true);
  const [openAfterExport, setOpenAfterExport] = useState(true);
  const [filterMode, setFilterMode] = useState<'month' | 'year'>('month');
  const [monthInput, setMonthInput] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`; // YYYY-MM
  });
  const [yearInput, setYearInput] = useState(() =>
    String(new Date().getFullYear()),
  );
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(false);

  const buildRange = useCallback(() => {
    const today = new Date();
    if (filterMode === 'year') {
      const y = Number(yearInput) || today.getFullYear();
      const start = new Date(y, 0, 1);
      const end = new Date(y, 11, 31);
      return { start: startOfDay(start), end: endOfDay(end) };
    }

    // month mode (default)
    const [y, m] = monthInput.split('-').map(Number);
    const start = new Date(
      y || today.getFullYear(),
      (m || today.getMonth() + 1) - 1,
      1,
    );
    const end = new Date(
      y || today.getFullYear(),
      m || today.getMonth() + 1,
      0,
    );
    return { start: startOfDay(start), end: endOfDay(end) };
  }, [filterMode, monthInput, yearInput]);

  const fetchSalesRange = useCallback(async () => {
    setLoading(true);
    try {
      const range = buildRange();
      try {
        const data = await salesService.getSalesByDateRange(
          range.start,
          range.end,
        );
        setSales((data || []) as unknown as Sale[]);
      } catch (e) {
        console.warn('Failed to fetch sales by date range via service:', e);
        setSales([]);
      }
    } catch (e) {
      console.error('Failed to fetch sales for range', e);
      toast.showToast('Failed to load reports', 'error');
    } finally {
      setLoading(false);
    }
  }, [buildRange, toast]);

  useEffect(() => {
    fetchSalesRange();
  }, [fetchSalesRange]);

  const exportToPdf = useCallback(async () => {
    if (sales.length === 0) {
      toast.showToast('No sales to export for the selected range', 'info');
      return;
    }

    try {
      const range = buildRange();
      const filterLabel =
        filterMode === 'year' ? `${yearInput}` : `${monthInput}`;
      const generatedAt = new Date().toLocaleString();
      const total = sales.reduce(
        (s, it) => s + (Number(it.totalPrice) || 0),
        0,
      );

      const rows = sales
        .map(s => {
          const d = s.createdAt?.toDate ? s.createdAt.toDate() : new Date();
          const date = d.toLocaleDateString();
          const customer = escapeHtml(s.customer || '');
          const product = escapeHtml(s.productName || s.name || s.sku || '');
          const qty = s.quantity ?? '';
          const unit = s.unitPrice ? formatCurrency(s.unitPrice) : '';
          const amount = formatCurrency(s.totalPrice || 0);
          const status = escapeHtml(
            getSaleStatus(s.totalPrice || 0, s.paidAmount || 0),
          );
          return `<tr><td>${date}</td><td>${customer}</td><td>${product}</td><td class="center">${qty}</td><td class="right">${unit}</td><td class="right">${amount}</td><td>${status}</td></tr>`;
        })
        .join('\n');

      const html = `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial; color:#0F172A }
    .header{display:flex;justify-content:space-between;align-items:center;margin-bottom:20px}
    .meta{font-size:12px;color:#64748B}
    table{width:100%;border-collapse:collapse}
    th,td{padding:8px;border-bottom:1px solid #E6EEF8;text-align:left}
    .right{text-align:right}
    .center{text-align:center}
    .badge{background:#EFF6FF;padding:8px;border-radius:6px;font-weight:800}
    .totalRow td{border-top:2px solid #E2E8F0;font-weight:800}
  </style>
</head>
<body>
  <div class="header">
    <div>
      <h1>Sales Report</h1>
      <div class="meta">${filterLabel} • Range: ${new Date(
        range.start,
      ).toLocaleDateString()} - ${new Date(
        range.end,
      ).toLocaleDateString()}</div>
      <div class="meta">Generated: ${generatedAt}</div>
    </div>
    <div>
      <div class="badge">Total: ${formatCurrency(total)}</div>
    </div>
  </div>
  <table>
    <thead>
      <tr>
        <th style="width:16%">Date</th>
        <th style="width:20%">Customer</th>
        <th style="width:26%">Product</th>
        <th style="width:8%" class="center">Qty</th>
        <th style="width:10%" class="right">Unit</th>
        <th style="width:10%" class="right">Amount</th>
        <th style="width:10%">Status</th>
      </tr>
    </thead>
    <tbody>
      ${rows}
      <tr class="totalRow"><td colspan="5"></td><td class="right">${formatCurrency(
        total,
      )}</td><td></td></tr>
    </tbody>
  </table>
</body>
</html>`;

      // require the native module and support various export shapes
      let mod;
      try {
        mod = require('react-native-html-to-pdf');
      } catch (e) {
        throw new Error('module-missing');
      }

      const RNHTMLtoPDF = mod?.default ?? mod;
      if (!RNHTMLtoPDF) throw new Error('module-missing');

      let file: any = null;
      if (typeof RNHTMLtoPDF === 'function') {
        file = await RNHTMLtoPDF({
          html,
          fileName: `sales-report-${Date.now()}`,
        });
      } else if (typeof RNHTMLtoPDF.convert === 'function') {
        file = await RNHTMLtoPDF.convert({
          html,
          fileName: `sales-report-${Date.now()}`,
        });
      } else if (typeof RNHTMLtoPDF.convertToPDF === 'function') {
        file = await RNHTMLtoPDF.convertToPDF({
          html,
          fileName: `sales-report-${Date.now()}`,
        });
      } else {
        console.warn(
          'Unexpected react-native-html-to-pdf module shape:',
          RNHTMLtoPDF,
        );
        throw new Error('unsupported-module-shape');
      }

      const sourcePath = file?.filePath ?? file?.path ?? file?.fileName ?? null;
      if (!sourcePath) {
        setErrorModalTitle('PDF Created');
        setErrorModalMessage(
          'PDF was created but path could not be determined. You can still try to share it.',
        );
        setModalSourcePath(null);
        setErrorModalPath(null);
        setErrorModalVisible(true);
        return;
      }

      // Defer copy to Downloads until user confirms in modal
      setModalSourcePath(sourcePath);
      setErrorModalTitle('PDF Created');
      setErrorModalMessage(
        'A PDF was created. Toggle "Save to Downloads" and press OK to save it.',
      );
      setErrorModalPath(sourcePath);
      setErrorModalVisible(true);
    } catch (err: any) {
      console.warn('PDF export failed:', err);
      const msg =
        err?.message === 'module-missing'
          ? 'PDF native module not found. Rebuild the app after installing the package.'
          : err?.message === 'unsupported-module-shape'
          ? 'PDF module loaded but has unexpected API. Check console logs for module shape.'
          : 'PDF export failed. See console for details.';
      setErrorModalTitle('Export Failed');
      setErrorModalMessage(
        msg + '\n\nCheck console logs for details or rebuild the app.',
      );
      setErrorModalPath(null);
      setErrorModalVisible(true);
    }
  }, [sales, buildRange, toast, filterMode, monthInput, yearInput]);

  // close handler used inline

  const shareErrorModalFile = async () => {
    if (!errorModalPath) return;
    try {
      await Share.share({
        url:
          Platform.OS === 'android' && !errorModalPath.startsWith('file://')
            ? `file://${errorModalPath}`
            : errorModalPath,
        title: 'Sales Report',
      } as any);
    } catch (e) {
      console.warn('Share failed', e);
      toast.showToast('Could not share file.', 'error');
    }
  };

  const handleModalConfirm = async () => {
    // if modalSourcePath present and user wants to save, copy to downloads and try to open
    if (!modalSourcePath) {
      setErrorModalVisible(false);
      return;
    }

    let finalPath = modalSourcePath;
    if (saveToDevice) {
      try {
        const RNFS = require('react-native-fs');
        const downloadsDir =
          RNFS.DownloadDirectoryPath ??
          RNFS.ExternalDownloadsDirectoryPath ??
          RNFS.ExternalDirectoryPath ??
          null;
        if (downloadsDir) {
          const fileName = `sales-report-${Date.now()}.pdf`;
          const dest = `${downloadsDir}/${fileName}`;
          if (modalSourcePath !== dest)
            await RNFS.copyFile(modalSourcePath, dest);
          finalPath = dest;
          setErrorModalMessage('Saved to Downloads. Opening...');
          setErrorModalPath(finalPath);
        }
      } catch (e) {
        console.warn('Copy to downloads failed', e);
        setErrorModalMessage(
          'Saved but could not copy to Downloads. You can share the file.',
        );
        setErrorModalPath(modalSourcePath);
      }
    }

    // attempt to open via Share (lets user choose PDF viewer)
    try {
      await Share.share({
        url:
          Platform.OS === 'android' && !finalPath!.startsWith('file://')
            ? `file://${finalPath}`
            : finalPath!,
        title: 'Sales Report',
      } as any);
    } catch (e) {
      console.warn('Open failed', e);
      toast.showToast('Could not open file automatically.', 'error');
    }

    setModalSourcePath(null);
    setErrorModalVisible(false);
  };

  // small helper to escape HTML in data
  function escapeHtml(str: string) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // nested SaleItemComponent removed (uses top-level SaleItemComponent)

  return (
    <View style={styles.container}>
      {/* Themed error modal shown when PDF/RNFS operations fail */}
      <Modal
        visible={errorModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setErrorModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>{errorModalTitle}</Text>
            <Text style={styles.modalMessage}>{errorModalMessage}</Text>
            <View style={styles.switchRow}>
              <Text style={styles.switchLabel}>Save to Downloads</Text>
              <Switch value={saveToDevice} onValueChange={setSaveToDevice} />
            </View>
            <View style={styles.switchRow}>
              <Text style={styles.switchLabel}>Open after export</Text>
              <Switch
                value={openAfterExport}
                onValueChange={setOpenAfterExport}
              />
            </View>
            {errorModalPath ? (
              <Text style={styles.modalPath}>{errorModalPath}</Text>
            ) : null}
            <View style={styles.modalActions}>
              {errorModalPath ? (
                <TouchableOpacity
                  style={[styles.filterButton, styles.modalButtonPrimary]}
                  onPress={shareErrorModalFile}
                >
                  <Text style={[styles.modalButtonTextPrimary]}>
                    Share / Open
                  </Text>
                </TouchableOpacity>
              ) : null}
              <TouchableOpacity
                style={[styles.filterButton, styles.modalButton]}
                onPress={handleModalConfirm}
              >
                <Text style={styles.filterText}>OK</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      <View style={styles.pageHeader}>
        <Text style={styles.pageTitle}>Reports</Text>
        <Text style={styles.pageSubtitle}>
          Filter sales by day, month or year and export to PDF
        </Text>
      </View>

      <View style={styles.containerPadding}>
        <View style={[styles.rowInline, styles.rowGap8]}>
          <TouchableOpacity
            style={[
              styles.filterButton,
              filterMode === 'month' && styles.filterButtonActive,
            ]}
            onPress={() => setFilterMode('month')}
          >
            <Text style={styles.filterText}>Month</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.filterButton,
              filterMode === 'year' && styles.filterButtonActive,
            ]}
            onPress={() => setFilterMode('year')}
          >
            <Text style={styles.filterText}>Year</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.marginTop12}>
          {filterMode === 'month' && (
            <View>
              {/* Year slider (select year first) */}
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.scrollYears}
              >
                {(() => {
                  const current = new Date().getFullYear();
                  const years = [] as number[];
                  for (let i = current - 10; i <= current + 10; i++)
                    years.push(i);
                  return years.map(y => (
                    <TouchableOpacity
                      key={y}
                      style={[
                        styles.filterButton,
                        yearInput === String(y) && styles.filterButtonActive,
                        styles.yearButton,
                      ]}
                      onPress={() => {
                        setYearInput(String(y));
                        // default month to January of selected year
                        setMonthInput(`${y}-01`);
                      }}
                    >
                      <Text style={styles.filterText}>{y}</Text>
                    </TouchableOpacity>
                  ));
                })()}
              </ScrollView>

              {/* Months slider for the selected year */}
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.scrollYears}
              >
                {[
                  'Jan',
                  'Feb',
                  'Mar',
                  'Apr',
                  'May',
                  'Jun',
                  'Jul',
                  'Aug',
                  'Sep',
                  'Oct',
                  'Nov',
                  'Dec',
                ].map((shortName, idx) => {
                  const m = String(idx + 1).padStart(2, '0');
                  const y = yearInput || monthInput.split('-')[0];
                  const value = `${y}-${m}`;
                  const active = value === monthInput;
                  return (
                    <TouchableOpacity
                      key={value}
                      style={[
                        styles.filterButton,
                        active && styles.filterButtonActive,
                        styles.yearButton,
                      ]}
                      onPress={() => setMonthInput(value)}
                    >
                      <Text style={styles.filterText}>{shortName}</Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              <Text style={styles.selectedInfo}>
                Selected month: {monthInput}
              </Text>
            </View>
          )}

          {filterMode === 'year' && (
            <View>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.scrollYears}
              >
                {(() => {
                  const current = new Date().getFullYear();
                  const years = [] as number[];
                  for (let i = current - 10; i <= current + 10; i++)
                    years.push(i);
                  return years.map(y => (
                    <TouchableOpacity
                      key={y}
                      style={[
                        styles.filterButton,
                        yearInput === String(y) && styles.filterButtonActive,
                        styles.yearButton,
                      ]}
                      onPress={() => setYearInput(String(y))}
                    >
                      <Text style={styles.filterText}>{y}</Text>
                    </TouchableOpacity>
                  ));
                })()}
              </ScrollView>
              <Text style={styles.selectedInfo}>
                Selected year: {yearInput}
              </Text>
            </View>
          )}

          <View style={styles.actionsInline}>
            <TouchableOpacity
              style={[styles.filterButton]}
              onPress={fetchSalesRange}
            >
              <Text style={styles.filterText}>Apply</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.exportButton} onPress={exportToPdf}>
              <Text style={styles.exportText}>Export PDF</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {loading ? (
        <View style={styles.loadingPadding}>
          <ActivityIndicator size="large" color="#2563EB" />
        </View>
      ) : (
        <FlatList
          data={sales}
          keyExtractor={s => s.id}
          renderItem={({ item }) => <SaleItemComponent item={item} />}
        />
      )}
    </View>
  );
};

export default ReportsScreen;

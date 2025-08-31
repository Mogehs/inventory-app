import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  Keyboard,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRoute, useFocusEffect } from '@react-navigation/native';
import firestore from '@react-native-firebase/firestore';

const todayStart = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
};

const parseNumber = (v: any) => {
  const n = Number(String(v).replace(/[^0-9.-]+/g, ''));
  return isNaN(n) ? 0 : n;
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  form: {
    padding: 12,
    backgroundColor: '#fff',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.07,
    shadowRadius: 10,
    elevation: 4,
    marginBottom: 16, // keep space below form
  },
  header: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 12,
    color: '#111827',
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#FFF',
    padding: 10,
    borderRadius: 10,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E6EEF8',
  },
  inputDisabled: { backgroundColor: '#F3F4F6', color: '#6B7280' },
  inputFlexLeft: { flex: 1, marginRight: 8 },
  inputFlexRight: { flex: 1 },
  row: { flexDirection: 'row' },
  summaryCard: {
    backgroundColor: '#F9FAFB',
    padding: 12,
    borderRadius: 10,
    marginVertical: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  summaryLabel: { color: '#6B7280', fontWeight: '600' },
  summaryValue: { fontWeight: '700', color: '#111827' },
  remainingValue: { color: '#DC2626' },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  metaLeft: { flex: 1 },
  metaRight: { width: 92, alignItems: 'flex-end' },
  metaLabel: { fontSize: 12, color: '#6B7280', fontWeight: '600' },
  paidValue: { fontSize: 16, fontWeight: '700', color: '#111827' },
  metaSmall: { fontSize: 12, color: '#9CA3AF', marginTop: 4 },
  negative: { color: '#DC2626' },
  positive: { color: '#10B981' },
  paymentRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
  pill: {
    backgroundColor: '#E8F0FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 8,
  },
  pillText: { color: '#4F46E5', fontWeight: '700', fontSize: 12 },
  txText: { color: '#6B7280', fontSize: 12 },
  saveBtn: {
    backgroundColor: '#2563EB',
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 6,
  },
  saveBtnText: { color: '#fff', fontWeight: '700' },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginTop: 10,
    color: '#111827',
  },
  separator: { height: 12 },
  saleRow: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  saleMain: { flex: 1 },
  saleRight: { alignItems: 'flex-end' },
  saleTitle: { fontWeight: '700', fontSize: 16, color: '#0F172A' },
  saleMeta: { color: '#4B5563', fontSize: 13, marginTop: 6 },
  saleMetaSmall: { color: '#6B7280', fontSize: 12, marginTop: 6 },
  saleAmount: { fontWeight: '900', fontSize: 16, color: '#0B5FFF' },
  saleTime: { color: '#9CA3AF', fontSize: 12, marginTop: 8 },
  emptyText: { color: '#9CA3AF', textAlign: 'center', marginTop: 8 },
  contentContainer: {
    paddingHorizontal: 12,
    paddingBottom: 24,
  },
  listHeaderWrapper: {
    paddingTop: 16,
    paddingBottom: 12,
  },
  pageHeader: {
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e6e6e6',
  },
  pageTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 6,
  },
  pageSubtitle: {
    fontSize: 14,
    color: '#6B7280',
  },
});

type SalesFormProps = {
  customer: string;
  setCustomer: (v: string) => void;
  sku: string;
  setSku: (v: string) => void;
  name: string;
  setName: (v: string) => void;
  quantity: string;
  setQuantity: (v: string) => void;
  unitPrice: string;
  setUnitPrice: (v: string) => void;
  paidCash: string;
  setPaidCash: (v: string) => void;
  paidOnline: string;
  setPaidOnline: (v: string) => void;
  paymentPlatform: string;
  setPaymentPlatform: (v: string) => void;
  transactionId: string;
  setTransactionId: (v: string) => void;
  saving: boolean;
  onSave: () => void;
  totalPrice: () => number;
  paidTotal: () => number;
  matchedSkuName?: string | null;
};

const SalesForm: React.FC<SalesFormProps> = props => {
  const {
    customer,
    setCustomer,
    sku,
    setSku,
    name,
    setName,
    quantity,
    setQuantity,
    unitPrice,
    setUnitPrice,
    paidCash,
    setPaidCash,
    paidOnline,
    setPaidOnline,
    paymentPlatform,
    setPaymentPlatform,
    transactionId,
    setTransactionId,
    saving,
    onSave,
    totalPrice,
    paidTotal,
    matchedSkuName,
  } = props;

  return (
    <View style={styles.form}>
      <Text style={styles.header}>Record New Sale</Text>

      <Text style={styles.sectionLabel}>Customer</Text>
      <TextInput
        placeholder="Customer full name"
        placeholderTextColor="#9CA3AF"
        style={styles.input}
        value={customer}
        onChangeText={setCustomer}
      />

      <Text style={styles.sectionLabel}>Product</Text>
      <TextInput
        placeholder="SKU"
        placeholderTextColor="#9CA3AF"
        style={styles.input}
        value={sku}
        onChangeText={setSku}
      />
      {sku.trim() ? (
        <Text style={styles.metaSmall}>
          {matchedSkuName ? `Found: ${matchedSkuName}` : 'SKU lookup...'}
        </Text>
      ) : null}
      <TextInput
        placeholder="Product name"
        placeholderTextColor="#9CA3AF"
        style={styles.input}
        value={name}
        onChangeText={setName}
      />

      <View style={styles.row}>
        <TextInput
          placeholder="Quantity"
          placeholderTextColor="#9CA3AF"
          style={[styles.input, styles.inputFlexLeft]}
          keyboardType="numeric"
          value={quantity}
          onChangeText={setQuantity}
        />
        <TextInput
          placeholder="Unit price"
          placeholderTextColor="#9CA3AF"
          style={[styles.input, styles.inputFlexRight]}
          keyboardType="numeric"
          value={unitPrice}
          onChangeText={setUnitPrice}
        />
      </View>

      <Text style={styles.sectionLabel}>Payment Breakdown</Text>
      <View style={styles.row}>
        <TextInput
          placeholder="Paid cash"
          placeholderTextColor="#9CA3AF"
          style={[styles.input, styles.inputFlexLeft]}
          keyboardType="numeric"
          value={paidCash}
          onChangeText={setPaidCash}
        />
        <TextInput
          placeholder="Paid online"
          placeholderTextColor="#9CA3AF"
          style={[styles.input, styles.inputFlexRight]}
          keyboardType="numeric"
          value={paidOnline}
          onChangeText={setPaidOnline}
        />
      </View>
      <TextInput
        placeholder="Online platform (PayPal/Stripe)"
        placeholderTextColor="#9CA3AF"
        style={styles.input}
        value={paymentPlatform}
        onChangeText={setPaymentPlatform}
      />
      <TextInput
        placeholder="Transaction ID (optional)"
        placeholderTextColor="#9CA3AF"
        style={styles.input}
        value={transactionId}
        onChangeText={setTransactionId}
      />

      <View style={styles.summaryCard}>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Total</Text>
          <Text style={styles.summaryValue}>
            {'$' + totalPrice().toFixed(2)}
          </Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Paid</Text>
          <Text style={styles.summaryValue}>
            {'$' + paidTotal().toFixed(2)}
          </Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Remaining</Text>
          <Text style={[styles.summaryValue, styles.remainingValue]}>
            {'$' + Math.max(0, totalPrice() - paidTotal()).toFixed(2)}
          </Text>
        </View>
      </View>

      <TouchableOpacity
        style={styles.saveBtn}
        onPress={onSave}
        disabled={saving}
      >
        {saving ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.saveBtnText}>Add Sale</Text>
        )}
      </TouchableOpacity>
    </View>
  );
};

const ItemSeparator = () => <View style={styles.separator} />;
const EmptyList = () => (
  <View style={styles.form}>
    <Text style={styles.emptyText}>No sales recorded today.</Text>
  </View>
);
const LoadingEmpty = () => (
  <View style={styles.form}>
    <ActivityIndicator />
  </View>
);

const SalesScreen: React.FC = () => {
  const route = useRoute<any>();
  const prefill = route.params || {};

  const [customer, setCustomer] = useState(prefill.customer || '');
  const [itemId, setItemId] = useState(prefill.itemId || '');
  const [sku, setSku] = useState(prefill.sku || '');
  const [name, setName] = useState(prefill.name || '');
  const [unitPrice, setUnitPrice] = useState(
    prefill.unitPrice ? String(prefill.unitPrice) : '',
  );
  const [quantity, setQuantity] = useState('1');

  // payment breakdown
  const [paidCash, setPaidCash] = useState('');
  const [paidOnline, setPaidOnline] = useState('');
  const [paymentPlatform, setPaymentPlatform] = useState('');
  const [transactionId, setTransactionId] = useState('');

  // when user types a SKU, try to resolve product details automatically
  const [matchedSkuName, setMatchedSkuName] = useState<string | null>(null);

  const [sales, setSales] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const p = route.params || {};
    if (p) {
      if (typeof p.customer !== 'undefined') setCustomer(p.customer || '');
      if (typeof p.itemId !== 'undefined') setItemId(p.itemId || '');
      if (typeof p.sku !== 'undefined') setSku(p.sku || '');
      if (typeof p.name !== 'undefined') setName(p.name || '');
      if (typeof p.unitPrice !== 'undefined')
        setUnitPrice(p.unitPrice ? String(p.unitPrice) : '');
    }
  }, [route.params]);

  // debounce SKU lookups to auto-fill name/unitPrice and set/clear itemId
  useEffect(() => {
    let cancelled = false;
    setMatchedSkuName(null);

    // if SKU is empty, clear any matched state and do nothing
    const s = (sku || '').trim();
    if (!s) {
      // only clear itemId if it wasn't provided via navigation
      setItemId('');
      return;
    }

    const tid = setTimeout(async () => {
      try {
        const q = await firestore()
          .collection('inventory')
          .where('sku', '==', s)
          .limit(2)
          .get();

        if (cancelled) return;

        if (q.size === 1) {
          const doc = q.docs[0];
          const data = doc.data() as any;
          setMatchedSkuName(data.name || null);

          // auto-fill only when it makes sense: set itemId to allow inventory decrement
          setItemId(doc.id);

          if (data.name) setName(data.name);
          if (typeof data.unitPrice !== 'undefined' && data.unitPrice !== null)
            setUnitPrice(String(data.unitPrice));
        } else {
          // ambiguous or not found - clear itemId to avoid confusion
          setMatchedSkuName(null);
          setItemId('');
        }
      } catch (err) {
        console.error('sku lookup', err);
      }
    }, 450);

    return () => {
      cancelled = true;
      clearTimeout(tid);
    };
  }, [sku]);

  const fetchTodaySales = useCallback(async () => {
    setLoading(true);
    try {
      const snapshot = await firestore()
        .collection('sales')
        .where('createdAt', '>=', firestore.Timestamp.fromDate(todayStart()))
        .orderBy('createdAt', 'desc')
        .get();

      const raw = snapshot.docs.map(d => ({
        id: d.id,
        ...(d.data() as any),
      })) as any[];

      // enrich with product name from inventory when itemId present or when SKU matches
      const ids = Array.from(new Set(raw.map(r => r.itemId).filter(Boolean)));
      const skus = Array.from(new Set(raw.map(r => r.sku).filter(Boolean)));

      const inventoryById: Record<string, any> = {};
      if (ids.length) {
        // fetch docs in parallel by id
        const docs = await Promise.all(
          ids.map(id => firestore().collection('inventory').doc(id).get()),
        );
        docs.forEach(docSnap => {
          const ex = (docSnap as any).exists;
          const docExists = typeof ex === 'function' ? ex.call(docSnap) : !!ex;
          if (docExists) inventoryById[docSnap.id] = docSnap.data();
        });
      }

      const inventoryBySku: Record<string, any> = {};
      if (skus.length) {
        // fetch by SKU - run one query per sku (could be batched/optimized later)
        const skuDocs = await Promise.all(
          skus.map(skuVal =>
            firestore()
              .collection('inventory')
              .where('sku', '==', skuVal)
              .limit(1)
              .get(),
          ),
        );
        skuDocs.forEach(qsnap => {
          if (!qsnap.empty) {
            const doc = qsnap.docs[0];
            inventoryBySku[doc.data()?.sku || doc.id] = doc.data();
          }
        });
      }

      const enriched = raw.map(r => ({
        ...r,
        // prefer the inventory's canonical name when available (by itemId first, then sku)
        productName:
          (r.itemId ? inventoryById[r.itemId]?.name : undefined) ||
          (r.sku ? inventoryBySku[r.sku]?.name : undefined) ||
          r.name ||
          r.sku ||
          r.id,
      }));

      setSales(enriched);
    } catch (err) {
      console.error('fetchTodaySales', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTodaySales();
  }, [fetchTodaySales]);

  // Refresh sales list and reset form when screen is focused
  useFocusEffect(
    useCallback(() => {
      // clear form fields to defaults on each focus
      setCustomer('');
      setItemId('');
      setSku('');
      setName('');
      setUnitPrice('');
      setQuantity('1');
      setPaidCash('');
      setPaidOnline('');
      setPaymentPlatform('');
      setTransactionId('');
      setMatchedSkuName(null);

      // refresh the day's sales
      fetchTodaySales();

      // no cleanup needed
      return () => {};
    }, [fetchTodaySales]),
  );

  const totalPrice = () => parseNumber(quantity) * parseNumber(unitPrice);
  const paidTotal = () => parseNumber(paidCash) + parseNumber(paidOnline);

  const handleAddSale = async () => {
    if (!customer.trim())
      return Alert.alert('Validation', 'Customer name is required');
    if (!sku.trim()) return Alert.alert('Validation', 'SKU is required');
    const q = parseNumber(quantity);
    const p = parseNumber(unitPrice);
    if (q <= 0) return Alert.alert('Validation', 'Quantity must be > 0');
    if (p <= 0) return Alert.alert('Validation', 'Unit price must be > 0');

    setSaving(true);
    try {
      const paid = paidTotal();
      const sale = {
        itemId: itemId || null,
        sku: sku.trim(),
        name: name || null,
        customer: customer.trim(),
        quantity: q,
        unitPrice: p,
        totalPrice: q * p,
        paidCash: parseNumber(paidCash),
        paidOnline: parseNumber(paidOnline),
        paymentPlatform: paymentPlatform || null,
        transactionId: transactionId || null,
        paidAmount: paid,
        remainingAmount: Math.max(0, q * p - paid),
        createdAt: firestore.FieldValue.serverTimestamp(),
      } as any;

      await firestore().collection('sales').add(sale);

      if (itemId) {
        const itemRef = firestore().collection('inventory').doc(itemId);
        await firestore().runTransaction(async t => {
          const doc = await t.get(itemRef);
          if (!doc.exists) return;
          const current = doc.data()?.quantity || 0;
          t.update(itemRef, { quantity: Math.max(0, current - q) });
        });
      }

      Keyboard.dismiss();
      setQuantity('1');
      setPaidCash('');
      setPaidOnline('');
      setPaymentPlatform('');
      setTransactionId('');
      setSaving(false);
      fetchTodaySales();
      Alert.alert('Success', 'Sale saved');
    } catch (err) {
      console.error('handleAddSale', err);
      setSaving(false);
      Alert.alert('Error', 'Unable to save sale');
    }
  };

  const renderSale = ({ item }: any) => {
    const ts = item.createdAt?.toDate ? item.createdAt.toDate() : new Date();
    const fmt = (n: any) => '$' + Number(n || 0).toFixed(2);
    const pc = Number(item.paidCash || 0);
    const po = Number(item.paidOnline || 0);
    const paid = Number(item.paidAmount || pc + po || 0);
    const remaining = Number(
      item.remainingAmount || Math.max(0, (item.totalPrice || 0) - paid),
    );

    return (
      <View style={styles.saleRow}>
        <View style={styles.saleMain}>
          <Text style={styles.saleTitle}>
            {item.productName || item.name || item.sku}
          </Text>

          <Text style={styles.saleMeta}>
            {item.customer} • {item.quantity} × {fmt(item.unitPrice)}
          </Text>
          {item.sku ? (
            <Text style={styles.saleMetaSmall}>SKU: {item.sku}</Text>
          ) : null}

          <View style={styles.metaRow}>
            <View style={styles.metaLeft}>
              <Text style={styles.metaLabel}>Paid</Text>
              <Text style={styles.paidValue}>{fmt(paid)}</Text>
              <Text style={styles.metaSmall}>
                Cash: {fmt(pc)} • Online: {fmt(po)}
              </Text>
            </View>
            <View style={styles.metaRight}>
              <Text style={styles.metaLabel}>Remaining</Text>
              <Text
                style={[
                  styles.remainingValue,
                  remaining > 0 ? styles.negative : styles.positive,
                ]}
              >
                {fmt(remaining)}
              </Text>
            </View>
          </View>

          {item.paymentPlatform ? (
            <View style={styles.paymentRow}>
              <View style={styles.pill}>
                <Text style={styles.pillText}>{item.paymentPlatform}</Text>
              </View>
              <Text style={styles.txText}>{item.transactionId || '—'}</Text>
            </View>
          ) : null}
        </View>

        <View style={styles.saleRight}>
          <Text style={styles.saleAmount}>{fmt(item.totalPrice)}</Text>
          <Text style={styles.saleTime}>{ts.toLocaleTimeString()}</Text>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.pageHeader}>
        <Text style={styles.pageTitle}>Sales</Text>
        <Text style={styles.pageSubtitle}>Record and review today's sales</Text>
      </View>
      <FlatList
        data={sales}
        keyExtractor={i => i.id}
        renderItem={renderSale}
        ListHeaderComponent={
          <View style={styles.listHeaderWrapper}>
            <SalesForm
              customer={customer}
              setCustomer={setCustomer}
              sku={sku}
              setSku={setSku}
              name={name}
              setName={setName}
              quantity={quantity}
              setQuantity={setQuantity}
              unitPrice={unitPrice}
              setUnitPrice={setUnitPrice}
              paidCash={paidCash}
              setPaidCash={setPaidCash}
              paidOnline={paidOnline}
              setPaidOnline={setPaidOnline}
              paymentPlatform={paymentPlatform}
              setPaymentPlatform={setPaymentPlatform}
              transactionId={transactionId}
              setTransactionId={setTransactionId}
              saving={saving}
              onSave={handleAddSale}
              totalPrice={totalPrice}
              paidTotal={paidTotal}
              matchedSkuName={matchedSkuName}
            />
            <Text style={styles.sectionTitle}>Today's Sales</Text>
          </View>
        }
        ItemSeparatorComponent={ItemSeparator}
        ListEmptyComponent={loading ? LoadingEmpty : EmptyList}
        contentContainerStyle={styles.contentContainer}
      />
    </View>
  );
};

export default SalesScreen;

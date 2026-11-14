import { useCallback, useEffect, useState } from 'react';
import { ApiError, apiRequest } from '../lib/api';
import { useTenancy } from '../lib/tenancy';
import { Icon } from './Icon';

interface ReportData {
  customers: number;
  invoices: number;
  invoicesPaid: number;
  invoicesTotal: number;
  tickets: number;
  ticketsOpen: number;
  products: number;
  lowStock: number;
}

export function ReportsPanel() {
  const { hasPermission } = useTenancy();
  const canRead = hasPermission('reports.read');

  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!canRead) return;
    setLoading(true);
    setError(null);
    try {
      const [customers, invoices, tickets, products] = await Promise.all([
        apiRequest<any[]>('/api/v1/customers').catch(() => []),
        apiRequest<any[]>('/api/v1/invoices').catch(() => []),
        apiRequest<any[]>('/api/v1/tickets').catch(() => []),
        apiRequest<any[]>('/api/v1/inventory/products').catch(() => []),
      ]);
      const invoicesPaid = invoices.filter((i: any) => i.status === 'PAID').length;
      const invoicesTotal = invoices.reduce((s: number, i: any) => s + Number(i.total || 0), 0);
      const ticketsOpen = tickets.filter(
        (t: any) => t.status === 'OPEN' || t.status === 'IN_PROGRESS',
      ).length;
      const lowStock = products.filter(
        (p: any) => Number(p.quantity) <= Number(p.minQuantity) && Number(p.minQuantity) > 0,
      ).length;
      setData({
        customers: customers.length,
        invoices: invoices.length,
        invoicesPaid,
        invoicesTotal,
        tickets: tickets.length,
        ticketsOpen,
        products: products.length,
        lowStock,
      });
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : 'تعذر تحميل التقارير.');
    } finally {
      setLoading(false);
    }
  }, [canRead]);

  useEffect(() => {
    void load();
  }, [load]);

  function exportCsv() {
    if (!data) return;
    const rows = [
      ['المؤشر', 'القيمة'],
      ['العملاء', data.customers],
      ['الفواتير', data.invoices],
      ['الفواتير المدفوعة', data.invoicesPaid],
      ['إجمالي الفواتير', data.invoicesTotal.toFixed(2)],
      ['التذاكر', data.tickets],
      ['التذاكر المفتوحة', data.ticketsOpen],
      ['الأصناف', data.products],
      ['أصناف منخفضة', data.lowStock],
    ];
    const csv = rows.map((r) => r.join(',')).join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'shadtech-report.csv';
    a.click();
    URL.revokeObjectURL(url);
  }

  if (!canRead) {
    return (
      <section className="card" aria-labelledby="reports-title">
        <div className="card-head">
          <h3 id="reports-title">التقارير</h3>
        </div>
        <p className="card-note">لا تملك صلاحية عرض التقارير (reports.read).</p>
      </section>
    );
  }

  return (
    <section className="card reports-panel" aria-labelledby="reports-title">
      <div className="card-head">
        <h3 id="reports-title">التقارير ولوحة المعلومات</h3>
        <button type="button" className="button button-sm" onClick={exportCsv} disabled={!data}>
          <Icon name="chart" size={14} /> تصدير CSV
        </button>
      </div>

      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}

      {loading ? (
        <p className="card-note">جارٍ تحميل التقارير…</p>
      ) : !data ? (
        <p className="card-note">لا توجد بيانات.</p>
      ) : (
        <>
          <div className="report-grid">
            <div className="report-card">
              <Icon name="users" size={20} />
              <div>
                <p className="report-value">{data.customers}</p>
                <p className="report-label">العملاء</p>
              </div>
            </div>
            <div className="report-card">
              <Icon name="invoice" size={20} />
              <div>
                <p className="report-value">{data.invoices}</p>
                <p className="report-label">الفواتير</p>
              </div>
            </div>
            <div className="report-card">
              <Icon name="invoice" size={20} />
              <div>
                <p className="report-value">{data.invoicesPaid}</p>
                <p className="report-label">مدفوعة</p>
              </div>
            </div>
            <div className="report-card">
              <Icon name="invoice" size={20} />
              <div>
                <p className="report-value">{data.invoicesTotal.toFixed(2)}</p>
                <p className="report-label">إجمالي الفواتير</p>
              </div>
            </div>
            <div className="report-card">
              <Icon name="ticket" size={20} />
              <div>
                <p className="report-value">{data.tickets}</p>
                <p className="report-label">التذاكر</p>
              </div>
            </div>
            <div className="report-card">
              <Icon name="ticket" size={20} />
              <div>
                <p className="report-value">{data.ticketsOpen}</p>
                <p className="report-label">مفتوحة</p>
              </div>
            </div>
            <div className="report-card">
              <Icon name="box" size={20} />
              <div>
                <p className="report-value">{data.products}</p>
                <p className="report-label">الأصناف</p>
              </div>
            </div>
            <div className="report-card">
              <Icon name="box" size={20} />
              <div>
                <p className="report-value">{data.lowStock}</p>
                <p className="report-label">منخفضة</p>
              </div>
            </div>
          </div>
          <button type="button" className="button" onClick={() => void load()}>
            <Icon name="refresh" size={16} /> تحديث
          </button>
        </>
      )}

      <p className="card-note">
        تقارير مبنية على بيانات المؤسسة الحالية. تصدير CSV (UTF-8 with BOM).
      </p>
    </section>
  );
}

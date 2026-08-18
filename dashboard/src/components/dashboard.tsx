"use client";

import { useState } from "react";
import portfolio from "@/data/portfolio.json";
import { SegmentExplorer } from "@/components/segment-explorer";
import styles from "@/app/page.module.css";

type Language = "en" | "id";

const copy = {
  en: {
    nav: ["Findings", "Segments", "Methodology"], status: "Descriptive analysis",
    eyebrow: "Consumer lending · Portfolio case study", hero: "Lending risk, without losing sight of opportunity.",
    lead: (apps: string, prior: string) => `An explainable view of payment difficulty across ${apps} current applications and ${prior} linked prior decisions.`,
    read: "Read the findings", review: "Review methodology", boundary: "Decision boundary",
    boundaryText: "This analysis supports monitoring. It does not approve or reject applicants.",
    target: "Client experienced payment difficulty under the dataset's late-payment definition.",
    metrics: [["Applications", "Current application grain"], ["Payment difficulty", "observed outcomes"], ["Requested credit", "Source currency units"], ["History coverage", "Applicants with prior decisions"]],
    readout: "01 · Executive readout", attention: "What deserves attention", attentionBody: "Three signals that remain useful after accounting for sample size and measurement limits.",
    segmentEye: "02 · Risk segmentation", compare: "Compare stable segments",
    segmentNote: (n: string) => `Segments below ${n} applications are suppressed. Whiskers show 95% Wilson confidence intervals.`,
    affordabilityEye: "03 · Affordability lens", affordabilityTitle: "Risk rises at the edge of affordability", affordabilityBody: "Credit requested relative to annual income, grouped into interpretable bands.",
    selectBand: "Select a band to inspect its application volume and relative risk.", apps: "applications", riskVs: "risk vs portfolio", medianApplicant: "Median applicant", requested: "requested credit to annual income", medianBurden: "Median annuity burden", annual: "annual annuity to annual income",
    priorEye: "04 · Prior decisions", priorTitle: "History adds context—and policy bias", priorBody: (p: string) => `Earlier outcomes cover ${p} of current applicants.`, approved: "approved", priorHint: "Select an outcome to inspect its volume.",
    policy: "Prior approvals and refusals reflect historical policy. They can explain portfolio composition, but should not be treated as objective labels of applicant quality.",
    evidenceEye: "05 · Evidence & limitations", evidenceTitle: "Built to be challenged", evidenceBody: "Every headline metric traces back to a reproducible applicant-level model.",
    methods: ["Raw applications", "Clean & derive", "Aggregate history", "Guard the claims"],
    quality: ["Unknown gender codes", "Occupation missing", "Credit-to-income p99", "Monetary unit"], unknown: "Not identified",
    recommendEye: "Recommended next decision", recommendTitle: "Use affordability and stable segment signals to prioritize manual review—not automatic exclusion.",
    actions: [["Now", "Monitor high credit-to-income bands with volume and confidence intervals."], ["Next", "Validate stability over time and test whether observed differences persist after controlling for confounders."], ["Never", "Convert sensitive attributes or historical refusals directly into approval rules."]],
    top: "Back to top ↑",
  },
  id: {
    nav: ["Temuan", "Segmen", "Metodologi"], status: "Analisis deskriptif",
    eyebrow: "Kredit konsumen · Studi kasus portfolio", hero: "Memahami risiko kredit tanpa mengabaikan peluang.",
    lead: (apps: string, prior: string) => `Gambaran yang mudah dijelaskan mengenai kesulitan pembayaran pada ${apps} pengajuan saat ini dan ${prior} keputusan historis yang terhubung.`,
    read: "Baca temuan", review: "Tinjau metodologi", boundary: "Batas penggunaan",
    boundaryText: "Analisis ini mendukung pemantauan. Analisis ini tidak menyetujui atau menolak pemohon.",
    target: "Nasabah mengalami kesulitan pembayaran berdasarkan definisi keterlambatan pada dataset.",
    metrics: [["Pengajuan", "Satu baris per pengajuan saat ini"], ["Kesulitan pembayaran", "hasil yang teramati"], ["Kredit yang diminta", "Satuan mata uang sumber"], ["Cakupan riwayat", "Pemohon dengan keputusan sebelumnya"]],
    readout: "01 · Ringkasan eksekutif", attention: "Hal yang perlu diperhatikan", attentionBody: "Tiga sinyal yang tetap berguna setelah mempertimbangkan ukuran sampel dan keterbatasan pengukuran.",
    segmentEye: "02 · Segmentasi risiko", compare: "Bandingkan segmen yang stabil",
    segmentNote: (n: string) => `Segmen di bawah ${n} pengajuan disembunyikan. Garis rentang menunjukkan interval kepercayaan Wilson 95%.`,
    affordabilityEye: "03 · Analisis keterjangkauan", affordabilityTitle: "Risiko meningkat di batas keterjangkauan", affordabilityBody: "Kredit yang diminta dibanding pendapatan tahunan dan dikelompokkan ke dalam rentang yang mudah dipahami.",
    selectBand: "Pilih rentang untuk melihat volume pengajuan dan risiko relatif.", apps: "pengajuan", riskVs: "risiko vs portfolio", medianApplicant: "Pemohon median", requested: "kredit yang diminta terhadap pendapatan tahunan", medianBurden: "Beban angsuran median", annual: "angsuran tahunan terhadap pendapatan tahunan",
    priorEye: "04 · Keputusan sebelumnya", priorTitle: "Riwayat memberi konteks—sekaligus membawa bias kebijakan", priorBody: (p: string) => `Hasil historis mencakup ${p} dari pemohon saat ini.`, approved: "disetujui", priorHint: "Pilih hasil untuk melihat volumenya.",
    policy: "Persetujuan dan penolakan sebelumnya mencerminkan kebijakan historis. Data tersebut menjelaskan komposisi portfolio, tetapi tidak boleh dianggap sebagai label objektif atas kualitas pemohon.",
    evidenceEye: "05 · Bukti & keterbatasan", evidenceTitle: "Dibangun agar dapat diuji", evidenceBody: "Setiap metrik utama dapat ditelusuri ke model tingkat pemohon yang dapat direproduksi.",
    methods: ["Pengajuan mentah", "Bersihkan & turunkan fitur", "Agregasikan riwayat", "Batasi klaim"],
    quality: ["Kode gender tidak diketahui", "Pekerjaan kosong", "P99 kredit terhadap pendapatan", "Satuan moneter"], unknown: "Tidak teridentifikasi",
    recommendEye: "Rekomendasi keputusan berikutnya", recommendTitle: "Gunakan keterjangkauan dan sinyal segmen yang stabil untuk memprioritaskan tinjauan manual—bukan penolakan otomatis.",
    actions: [["Sekarang", "Pantau rentang kredit terhadap pendapatan yang tinggi beserta volume dan interval kepercayaannya."], ["Berikutnya", "Validasi kestabilan dari waktu ke waktu dan uji apakah perbedaan tetap ada setelah mengendalikan faktor perancu."], ["Jangan", "Mengubah atribut sensitif atau penolakan historis secara langsung menjadi aturan persetujuan."]],
    top: "Kembali ke atas ↑",
  },
} as const;

const insightId = [
  { eyebrow: "Baseline portfolio", title: "8,1% pengajuan saat ini mengalami kesulitan pembayaran", body: "Ini merupakan tingkat hasil deskriptif, bukan probabilitas gagal bayar atau estimasi kausal." },
  { eyebrow: "Segmen stabil tertinggi", title: "Pemohon berstatus bekerja memiliki indeks 1,19× baseline", body: "Estimasi didasarkan pada 158.774 pengajuan; segmen di bawah 500 pengajuan tidak ditampilkan." },
  { eyebrow: "Cakupan riwayat", title: "94,6% pemohon memiliki keputusan sebelumnya yang terhubung", body: "Riwayat menambah konteks, tetapi dapat merekam kebijakan lama dan bukan kebenaran objektif yang netral." },
];

export function Dashboard() {
  const [language, setLanguage] = useState<Language>("en");
  const [affordabilityIndex, setAffordabilityIndex] = useState(0);
  const [priorIndex, setPriorIndex] = useState(0);
  const t = copy[language];
  const locale = language === "id" ? "id-ID" : "en-US";
  const number = new Intl.NumberFormat(locale);
  const compact = new Intl.NumberFormat(locale, { notation: "compact", maximumFractionDigits: 1 });
  const percent = new Intl.NumberFormat(locale, { style: "percent", maximumFractionDigits: 1 });
  const { overview, segments, priorOutcomes, quality, insights, meta } = portfolio;
  const visibleInsights = language === "id" ? insightId : insights;
  const selectedBand = segments.affordability[affordabilityIndex];
  const selectedPrior = priorOutcomes[priorIndex];

  return (
    <main className={styles.shell} lang={language}>
      <header className={styles.header}>
        <a className={styles.brand} href="#top" aria-label="Credit risk case study home"><span className={styles.brandMark}>CR</span><span>Risk / Opportunity</span></a>
        <nav className={styles.nav} aria-label="Case study navigation"><a href="#findings">{t.nav[0]}</a><a href="#segments">{t.nav[1]}</a><a href="#methodology">{t.nav[2]}</a></nav>
        <div className={styles.headerActions}>
          <span className={styles.status}><span /> {t.status}</span>
          <div className={styles.languageSwitch} aria-label="Language selection">
            <button className={language === "id" ? styles.languageActive : undefined} onClick={() => setLanguage("id")} type="button">ID</button>
            <button className={language === "en" ? styles.languageActive : undefined} onClick={() => setLanguage("en")} type="button">EN</button>
          </div>
        </div>
      </header>

      <section className={styles.hero} id="top"><div className={styles.heroCopy}><p className={styles.eyebrow}>{t.eyebrow}</p><h1>{t.hero}</h1><p className={styles.heroLead}>{t.lead(number.format(overview.applications), compact.format(overview.prior_applications))}</p><div className={styles.heroActions}><a className={styles.primaryAction} href="#findings">{t.read} <span>↘</span></a><a className={styles.secondaryAction} href="#methodology">{t.review}</a></div></div><aside className={styles.heroNote}><p>{t.boundary}</p><strong>{t.boundaryText}</strong><span>{t.target}</span></aside></section>

      <section className={styles.kpis} aria-label="Portfolio overview"><Metric label={t.metrics[0][0]} value={number.format(overview.applications)} note={t.metrics[0][1]} /><Metric label={t.metrics[1][0]} value={percent.format(overview.payment_difficulty_rate)} note={`${number.format(overview.payment_difficulty_count)} ${t.metrics[1][1]}`} accent /><Metric label={t.metrics[2][0]} value={compact.format(overview.total_credit)} note={t.metrics[2][1]} /><Metric label={t.metrics[3][0]} value={percent.format(overview.linkedHistoryRate)} note={t.metrics[3][1]} /></section>

      <section className={styles.section} id="findings"><div className={styles.sectionHeading}><p className={styles.eyebrow}>{t.readout}</p><h2>{t.attention}</h2><p>{t.attentionBody}</p></div><div className={styles.insightGrid}>{visibleInsights.map((insight, index) => <article className={styles.insightCard} key={insight.eyebrow}><span className={styles.insightIndex}>0{index + 1}</span><p>{insight.eyebrow}</p><h3>{insight.title}</h3><span>{insight.body}</span></article>)}</div></section>

      <section className={styles.section} id="segments"><div className={styles.sectionHeadingRow}><div className={styles.sectionHeading}><p className={styles.eyebrow}>{t.segmentEye}</p><h2>{t.compare}</h2></div><p className={styles.sectionAside}>{t.segmentNote(number.format(meta.minimumSegmentSize))}</p></div><SegmentExplorer groups={{ Income: segments.income, Contract: segments.contract, Age: segments.age }} baseline={overview.payment_difficulty_rate} language={language} /></section>

      <section className={`${styles.section} ${styles.splitSection}`}><div><div className={styles.sectionHeading}><p className={styles.eyebrow}>{t.affordabilityEye}</p><h2>{t.affordabilityTitle}</h2><p>{t.affordabilityBody}</p></div><p className={styles.interactionHint}>{t.selectBand}</p><div className={styles.riskLadder}>{segments.affordability.map((item, index) => <button aria-pressed={affordabilityIndex === index} className={`${styles.riskRow} ${affordabilityIndex === index ? styles.riskRowActive : ""}`} key={item.label} onClick={() => setAffordabilityIndex(index)} type="button"><span>{translateBand(item.label, language)}</span><div><i style={{ width: `${Math.min(item.riskIndex * 55, 100)}%` }} /></div><strong>{item.riskIndex.toFixed(2)}×</strong><small>{number.format(item.applications)} {t.apps}</small></button>)}</div><div className={styles.chartDetail} aria-live="polite"><span>{translateBand(selectedBand.label, language)}</span><strong>{percent.format(selectedBand.difficultyRate)}</strong><p>{number.format(selectedBand.applications)} {t.apps} · {selectedBand.riskIndex.toFixed(2)}× {t.riskVs}</p></div></div><aside className={styles.callout}><span>{t.medianApplicant}</span><strong>{overview.median_credit_to_income.toFixed(2)}×</strong><p>{t.requested}</p><hr /><span>{t.medianBurden}</span><strong>{percent.format(overview.medianAnnuityToIncome)}</strong><p>{t.annual}</p></aside></section>

      <section className={`${styles.section} ${styles.priorSection}`}><div className={styles.sectionHeading}><p className={styles.eyebrow}>{t.priorEye}</p><h2>{t.priorTitle}</h2><p>{t.priorBody(percent.format(overview.linkedHistoryRate))}</p></div><div className={styles.priorVisual}><button className={styles.donut} style={{ background: `conic-gradient(#b9f56a 0 ${priorOutcomes[0].share * 100}%, #ff8b72 ${priorOutcomes[0].share * 100}% ${(priorOutcomes[0].share + priorOutcomes[1].share) * 100}%, #586157 ${(priorOutcomes[0].share + priorOutcomes[1].share) * 100}% 100%)` }} aria-label="Distribution of linked prior application outcomes" type="button"><span><strong>{percent.format(selectedPrior.share)}</strong>{translatePrior(selectedPrior.label, language)}</span></button><div><p className={styles.interactionHint}>{t.priorHint}</p><div className={styles.priorLegend}>{priorOutcomes.map((outcome, index) => <button aria-pressed={priorIndex === index} className={priorIndex === index ? styles.priorActive : undefined} key={outcome.label} onClick={() => setPriorIndex(index)} type="button"><i data-color={index} /><span>{translatePrior(outcome.label, language)}</span><strong>{percent.format(outcome.share)}</strong><small>{number.format(outcome.count)}</small></button>)}</div></div><p className={styles.policyNote}>{t.policy}</p></div></section>

      <section className={styles.section} id="methodology"><div className={styles.sectionHeadingRow}><div className={styles.sectionHeading}><p className={styles.eyebrow}>{t.evidenceEye}</p><h2>{t.evidenceTitle}</h2></div><p className={styles.sectionAside}>{t.evidenceBody}</p></div><div className={styles.methodGrid}><Method number="01" title={t.methods[0]} text={language === "id" ? `${number.format(overview.applications)} baris · ${quality.rawApplicationColumns} kolom sumber · input CSV tidak diubah` : `${number.format(overview.applications)} rows · ${quality.rawApplicationColumns} source fields · immutable CSV inputs`} /><Method number="02" title={t.methods[1]} text={language === "id" ? `${number.format(quality.employmentSentinelCount)} nilai sentinel masa kerja diubah menjadi kosong; rasio hanya dihitung untuk pendapatan positif` : `${number.format(quality.employmentSentinelCount)} employment sentinels converted to missing; ratios derived only with positive income`} /><Method number="03" title={t.methods[2]} text={language === "id" ? `${compact.format(overview.prior_applications)} keputusan sebelumnya diringkas menjadi satu baris per pemohon` : `${compact.format(overview.prior_applications)} linked prior decisions collapsed to one applicant grain`} /><Method number="04" title={t.methods[3]} text={language === "id" ? `Minimum n=${number.format(meta.minimumSegmentSize)}; interval kepercayaan ditampilkan; tanpa klaim kausal atau kelayakan` : `Minimum n=${number.format(meta.minimumSegmentSize)}; confidence intervals shown; no causal or eligibility claims`} /></div><div className={styles.qualityStrip}><div><span>{t.quality[0]}</span><strong>{quality.unknownGenderCount}</strong></div><div><span>{t.quality[1]}</span><strong>{percent.format(quality.occupationMissingRate)}</strong></div><div><span>{t.quality[2]}</span><strong>{quality.creditToIncomeP99.toFixed(2)}×</strong></div><div><span>{t.quality[3]}</span><strong>{t.unknown}</strong></div></div></section>

      <section className={styles.recommendation}><p className={styles.eyebrow}>{t.recommendEye}</p><h2>{t.recommendTitle}</h2><div>{t.actions.map(([title, text]) => <p key={title}><strong>{title}</strong>{text}</p>)}</div></section>
      <footer className={styles.footer}><span>Credit Risk & Lending Portfolio Analytics</span><span>Python pipeline · Statistical guardrails · Next.js</span><a href="#top">{t.top}</a></footer>
    </main>
  );
}

function translateBand(label: string, language: Language) {
  if (language === "en") return label;
  return label.replace("Under", "Di bawah").replace("and above", "ke atas");
}

function translatePrior(label: string, language: Language) {
  if (language === "en") return label;
  return ({ Approved: "Disetujui", Refused: "Ditolak", "Cancelled / unused": "Dibatalkan / tidak digunakan" } as Record<string, string>)[label] ?? label;
}

function Metric({ label, value, note, accent = false }: { label: string; value: string; note: string; accent?: boolean }) { return <article className={accent ? styles.metricAccent : styles.metric}><span>{label}</span><strong>{value}</strong><small>{note}</small></article>; }
function Method({ number: index, title, text }: { number: string; title: string; text: string }) { return <article className={styles.method}><span>{index}</span><h3>{title}</h3><p>{text}</p></article>; }

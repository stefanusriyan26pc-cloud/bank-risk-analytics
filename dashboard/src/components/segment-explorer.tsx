"use client";

import { useState } from "react";
import styles from "./segment-explorer.module.css";

type Segment = {
  label: string;
  applications: number;
  difficultyCount: number;
  difficultyRate: number;
  ciLow: number;
  ciHigh: number;
  riskIndex: number;
};

type Props = {
  groups: Record<string, Segment[]>;
  baseline: number;
  language: "en" | "id";
};

export function SegmentExplorer({ groups, baseline, language }: Props) {
  const labels = Object.keys(groups);
  const [active, setActive] = useState(labels[0]);
  const [selected, setSelected] = useState(0);
  const rows = groups[active];
  const selectedRow = rows[Math.min(selected, rows.length - 1)];
  const maximum = Math.max(...rows.map((row) => row.ciHigh), baseline) * 1.14;
  const locale = language === "id" ? "id-ID" : "en-US";
  const percent = new Intl.NumberFormat(locale, { style: "percent", maximumFractionDigits: 1 });
  const number = new Intl.NumberFormat(locale);
  const tabs = language === "id" ? { Income: "Pendapatan", Contract: "Kontrak", Age: "Usia" } : { Income: "Income", Contract: "Contract", Age: "Age" };

  return (
    <div className={styles.explorer}>
      <div className={styles.tabs} role="tablist" aria-label={language === "id" ? "Dimensi segmen" : "Segment dimension"}>
        {labels.map((label) => (
          <button
            aria-selected={active === label}
            className={active === label ? styles.active : undefined}
            key={label}
            onClick={() => { setActive(label); setSelected(0); }}
            role="tab"
            type="button"
          >
            {tabs[label as keyof typeof tabs]}
          </button>
        ))}
      </div>
      <div className={styles.legend}><span><i /> {language === "id" ? "Tingkat segmen" : "Segment rate"}</span><span><i /> {language === "id" ? "Baseline portfolio" : "Portfolio baseline"} {percent.format(baseline)}</span></div>
      <div className={styles.chart} role="tabpanel">
        {rows.map((row, index) => (
          <button aria-pressed={selected === index} className={`${styles.row} ${selected === index ? styles.rowActive : ""}`} key={row.label} onClick={() => setSelected(index)} type="button">
            <div className={styles.label}><strong>{translateLabel(row.label, language)}</strong><span>{number.format(row.applications)} {language === "id" ? "pengajuan" : "applications"}</span></div>
            <div className={styles.track}>
              <i className={styles.baseline} style={{ left: `${(baseline / maximum) * 100}%` }} />
              <div className={styles.bar} style={{ width: `${(row.difficultyRate / maximum) * 100}%` }} />
              <div
                className={styles.interval}
                style={{ left: `${(row.ciLow / maximum) * 100}%`, width: `${((row.ciHigh - row.ciLow) / maximum) * 100}%` }}
              />
            </div>
            <div className={styles.value}><strong>{percent.format(row.difficultyRate)}</strong><span>{row.riskIndex.toFixed(2)}× baseline</span></div>
          </button>
        ))}
      </div>
      <div className={styles.detail} aria-live="polite">
        <div><span>{language === "id" ? "Segmen dipilih" : "Selected segment"}</span><strong>{translateLabel(selectedRow.label, language)}</strong></div>
        <div><span>{language === "id" ? "Kesulitan pembayaran" : "Payment difficulty"}</span><strong>{percent.format(selectedRow.difficultyRate)}</strong></div>
        <div><span>{language === "id" ? "Interval kepercayaan 95%" : "95% confidence interval"}</span><strong>{percent.format(selectedRow.ciLow)}–{percent.format(selectedRow.ciHigh)}</strong></div>
        <div><span>{language === "id" ? "Hasil teramati" : "Observed outcomes"}</span><strong>{number.format(selectedRow.difficultyCount)}</strong></div>
      </div>
    </div>
  );
}

function translateLabel(label: string, language: "en" | "id") {
  if (language === "en") return label;
  const labels: Record<string, string> = {
    Working: "Bekerja", "Commercial associate": "Rekan komersial", Pensioner: "Pensiunan",
    "State servant": "Pegawai negeri", Unemployed: "Tidak bekerja", Student: "Pelajar",
    Businessman: "Pengusaha", "Maternity leave": "Cuti melahirkan", "Cash loans": "Pinjaman tunai",
    "Revolving loans": "Pinjaman bergulir",
  };
  return labels[label] ?? label;
}

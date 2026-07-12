const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  AlignmentType, HeadingLevel, BorderStyle, WidthType, ShadingType,
  LevelFormat, PageNumber, Footer, PageBreak
} = require('docx');
const fs = require('fs');

const BLUE  = "1F4E79";
const LBLUE = "D6E4F0";
const LGRAY = "F2F2F2";
const WHITE = "FFFFFF";

const border = { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" };
const borders = { top: border, bottom: border, left: border, right: border };

function cell(text, width, { bold=false, bg=WHITE, align=AlignmentType.LEFT }={}) {
  return new TableCell({
    borders,
    width: { size: width, type: WidthType.DXA },
    shading: { fill: bg, type: ShadingType.CLEAR },
    margins: { top: 80, bottom: 80, left: 120, right: 120 },
    children: [new Paragraph({
      alignment: align,
      children: [new TextRun({ text, bold, font: "Arial", size: 20 })]
    })]
  });
}

function hrow(cells_data, widths) {
  return new TableRow({
    tableHeader: true,
    children: cells_data.map((t, i) => cell(t, widths[i], { bold: true, bg: BLUE + "00".slice(0, 0), align: AlignmentType.CENTER }))
  });
}

function heading1(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 320, after: 160 },
    children: [new TextRun({ text, bold: true, font: "Arial", size: 32, color: BLUE })]
  });
}

function heading2(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 240, after: 120 },
    children: [new TextRun({ text, bold: true, font: "Arial", size: 26, color: "2E75B6" })]
  });
}

function para(text, { bold=false, size=22, spacing=160, color="000000", italic=false }={}) {
  return new Paragraph({
    spacing: { after: spacing },
    children: [new TextRun({ text, bold, font: "Arial", size, color, italic })]
  });
}

function code(text) {
  return new Paragraph({
    spacing: { after: 80 },
    shading: { fill: "F4F4F4", type: ShadingType.CLEAR },
    indent: { left: 360 },
    children: [new TextRun({ text, font: "Courier New", size: 18, color: "333333" })]
  });
}

function bullet(text) {
  return new Paragraph({
    numbering: { reference: "bullets", level: 0 },
    spacing: { after: 80 },
    children: [new TextRun({ text, font: "Arial", size: 22 })]
  });
}

function divider() {
  return new Paragraph({
    spacing: { after: 160 },
    border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: "2E75B6", space: 1 } },
    children: []
  });
}

// ── TABLES ────────────────────────────────────────────────────────────────────

function pillar1Table() {
  const rows = [
    ["Zone", "Followers", "Benchmark ER"],
    ["Nano", "1K – 9K", "8.0%"],
    ["Buffer", "9K – 11K", "Interpolate"],
    ["Micro", "11K – 90K", "3.5%"],
    ["Buffer", "90K – 110K", "Interpolate"],
    ["Macro", "110K – 900K", "2.0%"],
    ["Buffer", "900K – 1.1M", "Interpolate"],
    ["Mega", "1.1M+", "1.42%"],
  ];
  const w = [3120, 3120, 3120];
  return new Table({
    width: { size: 9360, type: WidthType.DXA },
    columnWidths: w,
    rows: rows.map((r, i) => new TableRow({
      tableHeader: i === 0,
      children: r.map((t, j) => cell(t, w[j], {
        bold: i === 0,
        bg: i === 0 ? "1F4E79" : i % 2 === 0 ? LGRAY : WHITE,
        align: AlignmentType.CENTER
      }))
    }))
  });
}

function platformWeightTable() {
  const rows = [
    ["Platform", "Weight"],
    ["YouTube", "1.4"], ["Instagram", "1.2"], ["TikTok", "1.1"],
    ["Twitch", "1.0"], ["Twitter/X", "0.9"], ["LinkedIn", "0.9"],
    ["Pinterest", "0.8"], ["All others", "0.8"],
  ];
  const w = [4680, 4680];
  return new Table({
    width: { size: 9360, type: WidthType.DXA },
    columnWidths: w,
    rows: rows.map((r, i) => new TableRow({
      tableHeader: i === 0,
      children: r.map((t, j) => cell(t, w[j], {
        bold: i === 0,
        bg: i === 0 ? "1F4E79" : i % 2 === 0 ? LGRAY : WHITE,
        align: AlignmentType.CENTER
      }))
    }))
  });
}

function freqTable() {
  const rows = [
    ["Platform", "Ideal Posts/Week"],
    ["YouTube","1"],["Instagram","4"],["TikTok","5"],
    ["Twitter/X","7"],["LinkedIn","3"],["Twitch","3"],["Others","4"],
  ];
  const w = [4680, 4680];
  return new Table({
    width: { size: 9360, type: WidthType.DXA },
    columnWidths: w,
    rows: rows.map((r, i) => new TableRow({
      tableHeader: i === 0,
      children: r.map((t, j) => cell(t, w[j], {
        bold: i === 0,
        bg: i === 0 ? "1F4E79" : i % 2 === 0 ? LGRAY : WHITE,
        align: AlignmentType.CENTER
      }))
    }))
  });
}

function ctlTable() {
  const rows = [
    ["Tier", "Full 75 pts (≥)", "Half 37.5 pts", "0 pts (<)"],
    ["Nano/Micro (≤100K)", "0.04", "0.02 – 0.039", "0.02"],
    ["Macro (100K – 1M)", "0.02", "0.01 – 0.019", "0.01"],
    ["Mega (1M+)", "0.008", "0.004 – 0.007", "0.004"],
  ];
  const w = [2340, 2340, 2340, 2340];
  return new Table({
    width: { size: 9360, type: WidthType.DXA },
    columnWidths: w,
    rows: rows.map((r, i) => new TableRow({
      tableHeader: i === 0,
      children: r.map((t, j) => cell(t, w[j], {
        bold: i === 0,
        bg: i === 0 ? "1F4E79" : i % 2 === 0 ? LGRAY : WHITE,
        align: AlignmentType.CENTER
      }))
    }))
  });
}

function growthTable() {
  const rows = [
    ["Condition", "Points"],
    ["Growth within range AND ER stable", "75"],
    ["Growth exceeds range BUT ER stable", "37.5"],
    ["Growth exceeds range AND ER dropped", "0 (red flag)"],
    ["Data unavailable", "37.5 (neutral default)"],
  ];
  const w = [7020, 2340];
  return new Table({
    width: { size: 9360, type: WidthType.DXA },
    columnWidths: w,
    rows: rows.map((r, i) => new TableRow({
      tableHeader: i === 0,
      children: r.map((t, j) => cell(t, w[j], {
        bold: i === 0,
        bg: i === 0 ? "1F4E79" : i % 2 === 0 ? LGRAY : WHITE,
        align: j === 1 ? AlignmentType.CENTER : AlignmentType.LEFT
      }))
    }))
  });
}

function creatorTable() {
  const rows = [
    ["Creator", "Platform", "Followers", "P1", "P2", "P3", "P4B", "P4C", "Bonus", "Raw", "Score"],
    ["Tier 1 Nano", "Instagram", "1,200", "320.0", "128.5", "162.5", "75", "75", "20", "780.97", "743.8"],
    ["Tier 2 Micro", "Instagram", "6,500", "289.2", "158.3", "200.0", "75", "75", "35", "832.5", "792.9"],
    ["Tier 3 Nas Daily", "Instagram", "4,861,972", "136.9", "250.0", "200.0", "75", "75", "50", "786.9", "749.4"],
    ["Tier 4 MKBHD", "YouTube", "21,055,893", "162.6", "250.0", "200.0", "75", "75", "50", "812.6", "773.9"],
    ["Tier 5 MrBeast", "YouTube", "484,000,000", "114.2", "250.0", "200.0", "37.5", "75", "50", "726.7", "692.1"],
  ];
  const w = [1600, 1200, 1400, 700, 700, 700, 700, 700, 700, 700, 760];
  return new Table({
    width: { size: 9360, type: WidthType.DXA },
    columnWidths: w,
    rows: rows.map((r, i) => new TableRow({
      tableHeader: i === 0,
      children: r.map((t, j) => cell(t, w[j], {
        bold: i === 0 || j === 10,
        bg: i === 0 ? "1F4E79" : i % 2 === 0 ? LGRAY : WHITE,
        align: j === 0 ? AlignmentType.LEFT : AlignmentType.CENTER
      }))
    }))
  });
}

function principlesTable() {
  const rows = [
    ["Test", "How the model passes"],
    ["Fair across sizes", "Log scaling in P2; tier benchmarks in P1"],
    ["Hard to fake", "Comments weighted 2x; CTL ratio; growth alignment"],
    ["Fully automatic", "Every input readable from public profile or Social Blade"],
    ["Easy to explain", "Each pillar is independently calculable and justifiable"],
  ];
  const w = [3120, 6240];
  return new Table({
    width: { size: 9360, type: WidthType.DXA },
    columnWidths: w,
    rows: rows.map((r, i) => new TableRow({
      tableHeader: i === 0,
      children: r.map((t, j) => cell(t, w[j], {
        bold: i === 0,
        bg: i === 0 ? "1F4E79" : i % 2 === 0 ? LGRAY : WHITE,
        align: AlignmentType.LEFT
      }))
    }))
  });
}

function evalTable() {
  const rows = [
    ["Area", "Weight", "What we are looking for"],
    ["Quality of thinking", "45%", "Non-obvious problems found and designed around"],
    ["Does the model work", "30%", "Scores and order make sense across all 5 tiers"],
    ["Clarity", "15%", "Model reproducible by another person; write-up concise"],
    ["Validation effort", "10%", "Genuine testing with honest reporting of findings"],
  ];
  const w = [2340, 1170, 5850];
  return new Table({
    width: { size: 9360, type: WidthType.DXA },
    columnWidths: w,
    rows: rows.map((r, i) => new TableRow({
      tableHeader: i === 0,
      children: r.map((t, j) => cell(t, w[j], {
        bold: i === 0,
        bg: i === 0 ? "1F4E79" : i % 2 === 0 ? LGRAY : WHITE,
        align: j === 1 ? AlignmentType.CENTER : AlignmentType.LEFT
      }))
    }))
  });
}

// ── DOCUMENT ──────────────────────────────────────────────────────────────────

const doc = new Document({
  numbering: {
    config: [{
      reference: "bullets",
      levels: [{ level: 0, format: LevelFormat.BULLET, text: "\u2022", alignment: AlignmentType.LEFT,
        style: { paragraph: { indent: { left: 720, hanging: 360 } } } }]
    }]
  },
  styles: {
    default: { document: { run: { font: "Arial", size: 22 } } },
    paragraphStyles: [
      { id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 32, bold: true, font: "Arial", color: BLUE },
        paragraph: { spacing: { before: 320, after: 160 }, outlineLevel: 0 } },
      { id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 26, bold: true, font: "Arial", color: "2E75B6" },
        paragraph: { spacing: { before: 240, after: 120 }, outlineLevel: 1 } },
    ]
  },
  sections: [{
    properties: {
      page: {
        size: { width: 12240, height: 15840 },
        margin: { top: 1440, right: 1080, bottom: 1440, left: 1080 }
      }
    },
    footers: {
      default: new Footer({
        children: [new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [
            new TextRun({ text: "Linkfluencer Social Score  |  Intern Assignment  |  Page ", font: "Arial", size: 18, color: "888888" }),
            new PageNumber()
          ]
        })]
      })
    },
    children: [

      // ── COVER ──
      new Paragraph({ spacing: { after: 80 }, children: [] }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 80 },
        children: [new TextRun({ text: "LINKFLUENCER", bold: true, font: "Arial", size: 48, color: BLUE })]
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 80 },
        children: [new TextRun({ text: "Social Score — Design & Validation", font: "Arial", size: 32, color: "2E75B6" })]
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 400 },
        children: [new TextRun({ text: "Product / Associate Intern Assignment", font: "Arial", size: 24, italic: true, color: "555555" })]
      }),
      divider(),

      // ── SECTION 1 ──
      heading1("1. The Model at a Glance"),
      para("The Social Score condenses a creator's value to a brand into a single number from 0 to 1000. It is computed fully automatically from public data, designed to be fair across creator sizes, hard to game, and easy to explain.", { spacing: 200 }),

      new Table({
        width: { size: 9360, type: WidthType.DXA },
        columnWidths: [3740, 1170, 4450],
        rows: [
          new TableRow({ tableHeader: true, children: [
            cell("Pillar", 3740, { bold: true, bg: "1F4E79", align: AlignmentType.LEFT }),
            cell("Points", 1170, { bold: true, bg: "1F4E79", align: AlignmentType.CENTER }),
            cell("What it measures", 4450, { bold: true, bg: "1F4E79", align: AlignmentType.LEFT }),
          ]}),
          new TableRow({ children: [
            cell("P1 — Engagement Quality", 3740, { bg: WHITE }),
            cell("400", 1170, { bold: true, bg: WHITE, align: AlignmentType.CENTER }),
            cell("Weighted ER vs tier benchmark (comments 2×)", 4450, { bg: WHITE }),
          ]}),
          new TableRow({ children: [
            cell("P2 — Audience Reach", 3740, { bg: LGRAY }),
            cell("250", 1170, { bold: true, bg: LGRAY, align: AlignmentType.CENTER }),
            cell("Log-scaled adjusted followers by platform", 4450, { bg: LGRAY }),
          ]}),
          new TableRow({ children: [
            cell("P3 — Content Consistency", 3740, { bg: WHITE }),
            cell("200", 1170, { bold: true, bg: WHITE, align: AlignmentType.CENTER }),
            cell("Post frequency + recency by platform", 4450, { bg: WHITE }),
          ]}),
          new TableRow({ children: [
            cell("P4B — CTL Ratio", 3740, { bg: LGRAY }),
            cell("75", 1170, { bold: true, bg: LGRAY, align: AlignmentType.CENTER }),
            cell("Comment-to-like ratio (tier-adjusted)", 4450, { bg: LGRAY }),
          ]}),
          new TableRow({ children: [
            cell("P4C — Growth Alignment", 3740, { bg: WHITE }),
            cell("75", 1170, { bold: true, bg: WHITE, align: AlignmentType.CENTER }),
            cell("Monthly growth vs organic thresholds", 4450, { bg: WHITE }),
          ]}),
          new TableRow({ children: [
            cell("Bonus (Diversity + Age)", 3740, { bg: LGRAY }),
            cell("50", 1170, { bold: true, bg: LGRAY, align: AlignmentType.CENTER }),
            cell("Platform presence + account age", 4450, { bg: LGRAY }),
          ]}),
          new TableRow({ children: [
            cell("Max Raw Score", 3740, { bold: true, bg: "D6E4F0" }),
            cell("1050", 1170, { bold: true, bg: "D6E4F0", align: AlignmentType.CENTER }),
            cell("Normalized to 1000: Score = (Raw / 1050) × 1000", 4450, { bold: true, bg: "D6E4F0" }),
          ]}),
        ]
      }),
      new Paragraph({ spacing: { after: 200 }, children: [] }),

      // ── SECTION 2 ──
      heading1("2. Pillar Formulas"),

      heading2("P1 — Engagement Quality  (400 pts)"),
      para("Step 1 — Weighted Engagement Rate:", { bold: true, size: 22 }),
      code("Weighted ER = (Avg Likes × 1 + Avg Comments × 2) / Followers × 100"),
      new Paragraph({ spacing: { after: 120 }, children: [] }),
      para("Step 2 — Tier Benchmarks with Buffer Zones:", { bold: true, size: 22 }),
      para("Buffer zones eliminate the cliff effect at tier boundaries. Linear interpolation is used between zones.", { size: 20, color: "444444", spacing: 120 }),
      pillar1Table(),
      new Paragraph({ spacing: { after: 120 }, children: [] }),
      para("Buffer Interpolation Formula:", { bold: true, size: 22 }),
      code("Benchmark = Lower_ER + (Followers - Lower_boundary) / (Upper_boundary - Lower_boundary) × (Upper_ER - Lower_ER)"),
      new Paragraph({ spacing: { after: 120 }, children: [] }),
      para("Step 3 — ER Score (allows 25% overperformance reward):", { bold: true, size: 22 }),
      code("ER Ratio  = Weighted ER / Benchmark ER"),
      code("ER Score  = min(ER Ratio, 1.25) / 1.25 × 400"),
      para("Hitting the benchmark = 320 pts. Exceeding by 25%+ = full 400 pts. Below = proportional.", { size: 20, color: "555555", spacing: 200 }),

      heading2("P2 — Audience Reach  (250 pts)"),
      platformWeightTable(),
      new Paragraph({ spacing: { after: 120 }, children: [] }),
      code("Adjusted Followers = Actual Followers × Platform Weight"),
      code("Reach Score        = min(log10(Adjusted Followers) / log10(1,400,000), 1) × 250"),
      para("Ceiling = 1,400,000 = 1M followers × 1.4 (max platform weight). Log scaling prevents mega-creators from dominating.", { size: 20, color: "555555", spacing: 200 }),

      heading2("P3 — Content Consistency  (200 pts)"),
      freqTable(),
      new Paragraph({ spacing: { after: 120 }, children: [] }),
      code("Frequency Score = min(Actual posts/week / Platform Benchmark, 1) × 150"),
      new Paragraph({ spacing: { after: 120 }, children: [] }),
      new Table({
        width: { size: 9360, type: WidthType.DXA },
        columnWidths: [4680, 4680],
        rows: [
          new TableRow({ tableHeader: true, children: [cell("Last Post", 4680, { bold: true, bg: "1F4E79", align: AlignmentType.CENTER }), cell("Recency Points", 4680, { bold: true, bg: "1F4E79", align: AlignmentType.CENTER })] }),
          new TableRow({ children: [cell("≤ 7 days", 4680, { align: AlignmentType.CENTER }), cell("50", 4680, { align: AlignmentType.CENTER })] }),
          new TableRow({ children: [cell("8 – 14 days", 4680, { bg: LGRAY, align: AlignmentType.CENTER }), cell("25", 4680, { bg: LGRAY, align: AlignmentType.CENTER })] }),
          new TableRow({ children: [cell("15 – 30 days", 4680, { align: AlignmentType.CENTER }), cell("10", 4680, { align: AlignmentType.CENTER })] }),
          new TableRow({ children: [cell("> 30 days", 4680, { bg: LGRAY, align: AlignmentType.CENTER }), cell("0", 4680, { bg: LGRAY, align: AlignmentType.CENTER })] }),
        ]
      }),
      new Paragraph({ spacing: { after: 200 }, children: [] }),

      heading2("P4B — Comment-to-Like Ratio  (75 pts)"),
      para("Comments require deliberate effort and are significantly harder to buy at scale. Thresholds are tier-adjusted so mega creators are not penalised for naturally lower ratios.", { size: 20, color: "444444", spacing: 120 }),
      ctlTable(),
      new Paragraph({ spacing: { after: 200 }, children: [] }),

      heading2("P4C — Follower Growth Alignment  (75 pts)"),
      para("Source: Social Blade or equivalent. Max organic monthly growth thresholds: Nano 38%, Micro 34%, Macro/Mega 10%.", { size: 20, color: "444444", spacing: 120 }),
      growthTable(),
      new Paragraph({ spacing: { after: 200 }, children: [] }),

      heading2("Bonus  (50 pts)"),
      new Table({
        width: { size: 9360, type: WidthType.DXA },
        columnWidths: [4680, 4680],
        rows: [
          new TableRow({ tableHeader: true, children: [cell("Platforms Active", 4680, { bold: true, bg: "1F4E79", align: AlignmentType.CENTER }), cell("Points", 4680, { bold: true, bg: "1F4E79", align: AlignmentType.CENTER })] }),
          new TableRow({ children: [cell("1 platform", 4680, { align: AlignmentType.CENTER }), cell("0", 4680, { align: AlignmentType.CENTER })] }),
          new TableRow({ children: [cell("2 platforms", 4680, { bg: LGRAY, align: AlignmentType.CENTER }), cell("15", 4680, { bg: LGRAY, align: AlignmentType.CENTER })] }),
          new TableRow({ children: [cell("3+ platforms", 4680, { align: AlignmentType.CENTER }), cell("30", 4680, { align: AlignmentType.CENTER })] }),
        ]
      }),
      new Paragraph({ spacing: { after: 120 }, children: [] }),
      new Table({
        width: { size: 9360, type: WidthType.DXA },
        columnWidths: [4680, 4680],
        rows: [
          new TableRow({ tableHeader: true, children: [cell("Account Age", 4680, { bold: true, bg: "1F4E79", align: AlignmentType.CENTER }), cell("Points", 4680, { bold: true, bg: "1F4E79", align: AlignmentType.CENTER })] }),
          new TableRow({ children: [cell("> 1 year", 4680, { align: AlignmentType.CENTER }), cell("20", 4680, { align: AlignmentType.CENTER })] }),
          new TableRow({ children: [cell("6 – 12 months", 4680, { bg: LGRAY, align: AlignmentType.CENTER }), cell("10", 4680, { bg: LGRAY, align: AlignmentType.CENTER })] }),
          new TableRow({ children: [cell("< 6 months", 4680, { align: AlignmentType.CENTER }), cell("0", 4680, { align: AlignmentType.CENTER })] }),
          new TableRow({ children: [cell("Cannot be verified publicly", 4680, { bg: LGRAY, align: AlignmentType.CENTER }), cell("10 (conservative default)", 4680, { bg: LGRAY, align: AlignmentType.CENTER })] }),
        ]
      }),
      new Paragraph({ spacing: { after: 200 }, children: [] }),

      // ── SECTION 3 ──
      heading1("3. Five Creators — Validation Data"),
      para("One real creator was selected per follower tier. All data was collected from public profiles.", { size: 20, color: "444444", spacing: 160 }),
      creatorTable(),
      new Paragraph({ spacing: { after: 200 }, children: [] }),

      // ── SECTION 4 ──
      heading1("4. Design Write-Up"),

      heading2("Why These Pillars"),
      para("Engagement Quality carries the most weight (400 pts) because it is the most direct signal of whether an audience actually responds to a creator. Raw follower count is explicitly not the primary input — a creator with 1 million disengaged followers is worth less to a brand than one with 20,000 obsessed ones. The weighted engagement rate gives comments 2× the weight of likes because comments require deliberate effort and are significantly harder to buy in volume."),
      para("Reach is scored on a log10 scale, not a linear one. Without this, a 10M-follower creator would score 10,000× higher than a 1,000-follower creator on reach alone, making the score meaningless for smaller tiers. Log scaling compresses the range fairly while still rewarding genuine audience size."),
      para("Consistency matters because a creator who posts irregularly is harder to plan campaigns around. Platform-specific benchmarks are used — YouTube's ideal is 1 post per week, not 4 — so creators are never penalised for following their platform's natural rhythm."),
      para("Authenticity catches what raw engagement numbers miss: bought followers, purchased likes, and sudden artificial growth spikes. The comment-to-like ratio is the core signal, with tier-adjusted thresholds so mega creators are not unfairly penalised for naturally lower ratios at scale.", { spacing: 200 }),

      heading2("What the Validation Showed"),
      para("Testing across five real creators produced scores ranging from 692 to 793 — a spread that reflects genuine differences in engagement quality rather than just follower size."),
      para("The most important finding concerned MrBeast. In the first model run he scored last, which looked wrong. Investigation showed the flat CTL threshold (0.02) was penalising him for having 15,500 comments against 2.4 million likes — a ratio that looks low but is entirely normal at 484 million followers. Introducing tier-adjusted CTL thresholds fixed this. This was the most valuable output of the validation exercise: a hidden assumption that only became visible when tested against a real mega creator."),
      para("Nas Daily scoring below two anonymous smaller creators (749 vs 793 and 743) is intentional and correct. His weighted ER of 0.61% is less than half the mega benchmark of 1.42%, meaning his audience is comparatively disengaged. The model is working as designed — rewarding quality over size.", { spacing: 200 }),

      heading2("How Someone Could Game This Score"),
      bullet("Buying followers suppresses ER because fake followers do not engage, directly hurting P1."),
      bullet("Buying likes without buying comments shifts the CTL ratio down, hurting P4B."),
      bullet("Posting low-quality content at high frequency earns P3 points but tanks P1 — no free lunch."),
      bullet("The hardest vector is coordinated inauthentic engagement (real humans paid proportionally). The P4C growth alignment check partially addresses this: sudden follower spikes paired with stable ER are flagged."),
      new Paragraph({ spacing: { after: 200 }, children: [] }),

      heading2("What I Would Improve With More Time"),
      bullet("Score compression: all five creators fell between 692 and 793. A mild exponential curve on P1 instead of a hard cap would spread scores more across the full 0–1000 range."),
      bullet("P4C reliability: Social Blade has patchy coverage for small creators. A platform-native insights integration or self-reported API would make this pillar more robust."),
      bullet("Content type weighting: Stories, Reels, and long-form video are treated equally in P3. Weighting by content type would make consistency scoring more meaningful."),
      new Paragraph({ spacing: { after: 200 }, children: [] }),

      // ── SECTION 5 ──
      heading1("5. Design Principles Check"),
      principlesTable(),
      new Paragraph({ spacing: { after: 200 }, children: [] }),

    ]
  }]
});

Packer.toBuffer(doc).then(buf => {
  fs.writeFileSync("/mnt/user-data/outputs/Linkfluencer_Social_Score.docx", buf);
  console.log("Done");
});